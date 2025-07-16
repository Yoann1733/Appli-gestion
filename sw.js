// sw.js

// Incrémentez la version pour forcer la mise à jour
const CACHE_NAME = 'maintenance-app-v8'; 
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    // --- AJOUT : Mise en cache des scripts externes pour un vrai mode hors-ligne ---
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
              console.error('SW: Échec de la mise en cache :', error);
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
    // On ne gère que les requêtes GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
          .then((response) => {
              // Si la ressource est dans le cache, on la retourne.
              if (response) {
                  return response;
              }
              
              // Sinon, on la récupère sur le réseau.
              return fetch(event.request).then((networkResponse) => {
                  // On ne met en cache que les réponses valides pour éviter les erreurs
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
              // Optionnel: retourner une page offline.html si le réseau et le cache échouent
              // return caches.match('/offline.html');
          })
    );
});
