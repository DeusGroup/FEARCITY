// Fear City Cycles - Lazy Loading & Image Optimization
class ImageOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.optimizeExistingImages();
        this.handleImageErrors();
    }

    setupLazyLoading() {
        // Use Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadOptimizedImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    loadOptimizedImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create optimized image paths
        const optimizedPaths = this.getOptimizedPaths(src);
        
        // Try to load the most optimized version first
        this.loadWithFallback(img, optimizedPaths);
    }

    getOptimizedPaths(originalPath) {
        const basePath = originalPath.replace(/\.[^/.]+$/, "");
        const isProductImage = originalPath.includes('bike-') || 
                             originalPath.includes('jacket-') || 
                             originalPath.includes('tee-') || 
                             originalPath.includes('gloves-') ||
                             originalPath.includes('patch-') ||
                             originalPath.includes('vest-') ||
                             originalPath.includes('keychain-');

        // For now, return the original path since we need to optimize the actual files
        // In the future, this will return WebP, optimized JPEG, then original
        return [
            originalPath.replace('.png', '.webp'), // Try WebP first
            originalPath.replace('.png', '.jpg'),   // Try optimized JPEG
            originalPath                            // Fallback to original
        ];
    }

    loadWithFallback(img, paths) {
        let pathIndex = 0;
        
        const tryNextPath = () => {
            if (pathIndex >= paths.length) {
                // All paths failed, show placeholder
                this.showPlaceholder(img);
                return;
            }

            const testImg = new Image();
            testImg.onload = () => {
                // Success! Set this as the source
                img.src = paths[pathIndex];
                img.classList.add('loaded');
                this.trackImageLoad(paths[pathIndex], img);
            };
            
            testImg.onerror = () => {
                // This path failed, try next
                pathIndex++;
                tryNextPath();
            };

            testImg.src = paths[pathIndex];
        };

        tryNextPath();
    }

    loadAllImages() {
        // Fallback for browsers without Intersection Observer
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadOptimizedImage(img);
        });
    }

    optimizeExistingImages() {
        // Add loading states and error handling to existing images
        document.querySelectorAll('img:not([data-src])').forEach(img => {
            if (!img.complete) {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                
                img.addEventListener('error', () => {
                    this.handleImageError(img);
                });
            } else if (img.naturalWidth === 0) {
                this.handleImageError(img);
            }
        });
    }

    handleImageErrors() {
        // Global error handler for failed images
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    handleImageError(img) {
        console.log('Image failed to load:', img.src);
        
        // Try alternative formats or show placeholder
        if (img.src.includes('.png')) {
            const jpgSrc = img.src.replace('.png', '.jpg');
            if (jpgSrc !== img.src) {
                img.src = jpgSrc;
                return;
            }
        }
        
        this.showPlaceholder(img);
    }

    showPlaceholder(img) {
        // Create a placeholder based on image context
        const isProductImage = img.classList.contains('product-image');
        const isLogo = img.alt.toLowerCase().includes('logo');
        
        if (isProductImage) {
            this.createProductPlaceholder(img);
        } else if (isLogo) {
            this.createLogoPlaceholder(img);
        } else {
            this.createGenericPlaceholder(img);
        }
    }

    createProductPlaceholder(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Dark background with Fear City styling
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 600);
        
        // Red border
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 796, 596);
        
        // Text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FEAR CITY CYCLES', 400, 280);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#CCC';
        ctx.fillText('Product Image Loading...', 400, 320);
        
        img.src = canvas.toDataURL();
        img.classList.add('placeholder');
    }

    createLogoPlaceholder(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 200, 60);
        
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FEAR CITY', 100, 25);
        
        ctx.font = '14px Arial';
        ctx.fillText('CYCLES', 100, 45);
        
        img.src = canvas.toDataURL();
        img.classList.add('placeholder');
    }

    createGenericPlaceholder(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Image Loading...', 200, 150);
        
        img.src = canvas.toDataURL();
        img.classList.add('placeholder');
    }

    trackImageLoad(path, img) {
        // Analytics for image loading performance
        if (window.gtag) {
            gtag('event', 'image_load', {
                'image_path': path,
                'image_type': img.classList.contains('product-image') ? 'product' : 'other',
                'load_time': Date.now() - (window.pageStartTime || Date.now())
            });
        }
    }

    // Method to compress images client-side (for future use)
    compressImage(file, quality = 0.8, maxWidth = 800, maxHeight = 600) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Calculate dimensions
                let { width, height } = this;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pageStartTime = Date.now();
    window.imageOptimizer = new ImageOptimizer();
});

// CSS for image loading states
const imageStyles = `
<style>
img {
    transition: opacity 0.3s ease;
}

img:not(.loaded) {
    opacity: 0.7;
}

img.loaded {
    opacity: 1;
}

img.placeholder {
    opacity: 0.8;
    border: 1px solid #666;
}

.product-image {
    background: #111;
    border-radius: 4px;
}

/* Loading animation */
@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

img:not(.loaded):not(.placeholder) {
    animation: pulse 1.5s ease-in-out infinite;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', imageStyles);