#!/usr/bin/env node

/**
 * Fear City Cycles - Asset Optimization Script
 * Optimizes CSS, JavaScript, and images for production deployment
 */

const fs = require('fs');
const path = require('path');

class AssetOptimizer {
    constructor() {
        this.stats = {
            cssMinified: 0,
            jsMinified: 0,
            imagesOptimized: 0,
            totalSavings: 0
        };
    }

    async optimizeAll() {
        console.log('🚀 Starting Fear City Cycles Asset Optimization...');
        
        await this.optimizeCSS();
        await this.optimizeJavaScript();
        await this.optimizeImages();
        await this.generateManifest();
        
        this.generateReport();
    }

    async optimizeCSS() {
        console.log('🎨 Optimizing CSS files...');
        
        const cssFiles = [
            'assets/css/main.css',
            'assets/css/responsive.css',
            'assets/css/pages.css',
            'assets/css/gateway.css',
            'assets/css/product.css',
            'assets/css/cart-animations.css'
        ];

        for (const file of cssFiles) {
            if (fs.existsSync(file)) {
                const originalContent = fs.readFileSync(file, 'utf8');
                const minified = this.minifyCSS(originalContent);
                
                const minifiedFile = file.replace('.css', '.min.css');
                fs.writeFileSync(minifiedFile, minified);
                
                const savings = originalContent.length - minified.length;
                this.stats.cssMinified++;
                this.stats.totalSavings += savings;
                
                console.log(`  ✅ ${file} → ${minifiedFile} (saved ${this.formatBytes(savings)})`);
            }
        }
    }

    async optimizeJavaScript() {
        console.log('⚡ Optimizing JavaScript files...');
        
        const jsFiles = [
            'assets/js/main.js',
            'assets/js/contact.js',
            'assets/js/cart.js',
            'assets/js/product.js',
            'assets/js/mobile-enhancements.js',
            'assets/js/performance-optimizer.js',
            'assets/js/gateway.js'
        ];

        for (const file of jsFiles) {
            if (fs.existsSync(file)) {
                const originalContent = fs.readFileSync(file, 'utf8');
                const minified = this.minifyJavaScript(originalContent);
                
                const minifiedFile = file.replace('.js', '.min.js');
                fs.writeFileSync(minifiedFile, minified);
                
                const savings = originalContent.length - minified.length;
                this.stats.jsMinified++;
                this.stats.totalSavings += savings;
                
                console.log(`  ✅ ${file} → ${minifiedFile} (saved ${this.formatBytes(savings)})`);
            }
        }
    }

    async optimizeImages() {
        console.log('🖼️ Optimizing images...');
        
        // Since we don't have image optimization libraries, we'll create optimization metadata
        const imageDir = 'assets/images';
        if (fs.existsSync(imageDir)) {
            const images = fs.readdirSync(imageDir).filter(file => 
                /\.(jpg|jpeg|png|svg|webp)$/i.test(file)
            );

            const imageManifest = {};
            
            for (const image of images) {
                const imagePath = path.join(imageDir, image);
                const stats = fs.statSync(imagePath);
                
                imageManifest[image] = {
                    size: stats.size,
                    lastModified: stats.mtime,
                    optimized: false,
                    suggestions: this.getImageOptimizationSuggestions(image, stats.size)
                };
                
                this.stats.imagesOptimized++;
            }
            
            fs.writeFileSync('image-optimization-manifest.json', JSON.stringify(imageManifest, null, 2));
            console.log(`  ✅ Created optimization manifest for ${images.length} images`);
        }
    }

    getImageOptimizationSuggestions(filename, size) {
        const suggestions = [];
        
        if (size > 500000) { // > 500KB
            suggestions.push('Consider compressing - file is over 500KB');
        }
        
        if (filename.endsWith('.png') && size > 100000) {
            suggestions.push('Consider converting to WebP format for better compression');
        }
        
        if (filename.endsWith('.jpg') && size > 200000) {
            suggestions.push('Consider reducing JPEG quality to 85-90%');
        }
        
        return suggestions;
    }

    async generateManifest() {
        console.log('📋 Generating asset manifest...');
        
        const manifest = {
            version: '1.5.0',
            buildTime: new Date().toISOString(),
            assets: {
                css: {},
                js: {},
                images: {}
            },
            optimization: this.stats
        };

        // CSS assets
        const cssFiles = fs.readdirSync('assets/css').filter(file => file.endsWith('.css'));
        cssFiles.forEach(file => {
            const filePath = `assets/css/${file}`;
            const stats = fs.statSync(filePath);
            manifest.assets.css[file] = {
                size: stats.size,
                lastModified: stats.mtime,
                minified: fs.existsSync(filePath.replace('.css', '.min.css'))
            };
        });

        // JavaScript assets
        const jsFiles = fs.readdirSync('assets/js').filter(file => file.endsWith('.js'));
        jsFiles.forEach(file => {
            const filePath = `assets/js/${file}`;
            const stats = fs.statSync(filePath);
            manifest.assets.js[file] = {
                size: stats.size,
                lastModified: stats.mtime,
                minified: fs.existsSync(filePath.replace('.js', '.min.js'))
            };
        });

        // Image assets
        if (fs.existsSync('assets/images')) {
            const imageFiles = fs.readdirSync('assets/images').filter(file => 
                /\.(jpg|jpeg|png|svg|webp)$/i.test(file)
            );
            imageFiles.forEach(file => {
                const filePath = `assets/images/${file}`;
                const stats = fs.statSync(filePath);
                manifest.assets.images[file] = {
                    size: stats.size,
                    lastModified: stats.mtime
                };
            });
        }

        fs.writeFileSync('asset-manifest.json', JSON.stringify(manifest, null, 2));
        console.log('  ✅ Asset manifest generated');
    }

    minifyCSS(css) {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove spaces around certain characters
            .replace(/\s*([{}:;,>+~])\s*/g, '$1')
            // Remove trailing semicolons
            .replace(/;}/g, '}')
            // Remove empty rules
            .replace(/[^{}]+{\s*}/g, '')
            .trim();
    }

    minifyJavaScript(js) {
        return js
            // Remove single-line comments (but preserve URLs)
            .replace(/\/\/(?![^\n]*http)[^\n]*/g, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace (but preserve in strings)
            .replace(/\s+/g, ' ')
            // Remove spaces around operators (simplified)
            .replace(/\s*([=+\-*/<>!&|{}();,])\s*/g, '$1')
            .trim();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateReport() {
        console.log('\n📊 Optimization Report:');
        console.log('========================');
        console.log(`CSS files minified: ${this.stats.cssMinified}`);
        console.log(`JavaScript files minified: ${this.stats.jsMinified}`);
        console.log(`Images analyzed: ${this.stats.imagesOptimized}`);
        console.log(`Total space saved: ${this.formatBytes(this.stats.totalSavings)}`);
        console.log('\n✅ Optimization complete!');
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Update HTML files to use .min.css and .min.js versions for production');
        console.log('2. Review image-optimization-manifest.json for image optimization opportunities');
        console.log('3. Consider implementing WebP images for better compression');
        console.log('4. Set up gzip compression on your web server');
        console.log('5. Test performance improvements with the performance test suite');
    }
}

// Check if running directly
if (require.main === module) {
    const optimizer = new AssetOptimizer();
    optimizer.optimizeAll().catch(console.error);
}

module.exports = AssetOptimizer;