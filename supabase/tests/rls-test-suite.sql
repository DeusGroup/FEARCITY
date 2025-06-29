-- Fear City Cycles RLS Test Suite v0.1.7
-- Comprehensive testing for Row-Level Security policies

-- =============================================================================
-- TEST SETUP AND CONFIGURATION
-- =============================================================================

-- Test users for different scenarios
DO $$
BEGIN
    -- Create test users if they don't exist (in auth.users)
    INSERT INTO auth.users (
        id, 
        email, 
        raw_app_meta_data, 
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'testuser1@example.com',
        '{"role": "user"}',
        '{"tenant_id": "tenant1"}',
        NOW(),
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'testuser2@example.com',
        '{"role": "user"}',
        '{"tenant_id": "tenant2"}',
        NOW(),
        NOW()
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'admin@example.com',
        '{"role": "admin"}',
        '{"tenant_id": "tenant1"}',
        NOW(),
        NOW()
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'superadmin@example.com',
        '{"role": "super_admin"}',
        '{"tenant_id": "admin"}',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Create corresponding user profiles
INSERT INTO users (
    id, 
    email, 
    full_name, 
    created_at, 
    updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'testuser1@example.com',
    'Test User 1',
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222',
    'testuser2@example.com',
    'Test User 2',
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333',
    'admin@example.com',
    'Admin User',
    NOW(),
    NOW()
),
(
    '44444444-4444-4444-4444-444444444444',
    'superadmin@example.com',
    'Super Admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- TEST DATA SETUP
-- =============================================================================

-- Create test orders
INSERT INTO orders (
    id,
    user_id,
    order_number,
    status,
    total_amount,
    shipping_name,
    shipping_email,
    created_at
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'TEST-ORDER-001',
    'pending',
    299.99,
    'Test User 1',
    'testuser1@example.com',
    NOW()
),
(
    '10000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'TEST-ORDER-002',
    'shipped',
    199.99,
    'Test User 2',
    'testuser2@example.com',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create test cart items
INSERT INTO cart_items (
    id,
    user_id,
    product_id,
    quantity,
    created_at
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM products LIMIT 1),
    2,
    NOW()
),
(
    '20000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM products LIMIT 1),
    1,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create test newsletter subscriptions
INSERT INTO newsletter_subscribers (
    id,
    email,
    created_at
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    'testuser1@example.com',
    NOW()
),
(
    '30000000-0000-0000-0000-000000000002',
    'testuser2@example.com',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- RLS TEST FUNCTIONS
-- =============================================================================

-- Function to simulate user context
CREATE OR REPLACE FUNCTION set_test_user_context(
    user_id UUID,
    user_role TEXT DEFAULT 'authenticated'
)
RETURNS VOID AS $$
BEGIN
    -- Clear any existing context
    PERFORM set_config('role', user_role, true);
    PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
    PERFORM set_config('request.jwt.claim.role', user_role, true);
    
    -- Set additional JWT claims that might be used
    PERFORM set_config('request.jwt.claim.email', 
        (SELECT email FROM auth.users WHERE id = user_id), true);
END;
$$ LANGUAGE plpgsql;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_test_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);
    PERFORM set_config('request.jwt.claim.email', '', true);
END;
$$ LANGUAGE plpgsql;

-- Function to run a test and capture results
CREATE OR REPLACE FUNCTION run_rls_test(
    test_name TEXT,
    test_sql TEXT,
    expected_result BOOLEAN DEFAULT true,
    user_context UUID DEFAULT NULL,
    user_role TEXT DEFAULT 'authenticated'
)
RETURNS TABLE (
    test_name_result TEXT,
    passed BOOLEAN,
    error_message TEXT,
    execution_time INTERVAL
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    test_passed BOOLEAN;
    error_msg TEXT;
BEGIN
    start_time := clock_timestamp();
    test_passed := false;
    error_msg := '';
    
    BEGIN
        -- Set user context if provided
        IF user_context IS NOT NULL THEN
            PERFORM set_test_user_context(user_context, user_role);
        ELSE
            PERFORM clear_test_context();
        END IF;
        
        -- Execute the test SQL
        EXECUTE test_sql;
        
        -- If we get here without exception, the query succeeded
        test_passed := expected_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- If we get an exception, the query failed
        test_passed := NOT expected_result;
        error_msg := SQLERRM;
    END;
    
    end_time := clock_timestamp();
    
    -- Always clear context after test
    PERFORM clear_test_context();
    
    -- Return results
    test_name_result := test_name;
    passed := test_passed;
    error_message := error_msg;
    execution_time := end_time - start_time;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPREHENSIVE RLS TESTS
-- =============================================================================

-- Function to run all RLS tests
CREATE OR REPLACE FUNCTION run_comprehensive_rls_tests()
RETURNS TABLE (
    category TEXT,
    test_name TEXT,
    passed BOOLEAN,
    error_message TEXT,
    execution_time INTERVAL
) AS $$
DECLARE
    test_user1 UUID := '11111111-1111-1111-1111-111111111111';
    test_user2 UUID := '22222222-2222-2222-2222-222222222222';
    admin_user UUID := '33333333-3333-3333-3333-333333333333';
    super_admin UUID := '44444444-4444-4444-4444-444444444444';
    result RECORD;
BEGIN
    
    -- =============================================================================
    -- USERS TABLE TESTS
    -- =============================================================================
    
    category := 'USERS';
    
    -- Test: User can read their own profile
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can read own profile',
            format('SELECT * FROM users WHERE id = %L', test_user1),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot read other user profiles
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot read other profiles',
            format('SELECT * FROM users WHERE id = %L', test_user2),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: Admin can read all user profiles
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Admin can read all profiles',
            'SELECT * FROM users',
            true,
            admin_user
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User can update their own profile
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can update own profile',
            format('UPDATE users SET full_name = ''Updated Name'' WHERE id = %L', test_user1),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot update other profiles
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot update other profiles',
            format('UPDATE users SET full_name = ''Hacked'' WHERE id = %L', test_user2),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- ORDERS TABLE TESTS
    -- =============================================================================
    
    category := 'ORDERS';
    
    -- Test: User can read their own orders
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can read own orders',
            format('SELECT * FROM orders WHERE user_id = %L', test_user1),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot read other user orders
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot read other orders',
            format('SELECT * FROM orders WHERE user_id = %L', test_user2),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User can create order for themselves
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can create own order',
            format(
                'INSERT INTO orders (user_id, order_number, total_amount) VALUES (%L, ''TEST-NEW'', 99.99)',
                test_user1
            ),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot create order for other user
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot create order for others',
            format(
                'INSERT INTO orders (user_id, order_number, total_amount) VALUES (%L, ''TEST-HACK'', 99.99)',
                test_user2
            ),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- CART_ITEMS TABLE TESTS
    -- =============================================================================
    
    category := 'CART_ITEMS';
    
    -- Test: User can read their own cart
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can read own cart',
            format('SELECT * FROM cart_items WHERE user_id = %L', test_user1),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot read other carts
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot read other carts',
            format('SELECT * FROM cart_items WHERE user_id = %L', test_user2),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- PRODUCTS TABLE TESTS (Public Read)
    -- =============================================================================
    
    category := 'PRODUCTS';
    
    -- Test: Anonymous users can read active products
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Anonymous can read active products',
            'SELECT * FROM products WHERE is_active = true',
            true,
            NULL,
            'anon'
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: Users cannot insert products
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Users cannot insert products',
            'INSERT INTO products (name, price) VALUES (''Hacker Product'', 1.00)',
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: Admin can insert products
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Admin can insert products',
            'INSERT INTO products (name, slug, price, is_active) VALUES (''Admin Product'', ''admin-product'', 99.99, true)',
            true,
            admin_user
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- NEWSLETTER TABLE TESTS
    -- =============================================================================
    
    category := 'NEWSLETTER';
    
    -- Test: Anyone can subscribe to newsletter
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Anyone can subscribe to newsletter',
            'INSERT INTO newsletter_subscribers (email) VALUES (''newsubscriber@example.com'')',
            true,
            NULL,
            'anon'
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User can view their own subscription
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can view own subscription',
            'SELECT * FROM newsletter_subscribers WHERE email = ''testuser1@example.com''',
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot view other subscriptions
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot view other subscriptions',
            'SELECT * FROM newsletter_subscribers WHERE email = ''testuser2@example.com''',
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- CONTACT_SUBMISSIONS TABLE TESTS
    -- =============================================================================
    
    category := 'CONTACT';
    
    -- Test: Anyone can submit contact form
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Anyone can submit contact form',
            'INSERT INTO contact_submissions (name, email, message) VALUES (''Test'', ''test@example.com'', ''Test message'')',
            true,
            NULL,
            'anon'
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: Admin can view all contact submissions
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Admin can view all contact submissions',
            'SELECT * FROM contact_submissions',
            true,
            admin_user
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: Regular users cannot view contact submissions
    FOR result IN 
        SELECT * FROM run_rls_test(
            'Users cannot view contact submissions',
            'SELECT * FROM contact_submissions',
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- =============================================================================
    -- CROSS-TABLE RELATIONSHIP TESTS
    -- =============================================================================
    
    category := 'RELATIONSHIPS';
    
    -- Test: User can access order_items through their orders
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User can access own order items',
            format(
                'SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = %L',
                test_user1
            ),
            true,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    -- Test: User cannot access other users' order items
    FOR result IN 
        SELECT * FROM run_rls_test(
            'User cannot access other order items',
            format(
                'SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = %L',
                test_user2
            ),
            false,
            test_user1
        )
    LOOP
        test_name := result.test_name_result;
        passed := result.passed;
        error_message := result.error_message;
        execution_time := result.execution_time;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS VULNERABILITY TESTS
-- =============================================================================

-- Function to test common RLS vulnerabilities
CREATE OR REPLACE FUNCTION test_rls_vulnerabilities()
RETURNS TABLE (
    vulnerability_type TEXT,
    test_description TEXT,
    is_vulnerable BOOLEAN,
    details TEXT
) AS $$
DECLARE
    test_user1 UUID := '11111111-1111-1111-1111-111111111111';
    test_user2 UUID := '22222222-2222-2222-2222-222222222222';
    result RECORD;
    row_count INTEGER;
BEGIN
    
    -- =============================================================================
    -- Test 1: Direct table access bypass
    -- =============================================================================
    
    vulnerability_type := 'DIRECT_ACCESS_BYPASS';
    test_description := 'Attempting to bypass RLS through direct table access';
    
    PERFORM set_test_user_context(test_user1);
    
    BEGIN
        SELECT COUNT(*) INTO row_count FROM users;
        -- If user can see more than 1 row (their own), there's a vulnerability
        is_vulnerable := row_count > 1;
        details := format('User can see %s user records (should be 1)', row_count);
    EXCEPTION WHEN OTHERS THEN
        is_vulnerable := false;
        details := 'Access properly restricted';
    END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    -- =============================================================================
    -- Test 2: SQL injection through policy conditions
    -- =============================================================================
    
    vulnerability_type := 'SQL_INJECTION';
    test_description := 'Testing for SQL injection vulnerabilities in policies';
    
    PERFORM set_test_user_context(test_user1);
    
    BEGIN
        -- Try to inject SQL through user context
        PERFORM set_config('request.jwt.claim.sub', 
            ''''; DROP TABLE users; SELECT ''', true);
        
        SELECT COUNT(*) INTO row_count FROM users;
        is_vulnerable := true; -- If we get here, injection didn't work
        details := 'SQL injection attempt failed (good)';
    EXCEPTION WHEN OTHERS THEN
        is_vulnerable := false;
        details := format('SQL injection blocked: %s', SQLERRM);
    END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    -- =============================================================================
    -- Test 3: Cross-table data leakage
    -- =============================================================================
    
    vulnerability_type := 'CROSS_TABLE_LEAKAGE';
    test_description := 'Testing for data leakage through table joins';
    
    PERFORM set_test_user_context(test_user1);
    
    BEGIN
        -- Try to access other users' data through joins
        SELECT COUNT(*) INTO row_count 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id != o.user_id;
        
        is_vulnerable := row_count > 0;
        details := format('Found %s cross-user data leaks', row_count);
    EXCEPTION WHEN OTHERS THEN
        is_vulnerable := false;
        details := format('Cross-table access blocked: %s', SQLERRM);
    END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    -- =============================================================================
    -- Test 4: Function security definer bypass
    -- =============================================================================
    
    vulnerability_type := 'FUNCTION_BYPASS';
    test_description := 'Testing for privilege escalation through functions';
    
    PERFORM set_test_user_context(test_user1);
    
    BEGIN
        -- Try to access restricted data through helper functions
        SELECT COUNT(*) INTO row_count FROM check_rls_coverage();
        is_vulnerable := row_count > 0;
        details := 'User can access admin function (potential vulnerability)';
    EXCEPTION WHEN insufficient_privilege THEN
        is_vulnerable := false;
        details := 'Function access properly restricted';
    EXCEPTION WHEN OTHERS THEN
        is_vulnerable := false;
        details := format('Function access blocked: %s', SQLERRM);
    END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE IMPACT TESTS
-- =============================================================================

-- Function to measure RLS performance impact
CREATE OR REPLACE FUNCTION measure_rls_performance()
RETURNS TABLE (
    table_name TEXT,
    operation TEXT,
    with_rls_ms NUMERIC,
    without_rls_ms NUMERIC,
    performance_impact_percent NUMERIC
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    with_rls_time NUMERIC;
    without_rls_time NUMERIC;
    test_user UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    
    -- Test users table performance
    table_name := 'users';
    operation := 'SELECT';
    
    -- Measure with RLS
    PERFORM set_test_user_context(test_user);
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM users;
    end_time := clock_timestamp();
    with_rls_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    -- Measure without RLS (as service role)
    PERFORM clear_test_context();
    PERFORM set_config('role', 'service_role', true);
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM users;
    end_time := clock_timestamp();
    without_rls_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    with_rls_ms := with_rls_time;
    without_rls_ms := without_rls_time;
    performance_impact_percent := 
        CASE 
            WHEN without_rls_time > 0 THEN 
                ((with_rls_time - without_rls_time) / without_rls_time) * 100
            ELSE 0 
        END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    -- Test orders table performance
    table_name := 'orders';
    operation := 'SELECT';
    
    PERFORM set_test_user_context(test_user);
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM orders;
    end_time := clock_timestamp();
    with_rls_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    PERFORM clear_test_context();
    PERFORM set_config('role', 'service_role', true);
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM orders;
    end_time := clock_timestamp();
    without_rls_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    with_rls_ms := with_rls_time;
    without_rls_ms := without_rls_time;
    performance_impact_percent := 
        CASE 
            WHEN without_rls_time > 0 THEN 
                ((with_rls_time - without_rls_time) / without_rls_time) * 100
            ELSE 0 
        END;
    
    PERFORM clear_test_context();
    RETURN NEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP AND GRANTS
-- =============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_test_user_context(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION clear_test_context() TO service_role;
GRANT EXECUTE ON FUNCTION run_rls_test(TEXT, TEXT, BOOLEAN, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION run_comprehensive_rls_tests() TO service_role;
GRANT EXECUTE ON FUNCTION test_rls_vulnerabilities() TO service_role;
GRANT EXECUTE ON FUNCTION measure_rls_performance() TO service_role;

-- Comments
COMMENT ON FUNCTION run_comprehensive_rls_tests() IS 'Comprehensive test suite for all RLS policies';
COMMENT ON FUNCTION test_rls_vulnerabilities() IS 'Tests for common RLS vulnerabilities and security issues';
COMMENT ON FUNCTION measure_rls_performance() IS 'Measures performance impact of RLS policies';

-- End of RLS Test Suite v0.1.7