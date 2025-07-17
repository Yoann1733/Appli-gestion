// sw.js (Version de test "Mouchard")

const CACHE_NAME = 'upkeep-cache-v-debug-trigger'; // Nouveau nom pour forcer la mise à jour

self.addEventListener('install', event => {
  console.log('SW DEBUG: Installation...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('SW DEBUG: Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => caches.delete(cache))
      );
    }).then(() => self.clients.claim())
  );
});

// Le "Mouchard"
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-task-check') {
    console.log('SW DEBUG: periodicsync a été déclenché ! Envoi de la notif de test.');
    const promise = self.registration.showNotification('Upkeep - Test de Synchro', {
        body: `⏰ Le navigateur a bien réveillé l'app à ${new Date().toLocaleTimeString()}`,
        tag: 'sync-test'
    });
    event.waitUntil(promise);
  }
});
