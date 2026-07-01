/**
 * UYEA Forum Page - forum.js
 * 论坛帖子加载、搜索与开发中提示
 */

document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('postList');
    const noResults = document.getElementById('noResults');

    async function loadPosts() {
        if (!list) return;

        // 显示加载中
        list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><div style="font-size:24px;margin-bottom:12px;">⏳</div><div>加载中...</div></div>';

        try {
            const res = await fetch(UYEA_CONFIG.dataFiles.posts);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: 帖子数据加载失败`);
            }

            const posts = await res.json();

            if (!Array.isArray(posts) || posts.length === 0) {
                throw new Error('无帖子数据');
            }

            // 渲染帖子列表
            list.innerHTML = posts.map((p) => {
                return `
                    <a href="${p.url}" class="post-item">
                        <div class="post-meta">
                            <span class="post-tag">${p.tag}</span>
                            <span>• ${p.author}</span>
                            <span>• ${p.time}</span>
                        </div>
                        <div class="post-title">${p.title}</div>
                        <div class="post-excerpt">${p.excerpt}</div>
                    </a>
                `;
            }).join('');

            // 搜索功能
            const searchInput = document.getElementById('forumSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const keyword = this.value.toLowerCase().trim();
                    let hasVisible = false;

                    list.querySelectorAll('.post-item').forEach(item => {
                        const title = item.querySelector('.post-title').textContent.toLowerCase();
                        const excerpt = item.querySelector('.post-excerpt').textContent.toLowerCase();
                        const author = item.querySelector('.post-meta').textContent.toLowerCase();

                        const show = title.includes(keyword) || excerpt.includes(keyword) || author.includes(keyword);
                        item.style.display = show ? 'block' : 'none';
                        if (show) hasVisible = true;
                    });

                    noResults.classList.toggle('show', !hasVisible && keyword.length > 0);
                });
            }

        } catch (e) {
            console.error('帖子加载失败:', e.message);
            list.innerHTML = `
                <div style="text-align:center;padding:40px 20px;">
                    <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
                    <div style="color:#666;font-size:14px;margin-bottom:12px;">帖子数据加载失败</div>
                    <div style="font-size:12px;color:#999;line-height:1.6;">
                        错误: ${e.message}<br/>
                        请检查网络连接或稍后重试<br/>
                        <button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;cursor:pointer;">刷新页面</button>
                    </div>
                </div>
            `;
        }
    }

    loadPosts();
});
