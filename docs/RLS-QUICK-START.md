# Fear City Cycles RLS Quick Start Guide v0.1.7

Get up and running with Row-Level Security in 10 minutes.

## 🚀 Quick Setup

### 1. Prerequisites

```bash
# Required environment variables
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy RLS Policies

```bash
# Apply RLS migration
npx supabase db push

# Verify deployment
npx supabase db diff
```

### 3. Install CLI Tools

```bash
# Install dependencies
npm install

# Make CLI executable
npm run setup:rls
```

### 4. Run Security Audit

```bash
# Quick security check
npm run rls:audit

# Detailed coverage report
npm run rls:coverage
```

## 🛡️ Security Model Overview

```
┌─────────────────┬──────────────────────────────────────┐
│ User Type       │ Access Level                         │
├─────────────────┼──────────────────────────────────────┤
│ Anonymous       │ • Public products/categories         │
│                 │ • Contact forms                      │
│                 │ • Newsletter signup                  │
├─────────────────┼──────────────────────────────────────┤
│ Authenticated   │ • Own profile and orders             │
│                 │ • Own cart items                     │
│                 │ • Create new orders                  │
├─────────────────┼──────────────────────────────────────┤
│ Admin           │ • All customer data                  │
│                 │ • Manage products/content            │
│                 │ • View analytics                     │
├─────────────────┼──────────────────────────────────────┤
│ Service Role    │ • Full database access               │
│                 │ • Bypass all RLS policies           │
└─────────────────┴──────────────────────────────────────┘
```

## 📋 Table Protection Status

| Table | RLS Status | Policy Type | Access Pattern |
|-------|------------|-------------|----------------|
| `users` | ✅ Protected | User Isolation | Own profile only |
| `orders` | ✅ Protected | User Isolation | Own orders only |
| `order_items` | ✅ Protected | Nested Access | Through orders |
| `cart_items` | ✅ Protected | User Isolation | Own cart only |
| `products` | ✅ Protected | Public Read | Active products |
| `categories` | ✅ Protected | Public Read | Active categories |
| `product_variants` | ✅ Protected | Public Read | Through products |
| `newsletter_subscribers` | ✅ Protected | Email-based | Own subscription |
| `contact_submissions` | ✅ Protected | Admin Only | Admin access |
| `rate_limit_*` | ✅ Protected | Admin/Service | System tables |

## 🧪 Quick Tests

### Test User Isolation

```sql
-- As User A (should only see own data)
SELECT COUNT(*) FROM users; -- Should return 1

-- As Admin (should see all data)
SELECT COUNT(*) FROM users; -- Should return all users
```

### Test Public Access

```sql
-- As anonymous user
SELECT COUNT(*) FROM products WHERE is_active = true; -- Should work

-- Try to access private data
SELECT COUNT(*) FROM orders; -- Should return 0 or error
```

### CLI Testing

```bash
# Run quick test suite
npm run rls:test

# Check for vulnerabilities
npm run rls:test --vulnerabilities

# Validate specific table
npm run rls:validate users
```

## 🔧 Common CLI Commands

```bash
# Security audit and reporting
npm run rls:audit                    # Full security report
npm run rls:audit --format html      # HTML report
npm run rls:coverage                 # Coverage summary
npm run rls:coverage --missing-only  # Show unprotected tables

# Testing and validation
npm run rls:test                     # Run all tests
npm run rls:test --vulnerabilities   # Security tests
npm run rls:test --performance       # Performance tests
npm run rls:validate <table>         # Validate specific table

# Monitoring
npm run rls:monitor                  # Activity monitoring
npm run rls:monitor --days 30        # 30-day analysis
```

## ⚡ Performance Quick Check

```bash
# Measure RLS performance impact
npm run rls:test --performance
```

Expected results:
- **Acceptable**: < 20% performance impact
- **Good**: < 10% performance impact
- **Excellent**: < 5% performance impact

## 🚨 Security Checklist

Quick verification checklist:

```bash
# 1. All tables have RLS enabled
npm run rls:coverage | grep "RLS Disabled" # Should show 0

# 2. No vulnerable patterns
npm run rls:test --vulnerabilities # All should pass

# 3. Basic functionality works
npm run rls:test | grep "FAIL" # Should show 0 failures

# 4. Performance is acceptable  
npm run rls:test --performance # Check impact percentages
```

## 🛠️ Troubleshooting

### Issue: "Permission denied for table"

**Solution**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Issue: Admin can't access data

**Solution**:
```sql
-- Verify admin role
SELECT auth.is_admin(); -- Should return true for admin users

-- Check user metadata
SELECT raw_app_meta_data FROM auth.users WHERE id = auth.uid();
```

### Issue: Poor performance

**Solution**:
```bash
# Check for missing indexes
npm run rls:validate <table>

# Analyze specific queries
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM table_name;
```

## 📚 Next Steps

1. **Custom Policies**: Review [RLS Implementation Guide](./RLS-IMPLEMENTATION-GUIDE.md) for advanced patterns
2. **Monitoring**: Set up automated monitoring with `npm run rls:monitor`
3. **CI/CD**: Add RLS tests to your continuous integration pipeline
4. **Team Training**: Share security model with your development team

## 🔗 Quick Links

- [Full Implementation Guide](./RLS-IMPLEMENTATION-GUIDE.md)
- [Migration Scripts](../supabase/migrations/)
- [Test Suite](../supabase/tests/rls-test-suite.sql)
- [CLI Tools](../scripts/rls-cli.ts)
- [Audit Tools](../lib/rls/audit-tools.ts)

---

**🛡️ Your database is now secured with comprehensive Row-Level Security!**

*For detailed documentation and advanced usage, see the [RLS Implementation Guide](./RLS-IMPLEMENTATION-GUIDE.md).*