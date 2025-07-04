// Fear City Cycles - Main Site JavaScript

// Enhanced Shopping Cart with Advanced Features
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.abandonmentTimer = null;
        this.sessionStartTime = Date.now();
        this.api = null;
        this.isAuthenticated = false;
        this.updateCartDisplay();
        this.initializeCartPersistence();
        this.setupAbandonmentPrevention();
        this.initializeAPI();
        // Make cart globally accessible
        window.fearCityCart = this;
    }

    // Initialize API integration
    async initializeAPI() {
        try {
            // Import API class dynamically
            const apiModule = await import('./api.js');
            this.api = new apiModule.FearCityAPI();
            
            // Check if user is authenticated
            this.isAuthenticated = !!this.api.getStoredToken();
            
            // If authenticated, sync cart with backend
            if (this.isAuthenticated) {
                await this.syncCartWithBackend();
            }
        } catch (error) {
            console.warn('API initialization failed, falling back to local storage only:', error);
            this.api = null;
            this.isAuthenticated = false;
        }
    }

    // Sync local cart with backend cart
    async syncCartWithBackend() {
        if (!this.api || !this.isAuthenticated) return;

        try {
            // Fetch cart from backend
            const response = await this.api.fetchCart();
            
            if (response.success && response.data.items) {
                // Merge local cart with backend cart
                const backendItems = response.data.items.map(item => ({
                    id: item.productId,
                    name: item.product?.name || 'Unknown Product',
                    price: parseFloat(item.price || 0),
                    image: item.product?.images?.[0] || '',
                    quantity: item.quantity,
                    size: item.variant || 'Standard',
                    customOptions: item.customOptions || [],
                    backendItemId: item.id // Store backend ID for updates
                }));

                // Merge with local items (prioritize local items)
                const mergedItems = [...this.items];
                
                // Add backend items that aren't in local cart
                backendItems.forEach(backendItem => {
                    const existsLocally = this.items.some(localItem =>
                        localItem.id === backendItem.id &&
                        (localItem.size || 'Standard') === backendItem.size
                    );
                    
                    if (!existsLocally) {
                        mergedItems.push(backendItem);
                    }
                });

                this.items = mergedItems;
                this.saveCart();
                this.updateCartDisplay();
            }
        } catch (error) {
            console.warn('Cart sync failed:', error);
        }
    }

    // Enhanced addItem with API integration
    async addItem(product) {
        const existingItem = this.items.find(item => 
            item.id === product.id && 
            (item.size || 'Standard') === (product.size || 'Standard') &&
            JSON.stringify(item.customOptions || []) === JSON.stringify(product.customOptions || [])
        );

        let updatedItem;
        if (existingItem) {
            existingItem.quantity += 1;
            updatedItem = existingItem;
            this.showQuantityAnimation(existingItem);
        } else {
            const newItem = {
                ...product,
                quantity: 1,
                size: product.size || 'Standard',
                addedAt: Date.now(),
                customOptions: product.customOptions || []
            };
            this.items.push(newItem);
            updatedItem = newItem;
        }

        // Save locally first for immediate UI feedback
        this.saveCart();
        this.updateCartDisplay();
        this.showEnhancedNotification(`Added ${product.name} to cart`, 'success');
        this.trackCartEvent('add_to_cart', product);
        this.resetAbandonmentTimer();

        // Sync with backend if authenticated
        if (this.api && this.isAuthenticated) {
            try {
                await this.api.addToCart(product.id, 1, {
                    variant: product.size,
                    customOptions: product.customOptions
                });
            } catch (error) {
                console.warn('Failed to sync cart addition with backend:', error);
                // Still continue with local storage - no need to revert
            }
        }
    }

    async removeItem(productId, size = 'Standard', customOptions = []) {
        const itemIndex = this.items.findIndex(item => 
            item.id === productId && 
            (item.size || 'Standard') === size &&
            JSON.stringify(item.customOptions || []) === JSON.stringify(customOptions)
        );
        
        if (itemIndex !== -1) {
            const removedItem = this.items[itemIndex];
            this.items.splice(itemIndex, 1);
            
            // Save locally first for immediate UI feedback
            this.saveCart();
            this.updateCartDisplay();
            this.showEnhancedNotification(`Removed ${removedItem.name} from cart`, 'remove');
            this.trackCartEvent('remove_from_cart', removedItem);

            // Sync with backend if authenticated and has backend ID
            if (this.api && this.isAuthenticated && removedItem.backendItemId) {
                try {
                    await this.api.removeFromCart(removedItem.backendItemId);
                } catch (error) {
                    console.warn('Failed to sync cart removal with backend:', error);
                    // Local storage is already updated, so we don't revert
                }
            }
        }
    }

    updateQuantity(productId, size, quantity, customOptions = []) {
        const item = this.items.find(item => 
            item.id === productId && 
            (item.size || 'Standard') === size &&
            JSON.stringify(item.customOptions || []) === JSON.stringify(customOptions)
        );
        
        if (item) {
            const oldQuantity = item.quantity;
            item.quantity = Math.max(0, quantity);
            
            if (item.quantity === 0) {
                this.removeItem(productId, size, customOptions);
            } else {
                this.saveCart();
                this.updateCartDisplay();
                this.showQuantityUpdateAnimation(item, oldQuantity);
                this.trackCartEvent('update_quantity', item);
            }
        }
    }

    async clearCart() {
        if (this.items.length > 0) {
            this.items = [];
            
            // Save locally first for immediate UI feedback
            this.saveCart();
            this.updateCartDisplay();
            this.showEnhancedNotification('Cart cleared', 'info');
            this.trackCartEvent('clear_cart');

            // Sync with backend if authenticated
            if (this.api && this.isAuthenticated) {
                try {
                    await this.api.clearCart();
                } catch (error) {
                    console.warn('Failed to clear backend cart:', error);
                    // Local storage is already cleared, so we don't revert
                }
            }
        }
    }

    loadCart() {
        try {
            const saved = localStorage.getItem('fearCityCart');
            const backup = sessionStorage.getItem('fearCityCartBackup');
            
            // Try localStorage first, fallback to sessionStorage
            const cartData = saved || backup;
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    getCartSummary() {
        return {
            itemCount: this.getItemCount(),
            total: this.getTotal(),
            items: this.items.length,
            sessionDuration: Date.now() - this.sessionStartTime
        };
    }

    saveCart() {
        try {
            const cartData = JSON.stringify(this.items);
            
            // Save to both localStorage and sessionStorage for redundancy
            localStorage.setItem('fearCityCart', cartData);
            sessionStorage.setItem('fearCityCartBackup', cartData);
            
            // Save cart metadata
            const metadata = {
                lastSaved: Date.now(),
                itemCount: this.getItemCount(),
                total: this.getTotal()
            };
            localStorage.setItem('fearCityCartMeta', JSON.stringify(metadata));
            
        } catch (error) {
            console.error('Error saving cart:', error);
            // Try session storage if localStorage fails
            try {
                sessionStorage.setItem('fearCityCartBackup', JSON.stringify(this.items));
            } catch (sessionError) {
                console.error('Error saving to session storage:', sessionError);
            }
        }
    }

    initializeCartPersistence() {
        // Periodic cart backup
        setInterval(() => {
            if (this.items.length > 0) {
                this.saveCart();
            }
        }, 30000); // Save every 30 seconds

        // Save cart before page unload
        window.addEventListener('beforeunload', () => {
            this.saveCart();
        });

        // Restore cart on visibility change (e.g., returning to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const currentItems = this.loadCart();
                if (JSON.stringify(currentItems) !== JSON.stringify(this.items)) {
                    this.items = currentItems;
                    this.updateCartDisplay();
                }
            }
        });
    }

    setupAbandonmentPrevention() {
        // Track user activity for abandonment prevention
        const activityEvents = ['click', 'scroll', 'keypress', 'mousemove'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.resetAbandonmentTimer();
            }, { passive: true });
        });

        // Check for cart abandonment on page focus
        window.addEventListener('focus', () => {
            if (this.items.length > 0) {
                this.checkCartAge();
            }
        });
    }

    resetAbandonmentTimer() {
        clearTimeout(this.abandonmentTimer);
        
        if (this.items.length > 0) {
            // Show abandonment prevention after 5 minutes of inactivity
            this.abandonmentTimer = setTimeout(() => {
                this.showAbandonmentPrevention();
            }, 300000); // 5 minutes
        }
    }

    showAbandonmentPrevention() {
        if (this.items.length === 0) return;

        const modal = document.createElement('div');
        modal.className = 'abandonment-modal';
        modal.innerHTML = `
            <div class="abandonment-content">
                <h3>Don't Leave Your Ride Behind!</h3>
                <p>You have ${this.getItemCount()} item${this.getItemCount() > 1 ? 's' : ''} waiting in your cart.</p>
                <div class="abandonment-actions">
                    <button class="btn-complete-order">Complete Order</button>
                    <button class="btn-save-later">Save for Later</button>
                    <button class="btn-dismiss">Dismiss</button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease;
        `;

        const content = modal.querySelector('.abandonment-content');
        content.style.cssText = `
            background: #000;
            border: 2px solid #8B0000;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.btn-complete-order').addEventListener('click', () => {
            window.location.href = '/cart/';
            modal.remove();
        });

        modal.querySelector('.btn-save-later').addEventListener('click', () => {
            this.saveCartForLater();
            modal.remove();
        });

        modal.querySelector('.btn-dismiss').addEventListener('click', () => {
            modal.remove();
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 30000);
    }

    saveCartForLater() {
        const laterCart = {
            items: this.items,
            savedAt: Date.now(),
            sessionId: this.generateSessionId()
        };
        
        localStorage.setItem('fearCityCartSavedForLater', JSON.stringify(laterCart));
        this.showEnhancedNotification('Cart saved for later', 'info');
        this.trackCartEvent('save_for_later');
    }

    restoreSavedCart() {
        const saved = localStorage.getItem('fearCityCartSavedForLater');
        if (saved) {
            const laterCart = JSON.parse(saved);
            this.items = [...this.items, ...laterCart.items];
            this.saveCart();
            this.updateCartDisplay();
            localStorage.removeItem('fearCityCartSavedForLater');
            this.showEnhancedNotification('Saved cart restored', 'success');
        }
    }

    checkCartAge() {
        const metadata = localStorage.getItem('fearCityCartMeta');
        if (metadata) {
            const meta = JSON.parse(metadata);
            const ageInHours = (Date.now() - meta.lastSaved) / (1000 * 60 * 60);
            
            if (ageInHours > 24 && this.items.length > 0) {
                this.showCartAgeWarning();
            }
        }
    }

    showCartAgeWarning() {
        this.showEnhancedNotification('Your cart items are over 24 hours old. Complete your order soon!', 'warning', 5000);
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
        
        cartCountElements.forEach(element => {
            const newCount = this.getItemCount();
            const oldCount = parseInt(element.textContent) || 0;
            
            element.textContent = newCount;
            
            // Add bounce animation for count changes
            if (newCount !== oldCount && newCount > 0) {
                element.style.animation = 'cartBounce 0.6s ease';
                setTimeout(() => {
                    element.style.animation = '';
                }, 600);
            }
        });

        // Update cart icon with visual feedback
        const cartLinks = document.querySelectorAll('.cart-link');
        cartLinks.forEach(link => {
            if (this.getItemCount() > 0) {
                link.classList.add('has-items');
            } else {
                link.classList.remove('has-items');
            }
        });
    }

    showEnhancedNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `cart-notification cart-notification--${type}`;
        
        const icons = {
            success: '✓',
            remove: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.success}</span>
            <span class="notification-message">${message}</span>
        `;

        const colors = {
            success: '#8B0000',
            remove: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            font-family: Orbitron, monospace;
            font-weight: 700;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    showQuantityAnimation(item) {
        // Find the product card and show quantity update animation
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const addButton = card.querySelector('.add-to-cart');
            if (addButton && addButton.dataset.productId === item.id) {
                const quantityBadge = document.createElement('div');
                quantityBadge.textContent = `Qty: ${item.quantity}`;
                quantityBadge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #8B0000;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: bold;
                    animation: quantityPulse 1s ease;
                `;
                
                card.style.position = 'relative';
                card.appendChild(quantityBadge);
                
                setTimeout(() => {
                    if (card.contains(quantityBadge)) {
                        card.removeChild(quantityBadge);
                    }
                }, 2000);
            }
        });
    }

    showQuantityUpdateAnimation(item, oldQuantity) {
        const change = item.quantity - oldQuantity;
        const message = change > 0 ? `+${change}` : `${change}`;
        this.showEnhancedNotification(`${item.name} quantity updated (${message})`, 'info', 2000);
    }

    trackCartEvent(action, item = null) {
        if (typeof gtag !== 'undefined') {
            const eventData = {
                event_category: 'Cart',
                event_label: action,
                value: this.getTotal()
            };

            if (item) {
                eventData.item_id = item.id;
                eventData.item_name = item.name;
                eventData.item_category = item.category || 'unknown';
                eventData.price = item.price;
            }

            gtag('event', action, eventData);
        }
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Legacy method name for backward compatibility
    showNotification(message) {
        this.showEnhancedNotification(message, 'success');
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();

            // Disable button to prevent double-clicks
            const originalText = this.textContent;
            this.disabled = true;
            this.textContent = 'Adding...';

            try {
                const productCard = this.closest('.product-card');
                const product = {
                    id: this.dataset.productId,
                    name: this.dataset.name || productCard.querySelector('h3')?.textContent || 'Unknown Product',
                    price: parseFloat(this.dataset.price),
                    image: this.dataset.image || productCard.querySelector('img')?.src || '',
                    size: this.dataset.size || 'Standard'
                };

                await cart.addItem(product);
            } catch (error) {
                console.error('Error adding item to cart:', error);
                // Show error notification
                if (window.fearCityCart) {
                    window.fearCityCart.showEnhancedNotification('Failed to add item to cart', 'error');
                }
            } finally {
                // Re-enable button
                this.disabled = false;
                this.textContent = originalText;
            }
        });
    });

    // Search functionality - Enhanced Product Search System
    // Products will be loaded dynamically from the API
    let productDatabase = [];

    // Enhanced search function with fuzzy matching
    function searchProducts(query) {
        if (!query || query.length < 2) return [];
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        const results = [];
        
        productDatabase.forEach(product => {
            let score = 0;
            const searchableText = `${product.name} ${product.category} ${product.specs} ${product.description}`.toLowerCase();
            
            searchTerms.forEach(term => {
                // Exact name match (highest score)
                if (product.name.toLowerCase().includes(term)) score += 10;
                
                // Category match
                if (product.category.toLowerCase().includes(term)) score += 8;
                
                // Specs match
                if (product.specs.toLowerCase().includes(term)) score += 6;
                
                // Description match
                if (product.description.toLowerCase().includes(term)) score += 4;
                
                // Price range matching
                if (term.includes('$') || term.includes('k') || term.includes('thousand')) {
                    const priceMatch = extractPriceFromQuery(term);
                    if (priceMatch && isInPriceRange(product.price, priceMatch)) score += 5;
                }
                
                // Type matching
                if ((term === 'bike' || term === 'motorcycle') && product.type === 'motorcycle') score += 7;
                if ((term === 'gear' || term === 'apparel' || term === 'clothing') && product.type === 'gear') score += 7;
            });
            
            if (score > 0) {
                results.push({ ...product, score });
            }
        });
        
        return results.sort((a, b) => b.score - a.score).slice(0, 8); // Top 8 results
    }

    // Helper function to extract price from search query
    function extractPriceFromQuery(term) {
        if (term.includes('under') || term.includes('<')) return { max: parseInt(term.replace(/\D/g, '')) };
        if (term.includes('over') || term.includes('>')) return { min: parseInt(term.replace(/\D/g, '')) };
        return null;
    }

    // Helper function to check if price is in range
    function isInPriceRange(price, range) {
        if (range.min && price < range.min) return false;
        if (range.max && price > range.max) return false;
        return true;
    }

    // Search input handler with debouncing
    const searchInput = document.getElementById('product-search');
    let searchTimeout;
    
    if (searchInput) {
        // Create search results dropdown
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchResults.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #222;
            border: 1px solid #666;
            border-top: none;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        // Position search results relative to input
        const searchContainer = document.createElement('div');
        searchContainer.style.position = 'relative';
        searchContainer.style.display = 'inline-block';
        searchInput.parentNode.insertBefore(searchContainer, searchInput);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchResults);
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                const results = searchProducts(query);
                displaySearchResults(results, searchResults, query);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
        
        // Handle Enter key for search
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    performFullSearch(query);
                }
            }
        });
    }

    // Display search results in dropdown
    function displaySearchResults(results, container, query) {
        if (results.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; color: #ccc; text-align: center;">
                    No products found for "${query}"
                </div>
            `;
        } else {
            container.innerHTML = results.map(product => `
                <div class="search-result-item" style="
                    padding: 10px 15px;
                    border-bottom: 1px solid #333;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='transparent'" onclick="window.location.href='${product.page}'">
                    <div>
                        <div style="color: white; font-weight: bold; margin-bottom: 2px;">${highlightMatch(product.name, query)}</div>
                        <div style="color: #ccc; font-size: 12px;">${product.category} • ${product.type}</div>
                    </div>
                    <div style="color: #8B0000; font-weight: bold;">$${product.price.toLocaleString()}</div>
                </div>
            `).join('');
            
            // Add "View All Results" option if there are many results
            if (results.length >= 6) {
                container.innerHTML += `
                    <div class="search-result-item" style="
                        padding: 10px 15px;
                        cursor: pointer;
                        text-align: center;
                        color: #8B0000;
                        font-weight: bold;
                        background: #1a1a1a;
                    " onclick="performFullSearch('${query}')">
                        View All Results for "${query}" →
                    </div>
                `;
            }
        }
        
        container.style.display = 'block';
    }

    // Highlight matching text in search results
    function highlightMatch(text, query) {
        const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
        return text.replace(regex, '<span style="background: #8B0000; color: white; padding: 0 2px;">$1</span>');
    }

    // Perform full search and redirect to results page
    function performFullSearch(query) {
        // Store search query and redirect to main page with search
        sessionStorage.setItem('searchQuery', query);
        if (window.location.pathname !== '/main.html' && !window.location.pathname.endsWith('main.html')) {
            window.location.href = '/main.html#search';
        } else {
            filterProductsBySearch(query);
        }
    }

    // Filter products on page by search query
    function filterProductsBySearch(query) {
        const results = searchProducts(query);
        const productGrid = document.querySelector('.product-grid');
        
        if (productGrid) {
            const productCards = productGrid.querySelectorAll('.product-card');
            const resultsIds = results.map(r => r.id);
            
            productCards.forEach(card => {
                const productId = card.querySelector('.add-to-cart')?.getAttribute('data-product-id');
                if (resultsIds.includes(productId)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show search status
            showSearchStatus(query, results.length);
        }
    }

    // Show search status message
    function showSearchStatus(query, resultCount) {
        let statusElement = document.querySelector('.search-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'search-status';
            statusElement.style.cssText = `
                text-align: center;
                margin: 20px 0;
                padding: 10px;
                background: #1a1a1a;
                border: 1px solid #333;
                color: #ccc;
            `;
            const productsSection = document.querySelector('.products');
            if (productsSection) {
                productsSection.insertBefore(statusElement, productsSection.querySelector('.product-grid'));
            }
        }
        
        statusElement.innerHTML = `
            <span>Showing ${resultCount} result${resultCount !== 1 ? 's' : ''} for "${query}"</span>
            <button onclick="clearSearch()" style="
                margin-left: 10px;
                background: #8B0000;
                color: white;
                border: none;
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 3px;
            ">Clear Search</button>
        `;
    }

    // Clear search function
    window.clearSearch = function() {
        const searchInput = document.getElementById('product-search');
        if (searchInput) searchInput.value = '';
        
        const statusElement = document.querySelector('.search-status');
        if (statusElement) statusElement.remove();
        
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => card.style.display = 'block');
        
        sessionStorage.removeItem('searchQuery');
    };

    // Check for stored search query on page load
    window.addEventListener('load', function() {
        const storedQuery = sessionStorage.getItem('searchQuery');
        if (storedQuery && window.location.hash === '#search') {
            const searchInput = document.getElementById('product-search');
            if (searchInput) {
                searchInput.value = storedQuery;
                filterProductsBySearch(storedQuery);
            }
            sessionStorage.removeItem('searchQuery');
        }
    });

    // Newsletter signup with EmailJS integration
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;

            // Check if EmailJS is available and configured
            if (typeof emailjs !== 'undefined' && window.EMAILJS_PUBLIC_KEY && window.EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
                const params = {
                    email: email,
                    timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
                    source: 'Newsletter Signup',
                    page_url: window.location.href
                };
                
                emailjs.send(
                    'fear_city_service',
                    'template_newsletter', // You'll need to create this template
                    params
                ).then(
                    function(response) {
                        showToast('Welcome to the Fear City family! Check your email for confirmation.');
                        // Track newsletter signup
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'newsletter_signup', {
                                'event_category': 'Engagement',
                                'event_label': 'Footer Newsletter',
                                'value': 1
                            });
                        }
                    },
                    function(error) {
                        console.error('Newsletter signup error:', error);
                        showToast('Failed to subscribe. Please try again or email us directly.');
                    }
                );
                this.reset();
            } else {
                // Demo mode fallback
                setTimeout(() => {
                    showToast('Thank you for joining the Fear City family!');
                    this.reset();
                }, 1000);
            }
        });
    }

    // Product image galleries
    document.querySelectorAll('.product-gallery').forEach(gallery => {
        const mainImage = gallery.querySelector('.main-image');
        const thumbnails = gallery.querySelectorAll('.thumbnail');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                mainImage.src = this.src.replace('-thumb', '');
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    });

    // Quantity selectors
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        const minusBtn = selector.querySelector('.quantity-minus');
        const plusBtn = selector.querySelector('.quantity-plus');
        const input = selector.querySelector('.quantity-input');

        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            if (currentValue > 1) {
                input.value = currentValue - 1;
                input.dispatchEvent(new Event('change'));
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            input.value = currentValue + 1;
            input.dispatchEvent(new Event('change'));
        });
    });

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = hero.querySelector('.hero-content');
            if (parallax) {
                parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    // Add fade-in animation for elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for fade-in animation
    document.querySelectorAll('.product-card, .culture-text, .footer-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Contact form validation
function validateContactForm(form) {
    const email = form.querySelector('input[type="email"]').value;
    const message = form.querySelector('textarea').value;

    if (!email || !message) {
        alert('Please fill in all required fields.');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return false;
    }

    return true;
}

// Toast notification function
function showToast(message, duration = 3000) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #000;
        color: white;
        padding: 15px 25px;
        border: 2px solid #8B0000;
        border-radius: 4px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, duration);
}

// Size guide functionality
function showSizeGuide(productType) {
    const modal = document.createElement('div');
    modal.className = 'size-guide-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Size Guide - ${productType}</h3>
            <div class="size-chart">
                <!-- Size chart content would go here -->
                <p>Size guide content for ${productType}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Export cart for use in other pages
window.fearCityCart = cart;

// Load products from API
async function loadProducts() {
    try {
        // Show loading indicator
        const productsSection = document.querySelector('.products');
        if (productsSection && !document.querySelector('.loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = '<p>Loading products...</p>';
            loadingDiv.style.cssText = 'text-align: center; padding: 20px; color: #ccc;';
            productsSection.insertBefore(loadingDiv, productsSection.firstChild);
        }

        // Fetch products from API
        const products = await window.fearCityAPI.fetchProducts();
        
        // Transform API response to match existing format
        productDatabase = products.map(product => ({
            id: product.id,
            name: product.name,
            category: product.category?.slug || product.category,
            price: product.price,
            specs: product.specifications ? Object.values(product.specifications).join(' ') : '',
            description: product.description,
            type: product.category?.name === 'Motorcycles' ? 'motorcycle' : 'gear',
            page: product.category?.name === 'Motorcycles' 
                ? `bikes/${product.slug}.html` 
                : 'gear/index.html',
            image: product.image || product.images?.[0] || '/assets/images/placeholder.svg'
        }));

        // Remove loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Update product display if on main page
        updateProductDisplay();

        // Re-initialize search with loaded products
        initializeSearchWithProducts();

        console.log(`Loaded ${productDatabase.length} products from API`);

    } catch (error) {
        console.error('Error loading products:', error);
        
        // Remove loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Show error message
        showToast('Unable to load products. Please refresh the page.', 'error', 5000);
        
        // Optionally fall back to hardcoded data for demo purposes
        // productDatabase = getFallbackProducts();
    }
}

// Update product display on the page
function updateProductDisplay() {
    const productGrids = document.querySelectorAll('.product-grid');
    
    productGrids.forEach(grid => {
        // Skip if grid already has products (static HTML)
        if (grid.children.length > 0 && !grid.dataset.dynamic) {
            return;
        }

        // Mark as dynamic to prevent re-rendering
        grid.dataset.dynamic = 'true';

        // Clear existing content
        grid.innerHTML = '';

        // Filter products based on page context
        const isGearPage = window.location.pathname.includes('/gear/');
        const isBikesPage = window.location.pathname.includes('/bikes/');
        
        let productsToShow = productDatabase;
        if (isGearPage) {
            productsToShow = productDatabase.filter(p => p.type === 'gear');
        } else if (isBikesPage) {
            productsToShow = productDatabase.filter(p => p.type === 'motorcycle');
        }

        // Create product cards
        productsToShow.forEach(product => {
            const productCard = createProductCard(product);
            grid.appendChild(productCard);
        });

        // Re-attach event listeners for add to cart buttons
        attachCartEventListeners();
    });
}

// Create a product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">$${product.price.toLocaleString()}</p>
        <div class="product-actions">
            <a href="${product.page}" class="btn-secondary">View Details</a>
            <button class="btn-primary add-to-cart" 
                    data-product-id="${product.id}" 
                    data-price="${product.price}">
                Add to Cart
            </button>
        </div>
    `;
    
    return card;
}

// Re-attach cart event listeners after dynamic content load
function attachCartEventListeners() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.replaceWith(button.cloneNode(true));
    });

    // Re-attach listeners
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();

            // Disable button to prevent double-clicks
            const originalText = this.textContent;
            this.disabled = true;
            this.textContent = 'Adding...';

            try {
                const productCard = this.closest('.product-card');
                const product = {
                    id: this.dataset.productId,
                    name: this.dataset.name || productCard.querySelector('h3')?.textContent || 'Unknown Product',
                    price: parseFloat(this.dataset.price),
                    image: this.dataset.image || productCard.querySelector('img')?.src || '',
                    size: this.dataset.size || 'Standard'
                };

                await cart.addItem(product);
            } catch (error) {
                console.error('Error adding item to cart:', error);
                // Show error notification
                if (window.fearCityCart) {
                    window.fearCityCart.showEnhancedNotification('Failed to add item to cart', 'error');
                }
            } finally {
                // Re-enable button
                this.disabled = false;
                this.textContent = originalText;
            }
        });
    });
}

// Global function to initialize add-to-cart buttons for dynamically loaded content
function initializeAddToCartButtons() {
    attachCartEventListeners();
}

// Make it globally available for bike.js and gear.js
window.initializeAddToCartButtons = initializeAddToCartButtons;

// Initialize search with loaded products
function initializeSearchWithProducts() {
    // Re-initialize search functionality if search input exists
    const searchInput = document.getElementById('product-search');
    if (searchInput && productDatabase.length > 0) {
        // Search functionality is already set up, just needs products loaded
        console.log('Search initialized with', productDatabase.length, 'products');
    }
}

// Load products when API is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if API is available
    if (typeof window.fearCityAPI !== 'undefined') {
        // Load products immediately
        loadProducts();
    } else {
        // Wait for API script to load
        const checkAPI = setInterval(() => {
            if (typeof window.fearCityAPI !== 'undefined') {
                clearInterval(checkAPI);
                loadProducts();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkAPI);
            console.warn('API not available, using static content');
        }, 5000);
    }
});