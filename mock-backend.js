// Mock Backend Server for Testing API Integration
// This simulates the backend API without needing database or dependencies

const http = require('http');

const products = [
    {
        id: 1,
        name: 'Street Reaper',
        slug: 'street-reaper',
        description: 'Stripped-down street fighter built for NYC streets. Raw power, minimal aesthetics.',
        price: 24500,
        image: '/assets/images/bike-001.svg',
        category: { id: 1, name: 'Motorcycles', slug: 'motorcycles' },
        specifications: {
            engine: '1000cc Twin',
            power: '120hp',
            weight: '420lbs',
            topSpeed: '155mph'
        },
        inventory: 5,
        featured: true
    },
    {
        id: 2,
        name: 'Borough Bruiser',
        slug: 'borough-bruiser',
        description: 'Heavy-duty cruiser with chrome attitude. Built to dominate the boroughs.',
        price: 28000,
        image: '/assets/images/bike-002.svg',
        category: { id: 1, name: 'Motorcycles', slug: 'motorcycles' },
        specifications: {
            engine: '1200cc Twin',
            power: '150hp',
            weight: '550lbs'
        },
        inventory: 3,
        featured: false
    },
    {
        id: 3,
        name: 'Fear City Jacket',
        slug: 'fear-city-jacket',
        description: 'Leather jacket with armor plating for street protection.',
        price: 175,
        image: '/assets/images/jacket-001.svg',
        category: { id: 2, name: 'Gear', slug: 'gear' },
        specifications: {
            material: 'Premium Leather',
            protection: 'CE Rated Armor'
        },
        inventory: 20,
        featured: true
    },
    {
        id: 4,
        name: 'Queens Skull Tee',
        slug: 'queens-skull-tee',
        description: 'Premium cotton tee with Queens skull design.',
        price: 35,
        image: '/assets/images/tee-001.svg',
        category: { id: 2, name: 'Gear', slug: 'gear' },
        specifications: {
            material: '100% Cotton',
            fit: 'Regular'
        },
        inventory: 50,
        featured: false
    }
];

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`${req.method} ${path}`);

    // Routes
    if (path === '/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Mock backend is running',
            timestamp: new Date().toISOString()
        }));
    } 
    else if (path === '/api/products' && req.method === 'GET') {
        // Simulate loading delay
        setTimeout(() => {
            res.statusCode = 200;
            res.end(JSON.stringify({
                success: true,
                data: products,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: products.length,
                    totalPages: 1
                }
            }));
        }, 300);
    }
    else if (path.match(/^\/api\/products\/\d+$/) && req.method === 'GET') {
        const id = parseInt(path.split('/').pop());
        const product = products.find(p => p.id === id);
        
        if (product) {
            res.statusCode = 200;
            res.end(JSON.stringify({
                success: true,
                data: product
            }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({
                success: false,
                error: 'Product not found'
            }));
        }
    }
    else if (path === '/api/cart' && req.method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify({
            success: true,
            data: {
                items: [],
                total: 0
            }
        }));
    }
    else {
        res.statusCode = 404;
        res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found'
        }));
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`
==============================================
Mock Backend Server Running
==============================================
URL: http://localhost:${PORT}
Health Check: http://localhost:${PORT}/health
Products API: http://localhost:${PORT}/api/products

This is a simplified mock server for testing.
Press Ctrl+C to stop.
==============================================
    `);
});