/**
 * UYEA Forum - forum.js
 * 论坛帖子加载、搜索、feed分类筛选
 * 适用于论坛主页（index.html）
 */

document.addEventListener('DOMContentLoaded', () => {
    // 加载守卫：utils.js 未加载时通知模块就绪并退出，避免后续解构抛错导致模块静默崩溃
    if (!window.UYEA_UTILS) {
        console.error('[forum] UYEA_UTILS 未加载，论坛模块初始化失败');
        window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'forum' } }));
        return;
    }
    if (!window.UYEA_CONFIG) {
        console.error('[forum] UYEA_CONFIG 未加载，论坛模块初始化失败');
        window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'forum' } }));
        return;
    }
    // 引用共享工具函数
    const { escapeHtml: esc, t, renderPostCard } = window.UYEA_UTILS;

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
            const posts = await UYEA_UTILS.fetchJsonCached(UYEA_CONFIG.dataFiles.posts);
            if (!Array.isArray(posts) || posts.length === 0) {
                allPosts = [];
                renderPosts([]);
                list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px;">暂无帖子</div>';
                return;
            }

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

        list.innerHTML = posts.map(p => renderPostCard(p, window.currentLang)).join('');

        // 无链接的帖子卡片（href="#"）阻止默认跳转行为
        list.querySelectorAll('a.post-item[href="#"]').forEach(a => {
            a.addEventListener('click', e => e.preventDefault());
        });
    }

    function filterPosts() {
        const filtered = allPosts.filter(p => (p.feed || 'recommend') === currentFeed);
        renderPosts(filtered);
        if (noResults) noResults.classList.toggle('show', filtered.length === 0);
    }

    loadPosts();

    // ==================== 底部导航栏 tab 切换（事件委托） ====================
    // 使用事件委托绑定在持久的 #bottomNav 容器上，避免每次视图切换重新绑定
    // 论坛底部导航项使用 data-tab 属性，与导航/工具页的 data-category 区分
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.addEventListener('click', (e) => {
            const item = e.target.closest('.bottom-nav-item[data-tab]');
            if (!item || item.classList.contains('active')) return;
            bottomNav.querySelectorAll('.bottom-nav-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            currentFeed = item.dataset.tab;
            filterPosts();
            // 移动凸透镜指示器到选中项并居中滚动
            if (typeof window.updateBottomNavIndicator === 'function') window.updateBottomNavIndicator();
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
        });
    }

    // 监听视图切换：切换回论坛视图时重置为第一个分类（推荐）
    window.addEventListener('viewchange', (e) => {
        if (e.detail.view === 'forum') {
            // 切换视图时统一重置为第一个分类（推荐），不保留历史位置
            currentFeed = 'recommend';
            // 底部导航HTML已默认第一项active，无需额外操作
            filterPosts();
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
        }
    });

    // 语言切换时重新渲染帖子（翻译标签）
    window.addEventListener('languagechange', () => {
        if (allPosts.length > 0) filterPosts();
    });
});
