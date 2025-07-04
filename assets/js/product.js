// Fear City Cycles - Enhanced Product Page JavaScript

// Product specifications database
const productSpecs = {
    'street-reaper': {
        engine: {
            type: '1000cc Twin-Cylinder',
            configuration: 'V-Twin, 4-stroke',
            cooling: 'Liquid-cooled',
            fuelSystem: 'Electronic Fuel Injection',
            compression: '11.5:1',
            bore: '100mm',
            stroke: '63mm',
            valves: '4 valves per cylinder, DOHC'
        },
        performance: {
            power: '115 HP @ 9,000 RPM',
            torque: '85 lb-ft @ 7,000 RPM',
            topSpeed: '155 mph',
            acceleration: '0-60 mph in 3.2 seconds',
            fuelCapacity: '4.5 gallons',
            fuelEconomy: '42 mpg average'
        },
        chassis: {
            frame: 'Aluminum twin-spar frame',
            frontSuspension: 'Fully adjustable USD forks, 120mm travel',
            rearSuspension: 'Monoshock with linkage, adjustable preload and damping',
            frontBrake: 'Dual 320mm discs, 4-piston calipers',
            rearBrake: '240mm disc, 2-piston caliper',
            abs: 'Dual-channel ABS standard',
            wheels: '17" cast aluminum alloy'
        },
        dimensions: {
            length: '82.7 inches',
            width: '31.1 inches',
            height: '44.5 inches',
            seatHeight: '32.3 inches',
            wheelbase: '56.7 inches',
            groundClearance: '5.1 inches',
            weight: '425 lbs (wet)'
        },
        features: [
            'LED headlight and taillight',
            'Digital instrument cluster',
            'Ride-by-wire throttle',
            'Traction control system',
            'Quick shifter',
            'Slipper clutch',
            'Adjustable rider modes',
            'USB charging port'
        ]
    },
    'borough-bruiser': {
        engine: {
            type: '1200cc Twin-Cylinder',
            configuration: 'V-Twin, 4-stroke',
            cooling: 'Air/Oil-cooled',
            fuelSystem: 'Electronic Sequential Port Fuel Injection',
            compression: '10.5:1',
            bore: '105mm',
            stroke: '69mm',
            valves: '2 valves per cylinder, OHV'
        },
        performance: {
            power: '92 HP @ 6,000 RPM',
            torque: '98 lb-ft @ 4,000 RPM',
            topSpeed: '130 mph',
            acceleration: '0-60 mph in 4.1 seconds',
            fuelCapacity: '5.0 gallons',
            fuelEconomy: '48 mpg average'
        },
        chassis: {
            frame: 'Steel tubular frame with engine as stressed member',
            frontSuspension: 'Telescopic forks, 140mm travel',
            rearSuspension: 'Dual shocks with adjustable preload',
            frontBrake: 'Dual 300mm discs, 4-piston calipers',
            rearBrake: '260mm disc, 2-piston caliper',
            abs: 'Optional dual-channel ABS',
            wheels: '16" front, 15" rear spoke wheels'
        },
        dimensions: {
            length: '90.2 inches',
            width: '35.8 inches',
            height: '46.7 inches',
            seatHeight: '26.8 inches',
            wheelbase: '63.5 inches',
            groundClearance: '4.7 inches',
            weight: '540 lbs (wet)'
        },
        features: [
            'Chrome exhaust system',
            'Leather saddle bags',
            'Highway pegs',
            'Windshield',
            'Cruise control',
            'Keyless ignition',
            'Security system',
            'Heated grips'
        ]
    }
};

// Related products mapping
const relatedProducts = {
    'street-reaper': ['fear-fighter', 'midnight-racer', 'gear-003'],
    'borough-bruiser': ['queens-crusher', 'death-rider', 'gear-001'],
    'fear-fighter': ['street-reaper', 'midnight-racer', 'gear-002'],
    'queens-crusher': ['borough-bruiser', 'death-rider', 'gear-005'],
    'death-rider': ['borough-bruiser', 'queens-crusher', 'gear-001'],
    'midnight-racer': ['street-reaper', 'fear-fighter', 'gear-003']
};

// Initialize product page enhancements
document.addEventListener('DOMContentLoaded', function() {
    const productId = getProductIdFromPage();
    
    if (productId) {
        enhanceProductGallery();
        loadDetailedSpecs(productId);
        loadRelatedProducts(productId);
        initializeProductOptions();
        setupAddToCart();
    }
});

// Get product ID from page context
function getProductIdFromPage() {
    // Try multiple methods to get product ID
    const addToCartBtn = document.querySelector('.add-to-cart-btn, [data-product-id]');
    if (addToCartBtn) {
        return addToCartBtn.dataset.productId || addToCartBtn.dataset.product;
    }
    
    // Try from URL
    const pathParts = window.location.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    if (filename && filename.includes('.html')) {
        return filename.replace('.html', '');
    }
    
    return null;
}

// Enhance product gallery with zoom and lightbox
function enhanceProductGallery() {
    const mainImage = document.querySelector('.main-product-image, .product-gallery img');
    const thumbnails = document.querySelectorAll('.gallery-thumbs img, .thumbnail');
    
    if (!mainImage) return;
    
    // Add zoom on hover functionality
    mainImage.style.cursor = 'zoom-in';
    mainImage.addEventListener('click', function() {
        openLightbox(this.src, this.alt);
    });
    
    // Thumbnail click handling
    thumbnails.forEach((thumb, index) => {
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('click', function() {
            mainImage.src = this.src;
            mainImage.alt = this.alt;
            
            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
        
        // Make first thumbnail active
        if (index === 0) thumb.classList.add('active');
    });
}

// Open lightbox for image zoom
function openLightbox(imageSrc, imageAlt) {
    const lightbox = document.createElement('div');
    lightbox.className = 'product-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <span class="lightbox-close">&times;</span>
            <img src="${imageSrc}" alt="${imageAlt}">
            <div class="lightbox-caption">${imageAlt}</div>
        </div>
    `;
    
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = lightbox.querySelector('.lightbox-content');
    content.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
    `;
    
    const img = content.querySelector('img');
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
    `;
    
    const close = lightbox.querySelector('.lightbox-close');
    close.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 40px;
        cursor: pointer;
        font-weight: normal;
        transition: color 0.2s;
    `;
    
    close.addEventListener('click', () => lightbox.remove());
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.remove();
    });
    
    document.body.appendChild(lightbox);
}

// Load detailed specifications
function loadDetailedSpecs(productId) {
    const specs = productSpecs[productId];
    if (!specs) return;
    
    const specsContainer = document.querySelector('.product-specifications');
    if (!specsContainer) {
        // Create specs section if it doesn't exist
        const detailsSection = document.querySelector('.product-details, .product-info');
        if (detailsSection) {
            const specsHTML = createSpecsHTML(specs);
            const specsDiv = document.createElement('div');
            specsDiv.className = 'product-specifications';
            specsDiv.innerHTML = specsHTML;
            detailsSection.appendChild(specsDiv);
        }
    } else {
        specsContainer.innerHTML = createSpecsHTML(specs);
    }
}

// Create specifications HTML
function createSpecsHTML(specs) {
    return `
        <h2>Detailed Specifications</h2>
        <div class="specs-tabs">
            <button class="spec-tab active" data-tab="engine">Engine</button>
            <button class="spec-tab" data-tab="performance">Performance</button>
            <button class="spec-tab" data-tab="chassis">Chassis</button>
            <button class="spec-tab" data-tab="dimensions">Dimensions</button>
            <button class="spec-tab" data-tab="features">Features</button>
        </div>
        
        <div class="specs-content">
            <div class="spec-panel active" id="engine">
                <h3>Engine Specifications</h3>
                <table class="specs-table">
                    ${Object.entries(specs.engine).map(([key, value]) => `
                        <tr>
                            <td>${formatSpecLabel(key)}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="spec-panel" id="performance">
                <h3>Performance</h3>
                <table class="specs-table">
                    ${Object.entries(specs.performance).map(([key, value]) => `
                        <tr>
                            <td>${formatSpecLabel(key)}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="spec-panel" id="chassis">
                <h3>Chassis & Suspension</h3>
                <table class="specs-table">
                    ${Object.entries(specs.chassis).map(([key, value]) => `
                        <tr>
                            <td>${formatSpecLabel(key)}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="spec-panel" id="dimensions">
                <h3>Dimensions & Weight</h3>
                <table class="specs-table">
                    ${Object.entries(specs.dimensions).map(([key, value]) => `
                        <tr>
                            <td>${formatSpecLabel(key)}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="spec-panel" id="features">
                <h3>Standard Features</h3>
                <ul class="features-list">
                    ${specs.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Format specification labels
function formatSpecLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}

// Initialize specification tabs
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('spec-tab')) {
        const tabs = document.querySelectorAll('.spec-tab');
        const panels = document.querySelectorAll('.spec-panel');
        const targetTab = e.target.dataset.tab;
        
        tabs.forEach(tab => tab.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(targetTab)?.classList.add('active');
    }
});

// Load related products
function loadRelatedProducts(productId) {
    const related = relatedProducts[productId];
    if (!related || related.length === 0) return;
    
    // Get product data from main.js productDatabase
    const productData = window.productDatabase || [];
    const relatedItems = related.map(id => 
        productData.find(p => p.id === id)
    ).filter(p => p);
    
    if (relatedItems.length === 0) return;
    
    const relatedSection = document.createElement('div');
    relatedSection.className = 'related-products';
    relatedSection.innerHTML = `
        <h2>You Might Also Like</h2>
        <div class="related-grid">
            ${relatedItems.map(product => `
                <div class="related-card">
                    <a href="${product.page}">
                        <img src="../assets/images/${product.id}.svg" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p class="related-category">${product.category}</p>
                        <p class="related-price">$${product.price.toLocaleString()}</p>
                    </a>
                </div>
            `).join('')}
        </div>
    `;
    
    const mainContent = document.querySelector('main, .product-page');
    if (mainContent) {
        mainContent.appendChild(relatedSection);
    }
}

// Initialize product options (color, size, etc.)
function initializeProductOptions() {
    const colorSelect = document.querySelector('#color, select[name="color"]');
    const customOptions = document.querySelector('.custom-options');
    
    if (colorSelect) {
        colorSelect.addEventListener('change', function() {
            updateProductPrice();
            updateProductImage(this.value);
        });
    }
    
    // Add customization options
    if (!customOptions) {
        const optionsContainer = document.querySelector('.product-options');
        if (optionsContainer) {
            const customHTML = `
                <div class="custom-options">
                    <h3>Customization Options</h3>
                    <label>
                        <input type="checkbox" name="custom-exhaust" value="500">
                        Performance Exhaust System (+$500)
                    </label>
                    <label>
                        <input type="checkbox" name="custom-seat" value="300">
                        Custom Leather Seat (+$300)
                    </label>
                    <label>
                        <input type="checkbox" name="custom-paint" value="800">
                        Custom Paint Job (+$800)
                    </label>
                </div>
            `;
            optionsContainer.insertAdjacentHTML('beforeend', customHTML);
            
            // Add event listeners for custom options
            document.querySelectorAll('.custom-options input').forEach(input => {
                input.addEventListener('change', updateProductPrice);
            });
        }
    }
}

// Update product price based on options
function updateProductPrice() {
    const basePrice = parseInt(document.querySelector('.add-to-cart-btn')?.dataset.price || 0);
    let totalPrice = basePrice;
    
    // Add custom options prices
    document.querySelectorAll('.custom-options input:checked').forEach(input => {
        totalPrice += parseInt(input.value);
    });
    
    // Update displayed price
    const priceElement = document.querySelector('.product-price');
    if (priceElement) {
        priceElement.textContent = `$${totalPrice.toLocaleString()}`;
    }
    
    // Update add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.textContent = `Add to Cart - $${totalPrice.toLocaleString()}`;
        addToCartBtn.dataset.currentPrice = totalPrice;
    }
}

// Update product image based on color selection
function updateProductImage(color) {
    // This would update the main image based on color selection
    // For demo purposes, we'll just log it
    console.log('Update image for color:', color);
}

// Enhanced add to cart functionality
function setupAddToCart() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', function() {
        const productId = this.dataset.productId || this.dataset.product;
        const price = parseInt(this.dataset.currentPrice || this.dataset.price);
        const color = document.querySelector('#color')?.value || 'default';
        const customOptions = [];
        
        // Collect custom options
        document.querySelectorAll('.custom-options input:checked').forEach(input => {
            customOptions.push(input.nextSibling.textContent.trim());
        });
        
        const product = {
            id: productId,
            name: document.querySelector('.product-title, h1')?.textContent || 'Product',
            price: price,
            quantity: 1,
            color: color,
            customOptions: customOptions,
            image: document.querySelector('.main-product-image')?.src || ''
        };
        
        // Add to cart (using the global cart from main.js)
        if (window.fearCityCart) {
            window.fearCityCart.addItem(product);
            showAddToCartAnimation();
        } else {
            console.error('Shopping cart not initialized');
        }
    });
}

// Show add to cart animation
function showAddToCartAnimation() {
    const btn = document.querySelector('.add-to-cart-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = '✓ Added to Cart!';
    btn.style.background = '#008000';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

// Export for use in other files
window.productEnhancements = {
    loadDetailedSpecs,
    loadRelatedProducts,
    enhanceProductGallery
};