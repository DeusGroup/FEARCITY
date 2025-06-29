# Supabase CLI Commands for Credential Rotation

## Quick Reference

```bash
# Set alias for easier use
alias supabase='./node_modules/supabase/bin/supabase'

# 1. Login first
supabase login

# 2. Get project info
supabase projects list

# 3. Reset database password
supabase projects database reset \
  --project-ref qmjauzmtznndsysnaxzo \
  --password 'Wf!HIABt&AEpj@uUXQcVBD%b'

# 4. View current API keys (before regenerating)
supabase projects api-keys get --project-ref qmjauzmtznndsysnaxzo

# 5. Regenerate API keys (⚠️ This invalidates old keys immediately!)
supabase projects api-keys regenerate --project-ref qmjauzmtznndsysnaxzo --key anon
supabase projects api-keys regenerate --project-ref qmjauzmtznndsysnaxzo --key service_role

# 6. After getting new keys, update your .env file
```

## New Credentials to Use

- **New Database Password**: `Wf!HIABt&AEpj@uUXQcVBD%b`
- **New JWT Secret**: `c907b3bc3eab1f5d335ef5c3f57a8aceb10d44631c6e300d0fd162c4e3b573ab1850fbc2e510035d303a67eb2cf9c54a48ea50323e689bef967d51e2108ce5f4`
- **New Admin Password**: `nllQBeod5hwoBwqC`

## Manual Step Required

After running the CLI commands, you still need to:
1. Go to https://app.supabase.com/project/qmjauzmtznndsysnaxzo/settings/auth
2. Update the JWT secret with the value above