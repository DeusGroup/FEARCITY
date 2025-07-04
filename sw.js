// Fear City Cycles - Service Worker for Performance Caching

const CACHE_NAME = 'fear-city-cycles-v1.6.0';
const STATIC_CACHE = 'fear-city-static-v2';
const DYNAMIC_CACHE = 'fear-city-dynamic-v2';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/main.html',
    '/index.html',
    '/assets/css/main.css',
    '/assets/css/responsive.css',
    '/assets/css/pages.css',
    '/assets/css/gateway.css',
    '/assets/js/api.js',
    '/assets/js/gateway.js',
    '/assets/js/contact.js',
    '/assets/js/cart.js',
    '/assets/js/mobile-enhancements.js',
    '/assets/js/performance-optimizer.js',
    '/assets/images/fear-city-logo.png',
    '/assets/images/fear-city-logo-small.png',
    '/assets/images/favicon.ico'
];

// Network-first strategy URLs (dynamic content)
const NETWORK_FIRST_URLS = [
    '/contact/',
    '/cart/',
    '/api/'
];

// Cache-first strategy URLs (static assets)
const CACHE_FIRST_URLS = [
    '/assets/',
    '/bikes/',
    '/gear/'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker installation failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (!url.origin.includes(self.location.origin)) {
        return;
    }
    
    // Determine strategy based on URL
    if (shouldUseNetworkFirst(url.pathname)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (shouldUseCacheFirst(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

function shouldUseNetworkFirst(pathname) {
    return NETWORK_FIRST_URLS.some(pattern => pathname.startsWith(pattern));
}

function shouldUseCacheFirst(pathname) {
    return CACHE_FIRST_URLS.some(pattern => pathname.startsWith(pattern));
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for HTML pages
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Failed to fetch and cache:', request.url, error);
        throw error;
    }
}

// Stale-while-revalidate strategy for balanced caching
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('Network request failed:', request.url, error);
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Background sync for form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForms());
    }
});

async function syncContactForms() {
    try {
        // Get pending form submissions from IndexedDB
        const pendingForms = await getPendingFormSubmissions();
        
        for (const form of pendingForms) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(form.data)
                });
                
                if (response.ok) {
                    await removePendingFormSubmission(form.id);
                    console.log('Synced form submission:', form.id);
                }
            } catch (error) {
                console.error('Failed to sync form:', form.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New update from Fear City Cycles',
        icon: '/assets/images/fear-city-logo-small.png',
        badge: '/assets/images/favicon.ico',
        data: data.url,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/assets/images/fear-city-logo-small.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Fear City Cycles', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view' && event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

// Utility functions for IndexedDB operations (simplified)
async function getPendingFormSubmissions() {
    // In a real implementation, this would use IndexedDB
    return [];
}

async function removePendingFormSubmission(id) {
    // In a real implementation, this would remove from IndexedDB
    console.log('Removing form submission:', id);
}

// Performance monitoring
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_STATS') {
        getCacheStats().then(stats => {
            event.ports[0].postMessage(stats);
        });
    }
});

async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats[cacheName] = keys.length;
    }
    
    return {
        caches: stats,
        totalEntries: Object.values(stats).reduce((sum, count) => sum + count, 0)
    };
}