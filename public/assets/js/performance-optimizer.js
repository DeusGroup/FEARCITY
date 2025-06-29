// Fear City Cycles - Performance Optimization for Mobile

class PerformanceOptimizer {
    constructor() {
        this.initialized = false;
        this.imageObserver = null;
        this.loadingStates = new Map();
        
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.setupLazyLoading();
        this.optimizeImages();
        this.preloadCriticalResources();
        this.setupIntersectionObserver();
        this.optimizeAnimations();
        this.setupServiceWorker();
        this.monitorPerformance();
        
        this.initialized = true;
        console.log('Performance optimizer initialized');
    }

    setupLazyLoading() {
        // Lazy load images below the fold
        const images = document.querySelectorAll('img[src]');
        
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            // Observe all images except those above the fold
            images.forEach((img, index) => {
                if (index > 2) { // Skip first 3 images (above fold)
                    const placeholder = img.src;
                    img.dataset.src = placeholder;
                    img.src = this.generatePlaceholder(img);
                    img.classList.add('lazy-loading');
                    this.imageObserver.observe(img);
                }
            });
        }
    }

    loadImage(img) {
        return new Promise((resolve, reject) => {
            const imageLoader = new Image();
            
            imageLoader.onload = () => {
                img.src = img.dataset.src;
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                resolve(img);
            };
            
            imageLoader.onerror = () => {
                img.classList.add('lazy-error');
                reject(new Error('Image failed to load'));
            };
            
            imageLoader.src = img.dataset.src;
        });
    }

    generatePlaceholder(img) {
        const width = img.getAttribute('width') || 300;
        const height = img.getAttribute('height') || 200;
        
        // Generate a simple gradient placeholder
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#333333');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add loading text
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', width / 2, height / 2);
        
        return canvas.toDataURL();
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading attribute for browsers that support it
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
            
            // Optimize image sizing
            if (!img.style.maxWidth) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
            
            // Add error handling
            img.addEventListener('error', () => {
                img.style.background = '#333';
                img.alt = 'Image failed to load';
            });
        });
    }

    preloadCriticalResources() {
        // Preload critical CSS and JavaScript
        const criticalResources = [
            { href: '/assets/css/main.css', as: 'style' },
            { href: '/assets/js/main.js', as: 'script' },
            { href: '/assets/images/fear-city-logo-small.png', as: 'image' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            
            if (resource.as === 'style') {
                link.onload = () => {
                    link.rel = 'stylesheet';
                };
            }
            
            document.head.appendChild(link);
        });
    }

    setupIntersectionObserver() {
        // Optimize animations and effects based on visibility
        const animatedElements = document.querySelectorAll('.product-card, .cart-notification, .modal');
        
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-viewport');
                    } else {
                        entry.target.classList.remove('in-viewport');
                    }
                });
            }, {
                threshold: 0.1
            });

            animatedElements.forEach(el => {
                animationObserver.observe(el);
            });
        }
    }

    optimizeAnimations() {
        // Reduce animations on low-performance devices
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduce-motion');
        }

        // Throttle expensive animations on mobile
        if (this.isMobileDevice()) {
            this.throttleAnimations();
        }

        // Use CSS animations instead of JavaScript when possible
        this.convertToCSS();
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    throttleAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                * {
                    animation-duration: 0.3s !important;
                    transition-duration: 0.3s !important;
                }
                
                .reduce-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    convertToCSS() {
        // Add CSS for common animations
        const animationCSS = document.createElement('style');
        animationCSS.textContent = `
            .lazy-loading {
                opacity: 0.5;
                filter: blur(2px);
                transition: opacity 0.3s ease, filter 0.3s ease;
            }
            
            .lazy-loaded {
                opacity: 1;
                filter: blur(0);
            }
            
            .lazy-error {
                opacity: 0.3;
                background: #333;
            }
            
            .in-viewport {
                animation: fadeInUp 0.6s ease;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* GPU-accelerated transforms */
            .product-card,
            .cart-notification,
            .modal {
                transform: translateZ(0);
                will-change: transform, opacity;
            }
        `;
        document.head.appendChild(animationCSS);
    }

    setupServiceWorker() {
        // Register service worker for caching
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    monitorPerformance() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            this.observeLCP();
            
            // First Input Delay
            this.observeFID();
            
            // Cumulative Layout Shift
            this.observeCLS();
        }

        // Monitor resource loading
        this.monitorResourceLoading();
    }

    observeLCP() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            console.log('LCP:', lastEntry.startTime);
            
            // Send to analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'LCP', {
                    event_category: 'Performance',
                    value: Math.round(lastEntry.startTime)
                });
            }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    observeFID() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'FID', {
                        event_category: 'Performance',
                        value: Math.round(entry.processingStart - entry.startTime)
                    });
                }
            });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
    }

    observeCLS() {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            
            console.log('CLS:', clsValue);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'CLS', {
                    event_category: 'Performance',
                    value: Math.round(clsValue * 1000)
                });
            }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
    }

    monitorResourceLoading() {
        // Monitor slow loading resources
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        
        if (slowResources.length > 0) {
            console.warn('Slow loading resources:', slowResources);
        }

        // Monitor failed resources
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                console.error('Resource failed to load:', e.target.src || e.target.href);
            }
        }, true);
    }

    // Public methods for manual optimization
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    prefetchPage(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    optimizeForConnection() {
        // Adapt to network conditions
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                document.body.classList.add('slow-connection');
                this.enableDataSaving();
            }
        }
    }

    enableDataSaving() {
        // Reduce image quality and disable non-essential features
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.dataset.optimized) {
                // Use a lower quality version if available
                img.src = img.src.replace(/\.jpg$/i, '_low.jpg').replace(/\.png$/i, '_low.png');
                img.dataset.optimized = 'true';
            }
        });
    }

    cleanup() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        
        this.loadingStates.clear();
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for manual use
window.PerformanceOptimizer = PerformanceOptimizer;