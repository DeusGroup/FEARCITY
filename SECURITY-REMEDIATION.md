# 🚨 URGENT: Security Credential Rotation Guide

## Critical Security Issues Found

Your codebase contained exposed credentials that need immediate rotation:

1. **Supabase Service Role Key** (CRITICAL)
2. **Supabase JWT Secret** (CRITICAL)  
3. **PostgreSQL Database Password** (CRITICAL)
4. **Hardcoded Admin Password** (HIGH)

## Immediate Actions Required

### 1. Rotate Supabase Credentials

1. **Log into Supabase Dashboard**
   - Go to your project: https://app.supabase.com/project/qmjauzmtznndsysnaxzo
   
2. **Generate New API Keys**
   - Navigate to Settings → API
   - Click "Regenerate anon key"
   - Click "Regenerate service_role key"
   - Save these new keys securely

3. **Reset Database Password**
   - Navigate to Settings → Database
   - Click "Reset Database Password"
   - Use a strong, unique password
   - Update your connection strings

4. **Regenerate JWT Secret**
   - Navigate to Settings → API → JWT Settings
   - Generate a new JWT secret
   - Update all services using this secret

### 2. Remove Exposed Credentials from Git History

```bash
# If credentials were ever committed, clean git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (coordinate with team)
git push origin --force --all
git push origin --force --tags
```

### 3. Update Environment Variables

1. **Create a new `.env` file** (never commit this!)
```bash
cp .env.example .env
```

2. **Fill in the new credentials**:
```env
VITE_SUPABASE_URL=https://qmjauzmtznndsysnaxzo.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
SUPABASE_JWT_SECRET=your_new_jwt_secret_here
DATABASE_URL=postgresql://postgres:NEW_PASSWORD@db.qmjauzmtznndsysnaxzo.supabase.co:5432/postgres
ADMIN_PASSWORD=generate_new_secure_password_here
```

### 4. Update Deployment Environments

Update environment variables in:
- Vercel/Netlify/Railway dashboard
- CI/CD pipelines
- Local development environments
- Production servers

### 5. Security Best Practices Going Forward

1. **Never commit `.env` files**
   - Always use `.env.example` with placeholders
   - Add `.env` to `.gitignore` (already done)

2. **Use Environment Variables**
   - All credentials must come from environment
   - No hardcoded secrets in code

3. **Implement Secret Scanning**
   ```bash
   # Install git-secrets
   brew install git-secrets  # macOS
   # or
   apt-get install git-secrets  # Linux

   # Configure for this repo
   git secrets --install
   git secrets --register-aws
   ```

4. **Regular Credential Rotation**
   - Rotate all credentials every 90 days
   - Use a password manager for team credentials
   - Document rotation procedures

## Verification Steps

1. **Verify no secrets in code**:
```bash
# Search for potential secrets
grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "password" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "secret" . --exclude-dir=node_modules --exclude-dir=.git
```

2. **Test with new credentials**:
```bash
# Test database connection
node -e "console.log(process.env.DATABASE_URL)"

# Test Supabase connection
npm run test-connection  # if available
```

3. **Monitor for unauthorized access**:
   - Check Supabase logs for suspicious activity
   - Review database access logs
   - Enable alerts for unusual patterns

## Additional Security Measures

1. **Enable Row Level Security (RLS)** in Supabase
2. **Implement API rate limiting**
3. **Use least-privilege principle** for service accounts
4. **Enable 2FA** on all admin accounts
5. **Regular security audits** of the codebase

## Support

If you discover any security issues:
1. Rotate affected credentials immediately
2. Check logs for unauthorized access
3. Report to security@yourdomain.com

---

**Remember**: Treat all credentials as compromised until fully rotated. Monitor your systems closely for the next 48 hours.