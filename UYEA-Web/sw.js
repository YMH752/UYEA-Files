/*
 * UYEA 悠野工作室 - Service Worker
 * 缓存优先策略，支持离线访问
 */

const CACHE_NAME = 'uyea-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/navigation.html',
  '/tools.html',
  '/forum.html',
  '/CSS/style.css?v=0.2.0',
  '/CSS/landing.css?v=0.2.0',
  '/JS/config.js?v=0.2.0',
  '/JS/script.js?v=0.2.0',
  '/JS/landing.js?v=0.2.0',
  '/JS/calendar.js?v=0.2.0',
  '/JS/tools.js?v=0.2.0',
  '/JS/forum.js?v=0.2.0',
  '/JSON/navigation.json',
  '/JSON/posts.json',
  '/JSON/holidays.json',
  '/IMAGE/JPG/Peter_Thomas(2-1).webp',
  '/IMAGE/JPG/Peter_Thomas(2-2).webp',
  '/IMAGE/ICO/zhihu.png',
  '/IMAGE/ICO/zhihu.ico'
];

// 安装：缓存核心静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求和跨域请求
  if (request.method !== 'GET' || request.url.startsWith('http') && !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // 缓存命中则返回，同时后台更新
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response && response.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      // 未命中则网络请求并缓存
      return fetch(request)
        .then((response) => {
          if (!response || !response.ok || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // 离线且未缓存 HTML 时返回首页
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
