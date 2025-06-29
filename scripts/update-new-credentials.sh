#!/bin/bash

echo "🔐 Updating Vercel with NEW rotated credentials..."

# Function to set env var (removing old ones first)
set_env() {
    local key=$1
    local value=$2
    echo "Setting $key..."
    # Remove from all environments first
    vercel env rm "$key" production 2>/dev/null || true
    vercel env rm "$key" preview 2>/dev/null || true  
    vercel env rm "$key" development 2>/dev/null || true
    # Add to all environments
    echo "$value" | vercel env add "$key" production
    echo "$value" | vercel env add "$key" preview  
    echo "$value" | vercel env add "$key" development
}

# Set the NEW rotated credentials
set_env "VITE_SUPABASE_URL" "https://qmjauzmtznndsysnaxzo.supabase.co"
set_env "VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzEwMzIsImV4cCI6MjA2NjgwNzAzMn0.Fx8Cicv8ZFtWBHWJAS9kHyrvOQOxXGbQNoPM5a69pfQ"
set_env "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMTAzMiwiZXhwIjoyMDY2ODA3MDMyfQ.ZTGwgZ1ku6WsAa6QAVeH2ZJducntClCaalk20yW6p7c"
set_env "SUPABASE_JWT_SECRET" "4C//AHTgP6X6E36rN4qd+K0nJ/fGYeOIBPCiQ2tVmU+qC9lrBg8HiXTxILToyc5yfAxTJaO+i3Cj9irexc56yw=="
set_env "ADMIN_PASSWORD" "nllQBeod5hwoBwqC"
set_env "DATABASE_URL" "postgresql://postgres:Wf!HIABt&AEpj@uUXQcVBD%b@db.qmjauzmtznndsysnaxzo.supabase.co:5432/postgres"
set_env "PGPASSWORD" "Wf!HIABt&AEpj@uUXQcVBD%b"

echo ""
echo "✅ NEW credentials set in Vercel!"
echo "🚀 Deploy now with: vercel --prod"
echo "🔒 Then go back to Supabase and click 'Disable legacy API keys'"