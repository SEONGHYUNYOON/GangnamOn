// 강남온 PWA - 간단한 서비스 워커
const CACHE_NAME = 'gangnamon-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 기본: 네트워크 우선 (실시간 데이터 필요)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
