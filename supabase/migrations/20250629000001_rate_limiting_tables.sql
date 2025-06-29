-- Fear City Cycles Rate Limiting Database Schema v0.1.6
-- Creates tables for rate limiting, monitoring, and analytics

-- Rate limit logs table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address, user ID, or API key
    endpoint TEXT NOT NULL,
    requests INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT true,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit blocks table (for temporary IP/user blocks)
CREATE TABLE IF NOT EXISTS rate_limit_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    violations INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit whitelist/blacklist
CREATE TABLE IF NOT EXISTS rate_limit_access_control (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('whitelist', 'blacklist')),
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit configuration (dynamic rules)
CREATE TABLE IF NOT EXISTS rate_limit_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    endpoint_pattern TEXT NOT NULL,
    time_window_ms INTEGER NOT NULL,
    max_requests INTEGER NOT NULL,
    user_tier TEXT, -- NULL for global, or 'free', 'premium', 'admin'
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier_endpoint ON rate_limit_logs(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_window_start ON rate_limit_logs(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_allowed ON rate_limit_logs(allowed);

CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_identifier ON rate_limit_blocks(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_expires_at ON rate_limit_blocks(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_access_control_identifier ON rate_limit_access_control(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_access_control_type ON rate_limit_access_control(type);

CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_endpoint_pattern ON rate_limit_rules(endpoint_pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_enabled ON rate_limit_rules(enabled);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_rate_limit_blocks_updated_at 
    BEFORE UPDATE ON rate_limit_blocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_rules_updated_at 
    BEFORE UPDATE ON rate_limit_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;

-- Admin users can read/write all rate limiting data
CREATE POLICY "Admin full access to rate_limit_logs" ON rate_limit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to rate_limit_blocks" ON rate_limit_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to rate_limit_access_control" ON rate_limit_access_control
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to rate_limit_rules" ON rate_limit_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Service role can read/write all (for Edge Functions)
CREATE POLICY "Service role full access to rate_limit_logs" ON rate_limit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to rate_limit_blocks" ON rate_limit_blocks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to rate_limit_access_control" ON rate_limit_access_control
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to rate_limit_rules" ON rate_limit_rules
    FOR ALL USING (auth.role() = 'service_role');

-- Public read access to rate limit rules (for client-side display)
CREATE POLICY "Public read access to rate_limit_rules" ON rate_limit_rules
    FOR SELECT USING (enabled = true);

-- Insert default rate limiting rules
INSERT INTO rate_limit_rules (name, endpoint_pattern, time_window_ms, max_requests, user_tier) VALUES
    -- Authentication endpoints
    ('auth_login', '/api/auth/login', 60000, 5, NULL),
    ('auth_register', '/api/auth/register', 60000, 3, NULL),
    ('auth_reset', '/api/auth/reset', 300000, 2, NULL),
    
    -- Contact and forms
    ('contact_form', '/api/contact', 60000, 2, NULL),
    ('newsletter_signup', '/api/newsletter', 60000, 1, NULL),
    
    -- Product catalog
    ('products_list', '/api/products', 60000, 200, NULL),
    ('product_detail', '/api/products/*', 60000, 100, NULL),
    
    -- Cart operations
    ('cart_add', '/api/cart/add', 60000, 50, NULL),
    ('cart_update', '/api/cart/update', 60000, 30, NULL),
    ('cart_checkout', '/api/cart/checkout', 300000, 3, NULL),
    
    -- Search
    ('search_products', '/api/search', 60000, 30, NULL),
    
    -- Admin endpoints
    ('admin_general', '/api/admin/*', 60000, 20, 'admin'),
    
    -- User tiers
    ('api_free_tier', '/api/*', 60000, 50, 'free'),
    ('api_premium_tier', '/api/*', 60000, 200, 'premium'),
    ('api_admin_tier', '/api/*', 60000, 1000, 'admin')
ON CONFLICT (name) DO NOTHING;

-- Create view for rate limiting analytics
CREATE OR REPLACE VIEW rate_limit_analytics AS
SELECT 
    endpoint,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE allowed = false) as blocked_requests,
    COUNT(DISTINCT identifier) as unique_clients,
    AVG(requests) as avg_requests_per_window,
    MAX(requests) as max_requests_per_window
FROM rate_limit_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, total_requests DESC;

-- Create function to cleanup old rate limit logs
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_logs 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also cleanup expired blocks
    DELETE FROM rate_limit_blocks 
    WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get rate limit status for an identifier
CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_window_ms INTEGER
)
RETURNS TABLE (
    current_requests INTEGER,
    window_start TIMESTAMPTZ,
    is_blocked BOOLEAN,
    block_expires_at TIMESTAMPTZ
) AS $$
DECLARE
    window_start_ts TIMESTAMPTZ;
BEGIN
    -- Calculate current window start
    window_start_ts := TO_TIMESTAMP(
        FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000 / p_window_ms) * p_window_ms / 1000
    );
    
    RETURN QUERY
    SELECT 
        COALESCE(logs.requests, 0)::INTEGER as current_requests,
        window_start_ts as window_start,
        COALESCE(blocks.expires_at > NOW(), false) as is_blocked,
        blocks.expires_at as block_expires_at
    FROM (SELECT window_start_ts) base
    LEFT JOIN rate_limit_logs logs ON (
        logs.identifier = p_identifier 
        AND logs.endpoint = p_endpoint 
        AND logs.window_start = window_start_ts
    )
    LEFT JOIN rate_limit_blocks blocks ON (
        blocks.identifier = p_identifier 
        AND blocks.expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON rate_limit_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_logs TO service_role;
GRANT EXECUTE ON FUNCTION get_rate_limit_status TO service_role;