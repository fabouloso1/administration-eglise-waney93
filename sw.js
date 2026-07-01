// Service Worker — Église de Dieu de la Prophétie de Waney 93
// Cache les fichiers statiques pour permettre une utilisation hors-ligne partielle

const CACHE_NAME = 'eglise-waney93-v1';

// Fichiers à mettre en cache pour utilisation hors-ligne
const FILES_TO_CACHE = [
  '/administration-eglise-waney93/',
  '/administration-eglise-waney93/index.html',
  '/administration-eglise-waney93/membres.html',
  '/administration-eglise-waney93/membres-ajouter.html',
  '/administration-eglise-waney93/membres-supprimer.html',
  '/administration-eglise-waney93/membres-rechercher.html',
  '/administration-eglise-waney93/membre-fiche.html',
  '/administration-eglise-waney93/membres-liste.html',
  '/administration-eglise-waney93/dime.html',
  '/administration-eglise-waney93/dime-ajouter.html',
  '/administration-eglise-waney93/dime-liste.html',
  '/administration-eglise-waney93/offrande.html',
  '/administration-eglise-waney93/depenses.html',
  '/administration-eglise-waney93/rapport.html',
  '/administration-eglise-waney93/style.css',
  '/administration-eglise-waney93/images.jpeg',
  '/administration-eglise-waney93/icon-192.png',
  '/administration-eglise-waney93/icon-512.png',
  '/administration-eglise-waney93/manifest.json'
];

// Installation : met en cache tous les fichiers statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE).catch((err) => {
        console.warn('Certains fichiers n\'ont pas pu être mis en cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch : Cache-first pour fichiers statiques, Network-first pour Firebase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Laisse passer les requêtes Firebase (besoin d'internet)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('google') ||
      url.hostname.includes('gstatic')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Pour les fichiers statiques : cache d'abord, réseau ensuite
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('Hors-ligne — connexion requise pour les données.', {status: 503}));
    })
  );
});
