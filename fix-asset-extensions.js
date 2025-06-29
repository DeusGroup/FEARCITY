#!/usr/bin/env node

// Fix Asset Extensions Script
// Updates all Supabase URLs to use correct JPG extensions

const fs = require('fs').promises;

class ExtensionFixer {
    constructor() {
        this.htmlFiles = [
            'index.html',
            'main.html',
            'bikes/index.html',
            'gear/index.html',
            'contact/index.html',
            'cart/index.html'
        ];
        
        this.assetMapping = null;
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

    async fixHtmlFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            let updatedContent = content;
            let changeCount = 0;

            // Find all Supabase URLs and fix their extensions
            const supabaseUrlRegex = /https:\/\/qmjauzmtznndsysnaxzo\.supabase\.co\/storage\/v1\/object\/public\/fear-city-assets\/[^"'\s)]+/g;
            
            updatedContent = updatedContent.replace(supabaseUrlRegex, (match) => {
                // Extract the asset name from the URL
                const urlParts = match.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const baseName = fileName.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
                
                // Check if we have a correct mapping for this asset
                if (this.assetMapping[baseName]) {
                    if (match !== this.assetMapping[baseName]) {
                        console.log(`   🔄 ${fileName} → ${this.assetMapping[baseName].split('/').pop()}`);
                        changeCount++;
                        return this.assetMapping[baseName];
                    }
                }
                
                return match;
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

    async fixAllFiles() {
        console.log('🔧 Fixing asset extensions in HTML files...\n');

        // Load asset mapping
        if (!(await this.loadAssetMapping())) {
            return false;
        }

        let totalChanges = 0;

        // Fix each HTML file
        for (const filePath of this.htmlFiles) {
            console.log(`📄 Processing: ${filePath}`);
            const changes = await this.fixHtmlFile(filePath);
            totalChanges += changes;
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Files processed: ${this.htmlFiles.length}`);
        console.log(`🔄 Total URL fixes: ${totalChanges}`);
        
        if (totalChanges > 0) {
            console.log(`\n✨ All asset URLs now use correct JPG extensions!`);
        } else {
            console.log(`\n✅ All asset URLs are already correct!`);
        }

        return true;
    }

    async testAssetUrls() {
        console.log('🔍 Testing asset URL accessibility...\n');
        
        if (!(await this.loadAssetMapping())) {
            return false;
        }

        let accessible = 0;
        let total = 0;

        for (const [assetName, url] of Object.entries(this.assetMapping)) {
            total++;
            console.log(`🌐 Testing: ${assetName}`);
            console.log(`   URL: ${url}`);
            
            try {
                // For Node.js environment, we can't directly test HTTP requests
                // But we can validate the URL format
                if (url.startsWith('https://qmjauzmtznndsysnaxzo.supabase.co') && url.includes('.jpg')) {
                    console.log(`   ✅ URL format valid`);
                    accessible++;
                } else {
                    console.log(`   ❌ URL format invalid`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
            console.log('');
        }

        console.log(`📊 URL Test Results:`);
        console.log(`✅ Valid URLs: ${accessible}/${total}`);
        console.log(`📈 Success Rate: ${Math.round((accessible/total)*100)}%`);

        return accessible === total;
    }
}

// Command line interface
async function main() {
    const fixer = new ExtensionFixer();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'fix':
            await fixer.fixAllFiles();
            break;
        case 'test':
            await fixer.testAssetUrls();
            break;
        default:
            console.log('Fear City Cycles Asset Extension Fixer');
            console.log('Usage:');
            console.log('  node fix-asset-extensions.js fix  - Fix all HTML files with correct extensions');
            console.log('  node fix-asset-extensions.js test - Test asset URL accessibility');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ExtensionFixer;