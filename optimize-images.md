# Image Optimization Guide for Fear City Cycles

## Current Image Analysis (Total: ~25MB)

### Critical Issues:
- Images are 1-2.5MB each (way too large for web)
- Target: 200KB max for products, 500KB max for heroes
- Current total: ~25MB, Target: ~5MB

### Current Image Sizes:
```
2.5MB - dark-texture.png
2.3MB - vest-prospect.png  
2.1MB - jacket-fear-city.png
1.9MB - patch-fear-city.png
1.9MB - nyc-streets.png
1.9MB - hero-bike.png
1.7MB - hero-bg.png
1.4MB - gloves-reaper-riding.png
1.4MB - bike-queens-crusher.png
1.4MB - bike-death-rider.png
1.4MB - bike-borough-bruiser.png
1.3MB - tee-queens-skull.png
1.3MB - bike-fear-fighter.png
1.2MB - bike-street-reaper.png
1.2MB - bike-midnight-racer.png
1.1MB - keychain-skull.png
56KB  - fear-city-logo-small.jpg (OK)
28KB  - Fear-city-image-Hi-Rez.jpg (OK)
```

## Optimization Strategy

### 1. Product Images (Bikes & Gear)
**Target Size**: 150-200KB each
**Current Size**: 1.1-2.3MB each
**Dimensions**: Reduce from 1232x928 to 800x600 or 600x450
**Format**: Convert PNG to JPEG with 80% quality

### 2. Hero Images
**Target Size**: 300-500KB each  
**Current Size**: 1.7-1.9MB each
**Keep as PNG** for quality, but reduce dimensions

### 3. Texture/Background Images
**Target Size**: 200-300KB
**Current Size**: 2.5MB
**Can compress significantly** as patterns

## Manual Optimization Options

### Option 1: Online Tools (Recommended)
1. **TinyPNG.com** - Drag and drop PNG files
2. **JPEGmini.com** - For JPEG optimization
3. **Squoosh.app** - Google's web-based image optimizer

### Option 2: Desktop Tools
1. **ImageOptim (Mac)** - Free drag-and-drop optimizer
2. **RIOT (Windows)** - Radical Image Optimization Tool
3. **GIMP** - Free alternative to Photoshop

### Option 3: Command Line (if available)
```bash
# Install tools (Ubuntu/Debian)
sudo apt-get install imagemagick jpegoptim optipng

# Optimize PNGs
optipng -o5 assets/images/*.png

# Convert PNG to JPEG and resize
for img in assets/images/bike-*.png; do
    convert "$img" -resize 800x600 -quality 80 "${img%.png}.jpg"
done

# Optimize JPEGs
jpegoptim --size=200k assets/images/*.jpg
```

## Specific Optimization Targets

### Bikes (Convert PNG to JPEG, resize to 800x600, 80% quality)
- bike-street-reaper.png → bike-street-reaper.jpg (target: 150KB)
- bike-borough-bruiser.png → bike-borough-bruiser.jpg (target: 150KB)
- bike-fear-fighter.png → bike-fear-fighter.jpg (target: 150KB)
- bike-queens-crusher.png → bike-queens-crusher.jpg (target: 150KB)
- bike-death-rider.png → bike-death-rider.jpg (target: 150KB)
- bike-midnight-racer.png → bike-midnight-racer.jpg (target: 150KB)

### Gear (Convert PNG to JPEG, resize to 600x600, 85% quality)
- jacket-fear-city.png → jacket-fear-city.jpg (target: 180KB)
- tee-queens-skull.png → tee-queens-skull.jpg (target: 120KB)
- gloves-reaper-riding.png → gloves-reaper-riding.jpg (target: 140KB)
- patch-fear-city.png → patch-fear-city.jpg (target: 100KB)
- vest-prospect.png → vest-prospect.jpg (target: 160KB)
- keychain-skull.png → keychain-skull.jpg (target: 80KB)

### Heroes & Backgrounds (Keep PNG, optimize)
- hero-bg.png (resize to 1920x1080, optimize: target 400KB)
- hero-bike.png (resize to 1200x800, optimize: target 300KB)
- nyc-streets.png (resize to 1200x800, optimize: target 300KB)
- dark-texture.png (resize to 512x512 tileable, optimize: target 150KB)

## File Naming Convention Update

After optimization, update HTML files to reference:
- `.png` → `.jpg` for product images
- Keep existing paths for optimized PNG files

## Expected Results

### Before Optimization:
- Total Size: ~25MB
- Load Time: 15-30 seconds on mobile
- Deployment Issues: Files too large for some hosting

### After Optimization:
- Total Size: ~4-5MB (80% reduction)
- Load Time: 2-3 seconds on mobile  
- Deployment: No issues with file sizes
- Quality: Visually identical for web use

## Implementation Steps

1. **Backup originals** to `assets/images/originals/`
2. **Optimize images** using preferred method above
3. **Update HTML files** if changing extensions (.png to .jpg)
4. **Test locally** to ensure quality is acceptable
5. **Deploy and test** on live site
6. **Monitor performance** improvements

## Quality Check

After optimization:
- Images should be sharp and clear
- No visible compression artifacts
- Colors should remain vibrant
- File sizes under targets above
- Total reduction of 80%+ from current sizes