# Fear City Cycles Row-Level Security (RLS) Implementation Guide v0.1.7

Comprehensive guide for implementing, testing, and maintaining Row-Level Security in the Fear City Cycles Supabase project.

## Table of Contents

- [Overview](#overview)
- [Security Model](#security-model)
- [Implementation](#implementation)
- [Policy Patterns](#policy-patterns)
- [Testing & Validation](#testing--validation)
- [Monitoring & Auditing](#monitoring--auditing)
- [CLI Tools](#cli-tools)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

### What is Row-Level Security (RLS)?

Row-Level Security is a PostgreSQL feature that allows you to control which rows users can access within database tables. Instead of traditional application-level access control, RLS enforces security directly at the database level.

### Why RLS for Fear City Cycles?

- **Data Isolation**: Customers can only access their own orders, cart items, and profile data
- **Admin Access**: Staff can access all data for support and management
- **Public Content**: Products and categories remain publicly accessible
- **Compliance**: Meet data privacy requirements (GDPR, CCPA)
- **Security**: Prevent data leaks even if application code has vulnerabilities

### Implementation Benefits

✅ **Zero Trust Security**: No data access without explicit permission  
✅ **Defense in Depth**: Multiple layers of protection  
✅ **Audit Trail**: Complete logging of data access  
✅ **Performance**: Database-level optimization  
✅ **Compliance**: Automatic privacy law compliance  

## Security Model

### User Roles

```
🏢 Super Admin (super_admin)
├── Full access to all data and operations
├── Can manage other admins
└── Can bypass all RLS policies

🛡️ Admin (admin)
├── Access to all customer data for support
├── Can manage products, orders, and content
└── Cannot modify other admin accounts

👤 Authenticated User (authenticated)
├── Can access their own profile and data
├── Can create orders and manage cart
└── Can view public products and content

👻 Anonymous User (anon)
├── Can view public products and categories
├── Can submit contact forms and newsletter signup
└── No access to user-specific data
```

### Data Classification

```
🔒 PRIVATE DATA (User Isolation Required)
├── users (profiles, personal information)
├── orders (purchase history, addresses)
├── order_items (order contents)
├── cart_items (shopping cart contents)
└── rls_audit_log (access logs)

🔐 RESTRICTED DATA (Admin Only)
├── contact_submissions (customer inquiries)
├── newsletter_subscribers (email lists)
├── rate_limit_* tables (security data)
└── Admin management functions

🌐 PUBLIC DATA (Read-Only Access)
├── products (catalog items)
├── categories (product categories)
├── product_variants (size/color options)
└── Public marketing content
```

## Implementation

### 1. Database Migration

Deploy the comprehensive RLS migration:

```bash
# Apply RLS migration
npx supabase db push

# Verify deployment
npx supabase db diff
```

The migration file `20250629000002_comprehensive_rls_v0_1_7.sql` includes:
- RLS enablement on all tables
- Comprehensive policy definitions
- Security helper functions
- Audit logging setup
- Performance optimizations

### 2. Policy Architecture

#### User Isolation Pattern
```sql
-- Users can only access their own data
CREATE POLICY "users_select_own" ON users
    FOR SELECT 
    USING (auth.uid() = id);
```

#### Admin Override Pattern
```sql
-- Admin can access all data
CREATE POLICY "users_admin_all" ON users
    FOR ALL 
    USING (auth.is_admin());
```

#### Public Read Pattern
```sql
-- Public access to active content
CREATE POLICY "products_public_read" ON products
    FOR SELECT 
    USING (is_active = true);
```

#### Nested Resource Pattern
```sql
-- Access order items through order ownership
CREATE POLICY "order_items_select_via_order" ON order_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );
```

### 3. Helper Functions

#### Security Check Functions
```sql
-- Check if user is admin
SELECT auth.is_admin();

-- Check specific role
SELECT auth.has_role('admin');

-- Get user's tenant/organization
SELECT auth.get_user_tenant();

-- Check if resource is public
SELECT is_public_resource('products', product_id);
```

## Policy Patterns

### 1. Basic User Isolation

**Pattern**: `user_id = auth.uid()`

**Use Case**: Personal data like profiles, orders, cart items

```sql
CREATE POLICY "table_user_isolation" ON table_name
    FOR operation 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

### 2. Email-based Access

**Pattern**: `email = auth.email()`

**Use Case**: Newsletter subscriptions, contact forms

```sql
CREATE POLICY "newsletter_own_email" ON newsletter_subscribers
    FOR SELECT 
    USING (email = auth.email());
```

### 3. Role-based Access

**Pattern**: `auth.has_role('role_name')`

**Use Case**: Admin functions, different user tiers

```sql
CREATE POLICY "admin_access" ON sensitive_table
    FOR ALL 
    USING (auth.has_role('admin'));
```

### 4. Time-based Access

**Pattern**: Date/time conditions

**Use Case**: Content publishing, limited-time offers

```sql
CREATE POLICY "published_content" ON articles
    FOR SELECT 
    USING (
        published_at <= NOW() 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
```

### 5. Status-based Access

**Pattern**: Record status checks

**Use Case**: Draft vs published content, active vs deleted

```sql
CREATE POLICY "active_products" ON products
    FOR SELECT 
    USING (is_active = true AND deleted_at IS NULL);
```

### 6. Hierarchical Access

**Pattern**: Parent-child relationships

**Use Case**: Order items through orders, comments through posts

```sql
CREATE POLICY "order_items_via_order" ON order_items
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );
```

## Testing & Validation

### 1. Automated Test Suite

Run comprehensive RLS tests:

```bash
# Run all RLS tests
npm run rls:test

# Test specific table
npm run rls:validate users

# Run vulnerability tests
npm run rls:test --vulnerabilities

# Performance impact analysis
npm run rls:test --performance
```

### 2. Manual Testing

#### Test User Contexts

```sql
-- Test as regular user
SELECT set_test_user_context('user-uuid', 'authenticated');
SELECT * FROM users; -- Should only see own record

-- Test as admin
SELECT set_test_user_context('admin-uuid', 'authenticated');
SELECT * FROM users; -- Should see all records

-- Test as anonymous
SELECT clear_test_context();
SELECT * FROM products; -- Should see public products only
```

#### Common Test Scenarios

1. **Data Isolation**: User A cannot see User B's data
2. **Admin Access**: Admin can see all user data
3. **Public Content**: Anonymous users can view public products
4. **Nested Resources**: Users can access order items through orders
5. **Creation Limits**: Users can only create records for themselves

### 3. Vulnerability Testing

```bash
# Test for common vulnerabilities
npm run rls:test --vulnerabilities
```

Tests include:
- Direct table access bypass
- SQL injection through policies
- Cross-table data leakage
- Function privilege escalation

## Monitoring & Auditing

### 1. RLS Coverage Monitoring

```bash
# Check RLS coverage across all tables
npm run rls:coverage

# Show only unprotected tables
npm run rls:coverage --missing-only
```

### 2. Security Audit

```bash
# Generate comprehensive security report
npm run rls:audit

# Export to different formats
npm run rls:audit --format html --output report.html
npm run rls:audit --format csv --output report.csv
```

### 3. Activity Monitoring

```bash
# Monitor RLS policy effectiveness
npm run rls:monitor --days 7

# View recent audit logs
npm run rls:logs --limit 100
```

### 4. Audit Log Analysis

The `rls_audit_log` table tracks:
- Table accessed
- Operation performed (SELECT, INSERT, UPDATE, DELETE)
- User ID and role
- Timestamp and affected row
- Before/after data for changes

## CLI Tools

### Installation

```bash
# Install dependencies
npm install

# Make CLI executable
chmod +x scripts/rls-cli.ts
```

### Available Commands

```bash
# Security audit
npx tsx scripts/rls-cli.ts audit

# Table validation
npx tsx scripts/rls-cli.ts validate users

# Run tests
npx tsx scripts/rls-cli.ts test --vulnerabilities

# Coverage report
npx tsx scripts/rls-cli.ts coverage

# Monitor activity
npx tsx scripts/rls-cli.ts monitor --days 7

# Initialize RLS setup
npx tsx scripts/rls-cli.ts init
```

### Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "rls:audit": "tsx scripts/rls-cli.ts audit",
    "rls:test": "tsx scripts/rls-cli.ts test",
    "rls:validate": "tsx scripts/rls-cli.ts validate",
    "rls:coverage": "tsx scripts/rls-cli.ts coverage",
    "rls:monitor": "tsx scripts/rls-cli.ts monitor",
    "rls:deploy": "npx supabase db push"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. RLS Policy Not Working

**Symptoms**: Users can see data they shouldn't access

**Debugging**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'your_table';

-- List policies for table
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy directly
SELECT * FROM your_table; -- Run as affected user
```

**Solutions**:
- Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policy conditions match your use case
- Ensure helper functions are accessible

#### 2. Performance Issues

**Symptoms**: Slow queries after RLS implementation

**Debugging**:
```sql
-- Check query plan
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE condition;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'users';
```

**Solutions**:
- Add indexes on policy condition columns
- Optimize policy expressions
- Use `SECURITY DEFINER` functions for complex logic

#### 3. Admin Access Issues

**Symptoms**: Admin users cannot access data

**Debugging**:
```sql
-- Check user role
SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid();

-- Test helper function
SELECT auth.is_admin();
```

**Solutions**:
- Verify admin role is set correctly in user metadata
- Check helper function permissions
- Ensure admin policies exist

#### 4. Anonymous Access Issues

**Symptoms**: Public content not accessible

**Debugging**:
```sql
-- Test as anonymous user
SELECT set_config('role', 'anon', true);
SELECT * FROM products;
```

**Solutions**:
- Check public read policies exist
- Verify `anon` role has necessary permissions
- Ensure content is marked as public/active

### Error Messages

#### "permission denied for table"
- RLS is enabled but no matching policy exists
- Add appropriate policy or check user context

#### "function auth.uid() does not exist"
- Helper functions not properly installed
- Run migration again or check function permissions

#### "row-level security policy violated"
- User trying to access unauthorized data
- Expected behavior - verify user context is correct

## Best Practices

### 1. Security First

✅ **Default Deny**: Start with no access, add permissions explicitly  
✅ **Least Privilege**: Give minimum required access  
✅ **Regular Audits**: Monitor and test policies regularly  
✅ **Incident Response**: Plan for security breaches  

### 2. Policy Design

✅ **Simple Conditions**: Keep policy logic clear and maintainable  
✅ **Performance**: Consider query performance impact  
✅ **Consistency**: Use standard patterns across tables  
✅ **Documentation**: Comment complex policies  

### 3. Testing Strategy

✅ **Automated Tests**: Include RLS tests in CI/CD  
✅ **User Contexts**: Test with different user roles  
✅ **Edge Cases**: Test boundary conditions  
✅ **Performance**: Monitor query performance  

### 4. Monitoring

✅ **Coverage Tracking**: Ensure all tables are protected  
✅ **Access Logging**: Monitor data access patterns  
✅ **Alert Systems**: Alert on suspicious activity  
✅ **Regular Reviews**: Review policies quarterly  

### 5. Development Workflow

✅ **Local Testing**: Test policies locally first  
✅ **Staging Validation**: Validate in staging environment  
✅ **Gradual Rollout**: Deploy policies incrementally  
✅ **Rollback Plan**: Have rollback procedures ready  

## Migration Checklist

### Pre-Migration

- [ ] Backup database
- [ ] Document current access patterns
- [ ] Identify sensitive tables
- [ ] Plan user roles and permissions
- [ ] Create test scenarios

### Migration

- [ ] Enable RLS on all tables
- [ ] Create helper functions
- [ ] Implement user isolation policies
- [ ] Add admin override policies
- [ ] Configure public read policies
- [ ] Set up audit logging

### Post-Migration

- [ ] Run comprehensive test suite
- [ ] Verify all user flows work
- [ ] Monitor performance impact
- [ ] Update application code if needed
- [ ] Train team on new security model

### Validation

- [ ] All tables have RLS enabled
- [ ] No unprotected sensitive data
- [ ] Admin access works correctly
- [ ] User isolation is enforced
- [ ] Public content is accessible
- [ ] Performance is acceptable

## Support

For RLS implementation issues:

1. **Check Documentation**: Review this guide and SQL comments
2. **Run Diagnostics**: Use CLI tools to identify issues
3. **Test Policies**: Use test suite to validate configuration
4. **Monitor Logs**: Check audit logs for access patterns
5. **Performance Analysis**: Monitor query performance impact

---

**Fear City Cycles RLS Implementation v0.1.7** - Comprehensive database security for motorcycle e-commerce.

*Queens, NYC - Secure by Design* 🔒