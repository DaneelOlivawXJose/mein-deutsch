// Service worker: permite abrir la app sin cobertura.
// La página se pide primero a la red (para recibir actualizaciones) y, si no hay red, sale de la caché.
// Las llamadas a Microsoft (OneDrive, inicio de sesión) nunca se guardan en caché.
const CACHE = 'mein-deutsch-@@VERSION@@';
const FILES = ['./', './index.html', './manifest.webmanifest', './icono-192.png', './icono-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
