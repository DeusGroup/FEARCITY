// Fear City Cycles - Dynamic Product Page JavaScript
// Fetches product data from API and renders product pages dynamically

let fearCityAPI = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API
    try {
        const apiModule = await import('./api.js');
        fearCityAPI = new apiModule.FearCityAPI();
    } catch (error) {
        console.error('Failed to initialize API:', error);
        showErrorFallback();
        return;
    }

    // Get product identifier from URL
    const productIdentifier = getProductIdentifierFromURL();
    
    if (productIdentifier) {
        await loadProductData(productIdentifier);
    } else {
        console.error('No product identifier found in URL');
        showErrorFallback();
    }
});

// Extract product identifier from URL
function getProductIdentifierFromURL() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    if (filename && filename.includes('.html')) {
        // Convert filename to slug (e.g., street-reaper.html -> street-reaper)
        return filename.replace('.html', '');
    }
    
    return null;
}

// Load product data from API
async function loadProductData(identifier) {
    try {
        showLoadingState();
        
        // Try to fetch by slug first, then by ID
        let response;
        try {
            response = await fearCityAPI.fetchProductBySlug(identifier);
        } catch (error) {
            // If slug fetch fails, try by ID
            response = await fearCityAPI.fetchProduct(identifier);
        }
        
        if (response.success && response.data) {
            const product = response.data;
            await renderProductPage(product);
            await loadRelatedProducts(product);
        } else {
            throw new Error('Product not found');
        }
        
    } catch (error) {
        console.error('Failed to load product:', error);
        showErrorFallback();
    }
}

// Render the product page with API data
async function renderProductPage(product) {
    // Update page title and meta
    document.title = `${product.name} | Fear City Cycles`;
    updateMetaTags(product);
    
    // Update breadcrumb
    updateBreadcrumb(product);
    
    // Update product gallery
    updateProductGallery(product);
    
    // Update product info
    updateProductInfo(product);
    
    // Update specifications if available
    updateProductSpecs(product);
    
    // Hide loading state
    hideLoadingState();
    
    // Initialize interactive features
    initializeProductInteractions();
}

// Update meta tags for SEO
function updateMetaTags(product) {
    const description = `${product.name} - ${product.shortDescription || product.description || 'Custom motorcycle from Fear City Cycles'}`;
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', description);
    } else {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = description;
        document.head.appendChild(metaDesc);
    }
    
    // Update Open Graph tags
    updateOrCreateMetaProperty('og:title', `${product.name} | Fear City Cycles`);
    updateOrCreateMetaProperty('og:description', description);
    updateOrCreateMetaProperty('og:image', product.images?.[0] || '');
}

function updateOrCreateMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (meta) {
        meta.setAttribute('content', content);
    } else {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
    }
}

// Update breadcrumb navigation
function updateBreadcrumb(product) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        const categoryPath = product.category?.slug === 'motorcycles' ? 'bikes' : 'gear';
        breadcrumb.innerHTML = `
            <a href="../main.html">Home</a> › 
            <a href="../${categoryPath}/">${product.category?.name || 'Products'}</a> › 
            ${product.name}
        `;
    }
}

// Update product gallery
function updateProductGallery(product) {
    const mainImage = document.querySelector('.main-product-image');
    const galleryThumbs = document.querySelector('.gallery-thumbs');
    
    if (mainImage && product.images && product.images.length > 0) {
        mainImage.src = product.images[0];
        mainImage.alt = `${product.name} - Main View`;
    }
    
    if (galleryThumbs && product.images && product.images.length > 1) {
        galleryThumbs.innerHTML = product.images.map((image, index) => `
            <img src="${image}" alt="${product.name} - View ${index + 1}" 
                 class="${index === 0 ? 'active' : ''}"
                 onclick="updateMainImage('${image}', this)">
        `).join('');
    }
}

// Update main image when thumbnail clicked
function updateMainImage(imageSrc, thumbElement) {
    const mainImage = document.querySelector('.main-product-image');
    if (mainImage) {
        mainImage.src = imageSrc;
        
        // Update active thumbnail
        document.querySelectorAll('.gallery-thumbs img').forEach(img => img.classList.remove('active'));
        thumbElement.classList.add('active');
    }
}

// Update product information
function updateProductInfo(product) {
    // Update product title
    const title = document.querySelector('.product-title, h1');
    if (title) title.textContent = product.name;
    
    // Update category
    const category = document.querySelector('.product-category');
    if (category) category.textContent = product.category?.name || '';
    
    // Update price
    const price = document.querySelector('.product-price');
    if (price) {
        const formattedPrice = formatPrice(product.price);
        price.textContent = formattedPrice;
    }
    
    // Update description
    const description = document.querySelector('.product-description p');
    if (description) description.textContent = product.description || '';
    
    // Update features if available
    const featuresList = document.querySelector('.product-features ul');
    if (featuresList && product.features && product.features.length > 0) {
        featuresList.innerHTML = product.features.map(feature => `<li>${feature}</li>`).join('');
    }
    
    // Update add to cart button
    updateAddToCartButton(product);
    
    // Update product options
    updateProductOptions(product);
}

// Update add to cart button
function updateAddToCartButton(product) {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        const formattedPrice = formatPrice(product.price);
        addToCartBtn.textContent = `Add to Cart - ${formattedPrice}`;
        addToCartBtn.dataset.productId = product.id;
        addToCartBtn.dataset.price = product.price;
        addToCartBtn.dataset.product = product.slug || product.id;
    }
}

// Update product options (colors, sizes, etc.)
function updateProductOptions(product) {
    const optionsContainer = document.querySelector('.product-options');
    if (!optionsContainer) return;
    
    // Clear existing options except essential ones
    const existingSelects = optionsContainer.querySelectorAll('select:not(#color)');
    existingSelects.forEach(select => select.remove());
    
    // Add size options if product has sizes
    if (product.sizes && product.sizes.length > 0) {
        const sizeSelect = createOptionSelect('size', 'Size', product.sizes);
        optionsContainer.appendChild(sizeSelect);
    }
    
    // Add color options if available
    if (product.colors && product.colors.length > 0) {
        const colorSelect = document.querySelector('#color') || createOptionSelect('color', 'Color', []);
        colorSelect.innerHTML = '<option value="">Select Color</option>' + 
            product.colors.map(color => `<option value="${color.value || color}">${color.name || color}</option>`).join('');
    }
}

// Create option select element
function createOptionSelect(name, label, options) {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
        <label for="${name}">${label}:</label>
        <select id="${name}" name="${name}">
            <option value="">Select ${label}</option>
            ${options.map(option => `
                <option value="${option.value || option}">${option.name || option}</option>
            `).join('')}
        </select>
    `;
    return div;
}

// Update product specifications
function updateProductSpecs(product) {
    const specsSection = document.querySelector('.specs-section .specs-grid');
    if (!specsSection || !product.specifications) return;
    
    const specs = product.specifications;
    specsSection.innerHTML = Object.entries(specs).map(([key, value]) => `
        <div class="spec-item">
            <h4>${formatSpecLabel(key)}</h4>
            <p>${value}</p>
        </div>
    `).join('');
}

// Load related products
async function loadRelatedProducts(product) {
    try {
        const response = await fearCityAPI.fetchRelatedProducts(product.id);
        
        if (response.success && response.data && response.data.length > 0) {
            renderRelatedProducts(response.data);
        } else {
            // Fallback: load products from same category
            const categoryResponse = await fearCityAPI.fetchProducts({
                category: product.category?.slug || product.category?.name,
                limit: 3,
                exclude: product.id
            });
            
            if (categoryResponse.success && categoryResponse.data.products) {
                renderRelatedProducts(categoryResponse.data.products);
            }
        }
    } catch (error) {
        console.warn('Failed to load related products:', error);
    }
}

// Render related products section
function renderRelatedProducts(products) {
    const relatedSection = document.querySelector('.related-products');
    if (!relatedSection) return;
    
    const relatedGrid = relatedSection.querySelector('.related-grid');
    if (relatedGrid) {
        relatedGrid.innerHTML = products.map(product => {
            const isMotorcycle = product.category?.slug === 'motorcycles';
            const basePath = isMotorcycle ? '../bikes/' : '../gear/';
            const productUrl = `${basePath}${product.slug}.html`;
            
            return `
                <a href="${productUrl}" class="related-item">
                    <img src="${product.images?.[0] || '../assets/images/placeholder.svg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${formatPrice(product.price)}</p>
                </a>
            `;
        }).join('');
    }
}

// Initialize product interactions
function initializeProductInteractions() {
    // Enhanced gallery interactions
    enhanceProductGallery();
    
    // Add to cart functionality
    setupDynamicAddToCart();
    
    // Product options change handlers
    setupProductOptionsHandlers();
}

// Enhanced gallery with zoom and lightbox
function enhanceProductGallery() {
    const mainImage = document.querySelector('.main-product-image');
    if (mainImage) {
        mainImage.style.cursor = 'zoom-in';
        mainImage.addEventListener('click', function() {
            openImageLightbox(this.src, this.alt);
        });
    }
}

// Open image in lightbox
function openImageLightbox(imageSrc, imageAlt) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <span class="lightbox-close">&times;</span>
            <img src="${imageSrc}" alt="${imageAlt}">
        </div>
    `;
    
    lightbox.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.9); z-index: 2000;
        display: flex; justify-content: center; align-items: center;
    `;
    
    const content = lightbox.querySelector('.lightbox-content');
    content.style.cssText = 'position: relative; max-width: 90%; max-height: 90%;';
    
    const img = content.querySelector('img');
    img.style.cssText = 'width: 100%; height: auto; max-height: 100%; object-fit: contain;';
    
    const close = lightbox.querySelector('.lightbox-close');
    close.style.cssText = `
        position: absolute; top: -40px; right: 0; color: white;
        font-size: 40px; cursor: pointer; font-weight: bold;
    `;
    
    close.addEventListener('click', () => lightbox.remove());
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.remove();
    });
    
    document.body.appendChild(lightbox);
}

// Setup dynamic add to cart functionality
function setupDynamicAddToCart() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', async function() {
        const productId = this.dataset.productId;
        const price = parseFloat(this.dataset.price);
        const name = document.querySelector('.product-title')?.textContent || 'Product';
        const image = document.querySelector('.main-product-image')?.src || '';
        const size = document.querySelector('#size')?.value || 'Standard';
        const color = document.querySelector('#color')?.value || 'Default';
        
        const product = {
            id: productId,
            name: name,
            price: price,
            quantity: 1,
            size: size,
            color: color,
            image: image
        };
        
        // Add to cart using global cart
        if (window.fearCityCart) {
            await window.fearCityCart.addItem(product);
            showAddToCartFeedback();
        } else {
            console.error('Shopping cart not initialized');
        }
    });
}

// Show add to cart feedback
function showAddToCartFeedback() {
    const btn = document.querySelector('.add-to-cart-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = '✓ Added to Cart!';
    btn.style.backgroundColor = '#28a745';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
        btn.disabled = false;
    }, 2000);
}

// Setup product options change handlers
function setupProductOptionsHandlers() {
    const selects = document.querySelectorAll('.product-options select');
    selects.forEach(select => {
        select.addEventListener('change', function() {
            updateProductPrice();
        });
    });
}

// Update product price based on selected options
function updateProductPrice() {
    const basePrice = parseFloat(document.querySelector('.add-to-cart-btn')?.dataset.price || 0);
    let currentPrice = basePrice;
    
    // Add any option-based price modifications here
    // This could be extended to handle size/color price variations
    
    // Update displayed price
    const priceElement = document.querySelector('.product-price');
    if (priceElement) {
        priceElement.textContent = formatPrice(currentPrice);
    }
    
    // Update add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.textContent = `Add to Cart - ${formatPrice(currentPrice)}`;
    }
}

// Utility functions
function formatPrice(price) {
    return `$${parseFloat(price).toLocaleString()}`;
}

function formatSpecLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}

function showLoadingState() {
    const productInfo = document.querySelector('.product-info');
    if (productInfo) {
        productInfo.innerHTML = '<div class="loading">Loading product...</div>';
    }
}

function hideLoadingState() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

function showErrorFallback() {
    const productInfo = document.querySelector('.product-info');
    if (productInfo) {
        productInfo.innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>Sorry, this product could not be loaded. Please try again or <a href="../main.html">return to the main page</a>.</p>
            </div>
        `;
    }
}

// Make functions globally available
window.updateMainImage = updateMainImage;