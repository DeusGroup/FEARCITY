#!/usr/bin/env node

// Cleanup Duplicates Script
// Removes redundant PNG files and keeps JPG versions

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class DuplicateCleanup {
    constructor() {
        this.supabaseUrl = 'https://qmjauzmtznndsysnaxzo.supabase.co';
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucketName = 'fear-city-assets';
        this.client = null;
        
        this.localDirs = [
            './assets/images',
            './assets/images/optimized',
            './assets/images/originals'
        ];
        
        this.duplicatesToRemove = {
            local: [],
            supabase: []
        };
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

    async findLocalDuplicates() {
        console.log('🔍 Scanning for local duplicate images...\n');
        
        const duplicates = [];
        
        for (const dir of this.localDirs) {
            try {
                const files = await fs.readdir(dir);
                
                // Group files by base name (without extension)
                const fileGroups = {};
                
                for (const file of files) {
                    if (file.includes('Zone.Identifier') || file.endsWith('.b64')) {
                        // Also remove Zone.Identifier files
                        duplicates.push({
                            path: path.join(dir, file),
                            reason: 'Zone.Identifier or b64 file'
                        });
                        continue;
                    }
                    
                    const ext = path.extname(file).toLowerCase();
                    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
                    
                    // Get base filename without extension and prefixes
                    let baseName = path.basename(file, ext);
                    baseName = baseName.replace(/^optimized_/, ''); // Remove optimized prefix
                    
                    if (!fileGroups[baseName]) {
                        fileGroups[baseName] = [];
                    }
                    
                    fileGroups[baseName].push({
                        fullPath: path.join(dir, file),
                        fileName: file,
                        extension: ext,
                        directory: dir
                    });
                }
                
                // Find duplicates (prefer JPG over PNG)
                for (const [baseName, files] of Object.entries(fileGroups)) {
                    if (files.length > 1) {
                        console.log(`📁 Found duplicates for: ${baseName}`);
                        
                        // Sort by preference: JPG > JPEG > WebP > PNG
                        files.sort((a, b) => {
                            const priority = { '.jpg': 1, '.jpeg': 2, '.webp': 3, '.png': 4 };
                            return (priority[a.extension] || 5) - (priority[b.extension] || 5);
                        });
                        
                        const keepFile = files[0];
                        const removeFiles = files.slice(1);
                        
                        console.log(`   ✅ Keep: ${keepFile.fileName}`);
                        removeFiles.forEach(file => {
                            console.log(`   ❌ Remove: ${file.fileName}`);
                            duplicates.push({
                                path: file.fullPath,
                                reason: `Duplicate of ${keepFile.fileName} (prefer ${keepFile.extension} over ${file.extension})`
                            });
                        });
                        console.log('');
                    }
                }
                
            } catch (error) {
                console.log(`⚠️ Directory ${dir} not found, skipping`);
            }
        }
        
        this.duplicatesToRemove.local = duplicates;
        console.log(`📊 Found ${duplicates.length} local files to remove\n`);
        return duplicates;
    }

    async findSupabaseDuplicates() {
        console.log('🔍 Scanning Supabase Storage for duplicates...\n');
        
        if (!this.client) return [];
        
        try {
            // List all files in storage
            const { data: files, error } = await this.client.storage
                .from(this.bucketName)
                .list('', { limit: 1000 });

            if (error) {
                console.error('❌ Error listing Supabase files:', error);
                return [];
            }

            const duplicates = [];
            
            // Recursively get all files from all folders
            const allFiles = [];
            await this.listAllSupabaseFiles('', allFiles);
            
            // Group by base name
            const fileGroups = {};
            
            for (const file of allFiles) {
                const fileName = file.name;
                const ext = path.extname(fileName).toLowerCase();
                
                if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
                
                let baseName = path.basename(fileName, ext);
                
                if (!fileGroups[baseName]) {
                    fileGroups[baseName] = [];
                }
                
                fileGroups[baseName].push({
                    name: fileName,
                    path: file.path,
                    extension: ext
                });
            }
            
            // Find duplicates in Supabase
            for (const [baseName, files] of Object.entries(fileGroups)) {
                if (files.length > 1) {
                    console.log(`📁 Found Supabase duplicates for: ${baseName}`);
                    
                    // Sort by preference: JPG > JPEG > WebP > PNG
                    files.sort((a, b) => {
                        const priority = { '.jpg': 1, '.jpeg': 2, '.webp': 3, '.png': 4 };
                        return (priority[a.extension] || 5) - (priority[b.extension] || 5);
                    });
                    
                    const keepFile = files[0];
                    const removeFiles = files.slice(1);
                    
                    console.log(`   ✅ Keep: ${keepFile.path}`);
                    removeFiles.forEach(file => {
                        console.log(`   ❌ Remove: ${file.path}`);
                        duplicates.push({
                            path: file.path,
                            reason: `Duplicate of ${keepFile.path} (prefer ${keepFile.extension})`
                        });
                    });
                    console.log('');
                }
            }
            
            this.duplicatesToRemove.supabase = duplicates;
            console.log(`📊 Found ${duplicates.length} Supabase files to remove\n`);
            return duplicates;
            
        } catch (error) {
            console.error('❌ Error scanning Supabase Storage:', error);
            return [];
        }
    }

    async listAllSupabaseFiles(folder, allFiles, prefix = '') {
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
                    // It's a folder
                    await this.listAllSupabaseFiles(itemPath, allFiles, prefix);
                } else {
                    // It's a file
                    allFiles.push({
                        name: item.name,
                        path: itemPath
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Error listing ${folder}:`, error);
        }
    }

    async removeLocalDuplicates() {
        console.log('🗑️ Removing local duplicate files...\n');
        
        let removed = 0;
        for (const duplicate of this.duplicatesToRemove.local) {
            try {
                await fs.unlink(duplicate.path);
                console.log(`✅ Removed: ${duplicate.path}`);
                console.log(`   Reason: ${duplicate.reason}\n`);
                removed++;
            } catch (error) {
                console.error(`❌ Failed to remove ${duplicate.path}:`, error.message);
            }
        }
        
        console.log(`📊 Removed ${removed}/${this.duplicatesToRemove.local.length} local files\n`);
        return removed;
    }

    async removeSupabaseDuplicates() {
        console.log('🗑️ Removing Supabase duplicate files...\n');
        
        if (!this.client) return 0;
        
        let removed = 0;
        for (const duplicate of this.duplicatesToRemove.supabase) {
            try {
                const { error } = await this.client.storage
                    .from(this.bucketName)
                    .remove([duplicate.path]);

                if (error) {
                    console.error(`❌ Failed to remove ${duplicate.path}:`, error);
                } else {
                    console.log(`✅ Removed from Supabase: ${duplicate.path}`);
                    console.log(`   Reason: ${duplicate.reason}\n`);
                    removed++;
                }
            } catch (error) {
                console.error(`❌ Error removing ${duplicate.path}:`, error);
            }
        }
        
        console.log(`📊 Removed ${removed}/${this.duplicatesToRemove.supabase.length} Supabase files\n`);
        return removed;
    }

    async updateAssetMapping() {
        console.log('📄 Updating asset mapping to reflect changes...\n');
        
        try {
            // Re-run the migration to update the mapping
            const AssetMigrator = require('./migrate-assets.js');
            const migrator = new AssetMigrator();
            
            if (await migrator.initialize()) {
                // Just regenerate the mapping without uploading
                const assets = await migrator.findLocalAssets();
                const mapping = {};
                
                assets.forEach(asset => {
                    const storagePath = migrator.getStoragePath(asset.fileName);
                    const key = asset.fileName.replace(/\.(jpg|png|jpeg|webp)$/i, '');
                    mapping[key] = `${migrator.supabaseUrl}/storage/v1/object/public/${migrator.bucketName}/${storagePath}`;
                });
                
                await fs.writeFile('./supabase-asset-mapping.json', JSON.stringify(mapping, null, 2));
                console.log('✅ Updated asset mapping');
            }
        } catch (error) {
            console.error('❌ Error updating asset mapping:', error);
        }
    }

    async cleanup() {
        console.log('🧹 Fear City Cycles - Duplicate Cleanup\n');
        
        // Initialize
        if (!(await this.initialize())) return false;
        
        // Find duplicates
        await this.findLocalDuplicates();
        await this.findSupabaseDuplicates();
        
        // Show summary
        const totalLocal = this.duplicatesToRemove.local.length;
        const totalSupabase = this.duplicatesToRemove.supabase.length;
        
        if (totalLocal === 0 && totalSupabase === 0) {
            console.log('🎉 No duplicates found! Your images are already clean.');
            return true;
        }
        
        console.log('📋 Cleanup Summary:');
        console.log(`   Local files to remove: ${totalLocal}`);
        console.log(`   Supabase files to remove: ${totalSupabase}`);
        console.log(`   Total cleanup needed: ${totalLocal + totalSupabase}\n`);
        
        // Remove duplicates
        const localRemoved = await this.removeLocalDuplicates();
        const supabaseRemoved = await this.removeSupabaseDuplicates();
        
        // Update asset mapping
        if (localRemoved > 0 || supabaseRemoved > 0) {
            await this.updateAssetMapping();
        }
        
        console.log('🎉 Cleanup Complete!');
        console.log(`✅ Removed ${localRemoved} local duplicates`);
        console.log(`✅ Removed ${supabaseRemoved} Supabase duplicates`);
        console.log('💾 Asset mapping updated');
        
        return true;
    }

    async preview() {
        console.log('👀 Preview Mode - Showing what would be removed\n');
        
        if (!(await this.initialize())) return false;
        
        await this.findLocalDuplicates();
        await this.findSupabaseDuplicates();
        
        console.log('📋 Would remove these files:');
        console.log('\n🖥️ Local files:');
        this.duplicatesToRemove.local.forEach(dup => {
            console.log(`   ❌ ${dup.path} (${dup.reason})`);
        });
        
        console.log('\n☁️ Supabase files:');
        this.duplicatesToRemove.supabase.forEach(dup => {
            console.log(`   ❌ ${dup.path} (${dup.reason})`);
        });
        
        console.log(`\n📊 Total: ${this.duplicatesToRemove.local.length + this.duplicatesToRemove.supabase.length} files would be removed`);
    }
}

// Command line interface
async function main() {
    const cleanup = new DuplicateCleanup();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'cleanup':
            await cleanup.cleanup();
            break;
        case 'preview':
            await cleanup.preview();
            break;
        case 'local':
            await cleanup.initialize();
            await cleanup.findLocalDuplicates();
            await cleanup.removeLocalDuplicates();
            break;
        case 'supabase':
            await cleanup.initialize();
            await cleanup.findSupabaseDuplicates();
            await cleanup.removeSupabaseDuplicates();
            break;
        default:
            console.log('Fear City Cycles Duplicate Cleanup');
            console.log('Usage:');
            console.log('  node cleanup-duplicates.js preview   - Preview what would be removed');
            console.log('  node cleanup-duplicates.js cleanup   - Remove all duplicates');
            console.log('  node cleanup-duplicates.js local     - Remove only local duplicates');
            console.log('  node cleanup-duplicates.js supabase  - Remove only Supabase duplicates');
            console.log('\nEnvironment variables:');
            console.log('  SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DuplicateCleanup;