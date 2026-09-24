const CACHE = "petit-boy-v3";
const CORE = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "data/store.json", "assets/logo.png", "assets/icon-192.png", "assets/icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    const response = await cache.match("data/store.json");
    if (response) {
      const store = await response.json();
      for (const item of store.products) {
        try { await cache.add(new URL(item.image, self.registration.scope)); }
        catch { /* An unavailable photo does not block the rest of the menu. */ }
      }
    }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/data/store.json") || /\.(js|css|webmanifest)$/.test(url.pathname) || event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match(event.request)));
  } else {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; })));
  }
});
