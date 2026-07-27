/*
 * UYEA 悠野社区 - Service Worker v0.6.50
 * 缓存优先策略，支持离线访问
 * 复古×现代 · 液态玻璃 · 纸张质感
 */

const CACHE_NAME = 'uyea-v0.6.50';
const V = 'v=0.6.50';

// 核心静态资源（安装时预缓存）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/navigation.html',
  '/tools.html',
  '/forum.html',
  `/CSS/style.css?${V}`,
  `/JS/liquid-glass.js?${V}`,
  `/JS/config.js?${V}`,
  `/JS/script.js?${V}`,
  `/JS/tools.js?${V}`,
  `/JS/forum.js?${V}`,
  '/JSON/navigation.json',
  '/JSON/posts.json',
  '/manifest.json'
];

// 可延迟缓存的资源（运行时按需缓存）
const RUNTIME_CACHE_PATTERN = [
  /\/IMAGE\//,
  /\/FONT\//
];

// 安装：预缓存核心资源，跳过失败项
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all(
      CORE_ASSETS.map(url =>
        caches.open(CACHE_NAME)
          .then(cache => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 拦截请求：HTML 和 JSON 网络优先 / 其他缓存优先
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 仅处理同源 GET 请求
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // HTML 文档：网络优先（确保用户第一次刷新即获取最新 HTML 和 JS 版本）
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // JSON 数据文件：网络优先（确保导航数据等即时更新）
  if (request.destination === '' && request.url.includes('/JSON/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
    return;
  }

  // 其他请求（JS/CSS/图片等）：缓存优先 + 后台更新
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // 后台更新缓存
        event.waitUntil(
          fetch(request)
            .then(response => {
              if (response && response.ok) {
                caches.open(CACHE_NAME).then(cache => cache.put(request, response));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      // 未命中：网络请求 → 缓存 → 返回
      return fetch(request)
        .then(response => {
          if (!response || !response.ok || response.type === 'opaque') {
            return response;
          }
          const shouldCache = RUNTIME_CACHE_PATTERN.some(pattern =>
            pattern.test(new URL(request.url).pathname)
          );
          if (shouldCache) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {})
    })
  );
});
