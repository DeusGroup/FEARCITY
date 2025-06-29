#!/usr/bin/env node

// Regenerate Asset Mapping Script
// Creates accurate mapping of current Supabase Storage assets

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

class MappingRegenerator {
    constructor() {
        this.supabaseUrl = 'https://qmjauzmtznndsysnaxzo.supabase.co';
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucketName = 'fear-city-assets';
        this.client = null;
        this.baseStorageUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}`;
    }

    async initialize() {
        if (!this.supabaseKey) {
            console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
            return false;
        }

        this.client = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Supabase client initialized');
        return true;
    }

    async getAllStorageFiles() {
        console.log('🔍 Scanning Supabase Storage for all files...\n');
        
        const allFiles = [];
        await this.listFilesRecursive('', allFiles);
        
        console.log(`📊 Found ${allFiles.length} files in storage`);
        return allFiles;
    }

    async listFilesRecursive(folder, allFiles) {
        try {
            const { data: items, error } = await this.client.storage
                .from(this.bucketName)
                .list(folder);

            if (error) {
                console.error(`❌ Error listing folder ${folder}:`, error);
                return;
            }

            for (const item of items) {
                const itemPath = folder ? `${folder}/${item.name}` : item.name;
                
                if (item.metadata === null) {
                    // It's a folder, recurse into it
                    await this.listFilesRecursive(itemPath, allFiles);
                } else {
                    // It's a file
                    allFiles.push({
                        name: item.name,
                        path: itemPath,
                        size: item.metadata?.size || 0
                    });
                    console.log(`   📄 ${itemPath} (${Math.round((item.metadata?.size || 0)/1024)}KB)`);
                }
            }
        } catch (error) {
            console.error(`❌ Error listing ${folder}:`, error);
        }
    }

    generateMapping(files) {
        console.log('\n🗺️ Generating asset mapping...\n');
        
        const mapping = {};
        
        files.forEach(file => {
            // Extract base filename without extension
            const fileName = file.name;
            const baseName = fileName.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
            const fullUrl = `${this.baseStorageUrl}/${file.path}`;
            
            mapping[baseName] = fullUrl;
            console.log(`   🔗 ${baseName} → ${fullUrl}`);
        });
        
        return mapping;
    }

    async saveMapping(mapping) {
        const mappingFile = './supabase-asset-mapping.json';
        await fs.writeFile(mappingFile, JSON.stringify(mapping, null, 2));
        console.log(`\n💾 Asset mapping saved to: ${mappingFile}`);
        console.log(`📊 Total assets mapped: ${Object.keys(mapping).length}`);
    }

    async regenerate() {
        console.log('🔄 Regenerating Fear City Cycles Asset Mapping\n');
        
        if (!(await this.initialize())) return false;
        
        const files = await this.getAllStorageFiles();
        
        if (files.length === 0) {
            console.log('⚠️ No files found in Supabase Storage');
            console.log('💡 Run: node migrate-assets.js migrate');
            return false;
        }
        
        const mapping = this.generateMapping(files);
        await this.saveMapping(mapping);
        
        console.log('\n✅ Asset mapping regenerated successfully!');
        return true;
    }
}

// Command line interface
async function main() {
    const regenerator = new MappingRegenerator();
    await regenerator.regenerate();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MappingRegenerator;