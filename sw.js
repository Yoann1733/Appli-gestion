const CACHE_NAME = 'maintenance-app-v2'; // Incrémentez le numéro de version à chaque modification du Service Worker ou des fichiers à cacher
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js', // Le Service Worker lui-même
  './icon-192.png', // Assurez-vous que ces icônes existent
  './icon-512.png',
  './icon-48.png', // Nouvelles icônes ajoutées au manifest, à créer si elles n'existent pas
  './icon-72.png',
  './icon-96.png',
  './icon-144.png',
  './icon-168.png',
  'https://unpkg.com/react@18/umd/react.production.min.js', // CDN React
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', // CDN React DOM
  'https://unpkg.com/@babel/standalone/babel.min.js', // CDN Babel
  'https://cdn.tailwindcss.com' // CDN Tailwind CSS
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
  self.skipWaiting(); // Force l'activation immédiate du nouveau SW
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
  event.waitUntil(self.clients.claim()); // Prend le contrôle des pages non contrôlées
  console.log('[Service Worker] Activated.');
});

// Stratégie de mise en cache : Cache-first, puis Network-fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si la ressource est dans le cache, la renvoyer
        if (response) {
          return response;
        }
        // Sinon, la récupérer depuis le réseau
        return fetch(event.request).then((networkResponse) => {
          // Et si la requête réseau est réussie, la mettre en cache pour une utilisation future
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
