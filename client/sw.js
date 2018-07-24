const staticCacheName = 'restaurant-reviews-static-v3';
const contentImgsCache = 'restaurant-reviews-imgs';
const allCaches = [
  staticCacheName,
  contentImgsCache,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(staticCacheName).then(cache => cache.addAll([
    '/',
    '/restaurant.html',
    '/css/styles.css',
    '/css/max_width_440.css',
    '/css/min_width_440.css',
    '/css/min-width_560.css',
    '/css/min_width_800.css',
    '/css/min_width_800_and_max_width_1023.css',
    '/css/min_width_1024.css',
    '/css/min_width_1600.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    '/data/restaurants.json',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/node_modules/lazysizes/lazysizes.min.js',
    '/node_modules/idb/lib/idb.js',
  ])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.filter(cacheName => cacheName.startsWith('restaurant-reviews-') &&
                  !allCaches.includes(cacheName)).map(cacheName => caches.delete(cacheName)))));
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(caches.match(event.request)
    .then(cachedResponse => cachedResponse || fetch(event.request)));
});

function servePhoto(request) {
  let storageUrl = request.url.replace(/\..+$/, '');
  storageUrl = request.url.replace(/\_.+$/, '');

  return caches.open(contentImgsCache).then(cache => cache.match(storageUrl).then((response) => {
    if (response) return response;
    return fetch(request).then((networkResponse) => {
      cache.put(storageUrl, networkResponse.clone());
      return networkResponse;
    });
  }));
}

self.addEventListener('message', (event) => {
  if (event.data.activate === 'true');
  self.skipWaiting();
});
