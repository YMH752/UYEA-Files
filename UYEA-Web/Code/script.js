/* ============================================================
   UYEA 悠野工作室 · script.js (接手修订版)
   功能模块：
     1. 搜索（百度 / 谷歌 / 必应 + 回车触发）
     2. 汉堡菜单 & 侧边栏开关
     3. 侧边栏遮罩关闭
     4. 卡片入场动画错峰延迟
     5. 导航高亮联动（侧边栏 + 底部导航同步）
     6. 滚动监听自动高亮
     7. 窗口resize自动处理侧边栏状态
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ──────────────────────────────────────────
       1. 元素引用
    ────────────────────────────────────────── */
    const searchEngine  = document.getElementById('searchEngine');
    const searchInput   = document.getElementById('searchInput');
    const hamburgerBtn  = document.getElementById('hamburgerBtn');
    const sidebar       = document.getElementById('sidebar');
    const overlay       = document.getElementById('sidebarOverlay');
    const mainContent   = document.getElementById('mainContent');

    // 获取所有导航项：包括侧边栏和移动端底部导航
    const sidebarItems  = document.querySelectorAll('.sidebar .nav-item[data-section]');
    const bottomItems   = document.querySelectorAll('.bottom-nav .bottom-nav-item[data-section]');
    // 获取页面中带有ID的内容分区，用于滚动监听
    const sections      = document.querySelectorAll('.content-section[id]');


    /* ──────────────────────────────────────────
       2. 搜索功能逻辑
    ────────────────────────────────────────── */
    const engineUrls = {
        baidu:  q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
        google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        bing:   q => `https://cn.bing.com/search?q=${encodeURIComponent(q)}` // 补全了必应搜索地址
    };

    // 执行搜索的函数
    function doSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const engine = searchEngine.value;
            // 打开新窗口进行搜索
            window.open(engineUrls[engine](query), '_blank');
        } else {
            // 如果输入为空，触发一个抖动效果提醒用户
            searchInput.classList.remove('shake');
            void searchInput.offsetWidth; // 触发重绘
            searchInput.classList.add('shake');
        }
    }

    // 监听搜索框的回车事件
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }


    /* ──────────────────────────────────────────
       3. 侧边栏（菜单）切换逻辑
    ────────────────────────────────────────── */
    // 打开/关闭侧边栏
    function toggleSidebar(state) {
        if (sidebar) sidebar.classList.toggle('active', state);
        if (overlay) overlay.classList.toggle('active', state);
        // 侧边栏打开时禁用主体滚动
        document.body.style.overflow = state ? 'hidden' : '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => toggleSidebar(true));
    }

    if (overlay) {
        overlay.addEventListener('click', () => toggleSidebar(false));
    }


    /* ──────────────────────────────────────────
       4. 导航高亮同步处理
    ────────────────────────────────────────── */
    function setActiveNav(sectionId) {
        // 清除所有侧边栏项的激活状态
        sidebarItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });
        // 清除所有底部导航项的激活状态
        bottomItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });
    }

    // 侧边栏点击事件：点击后自动关闭侧边栏并高亮
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            setActiveNav(sectionId);
            if (window.innerWidth < 1024) toggleSidebar(false);
        });
    });


    /* ──────────────────────────────────────────
       5. 滚动监听：随页面滚动自动切换导航高亮
    ────────────────────────────────────────── */
    window.addEventListener('scroll', () => {
        let currentSection = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // 判断滚动条位置是否进入了某个分区的范围（偏移量60px用于抵消顶栏高度）
            if (pageYOffset >= sectionTop - 70) {
                currentSection = section.getAttribute('id');
            }
        });

        if (currentSection) {
            setActiveNav(currentSection);
        }
    });


    /* ──────────────────────────────────────────
       6. 卡片入场动画（错峰加载效果）
    ────────────────────────────────────────── */
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // 根据卡片的索引顺序，依次延迟动画触发时间
        card.style.animationDelay = `${index * 0.05}s`;
    });


    /* ──────────────────────────────────────────
       7. 响应式处理：窗口大小改变时重置状态
    ────────────────────────────────────────── */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            toggleSidebar(false);
            document.body.style.overflow = '';
        }
    });


    /* ──────────────────────────────────────────
       8. 点击波纹特效（Ripple Effect）
    ────────────────────────────────────────── */
    document.querySelectorAll('.card, .nav-item, .bottom-nav-item, .post-btn').forEach(el => {
        el.addEventListener('pointerdown', function(e) {
            // 排除掉没有波纹样式的特殊占位符
            if (this.classList.contains('card-placeholder')) return;

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            
            ripple.style.cssText = `
                position:absolute;
                width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size/2}px;
                top:${e.clientY - rect.top - size/2}px;
                background:rgba(0,120,212,0.12);
                border-radius:50%;
                transform:scale(0);
                animation:ripple 0.5s ease-out forwards;
                pointer-events:none;
                z-index: 0;
            `;
            
            // 确保父元素有定位属性，否则波纹会飘走
            if (window.getComputedStyle(this).position === 'static') {
                this.style.position = 'relative';
            }
            this.style.overflow = 'hidden';
            
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

});

/* ──────────────────────────────────────────
   9. 动态样式注入：为波纹和抖动提供CSS支持
────────────────────────────────────────── */
(function injectStyles() {
    if (document.getElementById('injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'injected-styles';
    style.textContent = `
        @keyframes ripple {
            to { transform: scale(1); opacity: 0; }
        }
        @keyframes shake {
            0%,100% { transform: translateX(0); }
            20%      { transform: translateX(-6px); }
            40%      { transform: translateX(6px); }
            60%      { transform: translateX(-4px); }
            80%      { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
    `;
    document.head.appendChild(style);
})();
