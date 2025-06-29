#!/bin/bash

# Supabase Credential Rotation Script
# This script helps rotate Supabase credentials using the CLI

SUPABASE_CLI="./node_modules/supabase/bin/supabase"
PROJECT_ID="qmjauzmtznndsysnaxzo"

echo "🔐 Supabase Credential Rotation Script"
echo "======================================"
echo ""
echo "This script will help you rotate your Supabase credentials."
echo ""

# Check if Supabase CLI is available
if [ ! -f "$SUPABASE_CLI" ]; then
    echo "❌ Supabase CLI not found at $SUPABASE_CLI"
    echo "Please install it with: npm install supabase"
    exit 1
fi

echo "📋 Steps to rotate credentials:"
echo ""
echo "1. First, login to Supabase CLI:"
echo "   $SUPABASE_CLI login"
echo ""
echo "2. Generate new database password:"
echo "   Database Password: Wf!HIABt&AEpj@uUXQcVBD%b"
echo ""
echo "3. Update database password:"
echo "   $SUPABASE_CLI projects database reset --project-ref $PROJECT_ID --password 'Wf!HIABt&AEpj@uUXQcVBD%b'"
echo ""
echo "4. Get new API keys:"
echo "   $SUPABASE_CLI projects api-keys get --project-ref $PROJECT_ID"
echo ""
echo "5. Regenerate API keys (this will invalidate old keys):"
echo "   ⚠️  WARNING: This will immediately invalidate all existing keys!"
echo "   $SUPABASE_CLI projects api-keys regenerate --project-ref $PROJECT_ID --key anon"
echo "   $SUPABASE_CLI projects api-keys regenerate --project-ref $PROJECT_ID --key service_role"
echo ""
echo "6. Update JWT secret in Supabase Dashboard (manual step required):"
echo "   - Go to: https://app.supabase.com/project/$PROJECT_ID/settings/auth"
echo "   - Update JWT secret to:"
echo "     c907b3bc3eab1f5d335ef5c3f57a8aceb10d44631c6e300d0fd162c4e3b573ab1850fbc2e510035d303a67eb2cf9c54a48ea50323e689bef967d51e2108ce5f4"
echo ""
echo "7. After getting new keys, update .env.new-template with the values"
echo ""
echo "Would you like to proceed with the automated steps? (y/n)"
read -p "> " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔑 Step 1: Logging in to Supabase..."
    $SUPABASE_CLI login
    
    echo ""
    echo "🔐 Step 2: Resetting database password..."
    read -p "Reset database password now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUPABASE_CLI projects database reset --project-ref $PROJECT_ID --password 'Wf!HIABt&AEpj@uUXQcVBD%b'
    fi
    
    echo ""
    echo "📋 Step 3: Getting current API keys..."
    $SUPABASE_CLI projects api-keys get --project-ref $PROJECT_ID
    
    echo ""
    echo "⚠️  Step 4: Regenerate API keys?"
    echo "WARNING: This will immediately invalidate all existing keys!"
    read -p "Regenerate anon key? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUPABASE_CLI projects api-keys regenerate --project-ref $PROJECT_ID --key anon
    fi
    
    read -p "Regenerate service_role key? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUPABASE_CLI projects api-keys regenerate --project-ref $PROJECT_ID --key service_role
    fi
    
    echo ""
    echo "✅ Automated steps complete!"
    echo ""
    echo "📋 Manual steps remaining:"
    echo "1. Update JWT secret in Supabase Dashboard"
    echo "2. Update .env.new-template with new API keys"
    echo "3. Run ./scripts/update-vercel-env.sh to update Vercel"
else
    echo "Aborted. You can run the commands manually as shown above."
fi