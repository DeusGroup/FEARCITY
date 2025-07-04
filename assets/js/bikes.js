// bikes.js - Dynamic bike loading from API
(function() {
    'use strict';

    let allBikes = [];
    let currentFilter = 'all';

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        loadBikesFromAPI();
        setupFilterButtons();
        setupSearch();
    });

    // Load bikes from API
    async function loadBikesFromAPI() {
        const productGrid = document.querySelector('.product-grid');
        
        // Show loading state
        productGrid.innerHTML = `
            <div class="loading-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner"></div>
                <p style="margin-top: 20px; color: #999;">Loading our custom builds...</p>
            </div>
        `;

        try {
            // Import the API service
            const apiModule = await import('./api.js');
            const fearCityAPI = new apiModule.FearCityAPI();
            
            // Fetch bikes from the motorcycles category
            const response = await fearCityAPI.fetchProducts({
                category: 'motorcycles',
                limit: 20
            });
            
            if (response && response.products) {
                allBikes = response.products;
                displayBikes(allBikes);
            } else {
                throw new Error('Failed to load bikes');
            }
        } catch (error) {
            console.error('Error loading bikes:', error);
            productGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <p style="color: #dc2626; margin-bottom: 20px;">Failed to load bikes. Please try again later.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }

    // Display bikes in the grid
    function displayBikes(bikes) {
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';

        if (bikes.length === 0) {
            productGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <p style="color: #999;">No bikes found matching your criteria.</p>
                </div>
            `;
            return;
        }

        bikes.forEach(bike => {
            const card = createBikeCard(bike);
            productGrid.appendChild(card);
        });

        // Re-initialize cart functionality for new buttons
        if (window.initializeAddToCartButtons) {
            window.initializeAddToCartButtons();
        }
    }

    // Create a bike card element
    function createBikeCard(bike) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = getBikeCategory(bike);

        // Extract price from string or use numeric value
        const price = typeof bike.price === 'string' ? 
            parseFloat(bike.price.replace(/[^0-9.]/g, '')) : 
            bike.price;

        // Format price for display
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);

        // Build specifications string
        const specs = [];
        if (bike.specifications) {
            const specData = typeof bike.specifications === 'string' ? 
                JSON.parse(bike.specifications) : bike.specifications;
            
            if (specData.engine) specs.push(specData.engine);
            if (specData.type) specs.push(specData.type);
            if (specData.finish) specs.push(specData.finish);
        }
        const specsString = specs.join(', ') || bike.shortDescription || '';

        card.innerHTML = `
            <img src="${bike.images?.[0] || '/assets/images/placeholder-bike.jpg'}" 
                 alt="${bike.name}"
                 loading="lazy">
            <h3>${bike.name.toUpperCase()}</h3>
            <p class="bike-specs">${specsString}</p>
            <p class="price">${formattedPrice}</p>
            <div class="card-actions">
                <a href="${bike.slug}.html" class="btn btn-outline">VIEW BUILD</a>
                <button class="btn btn-primary add-to-cart" 
                        data-product-id="${bike.id}" 
                        data-price="${price}"
                        data-name="${bike.name}"
                        data-image="${bike.images?.[0] || ''}">
                    INQUIRE
                </button>
            </div>
        `;

        return card;
    }

    // Determine bike category based on specifications or tags
    function getBikeCategory(bike) {
        const name = bike.name.toLowerCase();
        const description = (bike.description || '').toLowerCase();
        const specs = JSON.stringify(bike.specifications || {}).toLowerCase();
        
        if (name.includes('street') || specs.includes('street fighter')) {
            return 'street-fighter';
        } else if (name.includes('bobber') || specs.includes('bobber')) {
            return 'bobber';
        } else if (name.includes('chopper') || specs.includes('chopper')) {
            return 'chopper';
        } else if (name.includes('cafe') || specs.includes('café racer')) {
            return 'cafe-racer';
        }
        
        return 'custom';
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
        let filteredBikes = allBikes;
        
        if (currentFilter !== 'all') {
            filteredBikes = allBikes.filter(bike => 
                getBikeCategory(bike) === currentFilter
            );
        }
        
        displayBikes(filteredBikes);
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

            const searchResults = allBikes.filter(bike => {
                const searchableText = `
                    ${bike.name} 
                    ${bike.description || ''} 
                    ${JSON.stringify(bike.specifications || {})}
                `.toLowerCase();
                
                return searchableText.includes(searchTerm);
            });

            displayBikes(searchResults);
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

})();