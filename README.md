# UYEA 悠野社区

纯前端社区平台 — 论坛 · 导航 · 在线工具，三合一 SPA。

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript（无框架依赖）
- **部署**：Cloudflare Pages（自动部署）
- **离线**：Service Worker 缓存策略
- **设计**：Apple Liquid Glass 液态玻璃 + 复古纸张质感

## 项目结构

```
UYEA-Web/
├── index.html          # SPA 主入口（论坛/导航/工具三视图）
├── sw.js               # Service Worker
├── manifest.json       # PWA 清单
├── _redirects          # Cloudflare Pages 路由规则
├── _headers            # 安全头
├── CSS/
│   └── style.css       # 全局样式
├── JS/
│   ├── config.js       # 配置 & 多语言 i18n
│   ├── utils.js        # 共享工具函数库
│   ├── script.js       # 主逻辑（视图切换/搜索/导航/主题）
│   ├── forum.js        # 论坛模块
│   ├── tools.js        # 在线工具模块
│   ├── auth.js         # 用户认证模块
│   └── liquid-glass.js # 液态玻璃折射效果
├── JSON/
│   ├── navigation.json # 导航网站数据
│   ├── posts.json      # 论坛帖子数据
│   └── users.json      # 用户数据
└── IMAGE/              # 静态图片资源
```

## 部署

推送到 `main` 分支后，Cloudflare Pages 自动构建部署。

访问地址：https://uyea-files.pages.dev/
