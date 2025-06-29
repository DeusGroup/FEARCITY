-- Fear City Cycles RLS Missing Tables Migration v0.1.7
-- Addresses critical gaps identified in RLS coverage analysis

-- =============================================================================
-- ENABLE RLS ON MISSING TABLES
-- =============================================================================

-- Enable RLS on Prisma backend tables that were missing protection
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Handle newsletter table discrepancy
-- Check if newsletter_subscriptions exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscriptions') THEN
        ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- CUSTOMERS TABLE POLICIES (High Priority - Contains PII)
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "customers_select_own" ON customers;
DROP POLICY IF EXISTS "customers_update_own" ON customers;
DROP POLICY IF EXISTS "customers_insert_own" ON customers;
DROP POLICY IF EXISTS "customers_admin_all" ON customers;
DROP POLICY IF EXISTS "customers_service_role_all" ON customers;

-- Customers can view their own profile only
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT 
    USING (
        auth.uid()::text = id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Customers can update their own profile
CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE 
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Customers can create their own profile (registration)
CREATE POLICY "customers_insert_own" ON customers
    FOR INSERT 
    WITH CHECK (auth.uid()::text = id);

-- Admin can manage all customers
CREATE POLICY "customers_admin_all" ON customers
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "customers_service_role_all" ON customers
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- ADDRESSES TABLE POLICIES (High Priority - Contains PII)
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "addresses_select_via_customer" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_via_customer" ON addresses;
DROP POLICY IF EXISTS "addresses_update_via_customer" ON addresses;
DROP POLICY IF EXISTS "addresses_delete_via_customer" ON addresses;
DROP POLICY IF EXISTS "addresses_admin_all" ON addresses;
DROP POLICY IF EXISTS "addresses_service_role_all" ON addresses;

-- Customers can view their own addresses
CREATE POLICY "addresses_select_via_customer" ON addresses
    FOR SELECT 
    USING (
        auth.uid()::text = "customerId" OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Customers can add addresses for themselves
CREATE POLICY "addresses_insert_via_customer" ON addresses
    FOR INSERT 
    WITH CHECK (
        auth.uid()::text = "customerId" OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Customers can update their own addresses
CREATE POLICY "addresses_update_via_customer" ON addresses
    FOR UPDATE 
    USING (auth.uid()::text = "customerId")
    WITH CHECK (auth.uid()::text = "customerId");

-- Customers can delete their own addresses
CREATE POLICY "addresses_delete_via_customer" ON addresses
    FOR DELETE 
    USING (auth.uid()::text = "customerId");

-- Admin can manage all addresses
CREATE POLICY "addresses_admin_all" ON addresses
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "addresses_service_role_all" ON addresses
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- CARTS TABLE POLICIES (Medium Priority - Shopping Data)
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "carts_select_own" ON carts;
DROP POLICY IF EXISTS "carts_insert_own" ON carts;
DROP POLICY IF EXISTS "carts_update_own" ON carts;
DROP POLICY IF EXISTS "carts_delete_own" ON carts;
DROP POLICY IF EXISTS "carts_admin_all" ON carts;
DROP POLICY IF EXISTS "carts_service_role_all" ON carts;

-- Customers can manage their own cart
CREATE POLICY "carts_select_own" ON carts
    FOR SELECT 
    USING (
        auth.uid()::text = "customerId" OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

CREATE POLICY "carts_insert_own" ON carts
    FOR INSERT 
    WITH CHECK (
        auth.uid()::text = "customerId" OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

CREATE POLICY "carts_update_own" ON carts
    FOR UPDATE 
    USING (auth.uid()::text = "customerId")
    WITH CHECK (auth.uid()::text = "customerId");

CREATE POLICY "carts_delete_own" ON carts
    FOR DELETE 
    USING (auth.uid()::text = "customerId");

-- Admin can manage all carts (for support)
CREATE POLICY "carts_admin_all" ON carts
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "carts_service_role_all" ON carts
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- ADMIN_USERS TABLE POLICIES (High Priority - Admin Credentials)
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "admin_users_select_admin_only" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_super_admin" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_own_or_super" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete_super_admin" ON admin_users;
DROP POLICY IF EXISTS "admin_users_service_role_all" ON admin_users;

-- Only admins can view admin users
CREATE POLICY "admin_users_select_admin_only" ON admin_users
    FOR SELECT 
    USING (
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Only super admins can create new admin users
CREATE POLICY "admin_users_insert_super_admin" ON admin_users
    FOR INSERT 
    WITH CHECK (
        auth.has_role('super_admin') OR 
        auth.is_service_role()
    );

-- Admins can update their own profile, super admins can update all
CREATE POLICY "admin_users_update_own_or_super" ON admin_users
    FOR UPDATE 
    USING (
        (auth.is_admin() AND auth.uid()::text = id) OR 
        auth.has_role('super_admin') OR 
        auth.is_service_role()
    )
    WITH CHECK (
        (auth.is_admin() AND auth.uid()::text = id) OR 
        auth.has_role('super_admin') OR 
        auth.is_service_role()
    );

-- Only super admins can delete admin users
CREATE POLICY "admin_users_delete_super_admin" ON admin_users
    FOR DELETE 
    USING (
        auth.has_role('super_admin') OR 
        auth.is_service_role()
    );

-- Service role full access
CREATE POLICY "admin_users_service_role_all" ON admin_users
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- SETTINGS TABLE POLICIES (Medium Priority - System Configuration)
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "settings_public_read" ON settings;
DROP POLICY IF EXISTS "settings_admin_write" ON settings;
DROP POLICY IF EXISTS "settings_service_role_all" ON settings;

-- Function to check if setting is public
CREATE OR REPLACE FUNCTION is_public_setting(setting_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Define which settings are public
    RETURN setting_key IN (
        'store_hours',
        'contact_info',
        'social_media',
        'shipping_info',
        'return_policy',
        'terms_of_service',
        'privacy_policy'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public can read certain settings
CREATE POLICY "settings_public_read" ON settings
    FOR SELECT 
    USING (
        is_public_setting(key) OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Only admins can modify settings
CREATE POLICY "settings_admin_write" ON settings
    FOR ALL 
    USING (
        auth.is_admin() OR 
        auth.is_service_role()
    )
    WITH CHECK (
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Service role full access
CREATE POLICY "settings_service_role_all" ON settings
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- NEWSLETTER_SUBSCRIPTIONS TABLE POLICIES (if exists)
-- =============================================================================

-- Handle newsletter_subscriptions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscriptions') THEN
        
        -- Drop any existing policies
        DROP POLICY IF EXISTS "newsletter_subscriptions_public_insert" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "newsletter_subscriptions_select_own" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "newsletter_subscriptions_update_own" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "newsletter_subscriptions_admin_all" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "newsletter_subscriptions_service_role_all" ON newsletter_subscriptions;

        -- Anyone can subscribe
        EXECUTE 'CREATE POLICY "newsletter_subscriptions_public_insert" ON newsletter_subscriptions
            FOR INSERT 
            WITH CHECK (true)';

        -- Users can view their own subscription
        EXECUTE 'CREATE POLICY "newsletter_subscriptions_select_own" ON newsletter_subscriptions
            FOR SELECT 
            USING (
                auth.email() = email OR 
                auth.is_admin() OR 
                auth.is_service_role()
            )';

        -- Users can update their own subscription (unsubscribe)
        EXECUTE 'CREATE POLICY "newsletter_subscriptions_update_own" ON newsletter_subscriptions
            FOR UPDATE 
            USING (auth.email() = email)
            WITH CHECK (auth.email() = email)';

        -- Admin can manage all subscriptions
        EXECUTE 'CREATE POLICY "newsletter_subscriptions_admin_all" ON newsletter_subscriptions
            FOR ALL 
            USING (auth.is_admin())
            WITH CHECK (auth.is_admin())';

        -- Service role full access
        EXECUTE 'CREATE POLICY "newsletter_subscriptions_service_role_all" ON newsletter_subscriptions
            FOR ALL 
            USING (auth.is_service_role())
            WITH CHECK (auth.is_service_role())';
    END IF;
END $$;

-- =============================================================================
-- PERFORMANCE INDEXES FOR NEW POLICIES
-- =============================================================================

-- Indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_customers_id ON customers(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses("customerId");
CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts("customerId");
CREATE INDEX IF NOT EXISTS idx_admin_users_id ON admin_users(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Conditional index for newsletter_subscriptions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscriptions') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email)';
    END IF;
END $$;

-- =============================================================================
-- UPDATE AUDIT LOGGING
-- =============================================================================

-- Add audit triggers for new tables (if audit function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_rls_access') THEN
        -- Add audit triggers for sensitive tables
        CREATE TRIGGER audit_customers_trigger
            AFTER INSERT OR UPDATE OR DELETE ON customers
            FOR EACH ROW EXECUTE FUNCTION audit_rls_access();
            
        CREATE TRIGGER audit_addresses_trigger
            AFTER INSERT OR UPDATE OR DELETE ON addresses
            FOR EACH ROW EXECUTE FUNCTION audit_rls_access();
            
        CREATE TRIGGER audit_admin_users_trigger
            AFTER INSERT OR UPDATE OR DELETE ON admin_users
            FOR EACH ROW EXECUTE FUNCTION audit_rls_access();
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if audit function doesn't exist
    NULL;
END $$;

-- =============================================================================
-- UPDATE RLS COVERAGE FUNCTION
-- =============================================================================

-- Update the RLS coverage function to include new tables
CREATE OR REPLACE FUNCTION check_rls_coverage_complete()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN,
    risk_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname)::INTEGER as policy_count,
        bool_or(p.cmd = 'r') as has_select_policy,
        bool_or(p.cmd = 'a') as has_insert_policy,
        bool_or(p.cmd = 'w') as has_update_policy,
        bool_or(p.cmd = 'd') as has_delete_policy,
        CASE 
            WHEN t.tablename IN ('customers', 'addresses', 'admin_users', 'users') THEN 'HIGH'
            WHEN t.tablename IN ('orders', 'carts', 'settings') THEN 'MEDIUM'
            ELSE 'LOW'
        END as risk_level
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY 
        CASE 
            WHEN t.tablename IN ('customers', 'addresses', 'admin_users', 'users') THEN 1
            WHEN t.tablename IN ('orders', 'carts', 'settings') THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant necessary permissions for new helper functions
GRANT EXECUTE ON FUNCTION is_public_setting(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_rls_coverage_complete() TO authenticated, service_role;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION is_public_setting(TEXT) IS 'Check if a setting key should be publicly readable';
COMMENT ON FUNCTION check_rls_coverage_complete() IS 'Complete RLS coverage analysis including risk levels';

COMMENT ON TABLE customers IS 'Customer profiles - protected by RLS user isolation';
COMMENT ON TABLE addresses IS 'Customer addresses - protected by RLS through customer relationship';
COMMENT ON TABLE carts IS 'Shopping carts - protected by RLS customer isolation';
COMMENT ON TABLE admin_users IS 'Admin user accounts - protected by RLS admin-only access';
COMMENT ON TABLE settings IS 'System settings - protected by RLS with public/admin split';

-- End of Missing Tables RLS Migration v0.1.7