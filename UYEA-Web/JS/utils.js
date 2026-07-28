/**
 * UYEA 共享工具函数库 - utils.js
 * 提取各模块重复使用的通用函数，减少代码冗余
 * 必须在 config.js 之后、其他业务脚本之前加载
 */
(function () {
    'use strict';

    // ==================== 安全 localStorage ====================
    function safeGetItem(key) {
        try { return localStorage.getItem(key); }
        catch (e) { return null; }
    }
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); }
        catch (e) { /* 静默忽略 */ }
    }
    function safeRemoveItem(key) {
        try { localStorage.removeItem(key); }
        catch (e) { /* 静默忽略 */ }
    }

    // ==================== HTML 转义（防 XSS） ====================
    var ESC_REGEX = /[&<>"']/g;
    var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(ESC_REGEX, function (ch) { return ESC_MAP[ch]; });
    }

    // ==================== Grid 列数计算 ====================
    // 与 CSS gap: 0 16px 保持一致
    var GRID_GAP = 16;
    function getGridColumns(grid, cards) {
        if (!grid || !cards || cards.length === 0) return 1;
        var gridWidth = grid.clientWidth;
        var cardWidth = cards[0].getBoundingClientRect().width;
        if (cardWidth <= 0) return 1;
        return Math.max(1, Math.floor((gridWidth + GRID_GAP) / (cardWidth + GRID_GAP)));
    }

    // ==================== 帖子标签翻译 ====================
    var TAG_I18N_MAP = {
        '公告': 'forum.cat.announcement',
        'AI 探讨': 'forum.cat.ai',
        '工具': 'forum.cat.tools',
        '生活': 'forum.cat.life',
        '反馈': 'forum.cat.feedback'
    };

    function translateTag(tag, lang) {
        var key = TAG_I18N_MAP[tag];
        if (!key) return tag;
        var cfg = window.UYEA_CONFIG;
        if (!cfg) return tag;
        var msgs = cfg.i18n[lang] || cfg.i18n[cfg.defaultLanguage];
        return (msgs && msgs[key]) || tag;
    }

    // ==================== 获取当前语言 ====================
    function getCurrentLang() {
        if (window.currentLang) return window.currentLang;
        var cfg = window.UYEA_CONFIG;
        if (!cfg) return 'zh-CN';
        try {
            return localStorage.getItem(cfg.getStorageKey(cfg.storageKeys.language)) || cfg.defaultLanguage;
        } catch (e) {
            return cfg.defaultLanguage;
        }
    }

    // ==================== 获取当前语言翻译消息集 ====================
    function getMsgs() {
        var cfg = window.UYEA_CONFIG;
        if (!cfg) return {};
        var lang = getCurrentLang();
        return cfg.i18n[lang] || cfg.i18n[cfg.defaultLanguage] || {};
    }

    // ==================== 获取单条翻译 ====================
    function t(key) {
        var msgs = getMsgs();
        return msgs[key] || key;
    }

    // ==================== 防抖 ====================
    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var ctx = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
        };
    }

    // ==================== JSON 请求 Promise 缓存（同 URL 多次调用复用同一 Promise） ====================
    var jsonCache = {};
    function fetchJsonCached(url) {
        if (jsonCache[url]) return jsonCache[url];
        var p = fetch(url).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).catch(function (e) {
            // 失败时清除缓存，允许下次重试
            delete jsonCache[url];
            throw e;
        });
        jsonCache[url] = p;
        return p;
    }

    // ==================== 帖子卡片 HTML 渲染（forum.js / script.js 共用） ====================
    function renderPostCard(post, lang) {
        var tagHtml = '<span class="post-tag">' + escapeHtml(translateTag(post.tag, lang)) + '</span>';
        // "#" 或空 URL 视为无链接，使用 href="#" 避免页面跳转和空白标签页
        var hasUrl = post.url && post.url !== '#';
        var href = hasUrl ? escapeHtml(post.url) : '#';
        var targetAttr = hasUrl ? ' target="_blank" rel="noopener"' : '';
        return '<a href="' + href + '" class="post-item"' + targetAttr + '>' +
            '<div class="post-meta">' +
                tagHtml +
                '<span class="dot">•</span>' +
                '<span>' + escapeHtml(post.author) + '</span>' +
                '<span class="dot">•</span>' +
                '<span>' + escapeHtml(post.time) + '</span>' +
            '</div>' +
            '<div class="post-title">' + escapeHtml(post.title) + '</div>' +
            '<div class="post-excerpt">' + escapeHtml(post.excerpt) + '</div>' +
        '</a>';
    }

    // ==================== 暴露到全局 ====================
    window.UYEA_UTILS = {
        safeGetItem: safeGetItem,
        safeSetItem: safeSetItem,
        safeRemoveItem: safeRemoveItem,
        escapeHtml: escapeHtml,
        getGridColumns: getGridColumns,
        translateTag: translateTag,
        getCurrentLang: getCurrentLang,
        getMsgs: getMsgs,
        t: t,
        debounce: debounce,
        fetchJsonCached: fetchJsonCached,
        renderPostCard: renderPostCard,
        TAG_I18N_MAP: TAG_I18N_MAP
    };
})();
