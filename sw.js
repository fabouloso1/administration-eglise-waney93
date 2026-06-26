// Service worker minimal — requis par les navigateurs pour permettre
// l'installation de l'application (PWA), mais sans mise en cache complexe.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // On laisse simplement passer toutes les requêtes vers le réseau.
  event.respondWith(fetch(event.request));
});
