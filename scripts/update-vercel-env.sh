#!/bin/bash

# Script to update Vercel environment variables
# Usage: ./update-vercel-env.sh

echo "🔐 Updating Vercel Environment Variables..."
echo "⚠️  Make sure you have updated .env.new-template with the new Supabase keys first!"
echo ""
read -p "Have you updated .env.new-template with new Supabase keys? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please update .env.new-template first, then run this script again."
    exit 1
fi

# Source the new environment file
if [ -f ".env.new-template" ]; then
    # Parse the env file and set variables
    export $(cat .env.new-template | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "❌ .env.new-template not found!"
    exit 1
fi

echo "📝 Setting Vercel environment variables..."

# Function to set Vercel env var
set_vercel_env() {
    local key=$1
    local value=$2
    local env_type=${3:-"production development preview"}
    
    echo "Setting $key..."
    vercel env rm "$key" production --yes 2>/dev/null || true
    vercel env rm "$key" development --yes 2>/dev/null || true
    vercel env rm "$key" preview --yes 2>/dev/null || true
    
    for env in $env_type; do
        echo "$value" | vercel env add "$key" "$env" --yes
    done
}

# Set public environment variables (available in frontend)
set_vercel_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
set_vercel_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"
set_vercel_env "VITE_EMAILJS_PUBLIC_KEY" "$VITE_EMAILJS_PUBLIC_KEY"

# Set secret environment variables (backend only)
set_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
set_vercel_env "SUPABASE_JWT_SECRET" "$SUPABASE_JWT_SECRET"
set_vercel_env "DATABASE_URL" "$DATABASE_URL"
set_vercel_env "PGUSER" "$PGUSER"
set_vercel_env "PGPASSWORD" "$PGPASSWORD"
set_vercel_env "PGHOST" "$PGHOST"
set_vercel_env "PGPORT" "$PGPORT"
set_vercel_env "PGDATABASE" "$PGDATABASE"
set_vercel_env "ADMIN_PASSWORD" "$ADMIN_PASSWORD"

echo ""
echo "✅ Vercel environment variables updated!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Test the deployment with new credentials"
echo "3. Delete old credential files:"
echo "   rm .env.compromised.backup"
echo "   rm .env.new-template"
echo ""
echo "⚠️  IMPORTANT: Monitor your Supabase logs for any unauthorized access attempts!"