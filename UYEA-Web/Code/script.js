/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：移除汉堡控制、用户登录状态模拟、图标100%清晰加载
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ────────────────────────────────────────────
       1. 模拟登录状态 (你可以在此处手动修改 true/false 进行测试)
       ──────────────────────────────────────────── */
    let isLoggedIn = true; // 修改为 false 即可看到 "登录/注册"
    const userActionArea = document.getElementById('userActionArea');

    function renderUserArea() {
        if (!userActionArea) return;
        
        if (isLoggedIn) {
            // 已登录：渲染头像和下拉菜单
            userActionArea.innerHTML = `
                <div class="user-profile" id="userProfileTrigger">
                    <div class="avatar-wrapper">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="user-avatar" alt="User">
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-item" data-action="profile">用户</div>
                        <div class="dropdown-item" data-action="settings">设置</div>
                    </div>
                </div>
            `;
            initUserEvents();
        } else {
            // 未登录：渲染登录链接
            userActionArea.innerHTML = `
                <a href="#" class="login-link" onclick="alert('正在开发登录系统...'); return false;">登录/注册</a>
            `;
        }
    }

    function initUserEvents() {
        const trigger = document.getElementById('userProfileTrigger');
        const dropdown = document.getElementById('userDropdown');

        // 点击头像：弹出正在开发中，并切换下拉菜单
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('正在开发中...');
            dropdown.classList.toggle('open');
        });

        // 下拉菜单项点击
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                alert(`${action === 'profile' ? '用户中心' : '系统设置'}功能正在开发中...`);
                dropdown.classList.remove('open');
            });
        });

        // 点击其他区域关闭下拉
        document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    renderUserArea();

    /* ────────────────────────────────────────────
       2. 搜索引擎逻辑
       ──────────────────────────────────────────── */
    const searchEngine = document.getElementById('searchEngine');
    const searchInput  = document.getElementById('searchInput');
    const searchBtn    = document.getElementById('searchBtn');

    const engineUrls = {
        baidu:  q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
        google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        bing:   q => `https://cn.bing.com/search?q=${encodeURIComponent(q)}`
    };

    function doSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const engine = searchEngine.value || 'baidu';
            window.open(engineUrls[engine](query), '_blank', 'noopener,noreferrer');
        } else {
            searchInput.focus();
        }
    }

    searchBtn?.addEventListener('click', doSearch);
    searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    /* ────────────────────────────────────────────
       3. ✅ 优化：图标百分之百清晰加载方案 (无 Emoji)
       ──────────────────────────────────────────── */
    function updateCardIcons() {
        const iconImages = document.querySelectorAll('.card-icon img');
        
        // 占位 SVG 模板 (一个简洁的全球互联网图标)
        const svgPlaceholder = `
            <svg class="svg-fallback" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm192.1-551.2c-15.7-20.6-40-32.8-66.1-32.8-26.1 0-50.4 12.2-66.1 32.8L512 408l-59.9-75.2c-15.7-20.6-40-32.8-66.1-32.8-26.1 0-50.4 12.2-66.1 32.8-19.1 25.1-19.1 60.5 0 85.6l96.1 120.6-96.1 120.6c-19.1 25.1-19.1 60.5 0 85.6 15.7 20.6 40 32.8 66.1 32.8 26.1 0 50.4-12.2 66.1-32.8L512 616l59.9 75.2c15.7 20.6 40 32.8 66.1 32.8 26.1 0 50.4-12.2 66.1-32.8 19.1-25.1 19.1-60.5 0-85.6l-96.1-120.6 96.1-120.6c19.1-25.1 19.1-60.5 0-85.6z"/>
            </svg>
        `;

        iconImages.forEach(img => {
            const domain = img.getAttribute('data-domain');
            if (domain) {
                // ✅ 使用 128px 的高清接口
                img.src = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
                
                // ✅ 失败处理：移除 img，插入 SVG 占位符
                img.onerror = function() {
                    const container = this.parentElement;
                    container.innerHTML = svgPlaceholder;
                };
            }
        });
    }

    updateCardIcons();
});
