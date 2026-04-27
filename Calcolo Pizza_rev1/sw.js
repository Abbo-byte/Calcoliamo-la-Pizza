const CACHE_NAME = "pizza-calc-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./pizza192.png",
  "./pizza512.png"
];

// Installazione e caching iniziale
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione e pulizia vecchie cache
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia di fetch
self.addEventListener("fetch", event => {
  const req = event.request;

  // Network-first per HTML
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Cache-first per asset statici
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});
