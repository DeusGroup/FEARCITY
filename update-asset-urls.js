#!/usr/bin/env node

// Update Asset URLs Script
// Updates all HTML files to use Supabase Storage URLs

const fs = require('fs').promises;
const path = require('path');

class AssetUrlUpdater {
    constructor() {
        this.assetMapping = null;
        this.htmlFiles = [
            'index.html',
            'main.html',
            'bikes/index.html',
            'gear/index.html',
            'contact/index.html',
            'cart/index.html'
        ];
        
        this.baseStorageUrl = 'https://qmjauzmtznndsysnaxzo.supabase.co/storage/v1/object/public/fear-city-assets';
    }

    async loadAssetMapping() {
        try {
            const mappingData = await fs.readFile('./supabase-asset-mapping.json', 'utf8');
            this.assetMapping = JSON.parse(mappingData);
            console.log('✅ Asset mapping loaded');
            return true;
        } catch (error) {
            console.error('❌ Error loading asset mapping:', error);
            return false;
        }
    }

    getSupabaseUrl(assetPath) {
        // Extract filename from path
        const filename = assetPath.split('/').pop();
        const baseFilename = filename.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
        
        // Check if we have a direct mapping
        if (this.assetMapping[baseFilename]) {
            return this.assetMapping[baseFilename];
        }

        // Fallback: construct URL based on file name patterns
        const filenameLower = filename.toLowerCase();
        
        if (filenameLower.includes('hero') || filenameLower.includes('nyc-streets')) {
            return `${this.baseStorageUrl}/hero/${filename}`;
        } else if (filenameLower.includes('logo') || filenameLower.includes('fear-city-image')) {
            return `${this.baseStorageUrl}/logo/${filename}`;
        } else if (filenameLower.includes('bike-')) {
            return `${this.baseStorageUrl}/products/bikes/${filename}`;
        } else if (filenameLower.includes('jacket') || filenameLower.includes('tee') || 
                   filenameLower.includes('gloves') || filenameLower.includes('patch') ||
                   filenameLower.includes('vest') || filenameLower.includes('keychain')) {
            return `${this.baseStorageUrl}/products/gear/${filename}`;
        } else if (filenameLower.includes('texture')) {
            return `${this.baseStorageUrl}/textures/${filename}`;
        }
        
        // Default fallback
        return `${this.baseStorageUrl}/misc/${filename}`;
    }

    async updateHtmlFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            let updatedContent = content;
            let changeCount = 0;

            // Replace img src attributes
            updatedContent = updatedContent.replace(/src=["']([^"']*assets\/images\/[^"']*)["']/g, (match, assetPath) => {
                const newUrl = this.getSupabaseUrl(assetPath);
                changeCount++;
                console.log(`   🔄 ${assetPath} → Supabase URL`);
                return `src="${newUrl}"`;
            });

            // Replace CSS background-image URLs
            updatedContent = updatedContent.replace(/background-image:\s*url\(['"]?([^'")]*assets\/images\/[^'")]*)['"]?\)/g, (match, assetPath) => {
                const newUrl = this.getSupabaseUrl(assetPath);
                changeCount++;
                console.log(`   🔄 Background: ${assetPath} → Supabase URL`);
                return `background-image: url('${newUrl}')`;
            });

            // Replace style attribute background-image
            updatedContent = updatedContent.replace(/style=["']([^"']*background-image:\s*url\([^)]*assets\/images\/[^)]*\)[^"']*)["']/g, (match, styleContent) => {
                const updatedStyle = styleContent.replace(/url\(['"]?([^'")]*assets\/images\/[^'")]*)['"]?\)/g, (urlMatch, assetPath) => {
                    const newUrl = this.getSupabaseUrl(assetPath);
                    changeCount++;
                    console.log(`   🔄 Style: ${assetPath} → Supabase URL`);
                    return `url('${newUrl}')`;
                });
                return `style="${updatedStyle}"`;
            });

            // Write updated content if changes were made
            if (changeCount > 0) {
                await fs.writeFile(filePath, updatedContent);
                console.log(`✅ Updated ${filePath} (${changeCount} changes)`);
                return changeCount;
            } else {
                console.log(`⚪ No changes needed in ${filePath}`);
                return 0;
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`⚠️ File not found: ${filePath}`);
                return 0;
            }
            console.error(`❌ Error updating ${filePath}:`, error);
            return 0;
        }
    }

    async updateAllFiles() {
        console.log('🚀 Starting asset URL updates...\n');

        // Load asset mapping
        if (!(await this.loadAssetMapping())) {
            return false;
        }

        let totalChanges = 0;

        // Update each HTML file
        for (const filePath of this.htmlFiles) {
            console.log(`📄 Processing: ${filePath}`);
            const changes = await this.updateHtmlFile(filePath);
            totalChanges += changes;
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Files processed: ${this.htmlFiles.length}`);
        console.log(`🔄 Total URL updates: ${totalChanges}`);
        
        if (totalChanges > 0) {
            console.log(`\n✨ All asset URLs now point to Supabase Storage!`);
            console.log(`🌐 Base URL: ${this.baseStorageUrl}`);
        }

        return true;
    }

    async addSupabaseScripts() {
        // Add Supabase CDN and storage config to main files
        const filesToUpdate = ['index.html', 'main.html'];
        
        for (const filePath of filesToUpdate) {
            try {
                let content = await fs.readFile(filePath, 'utf8');
                
                // Check if Supabase scripts are already included
                if (content.includes('supabase-js') || content.includes('supabase-storage-config.js')) {
                    console.log(`⚪ Supabase scripts already in ${filePath}`);
                    continue;
                }

                // Add Supabase CDN before closing head tag
                const supabaseScript = `    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-config.js"></script>
    <script src="supabase-storage-config.js"></script>`;

                content = content.replace('</head>', `${supabaseScript}\n</head>`);
                
                await fs.writeFile(filePath, content);
                console.log(`✅ Added Supabase scripts to ${filePath}`);
            } catch (error) {
                console.error(`❌ Error adding scripts to ${filePath}:`, error);
            }
        }
    }
}

// Command line interface
async function main() {
    const updater = new AssetUrlUpdater();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'update':
            await updater.updateAllFiles();
            await updater.addSupabaseScripts();
            break;
        case 'scripts':
            await updater.addSupabaseScripts();
            break;
        default:
            console.log('Fear City Cycles Asset URL Updater');
            console.log('Usage:');
            console.log('  node update-asset-urls.js update  - Update all HTML files with Supabase URLs');
            console.log('  node update-asset-urls.js scripts - Add Supabase scripts to HTML files');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AssetUrlUpdater;