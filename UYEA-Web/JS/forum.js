/**
 * UYEA Forum - forum.js
 * 论坛帖子加载、搜索、feed分类筛选
 * 适用于论坛主页（index.html）
 */

document.addEventListener('DOMContentLoaded', () => {
    // 引用共享工具函数
    const { escapeHtml: esc, translateTag, t } = window.UYEA_UTILS;

    const list = document.getElementById('postList');
    const noResults = document.getElementById('noResults');

    let allPosts = [];
    let currentFeed = 'recommend';

    async function loadPosts() {
        if (!list) {
            window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'forum' } }));
            return;
        }

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
            const res = await fetch(UYEA_CONFIG.dataFiles.posts, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const posts = await res.json();
            if (!Array.isArray(posts) || posts.length === 0) throw new Error('无帖子数据');

            allPosts = posts;
            filterPosts();

        } catch (e) {
            console.error('帖子加载失败:', e.message);
            list.innerHTML = `
                <div style="text-align:center;padding:40px 20px;">
                    <div style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">${esc(t('forum.failed'))}</div>
                    <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">${esc(e.message)}</div>
                </div>
            `;
        } finally {
            // 无论成功或失败，都通知加载动画：论坛模块已就绪
            window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'forum' } }));
        }
    }

    function renderPosts(posts) {
        if (posts.length === 0) {
            list.innerHTML = '';
            return;
        }

        list.innerHTML = posts.map(p => {
            const tagHtml = `<span class="post-tag">${esc(translateTag(p.tag, window.currentLang))}</span>`;
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
        const filtered = allPosts.filter(p => (p.feed || 'recommend') === currentFeed);
        renderPosts(filtered);
        if (noResults) noResults.classList.toggle('show', filtered.length === 0);
    }

    loadPosts();

    // ==================== 底部导航栏 tab 切换 ====================
    function bindForumEvents() {
        const bottomNavItems = document.querySelectorAll('#bottomNav .bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('active')) return; // 已选中则跳过
                bottomNavItems.forEach(x => x.classList.remove('active'));
                item.classList.add('active');
                currentFeed = item.dataset.tab;
                filterPosts();
                // 移动凸透镜指示器到选中项并居中滚动
                if (typeof window.updateBottomNavIndicator === 'function') window.updateBottomNavIndicator();
                if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
            });
        });
    }

    // 监听视图切换：切换回论坛视图时重置为第一个分类（推荐）
    window.addEventListener('viewchange', (e) => {
        if (e.detail.view === 'forum') {
            bindForumEvents();
            // 切换视图时统一重置为第一个分类（推荐），不保留历史位置
            currentFeed = 'recommend';
            // 底部导航HTML已默认第一项active，无需额外操作
            filterPosts();
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
        }
    });

    // 初始绑定论坛底部导航事件
    bindForumEvents();

    // 语言切换时重新渲染帖子（翻译标签）
    window.addEventListener('languagechange', () => {
        if (allPosts.length > 0) filterPosts();
    });
});
