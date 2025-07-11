// --- sw.js ---

// La version du cache DOIT être incrémentée pour déclencher la mise à jour du Service Worker.
const CACHE_NAME = 'maintenance-app-v4'; 
const urlsToCache =;

// Installation du Service Worker et mise en cache des ressources
self.addEventListener('install', (event) => {
  console.log(' Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
     .then((cache) => {
        console.log(' Mise en cache de l\'application shell');
        return cache.addAll(urlsToCache);
      })
     .catch((error) => {
        console.error(' Échec de cache.addAll :', error);
      })
  );
  // Force le nouveau Service Worker à s'activer dès qu'il est installé.
  self.skipWaiting(); 
});

// Activation du Service Worker et suppression des anciens caches
self.addEventListener('activate', (event) => {
  console.log(' Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Si le nom du cache n'est pas celui que nous venons de créer, on le supprime.
          if (cacheName!== CACHE_NAME) {
            console.log(' Suppression de l'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Indique au Service Worker de prendre le contrôle de la page immédiatement.
        return self.clients.claim();
    })
  );
  console.log(' Activé.');
});

// Stratégie de mise en cache : Cache-first, puis Network-fallback
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes non-GET (ex: POST, PUT, DELETE)
  if (event.request.method!== 'GET') {
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
            // On vérifie que la réponse est valide avant de la mettre en cache.
            // On ne met en cache que les ressources provenant de notre propre origine pour éviter
            // de mettre en cache des réponses opaques de CDN qui peuvent remplir le cache inutilement.
            if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
      })
     .catch((error) => {
        console.error(' Échec du fetch :', error);
        // Ici, on pourrait retourner une page hors-ligne générique si nécessaire.
        // return caches.match('/offline.html');
      })
  );
});
