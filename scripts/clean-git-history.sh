#!/bin/bash

echo "🧹 Git History Cleanup Script"
echo "=============================="
echo ""
echo "⚠️  WARNING: This will rewrite git history and require force push!"
echo "⚠️  Make sure all team members are aware before proceeding!"
echo ""
echo "This script will remove the old compromised credentials from git history."
echo ""
read -p "Are you sure you want to proceed? Type 'yes' to continue: " -r
echo ""

if [[ $REPLY != "yes" ]]; then
    echo "Aborted."
    exit 1
fi

# Backup current state
echo "📋 Creating backup..."
git branch backup-before-cleanup

# Remove specific credential strings from history
echo "🔄 Removing old anon key from history..."
git filter-branch --force --tree-filter '
    # Remove old anon key from all files
    find . -type f -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | xargs -I {} sed -i "s/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDY4NzUsImV4cCI6MjA2Njc4Mjg3NX0\.IfoQ_HxrkOE_-sEYM-7qu1FO7xIivWyAV3dSL141vrA/REMOVED_OLD_ANON_KEY/g" {}
' --tag-name-filter cat -- --all

echo "🔄 Removing old service role key from history..."
git filter-branch --force --tree-filter '
    # Remove old service role key from all files  
    find . -type f -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | xargs -I {} sed -i "s/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIwNjg3NSwiZXhwIjoyMDY2NzgyODc1fQ\.b6xwW8zRD83Hy7odoL9DJ0JA6MKlVOdASF2aXMSzH74/REMOVED_OLD_SERVICE_ROLE_KEY/g" {}
' --tag-name-filter cat -- --all

# Clean up filter-branch files
echo "🧹 Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git log --oneline -10"
echo "2. Force push to GitHub: git push origin --force --all"
echo "3. Update GitHub secrets with new credentials"
echo "4. If you have team members, they need to re-clone the repository"
echo ""
echo "⚠️  Remember: Force pushing will affect anyone else working on this repo!"