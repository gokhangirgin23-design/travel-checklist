/* =====================================================
   Service Worker — Offline destek
   Strateji: App shell için cache-first,
   checklist.md için network-first (güncel veri tercih edilir).
   ===================================================== */

const CACHE_NAME = "travel-checklist-v1";

// Önbelleğe alınacak uygulama kabuğu (relatif yollar — GitHub Pages uyumlu)
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./checklist.md",
  "./manifest.json",
  "./favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Kurulum: app shell'i önbelleğe al
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// İstekler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // checklist.md → network-first (çevrimdışıysa önbellekten)
  if (url.pathname.endsWith("checklist.md")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Diğer her şey → cache-first (çevrimdışı hız), yoksa ağ
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((res) => {
          // Sadece aynı origin'den gelen başarılı yanıtları önbelleğe al
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
    )
  );
});
