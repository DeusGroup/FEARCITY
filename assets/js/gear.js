// gear.js - Dynamic gear loading from API
(function() {
    'use strict';

    let allGear = [];
    let currentFilter = 'all';

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        loadGearFromAPI();
        setupFilterButtons();
        setupSearch();
    });

    // Load gear from API
    async function loadGearFromAPI() {
        const productGrid = document.querySelector('.product-grid');
        
        // Show loading state
        productGrid.innerHTML = `
            <div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner"></div>
                <p style="margin-top: 20px; color: #999;">Loading our gear collection...</p>
            </div>
        `;

        try {
            // Import the API service
            const apiModule = await import('./api.js');
            const fearCityAPI = new apiModule.FearCityAPI();
            
            // Fetch gear from the gear category
            const response = await fearCityAPI.fetchProducts({
                category: 'gear',
                limit: 20
            });
            
            if (response.success && response.data.products) {
                allGear = response.data.products;
                displayGear(allGear);
            } else {
                throw new Error('Failed to load gear');
            }
        } catch (error) {
            console.error('Error loading gear:', error);
            productGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <p style="color: #dc2626; margin-bottom: 20px;">Failed to load gear. Please try again later.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }

    // Display gear in the grid
    function displayGear(gear) {
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';

        if (gear.length === 0) {
            productGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <p style="color: #999;">No gear found matching your criteria.</p>
                </div>
            `;
            return;
        }

        gear.forEach(item => {
            const card = createGearCard(item);
            productGrid.appendChild(card);
        });

        // Re-initialize cart functionality for new buttons
        if (window.initializeAddToCartButtons) {
            window.initializeAddToCartButtons();
        }
    }

    // Create a gear card element
    function createGearCard(item) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = getGearCategory(item);

        // Extract price from string or use numeric value
        const price = typeof item.price === 'string' ? 
            parseFloat(item.price.replace(/[^0-9.]/g, '')) : 
            item.price;

        // Format price for display
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);

        // Build specifications string
        const specs = [];
        if (item.specifications) {
            const specData = typeof item.specifications === 'string' ? 
                JSON.parse(item.specifications) : item.specifications;
            
            if (specData.material) specs.push(specData.material);
            if (specData.protection) specs.push(specData.protection);
            if (specData.features) specs.push(specData.features);
        }
        const specsString = specs.join(', ') || item.shortDescription || '';

        // Determine if size options are needed
        const needsSizeSelector = isApparel(item);

        card.innerHTML = `
            <img src="${item.images?.[0] || '/assets/images/placeholder-gear.jpg'}" 
                 alt="${item.name}"
                 loading="lazy">
            <h3>${item.name.toUpperCase()}</h3>
            <p class="gear-specs">${specsString}</p>
            <p class="price">${formattedPrice}</p>
            ${needsSizeSelector ? createSizeSelector() : ''}
            <div class="card-actions">
                ${needsSizeSelector ? 
                    '<button class="btn btn-outline" onclick="showSizeGuide(\'' + item.name + '\')">SIZE GUIDE</button>' : 
                    '<a href="' + item.slug + '.html" class="btn btn-outline">VIEW DETAILS</a>'
                }
                <button class="btn btn-primary add-to-cart" 
                        data-product-id="${item.id}" 
                        data-price="${price}"
                        data-name="${item.name}"
                        data-image="${item.images?.[0] || ''}">
                    ADD TO CART
                </button>
            </div>
        `;

        return card;
    }

    // Check if item needs size selector (apparel items)
    function isApparel(item) {
        const name = item.name.toLowerCase();
        const category = getGearCategory(item);
        
        return category === 'jackets' || 
               category === 'apparel' || 
               name.includes('jacket') || 
               name.includes('tee') || 
               name.includes('shirt') || 
               name.includes('vest');
    }

    // Create size selector HTML
    function createSizeSelector() {
        return `
            <div class="size-options">
                <select class="size-selector">
                    <option value="">Select Size</option>
                    <option value="S">Small</option>
                    <option value="M">Medium</option>
                    <option value="L">Large</option>
                    <option value="XL">X-Large</option>
                    <option value="XXL">XX-Large</option>
                </select>
            </div>
        `;
    }

    // Determine gear category based on specifications or name
    function getGearCategory(item) {
        const name = item.name.toLowerCase();
        const description = (item.description || '').toLowerCase();
        const specs = JSON.stringify(item.specifications || {}).toLowerCase();
        
        if (name.includes('jacket') || specs.includes('jacket')) {
            return 'jackets';
        } else if (name.includes('helmet') || name.includes('glove') || name.includes('armor') || 
                   specs.includes('protective') || specs.includes('protection')) {
            return 'protective';
        } else if (name.includes('tee') || name.includes('shirt') || name.includes('hoodie') || 
                   name.includes('vest')) {
            return 'apparel';
        } else if (name.includes('patch') || name.includes('keychain') || name.includes('accessory')) {
            return 'accessories';
        }
        
        return 'accessories'; // Default category
    }

    // Setup filter buttons
    function setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Apply filter
                currentFilter = this.dataset.filter;
                applyFilter();
            });
        });
    }

    // Apply current filter
    function applyFilter() {
        let filteredGear = allGear;
        
        if (currentFilter !== 'all') {
            filteredGear = allGear.filter(item => 
                getGearCategory(item) === currentFilter
            );
        }
        
        displayGear(filteredGear);
    }

    // Setup search functionality
    function setupSearch() {
        const searchInput = document.getElementById('product-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                applyFilter();
                return;
            }

            const searchResults = allGear.filter(item => {
                const searchableText = `
                    ${item.name} 
                    ${item.description || ''} 
                    ${JSON.stringify(item.specifications || {})}
                `.toLowerCase();
                
                return searchableText.includes(searchTerm);
            });

            displayGear(searchResults);
        }, 300));
    }

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Global function for size guide (called from HTML)
    window.showSizeGuide = function(itemName) {
        alert(`Size guide for ${itemName} - coming soon! Please contact us for sizing assistance.`);
    };

})();