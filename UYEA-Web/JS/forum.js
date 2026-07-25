/**
 * UYEA Forum - forum.js
 * 论坛帖子加载、搜索、分类筛选与开发中提示
 * 适用于论坛主页（index.html）
 */

document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('postList');
    const noResults = document.getElementById('noResults');

    // 存储全部帖子，便于分类筛选
    let allPosts = [];
    let currentCategory = 'all';

    async function loadPosts() {
        if (!list) return;

        // 显示加载中
        list.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
                <div style="font-size:24px;margin-bottom:12px;">⏳</div>
                <div style="font-size:14px;">加载中...</div>
            </div>
        `;

        try {
            const res = await fetch(UYEA_CONFIG.dataFiles.posts);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: 帖子数据加载失败`);
            }

            const posts = await res.json();

            if (!Array.isArray(posts) || posts.length === 0) {
                throw new Error('无帖子数据');
            }

            allPosts = posts;
            renderPosts(posts);
            bindSearch();
            bindCategories();
            updateStats(posts);

        } catch (e) {
            console.error('帖子加载失败:', e.message);
            list.innerHTML = `
                <div style="text-align:center;padding:40px 20px;">
                    <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
                    <div style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">帖子数据加载失败</div>
                    <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">
                        错误: ${e.message}<br/>
                        请检查网络连接或稍后重试<br/>
                        <button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">刷新页面</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 渲染帖子列表
     * @param {Array} posts 帖子数组
     */
    function renderPosts(posts) {
        if (posts.length === 0) {
            list.innerHTML = '';
            if (noResults) noResults.classList.add('show');
            return;
        }

        if (noResults) noResults.classList.remove('show');

        list.innerHTML = posts.map((p, idx) => {
            const replies = (idx * 7 + 3) % 48;
            const views = (idx * 53 + 120) % 999;
            return `
                <a href="${p.url}" class="post-item">
                    <div class="post-meta">
                        <span class="post-tag">${p.tag}</span>
                        <span class="dot">•</span>
                        <span>${p.author}</span>
                        <span class="dot">•</span>
                        <span>${p.time}</span>
                    </div>
                    <div class="post-title">${p.title}</div>
                    <div class="post-excerpt">${p.excerpt}</div>
                    <div class="post-stats">
                        <span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            ${replies}
                        </span>
                        <span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ${views}
                        </span>
                    </div>
                </a>
            `;
        }).join('');
    }

    /**
     * 绑定搜索功能
     */
    function bindSearch() {
        const searchInput = document.getElementById('forumSearchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            filterPosts();
        });
    }

    /**
     * 绑定分类筛选
     */
    function bindCategories() {
        const items = document.querySelectorAll('.category-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(x => x.classList.remove('active'));
                item.classList.add('active');
                currentCategory = item.dataset.cat;
                filterPosts();
            });
        });
    }

    /**
     * 综合筛选（分类 + 关键词）
     */
    function filterPosts() {
        const searchInput = document.getElementById('forumSearchInput');
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filtered = allPosts.filter(p => {
            // 分类过滤
            const catMatch = currentCategory === 'all' || p.tag === currentCategory;
            if (!catMatch) return false;

            // 关键词过滤
            if (!keyword) return true;
            const inTitle = p.title.toLowerCase().includes(keyword);
            const inExcerpt = p.excerpt.toLowerCase().includes(keyword);
            const inAuthor = p.author.toLowerCase().includes(keyword);
            const inTag = p.tag.toLowerCase().includes(keyword);
            return inTitle || inExcerpt || inAuthor || inTag;
        });

        renderPosts(filtered);

        if (filtered.length === 0 && (keyword || currentCategory !== 'all')) {
            if (noResults) noResults.classList.add('show');
        } else {
            if (noResults) noResults.classList.remove('show');
        }
    }

    /**
     * 更新侧栏统计（基于实际帖子数）
     */
    function updateStats(posts) {
        const statEls = document.querySelectorAll('.sidebar-stat span:last-child');
        if (statEls.length >= 4) {
            statEls[0].textContent = posts.length;
        }

        // 更新分类计数
        const catItems = document.querySelectorAll('.category-item');
        catItems.forEach(item => {
            const cat = item.dataset.cat;
            const countEl = item.querySelector('.count');
            if (!countEl) return;
            if (cat === 'all') {
                countEl.textContent = posts.length;
            } else {
                countEl.textContent = posts.filter(p => p.tag === cat).length;
            }
        });
    }

    loadPosts();
});
