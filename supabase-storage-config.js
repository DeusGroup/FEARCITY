// Supabase Storage Configuration for Fear City Cycles Assets
// Handles image uploads, management, and URL generation

class FearCityStorage {
    constructor() {
        this.bucketName = 'fear-city-assets';
        this.supabaseUrl = window.SUPABASE_CONFIG?.url || import.meta?.env?.VITE_SUPABASE_URL || '';
        this.client = null;
        this.baseStorageUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}`;
    }

    // Initialize Supabase client
    init(supabaseClient) {
        this.client = supabaseClient;
        console.log('✅ Fear City Storage initialized');
    }

    // Get public URL for an asset
    getAssetUrl(filePath) {
        return `${this.baseStorageUrl}/${filePath}`;
    }

    // Upload single file to Supabase Storage
    async uploadFile(file, filePath) {
        if (!this.client) {
            console.error('❌ Supabase client not initialized');
            return null;
        }

        try {
            const { data, error } = await this.client.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error uploading ${filePath}:`, error);
                return null;
            }

            console.log(`✅ Uploaded: ${filePath}`);
            return this.getAssetUrl(filePath);
        } catch (error) {
            console.error(`❌ Upload failed for ${filePath}:`, error);
            return null;
        }
    }

    // Upload multiple files
    async uploadBatch(files) {
        const results = [];
        for (const { file, path } of files) {
            const url = await this.uploadFile(file, path);
            results.push({ path, url, success: url !== null });
        }
        return results;
    }

    // Delete file from storage
    async deleteFile(filePath) {
        if (!this.client) return false;

        try {
            const { error } = await this.client.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) {
                console.error(`❌ Error deleting ${filePath}:`, error);
                return false;
            }

            console.log(`🗑️ Deleted: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ Delete failed for ${filePath}:`, error);
            return false;
        }
    }

    // List all files in storage
    async listFiles(folder = '') {
        if (!this.client) return [];

        try {
            const { data, error } = await this.client.storage
                .from(this.bucketName)
                .list(folder);

            if (error) {
                console.error(`❌ Error listing files in ${folder}:`, error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error(`❌ List failed for ${folder}:`, error);
            return [];
        }
    }

    // Create storage bucket (admin function)
    async createBucket() {
        if (!this.client) return false;

        try {
            const { data, error } = await this.client.storage
                .createBucket(this.bucketName, {
                    public: true,
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
                    fileSizeLimit: 5242880 // 5MB
                });

            if (error) {
                console.error('❌ Error creating bucket:', error);
                return false;
            }

            console.log('✅ Storage bucket created:', this.bucketName);
            return true;
        } catch (error) {
            console.error('❌ Bucket creation failed:', error);
            return false;
        }
    }

    // Asset URL mapping for the website
    getAssetMap() {
        return {
            // Hero images
            'hero-bg': this.getAssetUrl('hero/hero-bg.jpg'),
            'hero-bike': this.getAssetUrl('hero/hero-bike.jpg'),
            'dark-texture': this.getAssetUrl('textures/dark-texture.jpg'),
            'nyc-streets': this.getAssetUrl('hero/nyc-streets.jpg'),
            
            // Logo assets
            'fear-city-logo': this.getAssetUrl('logo/Fear-city-image-Hi-Rez.jpg'),
            'fear-city-logo-small': this.getAssetUrl('logo/fear-city-logo-small.jpg'),
            
            // Motorcycle products
            'bike-street-reaper': this.getAssetUrl('products/bikes/bike-street-reaper.jpg'),
            'bike-borough-bruiser': this.getAssetUrl('products/bikes/bike-borough-bruiser.jpg'),
            'bike-fear-fighter': this.getAssetUrl('products/bikes/bike-fear-fighter.jpg'),
            'bike-queens-crusher': this.getAssetUrl('products/bikes/bike-queens-crusher.jpg'),
            'bike-death-rider': this.getAssetUrl('products/bikes/bike-death-rider.jpg'),
            'bike-midnight-racer': this.getAssetUrl('products/bikes/bike-midnight-racer.jpg'),
            
            // Gear & apparel products
            'jacket-fear-city': this.getAssetUrl('products/gear/jacket-fear-city.jpg'),
            'tee-queens-skull': this.getAssetUrl('products/gear/tee-queens-skull.jpg'),
            'gloves-reaper-riding': this.getAssetUrl('products/gear/gloves-reaper-riding.jpg'),
            'patch-fear-city': this.getAssetUrl('products/gear/patch-fear-city.jpg'),
            'vest-prospect': this.getAssetUrl('products/gear/vest-prospect.jpg'),
            'keychain-skull': this.getAssetUrl('products/gear/keychain-skull.jpg')
        };
    }

    // Replace all image sources in the DOM with Supabase URLs
    replaceImageSources() {
        const assetMap = this.getAssetMap();
        const images = document.querySelectorAll('img[src*="assets/images"]');
        
        let replacedCount = 0;
        images.forEach(img => {
            const src = img.src;
            const filename = src.split('/').pop().replace(/\.(jpg|png|jpeg|webp)$/, '');
            
            if (assetMap[filename]) {
                img.src = assetMap[filename];
                img.classList.add('supabase-asset');
                replacedCount++;
                console.log(`🔄 Replaced: ${filename}`);
            }
        });

        // Also replace CSS background images
        const elementsWithBg = document.querySelectorAll('[style*="background-image"]');
        elementsWithBg.forEach(el => {
            const style = el.style.backgroundImage;
            const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match && match[1].includes('assets/images')) {
                const filename = match[1].split('/').pop().replace(/\.(jpg|png|jpeg|webp)$/, '');
                if (assetMap[filename]) {
                    el.style.backgroundImage = `url('${assetMap[filename]}')`;
                    el.classList.add('supabase-bg-asset');
                    replacedCount++;
                    console.log(`🔄 Replaced background: ${filename}`);
                }
            }
        });

        console.log(`✅ Replaced ${replacedCount} asset references with Supabase URLs`);
        return replacedCount;
    }

    // Preload critical images
    preloadCriticalAssets() {
        const criticalAssets = [
            'hero-bg',
            'hero-bike',
            'fear-city-logo-small',
            'bike-street-reaper',
            'bike-borough-bruiser',
            'bike-fear-fighter'
        ];

        const assetMap = this.getAssetMap();
        criticalAssets.forEach(asset => {
            if (assetMap[asset]) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = assetMap[asset];
                document.head.appendChild(link);
                console.log(`⚡ Preloading: ${asset}`);
            }
        });
    }
}

// Initialize global storage manager
const fearCityStorage = new FearCityStorage();

// Auto-initialize when Supabase is available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase client to be available
    const initializeStorage = () => {
        const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (client) {
            fearCityStorage.init(client);
            fearCityStorage.replaceImageSources();
            fearCityStorage.preloadCriticalAssets();
        } else {
            // Retry after 500ms if Supabase not ready
            setTimeout(initializeStorage, 500);
        }
    };
    
    initializeStorage();
});

// Export for global use
if (typeof window !== 'undefined') {
    window.fearCityStorage = fearCityStorage;
    window.FearCityStorage = FearCityStorage;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FearCityStorage, fearCityStorage };
}