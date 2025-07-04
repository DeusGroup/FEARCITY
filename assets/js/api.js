// Fear City Cycles API Integration Layer
// Handles all communication with the backend API

class FearCityAPI {
    constructor() {
        // Determine API base URL based on environment
        this.baseURL = this.getBaseURL();
        this.token = this.getStoredToken();
    }

    // Get the appropriate base URL for the current environment
    getBaseURL() {
        const hostname = window.location.hostname;
        
        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        
        // Temporarily use mock mode for production until API is fully working
        return 'MOCK_MODE';
    }

    // Get stored authentication token
    getStoredToken() {
        return localStorage.getItem('fearCityToken') || sessionStorage.getItem('fearCityToken');
    }

    // Store authentication token
    setToken(token, remember = false) {
        if (remember) {
            localStorage.setItem('fearCityToken', token);
        } else {
            sessionStorage.setItem('fearCityToken', token);
        }
        this.token = token;
    }

    // Clear authentication token
    clearToken() {
        localStorage.removeItem('fearCityToken');
        sessionStorage.removeItem('fearCityToken');
        this.token = null;
    }

    // Base request method with error handling
    async request(endpoint, options = {}) {
        // Mock mode for development/testing
        if (this.baseURL === 'MOCK_MODE') {
            return this.mockRequest(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authentication token if available
        if (this.token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle different response statuses
            if (!response.ok) {
                const error = await this.handleErrorResponse(response);
                throw error;
            }

            // Parse and return JSON response
            const data = await response.json();
            
            // API returns { success: true/false, data: {...}, error: "..." }
            if (data.success === false) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data || data;

        } catch (error) {
            // Network errors or other fetch failures
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Please check your connection.');
            }
            throw error;
        }
    }

    // Mock API responses for testing
    async mockRequest(endpoint, options = {}) {
        console.log('MOCK API:', endpoint, options.method || 'GET');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (endpoint === '/api/products') {
            return {
                products: [
                    // Bikes
                    {
                        id: 'street-reaper',
                        slug: 'street-reaper',
                        name: 'Street Reaper',
                        price: 24500,
                        images: ['/assets/images/bike-street-reaper.jpg'],
                        description: 'Pure aggression on two wheels. Built for riders who know the streets.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    {
                        id: 'queens-crusher',
                        slug: 'queens-crusher',
                        name: 'Queens Crusher',
                        price: 26750,
                        images: ['/assets/images/bike-queens-crusher.jpg'],
                        description: 'Born in Queens, built for battle. This machine dominates city streets.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    {
                        id: 'death-rider',
                        slug: 'death-rider',
                        name: 'Death Rider',
                        price: 29500,
                        images: ['/assets/images/bike-death-rider.jpg'],
                        description: 'When subtlety is not an option. Raw power and intimidation.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    {
                        id: 'midnight-racer',
                        slug: 'midnight-racer',
                        name: 'Midnight Racer',
                        price: 31200,
                        images: ['/assets/images/bike-midnight-racer.jpg'],
                        description: 'Built for the night. Speed demons only.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    {
                        id: 'borough-bruiser',
                        slug: 'borough-bruiser',
                        name: 'Borough Bruiser',
                        price: 28900,
                        images: ['/assets/images/bike-borough-bruiser.jpg'],
                        description: 'Heavy metal justice on two wheels.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    {
                        id: 'fear-fighter',
                        slug: 'fear-fighter',
                        name: 'Fear Fighter',
                        price: 27400,
                        images: ['/assets/images/bike-fear-fighter.jpg'],
                        description: 'Engineered to conquer fear and concrete.',
                        category: { name: 'Motorcycles', slug: 'motorcycles' }
                    },
                    // Gear
                    {
                        id: 'reaper-gloves',
                        slug: 'reaper-riding-gloves',
                        name: 'Reaper Riding Gloves',
                        price: 89,
                        images: ['/assets/images/gloves-reaper-riding.jpg'],
                        description: 'Professional-grade riding gloves with superior grip.',
                        category: { name: 'Gear', slug: 'gear' }
                    },
                    {
                        id: 'fear-city-jacket',
                        slug: 'fear-city-jacket',
                        name: 'Fear City Leather Jacket',
                        price: 395,
                        images: ['/assets/images/jacket-fear-city.jpg'],
                        description: 'Premium leather jacket with authentic Fear City branding.',
                        category: { name: 'Gear', slug: 'gear' }
                    },
                    {
                        id: 'queens-skull-tee',
                        slug: 'queens-skull-tee',
                        name: 'Queens Skull Tee',
                        price: 35,
                        images: ['/assets/images/tee-queens-skull.jpg'],
                        description: 'Rep Queens with this hardcore skull design.',
                        category: { name: 'Gear', slug: 'gear' }
                    },
                    {
                        id: 'prospect-vest',
                        slug: 'prospect-vest',
                        name: 'Prospect Vest',
                        price: 125,
                        images: ['/assets/images/vest-prospect.jpg'],
                        description: 'Classic cut vest for the streets.',
                        category: { name: 'Gear', slug: 'gear' }
                    },
                    {
                        id: 'skull-keychain',
                        slug: 'skull-keychain',
                        name: 'Skull Keychain',
                        price: 15,
                        images: ['/assets/images/keychain-skull.jpg'],
                        description: 'Solid metal skull keychain.',
                        category: { name: 'Gear', slug: 'gear' }
                    },
                    {
                        id: 'fear-city-patch',
                        slug: 'fear-city-patch',
                        name: 'Fear City Patch',
                        price: 12,
                        images: ['/assets/images/patch-fear-city.jpg'],
                        description: 'Iron-on patch with Fear City logo.',
                        category: { name: 'Gear', slug: 'gear' }
                    }
                ]
            };
        }

        if (endpoint.includes('/api/products/')) {
            const slug = endpoint.split('/').pop();
            return {
                product: {
                    id: slug,
                    slug: slug,
                    name: slug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    price: 24500,
                    images: [`/assets/images/bike-${slug}.jpg`],
                    description: 'Custom build from Fear City Cycles.',
                    category: { name: 'Motorcycles', slug: 'motorcycles' }
                }
            };
        }

        if (endpoint === '/api/contact') {
            return {
                success: true,
                message: 'Contact form submitted successfully (MOCK)'
            };
        }

        return { message: 'Mock API response' };
    }

    // Handle error responses
    async handleErrorResponse(response) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.details) {
                // Validation errors
                errorMessage = errorData.details.map(d => d.message).join(', ');
            }
        } catch (e) {
            // Response wasn't JSON
        }

        // Handle specific status codes
        switch (response.status) {
            case 401:
                this.clearToken();
                // Could redirect to login or emit an event
                errorMessage = 'Authentication required. Please login.';
                break;
            case 403:
                errorMessage = 'You do not have permission to perform this action.';
                break;
            case 404:
                errorMessage = 'The requested resource was not found.';
                break;
            case 429:
                errorMessage = 'Too many requests. Please try again later.';
                break;
            case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = response;
        return error;
    }

    // Product-related API calls
    async fetchProducts(params = {}) {
        // Build query string from parameters
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async fetchProduct(id) {
        return await this.request(`/api/products/${id}`);
    }

    async fetchProductBySlug(slug) {
        return await this.request(`/api/products/${slug}`);
    }

    async fetchRelatedProducts(id) {
        return await this.request(`/api/products/${id}/related`);
    }

    // Category-related API calls
    async fetchCategories() {
        return await this.request('/api/categories');
    }

    // Cart-related API calls
    async fetchCart() {
        return await this.request('/api/cart');
    }

    async addToCart(productId, quantity = 1, options = {}) {
        return await this.request('/api/cart', {
            method: 'POST',
            body: JSON.stringify({
                productId,
                quantity,
                variant: options.variant,
                customOptions: options.customOptions
            })
        });
    }

    async updateCartItem(itemId, quantity) {
        return await this.request(`/api/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(itemId) {
        return await this.request(`/api/cart/${itemId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return await this.request('/api/cart', {
            method: 'DELETE'
        });
    }

    // Authentication API calls
    async login(email, password, rememberMe = false) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true
        });

        if (response.token) {
            this.setToken(response.token, rememberMe);
        }

        return response;
    }

    async register(userData) {
        const response = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            skipAuth: true
        });

        if (response.token) {
            this.setToken(response.token, false);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/api/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            // Even if logout fails, clear local token
        }
        this.clearToken();
    }

    async getCurrentUser() {
        return await this.request('/api/auth/me');
    }

    // Contact form API calls
    async submitContactForm(formData) {
        return await this.request('/api/contact', {
            method: 'POST',
            body: JSON.stringify(formData),
            skipAuth: true
        });
    }

    // Newsletter API calls
    async subscribeNewsletter(email, source = 'website') {
        return await this.request('/api/newsletter', {
            method: 'POST',
            body: JSON.stringify({ email, source }),
            skipAuth: true
        });
    }

    // Order-related API calls
    async createOrder(orderData) {
        return await this.request('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async fetchOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async fetchOrder(id) {
        return await this.request(`/api/orders/${id}`);
    }

    // Payment-related API calls
    async processPayment(paymentData) {
        return await this.request('/api/payments/process', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Helper method to check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Helper method to handle API errors in UI
    getErrorMessage(error) {
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred. Please try again.';
    }
}

// Create and export singleton instance
const fearCityAPI = new FearCityAPI();

// Also export the class for testing or multiple instances
export { FearCityAPI, fearCityAPI as default };

// For non-module usage, attach to window
if (typeof window !== 'undefined') {
    window.FearCityAPI = FearCityAPI;
    window.fearCityAPI = fearCityAPI;
}