// sw.js (Version Finale v2 - Horaires élargis et icône corrigée)

const CACHE_NAME = 'upkeep-cache-v-final-robust-2'; 

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
    console.log('SW: Installation de la version finale v2...');
    event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(urlsToCache))
          .catch((error) => console.error('SW: Échec de la mise en cache.', error))
    );
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activation de la version finale v2...');
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

async function checkTasksAndNotify() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours();

        let notifSlot = null;
        // --- MODIFIÉ : Créneaux horaires élargis ---
        if (hour >= 9 && hour < 12) {
            notifSlot = 'matin';
        } else if (hour >= 16 && hour < 20) {
            notifSlot = 'soir';
        }

        if (!notifSlot) {
            console.log(`SW: Heure actuelle (${hour}h) hors des créneaux.`);
            return;
        }

        const lastNotifDate = await idbKeyval.get(`lastNotifDate_${notifSlot}`);
        if (lastNotifDate === todayStr) {
            console.log(`SW: Notification pour le créneau '${notifSlot}' déjà envoyée aujourd'hui.`);
            return;
        }

        const items = await idbKeyval.get('maintenanceItems_v3') || [];
        const urgentItems = items.filter(item => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const nextDate = new Date(item.nextMaintenance); nextDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
        });

        if (urgentItems.length > 0) {
            const title = 'Rappel de tâches Upkeep';
            const body = `Vous avez ${urgentItems.length} tâche(s) urgente(s) ou en retard. Pensez à y jeter un oeil !`;
            
            // --- MODIFIÉ : Ajout du "badge" pour l'icône de la barre de statut ---
            await self.registration.showNotification(title, {
                body: body,
                icon: '/Appli-gestion/icon-192.png', // Grande icône
                badge: '/Appli-gestion/icon-96.png', // Petite icône pour la barre de statut (doit être simple)
                tag: 'task-reminder'
            });

            await idbKeyval.set(`lastNotifDate_${notifSlot}`, todayStr);
            console.log(`SW: Notification envoyée pour le créneau '${notifSlot}'.`);
        }
    } catch (error) {
        console.error("SW: Erreur dans checkTasksAndNotify:", error);
    }
}
