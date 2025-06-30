// Fear City Cycles - v0.1.2 JavaScript
// Basic interactions and functionality

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Enhanced CTA button interactions
    const ctaButtons = document.querySelectorAll('.cta-btn, .view-btn, .enter-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Product card hover effects
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 20px rgba(139, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
    
    // Enhanced shopping cart functionality
    let cart = JSON.parse(localStorage.getItem('fearCityCart')) || [];
    
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = itemCount;
        }
    }
    
    function saveCart() {
        localStorage.setItem('fearCityCart', JSON.stringify(cart));
        updateCartCount();
    }
    
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        showNotification('Item removed from cart');
        if (typeof renderCartItems === 'function') {
            renderCartItems();
        }
    }
    
    function updateQuantity(productId, newQuantity) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                saveCart();
                if (typeof renderCartItems === 'function') {
                    renderCartItems();
                }
            }
        }
    }
    
    function addToCart(productId, productName, price) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                quantity: 1
            });
        }
        
        saveCart();
        
        // Show confirmation
        showNotification(`${productName} added to cart!`);
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #8B0000;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    function showProductDetails(product) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.product-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup overlay
        const popup = document.createElement('div');
        popup.className = 'product-popup';
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-content">
                <button class="popup-close">&times;</button>
                <div class="popup-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="popup-details">
                    <h2>${product.name}</h2>
                    <p class="popup-price">${product.price}</p>
                    <p class="popup-description">${product.description}</p>
                    <button class="popup-add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.priceValue}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .product-popup {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .popup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }
            .popup-content {
                position: relative;
                background: #000;
                border: 2px solid #8B0000;
                max-width: 800px;
                max-height: 90vh;
                overflow: auto;
                display: flex;
                gap: 20px;
                padding: 20px;
            }
            .popup-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #8B0000;
                color: white;
                border: none;
                font-size: 24px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .popup-close:hover {
                background: #a00;
            }
            .popup-image {
                flex: 1;
            }
            .popup-image img {
                width: 100%;
                height: auto;
            }
            .popup-details {
                flex: 1;
                color: white;
            }
            .popup-details h2 {
                color: #8B0000;
                margin: 0 0 10px 0;
            }
            .popup-price {
                font-size: 24px;
                font-weight: bold;
                color: #8B0000;
                margin: 10px 0;
            }
            .popup-description {
                line-height: 1.6;
                margin: 20px 0;
            }
            .popup-add-to-cart {
                background: #8B0000;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.3s;
            }
            .popup-add-to-cart:hover {
                background: #a00;
            }
            @media (max-width: 768px) {
                .popup-content {
                    flex-direction: column;
                    max-width: 95%;
                    margin: 20px;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(popup);
        
        // Close popup handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
        popup.querySelector('.popup-overlay').addEventListener('click', () => popup.remove());
        
        // Add to cart handler
        popup.querySelector('.popup-add-to-cart').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price'));
            
            addToCart(id, name, price);
            popup.remove();
        });
    }
    
    // Initialize cart count on page load
    updateCartCount();
    
    // Add click handlers for view buttons to show product details
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Extract product info from parent card
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const priceText = productCard.querySelector('.price').textContent;
            const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ''));
            const description = productCard.querySelector('p:not(.price)').textContent;
            const imgSrc = productCard.querySelector('img').src;
            
            // Show product details popup
            showProductDetails({
                name: productName,
                price: priceText,
                description: description,
                image: imgSrc,
                id: `bike-${index + 1}`,
                priceValue: price
            });
        });
    });
    
    // Add click handlers for product page add-to-cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productId = this.getAttribute('data-product');
            const price = parseInt(this.getAttribute('data-price'));
            const productTitle = document.querySelector('.product-title').textContent;
            
            // Get selected options if any
            const sizeSelect = document.getElementById('size');
            const colorSelect = document.getElementById('color');
            
            let productName = productTitle;
            if (sizeSelect && sizeSelect.value) {
                productName += ` (${sizeSelect.value})`;
            }
            if (colorSelect && colorSelect.value) {
                productName += ` - ${colorSelect.value}`;
            }
            
            addToCart(productId, productName, price);
        });
    });
    
    // Cart page functionality
    function renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItemsContainer) return;
        
        if (cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            if (emptyCart) emptyCart.style.display = 'block';
            return;
        }
        
        cartItemsContainer.style.display = 'block';
        if (emptyCart) emptyCart.style.display = 'none';
        
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p class="item-price">$${item.price.toLocaleString()}</p>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">Remove</button>
                </div>
                <div class="item-total">$${itemTotal.toLocaleString()}</div>
            `;
            
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Update totals
        if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toLocaleString()}`;
        if (cartTotal) cartTotal.textContent = `$${subtotal.toLocaleString()}`;
        
        // Add event listeners for quantity controls
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                const item = cart.find(item => item.id === itemId);
                if (item) {
                    updateQuantity(itemId, item.quantity - 1);
                }
            });
        });
        
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                const item = cart.find(item => item.id === itemId);
                if (item) {
                    updateQuantity(itemId, item.quantity + 1);
                }
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                removeFromCart(itemId);
            });
        });
    }
    
    // Initialize cart page if we're on it
    if (document.getElementById('cart-items')) {
        renderCartItems();
    }
    
    // Product gallery functionality
    function initProductGallery() {
        const mainImage = document.querySelector('.main-product-image');
        const thumbnails = document.querySelectorAll('.gallery-thumbs img');
        
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    // Remove active class from all thumbnails
                    thumbnails.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked thumbnail
                    this.classList.add('active');
                    // Update main image
                    mainImage.src = this.src;
                    mainImage.alt = this.alt;
                });
            });
            
            // Set first thumbnail as active
            if (thumbnails[0]) {
                thumbnails[0].classList.add('active');
            }
            
            // Add click-to-zoom functionality
            mainImage.addEventListener('click', function() {
                const overlay = document.createElement('div');
                overlay.className = 'image-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    cursor: pointer;
                `;
                
                const zoomedImage = document.createElement('img');
                zoomedImage.src = this.src;
                zoomedImage.alt = this.alt;
                zoomedImage.style.cssText = `
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                `;
                
                overlay.appendChild(zoomedImage);
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', function() {
                    document.body.removeChild(overlay);
                });
            });
        }
    }
    
    // Initialize gallery if we're on a product page
    if (document.querySelector('.product-gallery')) {
        initProductGallery();
    }
    
    // Lazy loading for images
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Product search functionality
    function initProductSearch() {
        const searchInput = document.getElementById('product-search');
        const productCards = document.querySelectorAll('.product-card');
        
        if (searchInput && productCards.length > 0) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                productCards.forEach(card => {
                    const productName = card.querySelector('h3').textContent.toLowerCase();
                    const productDescription = card.querySelector('p:not(.price)').textContent.toLowerCase();
                    const productPrice = card.querySelector('.price').textContent.toLowerCase();
                    
                    const isMatch = productName.includes(searchTerm) || 
                                  productDescription.includes(searchTerm) || 
                                  productPrice.includes(searchTerm);
                    
                    if (searchTerm === '' || isMatch) {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                    } else {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
                
                // Show "no results" message if no products match
                const visibleCards = Array.from(productCards).filter(card => 
                    card.style.display !== 'none'
                );
                
                // Remove existing "no results" message
                const existingMessage = document.querySelector('.no-results-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                if (searchTerm !== '' && visibleCards.length === 0) {
                    const noResultsMessage = document.createElement('div');
                    noResultsMessage.className = 'no-results-message';
                    noResultsMessage.style.cssText = `
                        text-align: center;
                        color: #666;
                        font-size: 18px;
                        margin: 40px 0;
                        grid-column: 1 / -1;
                    `;
                    noResultsMessage.innerHTML = `
                        <p>No products found matching "${searchTerm}"</p>
                        <p style="font-size: 14px; margin-top: 10px;">Try searching for bikes, gear, or specific product names.</p>
                    `;
                    
                    // Add to the first product grid found
                    const productGrid = document.querySelector('.product-grid');
                    if (productGrid) {
                        productGrid.appendChild(noResultsMessage);
                    }
                }
            });
            
            // Clear search on escape key
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    this.value = '';
                    this.dispatchEvent(new Event('input'));
                }
            });
        }
    }
    
    // Initialize search functionality
    initProductSearch();
    
    // Product filtering functionality
    function initProductFilters() {
        const priceFilter = document.getElementById('price-filter');
        const categoryFilter = document.getElementById('category-filter');
        const productCards = document.querySelectorAll('.product-card');
        
        if ((priceFilter || categoryFilter) && productCards.length > 0) {
            function applyFilters() {
                const selectedPrice = priceFilter ? priceFilter.value : '';
                const selectedCategory = categoryFilter ? categoryFilter.value : '';
                
                productCards.forEach(card => {
                    const cardPrice = parseInt(card.getAttribute('data-price') || '0');
                    const cardCategory = card.getAttribute('data-category') || '';
                    
                    let showCard = true;
                    
                    // Price filtering
                    if (selectedPrice) {
                        const [minPrice, maxPrice] = selectedPrice.split('-').map(p => parseInt(p));
                        if (maxPrice) {
                            showCard = showCard && (cardPrice >= minPrice && cardPrice <= maxPrice);
                        } else {
                            showCard = showCard && (cardPrice >= minPrice);
                        }
                    }
                    
                    // Category filtering
                    if (selectedCategory) {
                        showCard = showCard && (cardCategory === selectedCategory);
                    }
                    
                    if (showCard) {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                    } else {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
                
                // Show "no results" message if no products match
                const visibleCards = Array.from(productCards).filter(card => 
                    card.style.display !== 'none'
                );
                
                // Remove existing "no results" message
                const existingMessage = document.querySelector('.no-filter-results');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                if ((selectedPrice || selectedCategory) && visibleCards.length === 0) {
                    const noResultsMessage = document.createElement('div');
                    noResultsMessage.className = 'no-filter-results';
                    noResultsMessage.style.cssText = `
                        text-align: center;
                        color: #666;
                        font-size: 18px;
                        margin: 40px 0;
                        grid-column: 1 / -1;
                    `;
                    noResultsMessage.innerHTML = `
                        <p>No products match the selected filters</p>
                        <p style="font-size: 14px; margin-top: 10px;">Try adjusting your price range or category selection.</p>
                    `;
                    
                    // Add to the first product grid found
                    const productGrid = document.querySelector('.product-grid');
                    if (productGrid) {
                        productGrid.appendChild(noResultsMessage);
                    }
                }
            }
            
            if (priceFilter) {
                priceFilter.addEventListener('change', applyFilters);
            }
            
            if (categoryFilter) {
                categoryFilter.addEventListener('change', applyFilters);
            }
        }
    }
    
    // Initialize filtering functionality
    initProductFilters();
    
    // Make functions globally available
    window.cart = cart;
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.renderCartItems = renderCartItems;
    
    // Console welcome message
    console.log('%cFear City Cycles - v0.1.3', 'color: #8B0000; font-size: 20px; font-weight: bold;');
    console.log('Lean Mean Built in Queens');
});