/* Royal Flush — Service Worker
   Strategy:
   - Static shell assets: Cache-first (fonts, icons, CSS, JS chunks)
   - Navigation (HTML pages): Network-first with offline fallback
   - API calls: Network-only (never cache real-time game data)
*/

const CACHE_NAME = "royal-flush-v1";

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept: API calls, Firebase, Stripe, Socket.IO
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("stripe.com") ||
    url.hostname.includes("socket.io") ||
    request.method !== "GET"
  ) {
    return;
  }

  // Static assets (_next/static) → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigation requests → network-first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // Everything else → network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
