// sw.js (Version Finale avec Notifications Programmées)

const CACHE_NAME = 'upkeep-cache-v-final-scheduled';

// --- IMPORTANT : J'ai ajouté le script pour la base de données IndexedDB ---
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

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
          .then((cache) => cache.addAll(urlsToCache))
          .catch((error) => console.error('SW: Échec de la mise en cache.', error))
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
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- NOUVEAU : Logique pour les notifications programmées ---
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-task-check') {
    console.log('SW: Synchronisation périodique déclenchée.');
    event.waitUntil(checkTasksAndNotify());
  }
});

async function checkTasksAndNotify() {
    const now = new Date();
    const hour = now.getHours();
    const lastNotifHour = await idbKeyval.get('lastNotifHour');

    // On vérifie s'il est 11h ou 18h ET si on n'a pas déjà notifié pour cette heure.
    if ((hour === 11 || hour === 18) && lastNotifHour !== hour) {
        console.log('SW: Heure de notification détectée, vérification des tâches...');
        
        const items = await idbKeyval.get('maintenanceItems_v3') || [];
        const urgentItems = items.filter(item => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const nextDate = new Date(item.nextMaintenance); nextDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 1; // Urgent = Aujourd'hui, demain ou en retard
        });

        if (urgentItems.length > 0) {
            const title = 'Rappel de tâches Upkeep';
            const body = `Vous avez ${urgentItems.length} tâche(s) urgente(s) ou en retard.`;
            
            await self.registration.showNotification(title, {
                body: body,
                icon: '/Appli-gestion/icon-192.png'
            });
            // On sauvegarde l'heure pour ne pas notifier à nouveau dans la même heure.
            await idbKeyval.set('lastNotifHour', hour);
        } else {
            console.log('SW: Aucune tâche urgente trouvée.');
        }
    } else {
        console.log('SW: Pas l\'heure de notifier ou déjà fait.');
    }
}
