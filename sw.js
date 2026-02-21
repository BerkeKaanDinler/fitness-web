const CACHE_NAME = "bkd-fitness-v7";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=7",
  "/script.js?v=7",
  "/manifest.webmanifest",
  "/icon.svg",
  "/media/3837743.jpg",
  "/media/2261476.jpg",
  "/media/3490363.jpg",
  "/media/2261477.jpg",
  "/media/2261485.jpg",
  "/media/4720555.jpg",
  "/media/1431282.jpg",
  "/media/1552242.jpg",
  "/media/11433060.jpg",
  "/media/8032754.jpg",
  "/media/841130.jpg",
  "/media/841131.jpg",
  "/media/949132.jpg",
  "/media/791763.jpg",
  "/media/3837743.webp",
  "/media/2261476.webp",
  "/media/3490363.webp",
  "/media/2261477.webp",
  "/media/2261485.webp",
  "/media/4720555.webp",
  "/media/1431282.webp",
  "/media/1552242.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return caches.match("/index.html");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
