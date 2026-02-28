const CACHE_NAME = 'fuvarnaplo-v1';
const ASSETS = [
  '/fuvarnaplo/',
  '/fuvarnaplo/index.html',
  '/fuvarnaplo/manifest.json',
  '/fuvarnaplo/icon-192.png',
  '/fuvarnaplo/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'
];

// Telepítéskor cache-elés
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, { mode: 'no-cors' })))
        .catch(() => cache.addAll(['/fuvarnaplo/', '/fuvarnaplo/index.html']));
    })
  );
  self.skipWaiting();
});

// Aktiváláskor régi cache törlése
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – cache first, network fallback
self.addEventListener('fetch', event => {
  // Nominatim keresések ne legyenek cache-elve
  if (event.request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(fetch(event.request).catch(() => new Response('[]')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Sikeres választ cache-eljük
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/fuvarnaplo/index.html');
        }
      });
    })
  );
});
