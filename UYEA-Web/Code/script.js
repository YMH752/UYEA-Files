/* ============================================================
   UYEA 悠野工作室 · script.js (微优化版)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── ✅ 任务2：用户状态模拟与渲染 ── */
    let isLoggedIn = true; // ⬅️ 你可以修改这里测试：true(显示头像) / false(显示登录注册)
    const userArea = document.getElementById('userActionArea');

    function renderUserStatus() {
        if (!userArea) return;
        if (isLoggedIn) {
            userArea.innerHTML = `
                <div class="user-profile" id="profileBtn">
                    <div class="avatar-wrapper">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="user-avatar">
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-item">用户</div>
                        <div class="dropdown-item">设置</div>
                    </div>
                </div>
            `;
            // 头像点击事件
            const btn = document.getElementById('profileBtn');
            const menu = document.getElementById('userDropdown');
            btn.onclick = (e) => {
                e.stopPropagation();
                alert('正在开发中...');
                menu.classList.toggle('show');
            };
        } else {
            userArea.innerHTML = `<div class="login-link" onclick="alert('跳转登录页面...')">登录/注册</div>`;
        }
    }
    renderUserStatus();
    // 点击外部关闭下拉菜单
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));

    /* ── 原始搜索逻辑 ── */
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');
    const engineSelect = document.getElementById('searchEngine');

    function handleSearch() {
        const q = searchInput.value.trim();
        const engine = engineSelect.value;
        if (!q) return;
        const urls = {
            baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
            bing: `https://cn.bing.com/search?q=${encodeURIComponent(q)}`
        };
        window.open(urls[engine], '_blank');
    }
    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keydown', e => e.key === 'Enter' && handleSearch());

    /* ── ✅ 任务3：高清图标加载与 SVG 强制回退 ── */
    function initHighResIcons() {
        const images = document.querySelectorAll('.card-icon img');
        
        // 清晰的 SVG 占位图代码
        const svgCode = `
            <svg class="fallback-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            </svg>
        `;

        images.forEach(img => {
            const domain = img.getAttribute('data-domain');
            if (domain) {
                // 使用 Google 128px 高清接口
                img.src = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
                
                // 加载失败处理：移除 img 标签，改存 SVG 代码
                img.onerror = function() {
                    const parent = this.parentElement;
                    if (parent) parent.innerHTML = svgCode;
                };
            }
        });
    }
    initHighResIcons();

    /* ── ✅ 任务1：已移除所有控制 hamburger 的 JS 代码 ── */
});
