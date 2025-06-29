# 🔐 Credential Rotation Steps

## Generated Credentials

I've generated new secure credentials for you. Here's what you need to do:

### 1. New Credentials Generated ✅

- **Database Password**: `Wf!HIABt&AEpj@uUXQcVBD%b`
- **JWT Secret**: `c907b3bc3eab1f5d335ef5c3f57a8aceb10d44631c6e300d0fd162c4e3b573ab1850fbc2e510035d303a67eb2cf9c54a48ea50323e689bef967d51e2108ce5f4`
- **Admin Password**: `nllQBeod5hwoBwqC`

### 2. Manual Steps Required in Supabase Dashboard

1. **Go to your Supabase project**: 
   https://app.supabase.com/project/qmjauzmtznndsysnaxzo

2. **Reset Database Password**:
   - Navigate to `Settings` → `Database`
   - Click `Reset database password`
   - Use password: `Wf!HIABt&AEpj@uUXQcVBD%b`
   - Click `Update password`

3. **Regenerate API Keys**:
   - Navigate to `Settings` → `API`
   - Click `Regenerate anon key` and save it
   - Click `Regenerate service_role key` and save it
   - Copy both keys - you'll need them

4. **Update JWT Secret**:
   - Navigate to `Authentication` → `Configuration`
   - Under `JWT Settings`, update the JWT secret to:
     ```
     c907b3bc3eab1f5d335ef5c3f57a8aceb10d44631c6e300d0fd162c4e3b573ab1850fbc2e510035d303a67eb2cf9c54a48ea50323e689bef967d51e2108ce5f4
     ```

### 3. Update Local Environment

1. **Edit `.env.new-template`** with the new Supabase keys:
   ```bash
   # Open the file
   nano .env.new-template
   
   # Replace:
   # <NEW_ANON_KEY_FROM_SUPABASE> with your new anon key
   # <NEW_SERVICE_ROLE_KEY_FROM_SUPABASE> with your new service role key
   ```

2. **Create your new .env file**:
   ```bash
   cp .env.new-template .env
   ```

### 4. Update Vercel Environment Variables

Run the provided script:
```bash
./scripts/update-vercel-env.sh
```

This will automatically update all your Vercel environment variables.

### 5. Deploy and Test

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Test your application** to ensure everything works with new credentials

### 6. Clean Up

After confirming everything works:
```bash
# Delete compromised credentials backup
rm .env.compromised.backup

# Delete template file
rm .env.new-template

# Delete credential generation scripts (optional)
rm scripts/generate-credentials.js
rm scripts/update-vercel-env.sh
```

### 7. Monitor for Security

- Check Supabase logs for any unauthorized access attempts
- Enable alerts in Supabase dashboard
- Consider enabling Row Level Security (RLS) on all tables

## Important Security Notes

1. **The old credentials are compromised** - assume they are public
2. **Monitor your systems** closely for the next 48-72 hours
3. **Enable 2FA** on your Supabase and Vercel accounts
4. **Never commit .env files** to version control
5. **Rotate credentials regularly** (every 90 days minimum)

## If You See Unauthorized Access

1. Immediately rotate all credentials again
2. Check audit logs in Supabase
3. Contact Supabase support if needed
4. Review all recent database changes

---

Remember: Security is an ongoing process. Stay vigilant! 🛡️