// sw.js (Version Minimaliste pour Test)
const CACHE_NAME = 'upkeep-cache-v3-minimal'; // Nouveau nom pour forcer la mise à jour

self.addEventListener('install', (event) => {
  console.log('SW (Minimal): Installation...');
  // On ne fait RIEN de risqué ici, juste s'activer.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('SW (Minimal): Activation...');
  // On prend le contrôle de la page immédiatement.
  event.waitUntil(
    // On supprime TOUS les anciens caches pour être sûr
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          console.log('SW (Minimal): Suppression de l\'ancien cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});
