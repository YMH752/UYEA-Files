/**
 * UYEA Forum - forum.js
 * 论坛帖子加载、搜索、feed分类筛选
 * 适用于论坛主页（index.html）
 */

document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('postList');
    const noResults = document.getElementById('noResults');

    let allPosts = [];
    let currentFeed = 'recommend';
    let searchTimer = null;
    let cachedLang = null; // 缓存语言值，避免每次翻译都读取 localStorage

    // 帖子标签中文 → i18n 键映射
    const TAG_I18N_MAP = {
        '公告': 'forum.cat.announcement',
        'AI 探讨': 'forum.cat.ai',
        '工具': 'forum.cat.tools',
        '生活': 'forum.cat.life',
        '反馈': 'forum.cat.feedback'
    };

    function t(key) {
        if (typeof UYEA_CONFIG === 'undefined') return key;
        if (cachedLang === null) {
            cachedLang = UYEA_CONFIG.defaultLanguage;
            try {
                cachedLang = localStorage.getItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language)) || UYEA_CONFIG.defaultLanguage;
            } catch (e) { /* 隐私模式下使用默认语言 */ }
        }
        const msgs = UYEA_CONFIG.i18n[cachedLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
        return msgs[key] || key;
    }

    function translateTag(tag) {
        const key = TAG_I18N_MAP[tag];
        return key ? t(key) : tag;
    }

    // HTML 转义，防止 XSS
    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadPosts() {
        if (!list) return;

        // 骨架屏
        list.innerHTML = Array(5).fill(0).map(() => `
            <div class="skeleton-post">
                <div class="skeleton-meta">
                    <div class="skeleton-line tag"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line short"></div>
                </div>
                <div class="skeleton-line long skeleton-title"></div>
                <div class="skeleton-line long skeleton-excerpt"></div>
                <div class="skeleton-line medium skeleton-excerpt"></div>
            </div>
        `).join('');

        try {
            const res = await fetch(UYEA_CONFIG.dataFiles.posts);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const posts = await res.json();
            if (!Array.isArray(posts) || posts.length === 0) throw new Error('无帖子数据');

            allPosts = posts;
            bindSearch();
            filterPosts();

        } catch (e) {
            console.error('帖子加载失败:', e.message);
            list.innerHTML = `
                <div style="text-align:center;padding:40px 20px;">
                    <div style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">${esc(t('forum.failed'))}</div>
                    <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">${esc(e.message)}</div>
                </div>
            `;
        }
    }

    function renderPosts(posts) {
        if (posts.length === 0) {
            list.innerHTML = '';
            return;
        }

        list.innerHTML = posts.map(p => {
            const tagHtml = `<span class="post-tag">${esc(translateTag(p.tag))}</span>`;
            // "#" 或空 URL 视为无链接，避免页面跳转和空白标签页
            const hasUrl = p.url && p.url !== '#';
            const href = hasUrl ? esc(p.url) : 'javascript:void(0)';
            const targetAttr = hasUrl ? ' target="_blank" rel="noopener"' : '';
            return `<a href="${href}" class="post-item"${targetAttr}>
                <div class="post-meta">
                    ${tagHtml}
                    <span class="dot">•</span>
                    <span>${esc(p.author)}</span>
                    <span class="dot">•</span>
                    <span>${esc(p.time)}</span>
                </div>
                <div class="post-title">${esc(p.title)}</div>
                <div class="post-excerpt">${esc(p.excerpt)}</div>
            </a>`;
        }).join('');
    }

    function filterPosts() {
        const searchInput = document.getElementById('forumSearchInput');
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filtered = allPosts.filter(p => {
            if ((p.feed || 'recommend') !== currentFeed) return false;
            if (!keyword) return true;
            return (p.title || '').toLowerCase().includes(keyword) ||
                   (p.excerpt || '').toLowerCase().includes(keyword) ||
                   (p.author || '').toLowerCase().includes(keyword) ||
                   (p.tag || '').toLowerCase().includes(keyword);
        });

        renderPosts(filtered);
        if (noResults) noResults.classList.toggle('show', filtered.length === 0);
    }

    function bindSearch() {
        const searchInput = document.getElementById('forumSearchInput');
        if (!searchInput) return;
        // 防抖：输入停止 200ms 后才过滤
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(filterPosts, 200);
        });
    }

    loadPosts();

    // ==================== 底部导航栏 tab 切换 ====================
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) return; // 已选中则跳过
            bottomNavItems.forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            currentFeed = item.dataset.tab;
            const searchInput = document.getElementById('forumSearchInput');
            if (searchInput) searchInput.value = '';
            filterPosts();
        });
    });

    // 语言切换时重新渲染帖子（翻译标签）
    window.addEventListener('languagechange', () => {
        cachedLang = null; // 重置语言缓存
        if (allPosts.length > 0) filterPosts();
    });
});
