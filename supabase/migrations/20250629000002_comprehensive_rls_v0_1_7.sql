-- Fear City Cycles Comprehensive Row-Level Security (RLS) Implementation v0.1.7
-- Implements complete RLS protection for all tables with proper isolation and access control

-- =============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Core business tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. DROP EXISTING POLICIES (Clean Slate)
-- =============================================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Orders table policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Cart items policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;

-- Products policies
DROP POLICY IF EXISTS "Products are publicly readable" ON products;

-- Categories policies
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;

-- Newsletter policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

-- Contact policies
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON contact_submissions;

-- =============================================================================
-- 3. HELPER FUNCTIONS FOR SECURITY CHECKS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_app_meta_data->>'role' = 'admin' OR
            raw_app_meta_data->>'role' = 'super_admin' OR
            raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is service role
CREATE OR REPLACE FUNCTION auth.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_app_meta_data->>'role' = required_role OR
            raw_user_meta_data->>'role' = required_role
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization/tenant
CREATE OR REPLACE FUNCTION auth.get_user_tenant()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            raw_app_meta_data->>'tenant_id',
            raw_user_meta_data->>'tenant_id',
            'default'
        )
        FROM auth.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if resource is public
CREATE OR REPLACE FUNCTION is_public_resource(table_name TEXT, resource_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    CASE table_name
        WHEN 'products' THEN
            RETURN EXISTS (SELECT 1 FROM products WHERE id = resource_id AND is_active = true);
        WHEN 'categories' THEN
            RETURN EXISTS (SELECT 1 FROM categories WHERE id = resource_id AND is_active = true);
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT 
    USING (
        auth.uid() = id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Admin can manage all users
CREATE POLICY "users_admin_all" ON users
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "users_service_role_all" ON users
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 5. CATEGORIES TABLE POLICIES (Public Read, Admin Write)
-- =============================================================================

-- Public read access to active categories
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT 
    USING (is_active = true);

-- Admin can manage categories
CREATE POLICY "categories_admin_all" ON categories
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "categories_service_role_all" ON categories
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 6. PRODUCTS TABLE POLICIES (Public Read, Admin Write)
-- =============================================================================

-- Public read access to active products
CREATE POLICY "products_public_read" ON products
    FOR SELECT 
    USING (is_active = true);

-- Admin can manage products
CREATE POLICY "products_admin_all" ON products
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "products_service_role_all" ON products
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 7. PRODUCT_VARIANTS TABLE POLICIES
-- =============================================================================

-- Public read access to active variants (through parent product)
CREATE POLICY "product_variants_public_read" ON product_variants
    FOR SELECT 
    USING (
        is_active = true AND 
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id 
            AND products.is_active = true
        )
    );

-- Admin can manage variants
CREATE POLICY "product_variants_admin_all" ON product_variants
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "product_variants_service_role_all" ON product_variants
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 8. ORDERS TABLE POLICIES (User Isolation)
-- =============================================================================

-- Users can view their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT 
    USING (
        auth.uid() = user_id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Users can create orders for themselves
CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Users can update their own pending orders only
CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE 
    USING (
        (auth.uid() = user_id AND status IN ('pending', 'processing')) OR
        auth.is_admin() OR 
        auth.is_service_role()
    )
    WITH CHECK (
        (auth.uid() = user_id AND status IN ('pending', 'processing')) OR
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Admin can manage all orders
CREATE POLICY "orders_admin_all" ON orders
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "orders_service_role_all" ON orders
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 9. ORDER_ITEMS TABLE POLICIES (Through Order Ownership)
-- =============================================================================

-- Users can view items from their own orders
CREATE POLICY "order_items_select_via_order" ON order_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.user_id = auth.uid() OR 
                auth.is_admin() OR 
                auth.is_service_role()
            )
        )
    );

-- Users can insert items to their own orders
CREATE POLICY "order_items_insert_via_order" ON order_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.user_id = auth.uid() OR 
                auth.is_admin() OR 
                auth.is_service_role()
            )
        )
    );

-- Users can update items in their pending orders
CREATE POLICY "order_items_update_via_order" ON order_items
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.status IN ('pending', 'processing')
            AND (
                orders.user_id = auth.uid() OR 
                auth.is_admin() OR 
                auth.is_service_role()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.status IN ('pending', 'processing')
            AND (
                orders.user_id = auth.uid() OR 
                auth.is_admin() OR 
                auth.is_service_role()
            )
        )
    );

-- Admin can manage all order items
CREATE POLICY "order_items_admin_all" ON order_items
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "order_items_service_role_all" ON order_items
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 10. CART_ITEMS TABLE POLICIES (User Isolation)
-- =============================================================================

-- Users can manage their own cart items
CREATE POLICY "cart_items_user_all" ON cart_items
    FOR ALL 
    USING (
        auth.uid() = user_id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Admin can view all carts (for support)
CREATE POLICY "cart_items_admin_all" ON cart_items
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "cart_items_service_role_all" ON cart_items
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 11. NEWSLETTER_SUBSCRIBERS TABLE POLICIES
-- =============================================================================

-- Anyone can subscribe (but only see their own)
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers
    FOR INSERT 
    WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "newsletter_select_own" ON newsletter_subscribers
    FOR SELECT 
    USING (
        auth.email() = email OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Users can update their own subscription (unsubscribe)
CREATE POLICY "newsletter_update_own" ON newsletter_subscribers
    FOR UPDATE 
    USING (auth.email() = email)
    WITH CHECK (auth.email() = email);

-- Admin can manage all subscriptions
CREATE POLICY "newsletter_admin_all" ON newsletter_subscribers
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "newsletter_service_role_all" ON newsletter_subscribers
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 12. CONTACT_SUBMISSIONS TABLE POLICIES
-- =============================================================================

-- Anyone can submit contact forms
CREATE POLICY "contact_public_insert" ON contact_submissions
    FOR INSERT 
    WITH CHECK (true);

-- Users can view their own submissions
CREATE POLICY "contact_select_own" ON contact_submissions
    FOR SELECT 
    USING (
        auth.email() = email OR 
        auth.is_admin() OR 
        auth.is_service_role()
    );

-- Admin can manage all contact submissions
CREATE POLICY "contact_admin_all" ON contact_submissions
    FOR ALL 
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- Service role full access
CREATE POLICY "contact_service_role_all" ON contact_submissions
    FOR ALL 
    USING (auth.is_service_role())
    WITH CHECK (auth.is_service_role());

-- =============================================================================
-- 13. SECURITY OPTIMIZATIONS
-- =============================================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_active_product ON product_variants(product_id, is_active) WHERE is_active = true;

-- =============================================================================
-- 14. AUDIT LOGGING
-- =============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS rls_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
    user_id UUID,
    user_role TEXT,
    row_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE rls_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
CREATE POLICY "audit_log_admin_read" ON rls_audit_log
    FOR SELECT 
    USING (auth.is_admin());

-- Service role can insert audit logs
CREATE POLICY "audit_log_service_insert" ON rls_audit_log
    FOR INSERT 
    WITH CHECK (auth.is_service_role());

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_rls_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO rls_audit_log (
        table_name,
        operation,
        user_id,
        user_role,
        row_id,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        auth.role()::text,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 15. RLS VALIDATION FUNCTIONS
-- =============================================================================

-- Function to check RLS coverage
CREATE OR REPLACE FUNCTION check_rls_coverage()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN
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
        bool_or(p.cmd = 'd') as has_delete_policy
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_access(
    test_table TEXT,
    test_user_id UUID DEFAULT NULL,
    test_role TEXT DEFAULT 'authenticated'
)
RETURNS TABLE (
    operation TEXT,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    test_sql TEXT;
    success_flag BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Set test context
    IF test_user_id IS NOT NULL THEN
        PERFORM set_config('role', test_role, true);
        PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    END IF;
    
    -- Test SELECT
    BEGIN
        test_sql := format('SELECT COUNT(*) FROM %I LIMIT 1', test_table);
        EXECUTE test_sql;
        operation := 'SELECT';
        success := true;
        error_message := NULL;
        RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
        operation := 'SELECT';
        success := false;
        error_message := SQLERRM;
        RETURN NEXT;
    END;
    
    -- Test INSERT (if applicable)
    BEGIN
        test_sql := format('INSERT INTO %I DEFAULT VALUES', test_table);
        EXECUTE test_sql;
        operation := 'INSERT';
        success := true;
        error_message := NULL;
        RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
        operation := 'INSERT';
        success := false;
        error_message := SQLERRM;
        RETURN NEXT;
    END;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 16. GRANT PERMISSIONS
-- =============================================================================

-- Grant necessary permissions for RLS helper functions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.is_service_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.has_role(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.get_user_tenant() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_public_resource(TEXT, UUID) TO anon, authenticated, service_role;

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION check_rls_coverage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION test_rls_access(TEXT, UUID, TEXT) TO service_role;

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_table_operation ON rls_audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_user_id ON rls_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_created_at ON rls_audit_log(created_at);

-- =============================================================================
-- 17. COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION auth.is_service_role() IS 'Check if current context is service role';
COMMENT ON FUNCTION auth.has_role(TEXT) IS 'Check if user has specific role';
COMMENT ON FUNCTION auth.get_user_tenant() IS 'Get current users tenant/organization ID';
COMMENT ON FUNCTION is_public_resource(TEXT, UUID) IS 'Check if resource should be publicly accessible';
COMMENT ON FUNCTION check_rls_coverage() IS 'Audit function to check RLS implementation coverage';
COMMENT ON FUNCTION test_rls_access(TEXT, UUID, TEXT) IS 'Test RLS policies for a given table and user context';

COMMENT ON TABLE rls_audit_log IS 'Audit log for tracking RLS policy enforcement and access patterns';

-- End of RLS Implementation v0.1.7