// Fear City Cycles - Main Site JavaScript

// Shopping cart functionality
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('fearCityCart')) || [];
        this.updateCartDisplay();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Item added to cart');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('fearCityCart', JSON.stringify(this.items));
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #8B0000;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            font-family: Orbitron, monospace;
            font-weight: 700;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
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
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const productCard = this.closest('.product-card');
            const product = {
                id: this.dataset.productId,
                name: productCard.querySelector('h3').textContent,
                price: parseFloat(this.dataset.price),
                image: productCard.querySelector('img').src,
                size: this.dataset.size || 'Standard'
            };

            cart.addItem(product);
        });
    });

    // Search functionality - Enhanced Product Search System
    const productDatabase = [
        // Motorcycles
        { id: 'bike-001', name: 'Street Reaper', category: 'street-fighter', price: 24500, specs: '1000cc Twin Engine Raw Power Minimal Aesthetics NYC Streets Built', description: 'Stripped-down street fighter built for NYC streets. Raw power, minimal aesthetics.', type: 'motorcycle', page: 'bikes/street-reaper.html' },
        { id: 'bike-002', name: 'Borough Bruiser', category: 'street-fighter', price: 28000, specs: '1200cc Twin Aggressive Stance Chrome Accents Heavy Duty Cruiser', description: 'Heavy-duty cruiser with chrome attitude. Built to dominate the boroughs.', type: 'motorcycle', page: 'bikes/borough-bruiser.html' },
        { id: 'bike-003', name: 'Fear Fighter', category: 'street-fighter', price: 32000, specs: '1000cc Twin Track Inspired Carbon Details Performance', description: 'Track-inspired machine with carbon details and performance engineering.', type: 'motorcycle', page: 'bikes/fear-fighter.html' },
        { id: 'bike-004', name: 'Queens Crusher', category: 'bobber', price: 22000, specs: '750cc Twin Bobber Style Vintage Inspired Classic', description: 'Vintage-inspired bobber built for the streets of Queens.', type: 'motorcycle', page: 'bikes/queens-crusher.html' },
        { id: 'bike-005', name: 'Death Rider', category: 'chopper', price: 26500, specs: '1100cc Twin Extended Fork Classic Chopper Style', description: 'Classic chopper with extended fork and authentic style.', type: 'motorcycle', page: 'bikes/death-rider.html' },
        { id: 'bike-006', name: 'Midnight Racer', category: 'cafe-racer', price: 25500, specs: '900cc Twin Café Racer Performance Tuned Racing', description: 'Performance-tuned café racer for midnight runs.', type: 'motorcycle', page: 'bikes/midnight-racer.html' },
        
        // Gear & Apparel
        { id: 'gear-001', name: 'Fear City Jacket', category: 'jackets', price: 175, specs: 'Leather Armor Plated Street Protection', description: 'Leather jacket with armor plating for street protection.', type: 'gear', page: 'gear/index.html' },
        { id: 'gear-002', name: 'Queens Skull Tee', category: 'apparel', price: 35, specs: 'Cotton Queens NYC Design Skull Graphics', description: 'Premium cotton tee with Queens skull design.', type: 'gear', page: 'gear/index.html' },
        { id: 'gear-003', name: 'Reaper Riding Gloves', category: 'gloves', price: 65, specs: 'Leather Reinforced Grip Protection', description: 'Reinforced leather gloves for maximum grip and protection.', type: 'gear', page: 'gear/index.html' },
        { id: 'gear-004', name: 'Fear City Patch', category: 'accessories', price: 15, specs: 'Embroidered Iron On NYC Pride', description: 'Embroidered Fear City patch - show your NYC pride.', type: 'gear', page: 'gear/index.html' },
        { id: 'gear-005', name: 'Prospect Vest', category: 'vests', price: 85, specs: 'Heavy Denim Reinforced Cut Ready', description: 'Heavy denim vest, reinforced and cut-ready.', type: 'gear', page: 'gear/index.html' },
        { id: 'gear-006', name: 'Skull Keychain', category: 'accessories', price: 25, specs: 'Pewter Cast Heavy Duty Ring 2 inch Height', description: 'Pewter cast skull keychain with heavy-duty ring.', type: 'gear', page: 'gear/index.html' }
    ];

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