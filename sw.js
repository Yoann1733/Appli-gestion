const CACHE_NAME = 'maintenance-app-v3'; // Incrémentez le numéro de version !
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-48.png',
  './icon-72.png',
  './icon-96.png',
  './icon-144.png',
  './icon-168.png',
  './icon-192.png',
  './icon-512.png',
  './icon-32.png', // Assurez-vous d'avoir ces fichiers d'icônes
  './icon-16.png', // Assurez-vous d'avoir ces fichiers d'icônes
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com'
];

// Installation du Service Worker et mise en cache des ressources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker et suppression des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
  console.log('[Service Worker] Activated.');
});

// Stratégie de mise en cache : Cache-first, puis Network-fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Vous pouvez ajouter une page hors ligne ici si vous voulez
        // return caches.match('/offline.html');
      })
  );
});
