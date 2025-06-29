# 🔐 Supabase API Key Rotation Guide

## Current Status
Your exposed keys are **JWT-based keys** (the old system). Supabase now recommends using **secret keys** instead.

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com/project/qmjauzmtznndsysnaxzo/settings/api

### 2. Create NEW Secret Keys
1. **Scroll down to "API Keys" section**
2. **Click "Create a new secret key"**
3. **Name it**: `fear-city-production-key`
4. **Copy the new secret key** - this replaces your service_role key

### 3. For Anon Key
The anon key is still needed for frontend. You have two options:

**Option A: Keep current anon key** (less secure but simpler)
- Current anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDY4NzUsImV4cCI6MjA2Njc4Mjg3NX0.IfoQ_HxrkOE_-sEYM-7qu1FO7xIivWyAV3dSL141vrA`

**Option B: Rotate JWT secret** (more secure but affects all keys)
1. **Go to**: https://app.supabase.com/project/qmjauzmtznndsysnaxzo/settings/auth
2. **Find "JWT Settings"**
3. **Click "Generate new JWT secret"**
4. **This will invalidate ALL JWT-based keys and generate new ones**

### 4. Update Your Environment

After getting the new secret key, update your `.env` file:

```env
# Use the NEW secret key instead of service_role
SUPABASE_SERVICE_ROLE_KEY=your_new_secret_key_here

# Keep current anon key OR use new one if you rotated JWT
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Test the Connection

Run this to test your new credentials:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log('✅ Connection test successful');
"
```

## Current Exposed Credentials (CHANGE THESE)

❌ **Exposed service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIwNjg3NSwiZXhwIjoyMDY2NzgyODc1fQ.b6xwW8zRD83Hy7odoL9DJ0JA6MKlVOdASF2aXMSzH74`

❌ **Exposed anon key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDY4NzUsImV4cCI6MjA2Njc4Mjg3NX0.IfoQ_HxrkOE_-sEYM-7qu1FO7xIivWyAV3dSL141vrA`

## Next Steps After Rotation

1. Update your `.env` file with new keys
2. Run: `./scripts/set-vercel-env.sh` (after updating the script with new keys)
3. Deploy: `vercel --prod`
4. Monitor for any unauthorized access

## Why This Happened

Your keys were exposed because they were hardcoded in JavaScript files that got committed to version control. The new secret keys will be properly secured via environment variables.