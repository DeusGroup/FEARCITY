-- Fear City Cycles Database Schema
-- Supabase PostgreSQL Schema for E-commerce Site

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for customer accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    gallery_images TEXT[], -- Array of image URLs
    specifications JSONB, -- JSON for product specs
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (for sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Size", "Color"
    value VARCHAR(100) NOT NULL, -- e.g., "Large", "Black"
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Shipping info
    shipping_name VARCHAR(255),
    shipping_email VARCHAR(255),
    shipping_phone VARCHAR(20),
    shipping_address_line1 TEXT,
    shipping_address_line2 TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(50),
    shipping_zip VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'USA',
    
    -- Billing info
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'USA',
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(255), -- Store name at time of order
    product_sku VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping cart (for logged-in users)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, product_variant_id)
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Motorcycles', 'motorcycles', 'Custom motorcycles built for the streets of NYC'),
('Gear & Apparel', 'gear', 'Riding gear and Fear City branded apparel'),
('Parts & Accessories', 'parts', 'Motorcycle parts and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products (matching current website)
INSERT INTO products (name, slug, description, short_description, category_id, price, sku, image_url, is_featured, specifications) VALUES
(
    'Street Reaper',
    'street-reaper',
    'Born from the concrete jungle, the Street Reaper is a machine that commands respect. Built for those who navigate the urban battlefield with style and attitude.',
    'Urban warfare machine built for NYC streets',
    (SELECT id FROM categories WHERE slug = 'motorcycles'),
    24999.00,
    'BIKE-SR-001',
    'assets/images/bike-street-reaper.jpg',
    true,
    '{"engine": "1200cc V-Twin", "power": "85 HP", "weight": "450 lbs", "fuel_capacity": "3.5 gallons"}'
),
(
    'Borough Bruiser',
    'borough-bruiser',
    'This beast owns every borough. From Queens to Manhattan, the Borough Bruiser cuts through traffic like a knife through butter.',
    'Multi-borough domination machine',
    (SELECT id FROM categories WHERE slug = 'motorcycles'),
    22999.00,
    'BIKE-BB-001',
    'assets/images/bike-borough-bruiser.jpg',
    true,
    '{"engine": "1000cc Parallel Twin", "power": "75 HP", "weight": "420 lbs", "fuel_capacity": "4.0 gallons"}'
),
(
    'Fear Fighter',
    'fear-fighter',
    'When the city tries to break you, fight back with the Fear Fighter. This machine is built for those who refuse to be intimidated.',
    'Anti-intimidation urban warrior',
    (SELECT id FROM categories WHERE slug = 'motorcycles'),
    26999.00,
    'BIKE-FF-001',
    'assets/images/bike-fear-fighter.jpg',
    true,
    '{"engine": "1300cc V-Twin", "power": "95 HP", "weight": "480 lbs", "fuel_capacity": "3.8 gallons"}'
),
(
    'Fear City Leather Jacket',
    'fear-city-jacket',
    'Premium leather jacket with Fear City branding. Built to protect and intimidate.',
    'Premium leather protection with attitude',
    (SELECT id FROM categories WHERE slug = 'gear'),
    299.00,
    'GEAR-JACKET-001',
    'assets/images/jacket-fear-city.jpg',
    true,
    '{"material": "Premium Cowhide", "armor": "CE Rated", "sizes": ["S", "M", "L", "XL", "XXL"]}'
),
(
    'Queens Skull Tee',
    'queens-skull-tee',
    'Rep your borough with pride. Queens, NYC - Ride or Die.',
    'Queens pride with skull design',
    (SELECT id FROM categories WHERE slug = 'gear'),
    34.99,
    'GEAR-TEE-001',
    'assets/images/tee-queens-skull.jpg',
    false,
    '{"material": "100% Cotton", "fit": "Regular", "sizes": ["S", "M", "L", "XL", "XXL"]}'
)
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Orders - users can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Cart items - users can only manage their own cart
CREATE POLICY "Users can manage their own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Products and categories are publicly readable
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Categories are publicly readable" ON categories
    FOR SELECT USING (is_active = true);

-- Newsletter subscriptions are publicly insertable
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Contact form submissions are publicly insertable
CREATE POLICY "Anyone can submit contact forms" ON contact_submissions
    FOR INSERT WITH CHECK (true);