/*
 * UYEA 悠野社区 - Service Worker v0.10.1
 * 缓存优先策略，支持离线访问
 * 复古×现代 · 液态玻璃 · 纸张质感
 */

const CACHE_NAME = 'uyea-v0.10.1';
const V = 'v=0.10.1';

// 核心静态资源（安装时预缓存）
// 安全：users.json 含用户凭据，不预缓存也不运行时缓存
const CORE_ASSETS = [
  '/',
  `/CSS/style.css?${V}`,
  `/JS/liquid-glass.js?${V}`,
  `/JS/config.js?${V}`,
  `/JS/utils.js?${V}`,
  `/JS/script.js?${V}`,
  `/JS/tools.js?${V}`,
  `/JS/forum.js?${V}`,
  `/JS/auth.js?${V}`,
  '/manifest.json',
  '/IMAGE/JPG/Peter_Thomas(2-2).webp'
];

// 可延迟缓存的资源（运行时按需缓存）
const RUNTIME_CACHE_PATTERN = [
  /\/IMAGE\//,
  /\/FONT\//
];

// 禁止缓存的路径（含敏感数据，仅网络请求，不写入 Cache API）
const NEVER_CACHE_PATTERN = [
  /\/JSON\/users\.json/
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

// 激活：清理旧缓存 + 启用导航预加载
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .catch(() => {})
      .then(() => {
        // 启用导航预加载：页面请求时并行发起网络请求，减少 SW 启动延迟
        if (self.registration.navigationPreload) {
          return self.registration.navigationPreload.enable();
        }
      })
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

  // 安全：含敏感数据的路径仅走网络，不拦截、不缓存
  const reqPath = new URL(request.url).pathname;
  if (NEVER_CACHE_PATTERN.some(pattern => pattern.test(reqPath))) {
    return;
  }

  // HTML 文档：网络优先（确保用户第一次刷新即获取最新 HTML 和 JS 版本）
  if (request.destination === 'document') {
    event.respondWith(
      (async () => {
        // 优先使用导航预加载的响应（如果可用）
        // event.preloadResponse 是 Promise，必须 await 获取实际 Response
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse && preloadResponse.ok) {
          const contentType = preloadResponse.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            const clone = preloadResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return preloadResponse;
        }
        // 回退到正常网络请求
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
          }
          return response;
        } catch (e) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexCache = await caches.match('/');
          if (indexCache) return indexCache;
          // 兜底：构造离线提示页面，避免返回 undefined 导致 TypeError
          return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>离线</title></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>您当前处于离线状态</h1><p>请检查网络连接后重试</p></body></html>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      })()
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
        // 离线时回退到缓存；无缓存则按 URL 返回正确结构的空数据
        // （posts.json 是数组、navigation.json 是对象，避免消费者解析崩溃）
        .catch(() => caches.match(request).then(cached => {
          if (cached) return cached;
          const url = request.url;
          const fallback = url.includes('posts') ? '[]'
            : url.includes('navigation') ? '{}'
            : '{"offline":true,"data":[]}';
          return new Response(fallback, {
            headers: { 'Content-Type': 'application/json' }
          });
        }))
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
        .catch(() => caches.match('/').then(cached => cached || new Response('', { status: 504, statusText: 'Gateway Timeout' })))
    })
  );
});
