// Service Worker for ProteinScan PWA
const CACHE_NAME = 'protein-scan-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  // Add your CSS and JS files here when bundled
];

// API endpoints that can work offline with cached data
const apiEndpoints = [
  'https://world.openfoodfacts.org/api/v0/product/',
  'https://world.openfoodfacts.org/cgi/search.pl'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  // Cache core files immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Handle API requests with network-first strategy
  if (isApiRequest(requestUrl.href)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(handleOtherRequests(event.request));
});

// Check if request is to a cached API endpoint
function isApiRequest(url) {
  return apiEndpoints.some(endpoint => url.startsWith(endpoint));
}

// Handle API requests with network-first, cache-fallback strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response if no cache available
    return new Response(JSON.stringify({
      error: 'Network unavailable and no cached data',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    // Network error, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline error
    return new Response(JSON.stringify({
      error: 'Offline: No cached data available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // If offline, return cached version or offline page
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return cache.match(OFFLINE_URL);
  }
}

// Handle other requests with cache-first strategy
async function handleOtherRequests(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a basic offline response for failed requests
    if (request.destination === 'image') {
 	 return await cache.match('/icon-192.png');
	}
    return await cache.match(OFFLINE_URL);
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-scan-history') {
    event.waitUntil(syncScanHistory());
  }
});

// Sync scan history when back online
async function syncScanHistory() {
  try {
    // Get pending scan history from IndexedDB
    const pendingScans = await getPendingScanHistory();
    
    for (const scan of pendingScans) {
      try {
        // Re-fetch fresh data for each scan
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${scan.barcode}.json`);
        if (response.ok) {
          const data = await response.json();
          // Update local storage with fresh data
          await updateScanHistory(scan.id, data);
        }
      } catch (error) {
        console.log('Failed to sync scan:', scan.barcode);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingScanHistory() {
  // Implement IndexedDB read operation
  return [];
}

async function updateScanHistory(id, data) {
  // Implement IndexedDB update operation
  console.log('Updated scan history:', id);
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New nutrition information available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ProteinScan', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
