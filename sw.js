// APP_VERSION (config.js) と同期: 更新時は両方を上げる
const CACHE_VERSION = 5;
const CACHE_NAME = `delivery-memo-v${CACHE_VERSION}`;
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
  'icons/icon-192.png',
  'icons/icon-512.png',
];

const PRECACHE = ASSET_PATHS.map((path) => new URL(path, BASE).href);

const NETWORK_FIRST = /\.(html|js|css|webmanifest)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
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

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (NETWORK_FIRST.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}
