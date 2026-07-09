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

// ────────────────────────────────────────────────────────────────
// 오프라인 푸시 알림 — 사이트(탭/브라우저)가 꺼져 있어도 OS가 이 스크립트를
// 깨워서 알림을 띄워줍니다. (1:1 채팅 새 메시지 알림용)
// ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '강남On', body: event.data ? event.data.text() : '새 알림이 도착했어요' };
  }

  const title = data.title || '강남On';
  const options = {
    body: data.body || '새 메시지가 도착했어요',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    data: { url: data.url || '/' },
    tag: data.tag || 'gangnamon-chat',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
