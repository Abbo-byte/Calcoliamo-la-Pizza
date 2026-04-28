const CACHE_NAME = "pizza-calc-v3";

// Asset statici sicuri (nessun redirect)
const STATIC_ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./pizza192.png",
  "./pizza512.png"
];

// Installazione
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Attivazione + pulizia vecchie cache
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", event => {
  const req = event.request;

  // Safari iOS: NON intercettare redirect o navigazioni strane
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Se la risposta è un redirect, NON usarla dal SW
          if (res.type === "opaqueredirect") {
            return fetch("./index.html");
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Stale-while-revalidate per asset statici
  event.respondWith(
    caches.match(req).then(cacheRes => {
      const fetchPromise = fetch(req)
        .then(networkRes => {
          // Salva solo risposte valide
          if (networkRes && networkRes.status === 200 && networkRes.type === "basic") {
            caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        })
        .catch(() => cacheRes);

      return cacheRes || fetchPromise;
    })
  );
});
