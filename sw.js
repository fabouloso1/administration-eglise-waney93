// Service Worker v2 — Église de Dieu de la Prophétie de Waney 93
// Stratégie: Cache-first pour TOUT (fichiers locaux + Firebase SDK + Fonts)

const CACHE = 'eglise-waney93-v2';

// Tous les fichiers à mettre en cache
const STATIC_FILES = [
  // Pages HTML
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
  // Assets locaux
  '/administration-eglise-waney93/style.css',
  '/administration-eglise-waney93/images.jpeg',
  '/administration-eglise-waney93/icon-192.png',
  '/administration-eglise-waney93/icon-512.png',
  '/administration-eglise-waney93/manifest.json',
  // Firebase SDK (CDN) — cachés localement après la première visite
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap',
];

// Installation — cache tous les fichiers statiques
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Cache fichiers locaux (obligatoires)
      const localFiles = STATIC_FILES.filter(f => !f.startsWith('http'));
      try {
        await cache.addAll(localFiles);
      } catch(e) {
        console.warn('Erreur cache local:', e);
      }
      // Cache fichiers CDN (optionnels — peuvent échouer si hors-ligne)
      const cdnFiles = STATIC_FILES.filter(f => f.startsWith('http'));
      for (const url of cdnFiles) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) await cache.put(url, response);
        } catch(e) {
          console.warn('CDN non mis en cache (hors-ligne?):', url);
        }
      }
    })
  );
});

// Activation — supprime anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Cache-first pour tout SAUF les requêtes Firestore (données)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requêtes Firestore (données) → réseau d'abord, puis cache si dispo
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.pathname.includes('/google.firestore.')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Met à jour le cache des données si possible
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Tout le reste (HTML, CSS, JS, fonts, images) → cache d'abord
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → essayer le réseau et mettre en cache
      return fetch(event.request).then(response => {
        if (response.ok || response.type === 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors-ligne et pas en cache
        if (event.request.destination === 'document') {
          return caches.match('/administration-eglise-waney93/index.html');
        }
        return new Response('Hors-ligne', { status: 503 });
      });
    })
  );
});

// Écoute les messages pour forcer une mise à jour du cache
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
