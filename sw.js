// sw.js

// IMPORTANT : Le nom du cache est changé pour forcer une mise à jour propre.
const CACHE_NAME = 'upkeep-cache-v10'; 

// --- MODIFIÉ : Les chemins sont maintenant corrects pour votre site ---
const urlsToCache = [
    '/Appli-gestion/',
    '/Appli-gestion/index.html',
    '/Appli-gestion/manifest.json',
    '/Appli-gestion/icon-192.png',
    '/Appli-gestion/icon-512.png',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
    console.log('SW: Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
              console.log('SW: Mise en cache de l\'application shell et des dépendances');
              return cache.addAll(urlsToCache);
          })
          .catch((error) => {
              console.error('SW: Échec de la mise en cache. Vérifiez les chemins dans urlsToCache.', error);
          })
    );
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activation...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Suppression de l'ancien cache :', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Clients claimed');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
          .then((response) => {
              if (response) {
                  return response;
              }
              
              return fetch(event.request).then((networkResponse) => {
                  if (networkResponse && networkResponse.status === 200) {
                      const responseToCache = networkResponse.clone();
                      caches.open(CACHE_NAME).then((cache) => {
                          cache.put(event.request, responseToCache);
                      });
                  }
                  return networkResponse;
              });
          })
          .catch((error) => {
              console.error('SW: Échec du fetch :', error);
          })
    );
});
