// sw.js (Version Finale v3 - Sans contrainte d'horaire)

const CACHE_NAME = 'upkeep-cache-v-final-robust-3'; 

importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

const urlsToCache = [
    '/Appli-gestion/',
    '/Appli-gestion/index.html',
    '/Appli-gestion/manifest.json',
    '/Appli-gestion/icon-192.png',
    '/Appli-gestion/icon-512.png',
    '/Appli-gestion/icon-maskable.png',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
    console.log('SW: Installation de la version finale v3...');
    event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(urlsToCache))
          .catch((error) => console.error('SW: Échec de la mise en cache.', error))
    );
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activation de la version finale v3...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request)
          .then((response) => response || fetch(event.request))
    );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-task-check') {
    console.log('SW: Synchronisation périodique déclenchée.');
    event.waitUntil(checkTasksAndNotify());
  }
});

// --- MODIFIÉ : Logique de notification simplifiée ---
async function checkTasksAndNotify() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastNotifDate = await idbKeyval.get('lastNotifDate');

        // Si une notification de résumé a déjà été envoyée aujourd'hui, on ne fait rien.
        if (lastNotifDate === todayStr) {
            console.log('SW: Notification de résumé déjà envoyée aujourd\'hui.');
            return;
        }

        console.log('SW: Vérification des tâches...');
        const items = await idbKeyval.get('maintenanceItems_v3') || [];
        const urgentItems = items.filter(item => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const nextDate = new Date(item.nextMaintenance); nextDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 1; // Urgent = Aujourd'hui, demain ou en retard
        });

        if (urgentItems.length > 0) {
            const title = 'Rappel de tâches Upkeep';
            const body = `Vous avez ${urgentItems.length} tâche(s) urgente(s) ou en retard. Pensez à y jeter un oeil !`;
            
            await self.registration.showNotification(title, {
                body: body,
                icon: '/Appli-gestion/icon-192.png',
                badge: '/Appli-gestion/icon-96.png',
                tag: 'task-reminder'
            });

            // On met à jour la date de la dernière notification pour n'en envoyer qu'une par jour.
            await idbKeyval.set('lastNotifDate', todayStr);
            console.log('SW: Notification de résumé envoyée.');
        } else {
            console.log('SW: Aucune tâche urgente trouvée.');
        }
    } catch (error) {
        console.error("SW: Erreur dans checkTasksAndNotify:", error);
    }
}
