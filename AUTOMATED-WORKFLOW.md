# Automated Asset Workflow - Fear City Cycles

## Overview

GitHub Action automatically syncs new images to Supabase Storage and updates HTML files whenever you push changes to the repository.

## How It Works

### Trigger Conditions
The workflow runs when you push:
- New images to `assets/images/`
- Modified images in `assets/images/optimized/`
- Modified images in `assets/images/originals/`
- Or manually trigger it from GitHub Actions tab

### Automatic Process
1. **Detects Changes**: Compares your commit to find new/modified images
2. **Uploads to Supabase**: Runs migration script to upload images to storage
3. **Updates HTML**: Updates all HTML files with new Supabase URLs
4. **Commits Changes**: Automatically commits updated HTML files
5. **Triggers Deployment**: Vercel deploys updated site automatically

## Setup Required

### GitHub Secrets
Add these secrets in your GitHub repository:

1. Go to **GitHub.com** → Your Repository → **Settings** → **Secrets and Variables** → **Actions**
2. Click **"New repository secret"** and add:

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtamF1em10em5uZHN5c25heHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIwNjg3NSwiZXhwIjoyMDY2NzgyODc1fQ.b6xwW8zRD83Hy7odoL9DJ0JA6MKlVOdASF2aXMSzH74

Name: SUPABASE_URL  
Value: https://qmjauzmtznndsysnaxzo.supabase.co
```

## Usage

### Adding New Images

**Simple Method:**
```bash
# 1. Add images to assets/images/ folder
cp new-bike-photo.jpg assets/images/

# 2. Commit and push
git add .
git commit -m "Add new bike photo"
git push origin main

# 3. GitHub Action automatically:
#    - Uploads to Supabase Storage
#    - Updates HTML files
#    - Commits changes
#    - Deploys to Vercel
```

### Manual Workflow Trigger
1. Go to GitHub → Actions tab
2. Select "Sync Assets to Supabase Storage"
3. Click "Run workflow"

## Workflow Status

### Success Indicators
- ✅ Green checkmark in GitHub Actions
- 🚀 Deployment summary shows processed files
- 📄 New commit with "Auto-update HTML files"
- 🌐 Images load on live site

### If Workflow Fails
1. Check GitHub Actions tab for error details
2. Verify GitHub Secrets are set correctly
3. Ensure image files are valid formats (JPG, PNG, WebP, SVG)
4. Check Supabase Storage bucket permissions

## File Organization

### Local Structure
```
assets/images/
├── new-image.jpg          # → uploads to misc/ folder
├── bike-new-model.jpg     # → uploads to products/bikes/
├── jacket-new-style.jpg   # → uploads to products/gear/
├── hero-new-bg.jpg        # → uploads to hero/
└── logo-updated.jpg       # → uploads to logo/
```

### Supabase Storage Structure
The workflow automatically organizes files:
- `bike-*` → `products/bikes/`
- `jacket-*`, `tee-*`, `gloves-*`, etc. → `products/gear/`
- `hero-*`, `nyc-*` → `hero/`
- `logo-*`, `fear-city-*` → `logo/`
- `*texture*` → `textures/`
- Everything else → `misc/`

## Benefits

### Before Automation
```bash
# Manual process (old way)
cp image.jpg assets/images/
export SUPABASE_SERVICE_ROLE_KEY="..."
node migrate-assets.js migrate
node update-asset-urls.js update
git add .
git commit -m "Add new image"
git push
```

### After Automation
```bash
# Automated process (new way)
cp image.jpg assets/images/
git add .
git commit -m "Add new image"  
git push
# ✨ Everything else happens automatically!
```

## Monitoring

### GitHub Actions Tab
- View workflow runs and status
- See detailed logs for troubleshooting
- Download workflow artifacts if needed

### Workflow Summary
Each run creates a summary showing:
- Number of assets processed
- List of changed files
- Supabase Storage status
- HTML update status
- Deployment trigger confirmation

## Advanced Features

### Batch Image Upload
```bash
# Add multiple images at once
cp *.jpg assets/images/
git add .
git commit -m "Add batch of new product images"
git push
# All images upload and HTML updates automatically
```

### Image Optimization
The workflow processes:
- Original images from `assets/images/`
- Optimized images from `assets/images/optimized/`
- Backup originals from `assets/images/originals/`

### Error Handling
- Skips duplicate uploads (Supabase handles deduplication)
- Continues processing if individual files fail
- Provides detailed error logs in GitHub Actions

## Troubleshooting

### Common Issues

**Workflow doesn't trigger:**
- Check that images are in `assets/images/` path
- Verify image file extensions are valid
- Ensure push is to `main` branch

**Upload fails:**
- Verify GitHub Secrets are set correctly
- Check Supabase Storage bucket exists
- Ensure service role key has storage permissions

**HTML not updating:**
- Check that migration created `supabase-asset-mapping.json`
- Verify HTML files have proper asset paths
- Review workflow logs for update script errors

### Debug Commands
```bash
# Test locally before pushing
export SUPABASE_SERVICE_ROLE_KEY="your-key"
node migrate-assets.js migrate
node update-asset-urls.js update
```

## Security

### Credentials Protection
- Service role key stored as encrypted GitHub Secret
- Not exposed in workflow logs or commits
- Only accessible during workflow execution

### Repository Permissions
- Workflow has minimal required permissions
- Only writes to HTML files and asset mapping
- Cannot access other repository secrets

---

**🎉 Automated workflow active!**

Simply add images to `assets/images/` and push - everything else happens automatically!