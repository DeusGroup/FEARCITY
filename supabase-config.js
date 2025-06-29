// Supabase Configuration for Fear City Cycles
// Client-side Supabase initialization

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get configuration from public-config.js or fallback values
const supabaseConfig = isBrowser && window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG : {
    url: 'https://qmjauzmtznndsysnaxzo.supabase.co',
    anonKey: 'REMOVED_OLD_ANON_KEY'
};

// Initialize Supabase client (will be loaded when supabase-js is available)
let supabaseClient = null;

// Initialize Supabase when the library is loaded
function initializeSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
        console.log('✅ Supabase initialized for Fear City Cycles');
        return supabaseClient;
    } else {
        console.warn('⚠️ Supabase library not loaded yet');
        return null;
    }
}

// Get Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = initializeSupabase();
    }
    return supabaseClient;
}

// Database table helpers for Fear City Cycles
const FearCityDB = {
    // User management
    async createUser(userData) {
        const client = getSupabaseClient();
        if (!client) return null;
        
        const { data, error } = await client
            .from('users')
            .insert([userData])
            .select();
        
        if (error) {
            console.error('Error creating user:', error);
            return null;
        }
        return data[0];
    },

    // Product management
    async getProducts(category = null) {
        const client = getSupabaseClient();
        if (!client) return [];
        
        let query = client.from('products').select('*');
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data || [];
    },

    // Order management
    async createOrder(orderData) {
        const client = getSupabaseClient();
        if (!client) return null;
        
        const { data, error } = await client
            .from('orders')
            .insert([orderData])
            .select();
        
        if (error) {
            console.error('Error creating order:', error);
            return null;
        }
        return data[0];
    },

    // Newsletter signup
    async addToNewsletter(email) {
        const client = getSupabaseClient();
        if (!client) return null;
        
        const { data, error } = await client
            .from('newsletter_subscribers')
            .insert([{ email, subscribed_at: new Date().toISOString() }])
            .select();
        
        if (error) {
            console.error('Error adding to newsletter:', error);
            return null;
        }
        return data[0];
    }
};

// Export for global use
if (isBrowser) {
    window.FearCityDB = FearCityDB;
    window.getSupabaseClient = getSupabaseClient;
    window.supabaseConfig = supabaseConfig;
    
    // Auto-initialize on DOM load
    document.addEventListener('DOMContentLoaded', initializeSupabase);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FearCityDB, getSupabaseClient, supabaseConfig, initializeSupabase };
}