#!/usr/bin/env node

// Asset Migration Script for Fear City Cycles
// Migrates all local assets to Supabase Storage

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class AssetMigrator {
    constructor() {
        this.supabaseUrl = 'https://qmjauzmtznndsysnaxzo.supabase.co';
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucketName = 'fear-city-assets';
        this.localAssetDir = './assets/images';
        this.client = null;
        
        // Asset organization structure
        this.assetCategories = {
            hero: ['hero-bg.jpg', 'hero-bike.jpg', 'nyc-streets.jpg'],
            logo: ['Fear-city-image-Hi-Rez.jpg', 'fear-city-logo-small.jpg'],
            textures: ['dark-texture.jpg'],
            'products/bikes': [
                'bike-street-reaper.jpg',
                'bike-borough-bruiser.jpg', 
                'bike-fear-fighter.jpg',
                'bike-queens-crusher.jpg',
                'bike-death-rider.jpg',
                'bike-midnight-racer.jpg'
            ],
            'products/gear': [
                'jacket-fear-city.jpg',
                'tee-queens-skull.jpg',
                'gloves-reaper-riding.jpg',
                'patch-fear-city.jpg',
                'vest-prospect.jpg',
                'keychain-skull.jpg'
            ]
        };
    }

    async initialize() {
        if (!this.supabaseKey) {
            console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
            console.log('💡 Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
            return false;
        }

        this.client = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Supabase client initialized');
        return true;
    }

    async createBucket() {
        try {
            const { data, error } = await this.client.storage.createBucket(this.bucketName, {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
                fileSizeLimit: 10485760 // 10MB
            });

            if (error && error.message !== 'The resource already exists') {
                console.error('❌ Error creating bucket:', error);
                return false;
            }

            console.log('✅ Storage bucket ready:', this.bucketName);
            return true;
        } catch (error) {
            console.error('❌ Bucket creation failed:', error);
            return false;
        }
    }

    async findLocalAssets() {
        const assets = [];
        
        try {
            // Check main assets directory
            const files = await fs.readdir(this.localAssetDir);
            
            for (const file of files) {
                const filePath = path.join(this.localAssetDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile() && this.isImageFile(file)) {
                    assets.push({
                        localPath: filePath,
                        fileName: file,
                        size: stats.size
                    });
                }
            }

            // Check optimized directory
            const optimizedDir = path.join(this.localAssetDir, 'optimized');
            try {
                const optimizedFiles = await fs.readdir(optimizedDir);
                for (const file of optimizedFiles) {
                    if (this.isImageFile(file) && !file.includes('Zone.Identifier')) {
                        const filePath = path.join(optimizedDir, file);
                        const stats = await fs.stat(filePath);
                        assets.push({
                            localPath: filePath,
                            fileName: file.replace('optimized_', ''), // Remove prefix
                            size: stats.size,
                            isOptimized: true
                        });
                    }
                }
            } catch (error) {
                console.log('⚠️ No optimized directory found, using original images');
            }

            console.log(`📁 Found ${assets.length} local assets`);
            return assets;
        } catch (error) {
            console.error('❌ Error scanning local assets:', error);
            return [];
        }
    }

    isImageFile(filename) {
        return /\.(jpg|jpeg|png|webp|svg)$/i.test(filename) && 
               !filename.includes('Zone.Identifier') &&
               !filename.endsWith('.b64');
    }

    getStoragePath(fileName) {
        // Determine storage path based on file name
        for (const [category, files] of Object.entries(this.assetCategories)) {
            if (files.some(f => f === fileName || f.includes(fileName.replace(/\.(png|jpg|jpeg|webp)$/, '')))) {
                return `${category}/${fileName}`;
            }
        }
        
        // Default to miscellaneous if not categorized
        return `misc/${fileName}`;
    }

    async uploadAsset(asset) {
        try {
            const fileBuffer = await fs.readFile(asset.localPath);
            const storagePath = this.getStoragePath(asset.fileName);
            
            const { data, error } = await this.client.storage
                .from(this.bucketName)
                .upload(storagePath, fileBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: this.getMimeType(asset.fileName)
                });

            if (error) {
                console.error(`❌ Upload failed for ${asset.fileName}:`, error);
                return { success: false, path: storagePath, error };
            }

            const publicUrl = this.client.storage
                .from(this.bucketName)
                .getPublicUrl(storagePath).data.publicUrl;

            console.log(`✅ Uploaded: ${asset.fileName} → ${storagePath} (${Math.round(asset.size/1024)}KB)`);
            return { success: true, path: storagePath, url: publicUrl };
        } catch (error) {
            console.error(`❌ Upload error for ${asset.fileName}:`, error);
            return { success: false, path: asset.fileName, error };
        }
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    async migrateAllAssets() {
        console.log('🚀 Starting Fear City Cycles asset migration...\n');

        // Initialize
        if (!(await this.initialize())) return false;
        if (!(await this.createBucket())) return false;

        // Find local assets
        const assets = await this.findLocalAssets();
        if (assets.length === 0) {
            console.log('📭 No assets found to migrate');
            return true;
        }

        // Upload assets
        const results = {
            successful: [],
            failed: [],
            totalSize: 0
        };

        console.log(`📤 Uploading ${assets.length} assets...\n`);

        for (const asset of assets) {
            const result = await this.uploadAsset(asset);
            
            if (result.success) {
                results.successful.push(result);
                results.totalSize += asset.size;
            } else {
                results.failed.push({ asset, error: result.error });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Summary
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successful uploads: ${results.successful.length}`);
        console.log(`❌ Failed uploads: ${results.failed.length}`);
        console.log(`📈 Total size migrated: ${Math.round(results.totalSize/1024/1024*100)/100}MB`);

        if (results.failed.length > 0) {
            console.log('\n❌ Failed uploads:');
            results.failed.forEach(({ asset, error }) => {
                console.log(`   - ${asset.fileName}: ${error.message || error}`);
            });
        }

        // Generate asset mapping
        await this.generateAssetMapping(results.successful);

        return results.failed.length === 0;
    }

    async generateAssetMapping(successful) {
        const mapping = {};
        
        successful.forEach(({ path, url }) => {
            const fileName = path.split('/').pop();
            const key = fileName.replace(/\.(jpg|png|jpeg|webp|svg)$/i, '');
            mapping[key] = url;
        });

        const mappingFile = './supabase-asset-mapping.json';
        await fs.writeFile(mappingFile, JSON.stringify(mapping, null, 2));
        console.log(`📄 Asset mapping saved to: ${mappingFile}`);
    }

    async listStorageContents() {
        if (!this.client) {
            console.error('❌ Client not initialized');
            return;
        }

        try {
            const { data, error } = await this.client.storage
                .from(this.bucketName)
                .list('', { limit: 100 });

            if (error) {
                console.error('❌ Error listing storage:', error);
                return;
            }

            console.log('\n📁 Current storage contents:');
            data.forEach(item => {
                console.log(`   - ${item.name} (${Math.round(item.metadata?.size/1024 || 0)}KB)`);
            });
        } catch (error) {
            console.error('❌ Storage listing failed:', error);
        }
    }
}

// Command line interface
async function main() {
    const migrator = new AssetMigrator();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'migrate':
            await migrator.migrateAllAssets();
            break;
        case 'list':
            await migrator.initialize();
            await migrator.listStorageContents();
            break;
        case 'bucket':
            await migrator.initialize();
            await migrator.createBucket();
            break;
        default:
            console.log('Fear City Cycles Asset Migrator');
            console.log('Usage:');
            console.log('  node migrate-assets.js migrate  - Migrate all assets to Supabase');
            console.log('  node migrate-assets.js list     - List current storage contents');
            console.log('  node migrate-assets.js bucket   - Create storage bucket');
            console.log('\nEnvironment variables:');
            console.log('  SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AssetMigrator;