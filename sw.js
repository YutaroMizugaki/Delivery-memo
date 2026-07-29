const CACHE_NAME = 'delivery-memo-v1';
const BASE = new URL('.', self.location.href);

const ASSET_PATHS = [
  'index.html',
  'delivery-memo.html',
  'css/styles.css',
  'js/app.js',
  'js/config.js',
  'js/form.js',
  'js/render.js',
  'js/search.js',
  'js/seed.js',
  'js/state.js',
  'js/storage.js',
  'js/toast.js',
  'js/utils.js',
  'manifest.webmanifest',
  'icons/icon.svg',
];

const ASSETS = ASSET_PATHS.map((path) => new URL(path, BASE).href);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
