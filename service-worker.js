const CACHE = 'cs-fitness-v1';

const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './data.json',
  './manifest.json',
  './icons/icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Vidéos MP4 : cache à la première lecture, offline ensuite
  if (url.pathname.endsWith('.mp4')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const resp = await fetch(request);
        cache.put(request, resp.clone());
        return resp;
      })
    );
    return;
  }

  // data.json : réseau d'abord pour avoir les màj, cache en fallback
  if (url.pathname.endsWith('data.json')) {
    e.respondWith(
      fetch(request)
        .then(resp => {
          caches.open(CACHE).then(c => c.put(request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Tout le reste : cache d'abord
  e.respondWith(
    caches.match(request).then(hit => {
      if (hit) return hit;
      return fetch(request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(request, resp.clone()));
        return resp;
      });
    })
  );
});
