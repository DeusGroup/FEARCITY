// Fear City Cycles - Performance Testing & Optimization Suite

class PerformanceTestSuite {
    constructor() {
        this.results = {
            pageLoad: {},
            javascript: {},
            css: {},
            images: {},
            network: {},
            coreWebVitals: {},
            overall: {}
        };
        this.startTime = performance.now();
    }

    async runAllTests() {
        console.log('🚀 Starting Fear City Cycles Performance Test Suite...');
        
        try {
            await this.testPageLoadTimes();
            await this.testJavaScriptPerformance();
            await this.testCSSPerformance();
            await this.testImageOptimization();
            await this.testNetworkEfficiency();
            await this.measureCoreWebVitals();
            
            this.generateReport();
            this.suggestOptimizations();
            
        } catch (error) {
            console.error('Performance test failed:', error);
        }
    }

    async testPageLoadTimes() {
        console.log('📊 Testing page load times...');
        
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        this.results.pageLoad = {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            pageLoad: timing.loadEventEnd - timing.navigationStart,
            firstPaint: navigation.responseStart - navigation.requestStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            resourcesLoaded: timing.loadEventStart - timing.domContentLoadedEventEnd
        };
        
        // Test critical resource loading
        const criticalResources = performance.getEntriesByType('resource').filter(resource => 
            resource.name.includes('/assets/css/main.css') ||
            resource.name.includes('/assets/js/main.js') ||
            resource.name.includes('fear-city-logo')
        );
        
        this.results.pageLoad.criticalResourceTime = criticalResources.reduce((max, resource) => 
            Math.max(max, resource.responseEnd - resource.requestStart), 0);
    }

    async testJavaScriptPerformance() {
        console.log('⚡ Testing JavaScript performance...');
        
        const jsTests = {
            cartOperations: () => this.testCartPerformance(),
            searchFunctionality: () => this.testSearchPerformance(),
            mobileEnhancements: () => this.testMobilePerformance(),
            eventHandlers: () => this.testEventHandlerPerformance()
        };
        
        for (const [testName, testFunction] of Object.entries(jsTests)) {
            const startTime = performance.now();
            await testFunction();
            const endTime = performance.now();
            
            this.results.javascript[testName] = endTime - startTime;
        }
    }

    testCartPerformance() {
        if (!window.fearCityCart) return;
        
        const startTime = performance.now();
        
        // Simulate cart operations
        const testProduct = {
            id: 'test-001',
            name: 'Test Product',
            price: 100,
            size: 'M'
        };
        
        // Add items
        for (let i = 0; i < 50; i++) {
            window.fearCityCart.addItem({ ...testProduct, id: `test-${i}` });
        }
        
        // Update quantities
        for (let i = 0; i < 25; i++) {
            window.fearCityCart.updateQuantity(`test-${i}`, 2);
        }
        
        // Remove items
        for (let i = 0; i < 25; i++) {
            window.fearCityCart.removeItem(`test-${i}`);
        }
        
        // Clear cart
        window.fearCityCart.clearCart();
        
        return performance.now() - startTime;
    }

    testSearchPerformance() {
        if (!window.productSearch) return;
        
        const searchTerms = ['street', 'reaper', 'leather', 'jacket', 'fear', 'city', 'queen'];
        const startTime = performance.now();
        
        searchTerms.forEach(term => {
            if (window.productSearch && window.productSearch.search) {
                window.productSearch.search(term);
            }
        });
        
        return performance.now() - startTime;
    }

    testMobilePerformance() {
        if (!window.MobileEnhancements) return;
        
        const startTime = performance.now();
        
        // Simulate touch events
        const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [{ clientX: 100, clientY: 100 }]
        });
        
        document.body.dispatchEvent(touchEvent);
        
        return performance.now() - startTime;
    }

    testEventHandlerPerformance() {
        const startTime = performance.now();
        
        // Test scroll performance
        window.dispatchEvent(new Event('scroll'));
        
        // Test resize performance
        window.dispatchEvent(new Event('resize'));
        
        // Test click performance
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        
        return performance.now() - startTime;
    }

    async testCSSPerformance() {
        console.log('🎨 Testing CSS performance...');
        
        const stylesheets = Array.from(document.styleSheets);
        let totalRules = 0;
        let complexSelectors = 0;
        
        stylesheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    totalRules += sheet.cssRules.length;
                    
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.selectorText) {
                            // Count complex selectors (more than 3 parts)
                            const selectorParts = rule.selectorText.split(' ').length;
                            if (selectorParts > 3) {
                                complexSelectors++;
                            }
                        }
                    });
                }
            } catch (e) {
                // External stylesheets may throw security errors
                console.warn('Could not analyze external stylesheet');
            }
        });
        
        this.results.css = {
            totalRules,
            complexSelectors,
            sheetsCount: stylesheets.length,
            optimization: complexSelectors < totalRules * 0.1 ? 'good' : 'needs-improvement'
        };
    }

    async testImageOptimization() {
        console.log('🖼️ Testing image optimization...');
        
        const images = Array.from(document.images);
        const imageStats = {
            total: images.length,
            withLazyLoading: 0,
            withAltText: 0,
            oversized: [],
            unoptimized: []
        };
        
        images.forEach((img, index) => {
            // Check lazy loading
            if (img.loading === 'lazy' || img.classList.contains('lazy-loading')) {
                imageStats.withLazyLoading++;
            }
            
            // Check alt text
            if (img.alt && img.alt.trim()) {
                imageStats.withAltText++;
            }
            
            // Check if image is much larger than display size
            if (img.naturalWidth > img.offsetWidth * 2) {
                imageStats.oversized.push({
                    src: img.src,
                    natural: `${img.naturalWidth}x${img.naturalHeight}`,
                    display: `${img.offsetWidth}x${img.offsetHeight}`
                });
            }
            
            // Check for unoptimized formats
            if (img.src.includes('.jpg') || img.src.includes('.png')) {
                if (!img.src.includes('optimized') && !img.src.includes('webp')) {
                    imageStats.unoptimized.push(img.src);
                }
            }
        });
        
        this.results.images = imageStats;
    }

    async testNetworkEfficiency() {
        console.log('🌐 Testing network efficiency...');
        
        const resources = performance.getEntriesByType('resource');
        const networkStats = {
            totalRequests: resources.length,
            totalSize: 0,
            slowRequests: [],
            failedRequests: 0,
            cacheHits: 0
        };
        
        resources.forEach(resource => {
            // Estimate size (not always available)
            if (resource.transferSize) {
                networkStats.totalSize += resource.transferSize;
            }
            
            // Check for slow requests (>2 seconds)
            const duration = resource.responseEnd - resource.requestStart;
            if (duration > 2000) {
                networkStats.slowRequests.push({
                    url: resource.name,
                    duration: Math.round(duration)
                });
            }
            
            // Check for cache hits (transferSize of 0 usually indicates cache)
            if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
                networkStats.cacheHits++;
            }
        });
        
        // Network connection info
        if ('connection' in navigator) {
            networkStats.connectionType = navigator.connection.effectiveType;
            networkStats.downlink = navigator.connection.downlink;
        }
        
        this.results.network = networkStats;
    }

    async measureCoreWebVitals() {
        console.log('📈 Measuring Core Web Vitals...');
        
        // Use performance observer for accurate measurements
        return new Promise((resolve) => {
            let lcpValue = 0;
            let fidValue = 0;
            let clsValue = 0;
            
            // Largest Contentful Paint
            if ('PerformanceObserver' in window) {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    if (entries.length > 0) {
                        lcpValue = entries[entries.length - 1].startTime;
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        fidValue = entry.processingStart - entry.startTime;
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                
                // Cumulative Layout Shift
                const clsObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            }
            
            // Wait a bit for measurements
            setTimeout(() => {
                this.results.coreWebVitals = {
                    lcp: lcpValue,
                    fid: fidValue,
                    cls: clsValue,
                    lcpGrade: lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor',
                    fidGrade: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor',
                    clsGrade: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
                };
                resolve();
            }, 3000);
        });
    }

    generateReport() {
        console.log('📋 Generating performance report...');
        
        const totalTime = performance.now() - this.startTime;
        
        this.results.overall = {
            testDuration: Math.round(totalTime),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        };
        
        // Calculate overall score
        let score = 100;
        
        // Page load penalties
        if (this.results.pageLoad.domContentLoaded > 2000) score -= 15;
        if (this.results.pageLoad.pageLoad > 5000) score -= 20;
        
        // Core Web Vitals penalties
        if (this.results.coreWebVitals.lcpGrade === 'poor') score -= 20;
        if (this.results.coreWebVitals.fidGrade === 'poor') score -= 15;
        if (this.results.coreWebVitals.clsGrade === 'poor') score -= 15;
        
        // Image optimization penalties
        const imageOptRatio = this.results.images.withLazyLoading / this.results.images.total;
        if (imageOptRatio < 0.8) score -= 10;
        
        this.results.overall.score = Math.max(0, score);
        this.results.overall.grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
        
        console.log('Performance Test Results:', this.results);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_test', {
                event_category: 'Performance',
                value: this.results.overall.score,
                custom_parameters: {
                    page_load_time: this.results.pageLoad.pageLoad,
                    lcp: this.results.coreWebVitals.lcp,
                    fid: this.results.coreWebVitals.fid,
                    cls: this.results.coreWebVitals.cls
                }
            });
        }
    }

    suggestOptimizations() {
        console.log('💡 Generating optimization suggestions...');
        
        const suggestions = [];
        
        // Page load optimizations
        if (this.results.pageLoad.domContentLoaded > 2000) {
            suggestions.push('🚀 Reduce DOM complexity and defer non-critical JavaScript');
        }
        
        if (this.results.pageLoad.criticalResourceTime > 1000) {
            suggestions.push('📦 Optimize critical resource loading (CSS, fonts, key JavaScript)');
        }
        
        // JavaScript optimizations
        if (this.results.javascript.cartOperations > 50) {
            suggestions.push('🛒 Optimize cart operations with better data structures');
        }
        
        if (this.results.javascript.searchFunctionality > 100) {
            suggestions.push('🔍 Consider debouncing search and using web workers for heavy operations');
        }
        
        // CSS optimizations
        if (this.results.css.complexSelectors > this.results.css.totalRules * 0.1) {
            suggestions.push('🎨 Simplify CSS selectors to improve rendering performance');
        }
        
        // Image optimizations
        if (this.results.images.oversized.length > 0) {
            suggestions.push(`🖼️ Resize ${this.results.images.oversized.length} oversized images`);
        }
        
        if (this.results.images.withLazyLoading / this.results.images.total < 0.8) {
            suggestions.push('⏳ Implement lazy loading for more images');
        }
        
        // Network optimizations
        if (this.results.network.slowRequests.length > 0) {
            suggestions.push(`🌐 Optimize ${this.results.network.slowRequests.length} slow network requests`);
        }
        
        if (this.results.network.cacheHits / this.results.network.totalRequests < 0.3) {
            suggestions.push('💾 Improve caching strategy for better performance');
        }
        
        // Core Web Vitals optimizations
        if (this.results.coreWebVitals.lcpGrade !== 'good') {
            suggestions.push('⚡ Optimize Largest Contentful Paint by preloading key resources');
        }
        
        if (this.results.coreWebVitals.clsGrade !== 'good') {
            suggestions.push('🎯 Reduce Cumulative Layout Shift by setting image dimensions');
        }
        
        this.results.suggestions = suggestions;
        
        if (suggestions.length > 0) {
            console.log('Optimization Suggestions:');
            suggestions.forEach(suggestion => console.log(suggestion));
        } else {
            console.log('✅ No major optimization issues found!');
        }
    }

    exportResults() {
        const dataStr = JSON.stringify(this.results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fear-city-performance-${Date.now()}.json`;
        link.click();
    }
}

// Auto-run performance tests on production builds
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const performanceTest = new PerformanceTestSuite();
            performanceTest.runAllTests();
            
            // Make results available globally for debugging
            window.performanceResults = performanceTest.results;
        }, 2000);
    });
}

// Export for manual testing
window.PerformanceTestSuite = PerformanceTestSuite;