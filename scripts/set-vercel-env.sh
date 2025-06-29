#!/bin/bash

# Set Vercel environment variables
echo "🔐 Setting Vercel environment variables..."

# Function to set env var
set_env() {
    local key=$1
    local value=$2
    echo "Setting $key..."
    echo "$value" | vercel env add "$key" production
    echo "$value" | vercel env add "$key" preview  
    echo "$value" | vercel env add "$key" development
}

# Set the environment variables
set_env "VITE_SUPABASE_URL" "https://qmjauzmtznndsysnaxzo.supabase.co"
set_env "VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDY4NzUsImV4cCI6MjA2Njc4Mjg3NX0.IfoQ_HxrkOE_-sEYM-7qu1FO7xIivWyAV3dSL141vrA"
set_env "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIwNjg3NSwiZXhwIjoyMDY2NzgyODc1fQ.b6xwW8zRD83Hy7odoL9DJ0JA6MKlVOdASF2aXMSzH74"
set_env "SUPABASE_JWT_SECRET" "c907b3bc3eab1f5d335ef5c3f57a8aceb10d44631c6e300d0fd162c4e3b573ab1850fbc2e510035d303a67eb2cf9c54a48ea50323e689bef967d51e2108ce5f4"
set_env "ADMIN_PASSWORD" "nllQBeod5hwoBwqC"

echo "✅ Vercel environment variables set!"
echo "🚀 Now deploy with: vercel --prod"