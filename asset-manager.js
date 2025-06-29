// Fear City Cycles Asset Manager
// Comprehensive asset management utilities for Supabase Storage

class AssetManager {
    constructor() {
        this.supabaseUrl = 'https://qmjauzmtznndsysnaxzo.supabase.co';
        this.bucketName = 'fear-city-assets';
        this.client = null;
        this.assetCache = new Map();
        this.preloadedAssets = new Set();
    }

    // Initialize with Supabase client
    init(supabaseClient) {
        this.client = supabaseClient;
        console.log('✅ Asset Manager initialized');
        this.setupPerformanceMonitoring();
        return this;
    }

    // Get optimized asset URL with transformations
    getAssetUrl(filePath, options = {}) {
        const baseUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
        
        // Add transformation parameters if supported
        const params = new URLSearchParams();
        
        if (options.resize) {
            params.append('resize', options.resize);
        }
        if (options.quality) {
            params.append('quality', options.quality);
        }
        if (options.format) {
            params.append('format', options.format);
        }

        const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        
        // Cache the URL
        this.assetCache.set(filePath, url);
        return url;
    }

    // Preload critical assets for performance
    async preloadCriticalAssets() {
        const criticalAssets = [
            'logo/fear-city-logo-small.jpg',
            'hero/hero-bg.png',
            'hero/hero-bike.png',
            'products/bikes/bike-street-reaper.png',
            'products/bikes/bike-borough-bruiser.png',
            'products/bikes/bike-fear-fighter.png'
        ];

        console.log('⚡ Preloading critical assets...');
        
        const preloadPromises = criticalAssets.map(asset => this.preloadImage(asset));
        const results = await Promise.allSettled(preloadPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Preloaded ${successful}/${criticalAssets.length} critical assets`);
        
        return successful;
    }

    // Preload single image
    preloadImage(assetPath) {
        return new Promise((resolve, reject) => {
            if (this.preloadedAssets.has(assetPath)) {
                resolve(assetPath);
                return;
            }

            const img = new Image();
            const url = this.getAssetUrl(assetPath);
            
            img.onload = () => {
                this.preloadedAssets.add(assetPath);
                console.log(`⚡ Preloaded: ${assetPath}`);
                resolve(assetPath);
            };
            
            img.onerror = () => {
                console.error(`❌ Failed to preload: ${assetPath}`);
                reject(new Error(`Failed to preload ${assetPath}`));
            };
            
            img.src = url;
        });
    }

    // Lazy load images with intersection observer
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            console.warn('⚠️ IntersectionObserver not supported, skipping lazy loading');
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.remove('lazy');
                        img.classList.add('lazy-loaded');
                        observer.unobserve(img);
                        console.log(`🔄 Lazy loaded: ${src.split('/').pop()}`);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe all lazy images
        document.querySelectorAll('img.lazy').forEach(img => {
            imageObserver.observe(img);
        });

        console.log('👁️ Lazy loading initialized');
    }

    // Progressive image loading with placeholders
    setupProgressiveLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            // Add loading placeholder
            img.style.backgroundColor = '#1a1a1a';
            img.style.backgroundImage = 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)';
            img.style.backgroundSize = '20px 20px';
            img.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
            
            // Load actual image
            const actualImg = new Image();
            actualImg.onload = () => {
                img.src = actualImg.src;
                img.style.background = 'none';
                img.classList.add('loaded');
            };
            actualImg.src = img.dataset.src;
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        if (!window.performance || !window.performance.getEntriesByType) {
            return;
        }

        // Monitor image loading performance
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.initiatorType === 'img' && entry.name.includes('supabase.co')) {
                    const loadTime = entry.responseEnd - entry.requestStart;
                    const assetName = entry.name.split('/').pop();
                    
                    if (loadTime > 1000) {
                        console.warn(`⚠️ Slow loading asset: ${assetName} (${Math.round(loadTime)}ms)`);
                    } else {
                        console.log(`⚡ Fast loading: ${assetName} (${Math.round(loadTime)}ms)`);
                    }
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    // Handle image loading errors with fallbacks
    setupErrorHandling() {
        document.addEventListener('error', (event) => {
            if (event.target.tagName === 'IMG' && event.target.src.includes('supabase.co')) {
                console.error(`❌ Image load failed: ${event.target.src}`);
                
                // Try to load fallback image
                const fallbackSrc = this.getFallbackImage(event.target.src);
                if (fallbackSrc && fallbackSrc !== event.target.src) {
                    event.target.src = fallbackSrc;
                    console.log(`🔄 Loading fallback: ${fallbackSrc}`);
                } else {
                    // Show error placeholder
                    event.target.style.backgroundColor = '#8B0000';
                    event.target.style.color = 'white';
                    event.target.alt = 'Image failed to load';
                    event.target.classList.add('image-error');
                }
            }
        }, true);
    }

    // Get fallback image for failed loads
    getFallbackImage(originalSrc) {
        // Map to different formats or sizes as fallbacks
        if (originalSrc.includes('.png')) {
            return originalSrc.replace('.png', '.jpg');
        } else if (originalSrc.includes('.jpg')) {
            return originalSrc.replace('.jpg', '.png');
        }
        return null;
    }

    // Optimize images for different screen sizes
    getResponsiveImageSrcSet(basePath) {
        const sizes = [
            { width: 400, suffix: '_mobile' },
            { width: 768, suffix: '_tablet' },
            { width: 1200, suffix: '_desktop' }
        ];

        const srcSet = sizes.map(size => {
            const url = this.getAssetUrl(basePath, { resize: size.width });
            return `${url} ${size.width}w`;
        }).join(', ');

        return srcSet;
    }

    // Update all images to use responsive loading
    setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            const basePath = img.dataset.responsive;
            const srcSet = this.getResponsiveImageSrcSet(basePath);
            
            img.srcset = srcSet;
            img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
        });

        console.log(`📱 Setup responsive images for ${images.length} elements`);
    }

    // Asset health check
    async checkAssetHealth() {
        console.log('🔍 Checking asset health...');
        
        const testAssets = [
            'logo/fear-city-logo-small.jpg',
            'products/bikes/bike-street-reaper.png',
            'hero/hero-bg.png'
        ];

        const results = await Promise.allSettled(
            testAssets.map(asset => this.testAssetLoad(asset))
        );

        const healthy = results.filter(r => r.status === 'fulfilled').length;
        const total = testAssets.length;
        
        console.log(`💚 Asset health: ${healthy}/${total} assets accessible`);
        return { healthy, total, success: healthy === total };
    }

    // Test single asset load
    testAssetLoad(assetPath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = this.getAssetUrl(assetPath);
            
            img.onload = () => resolve(assetPath);
            img.onerror = () => reject(new Error(`Failed to load ${assetPath}`));
            img.src = url;
        });
    }

    // Initialize all asset management features
    async initializeAll() {
        console.log('🚀 Initializing Fear City Asset Manager...');
        
        // Setup all features
        this.setupErrorHandling();
        this.setupLazyLoading();
        this.setupProgressiveLoading();
        this.setupResponsiveImages();
        
        // Preload critical assets
        await this.preloadCriticalAssets();
        
        // Health check
        const health = await this.checkAssetHealth();
        
        console.log('✅ Asset Manager fully initialized');
        return health;
    }
}

// Initialize global asset manager
const assetManager = new AssetManager();

// Auto-initialize when DOM and Supabase are ready
document.addEventListener('DOMContentLoaded', () => {
    const initAssetManager = () => {
        const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (client) {
            assetManager.init(client);
            assetManager.initializeAll();
        } else {
            setTimeout(initAssetManager, 500);
        }
    };
    
    initAssetManager();
});

// Export for global use
if (typeof window !== 'undefined') {
    window.assetManager = assetManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AssetManager, assetManager };
}