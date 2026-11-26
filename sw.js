// Service worker: permite abrir la app sin cobertura.
// La página se pide primero a la red (para recibir actualizaciones) y, si no hay red, sale de la caché.
// Las llamadas a GitHub nunca se guardan en caché. Las fotos (upload/thumb.wikimedia.org) se guardan en «md-fotos»
// la primera vez que se ven, para que luego salgan también sin cobertura.
const CACHE = 'mein-deutsch-1795703813567';
const FILES = ['./', './index.html', './manifest.webmanifest', './icono-192.png', './icono-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'md-fotos').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && /^(upload|thumb).wikimedia.org$/.test(url.hostname)){
    e.respondWith(caches.open('md-fotos').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
