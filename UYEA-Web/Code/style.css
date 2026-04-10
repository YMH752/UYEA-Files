/* ============================================================
   UYEA 悠野工作室 · script.js
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

    // 所有导航项（侧边栏 + 底部导航）
    const sidebarItems  = document.querySelectorAll('.sidebar .nav-item[data-section]');
    const bottomItems   = document.querySelectorAll('.bottom-nav .bottom-nav-item[data-section]');
    // 所有内容分区
    const sections      = document.querySelectorAll('.content-section[id]');


    /* ──────────────────────────────────────────
       2. 搜索功能
    ────────────────────────────────────────── */
    const engineUrls = {
        baidu:  q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
        google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        bing:   q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    };

    window.handleSearch = () => {
        const query = searchInput.value.trim();
        if (!query) {
            // 空查询时输入框抖动提示
            searchInput.closest('.search-wrapper').classList.add('shake');
            setTimeout(() => searchInput.closest('.search-wrapper').classList.remove('shake'), 500);
            return;
        }
        const engine = searchEngine.value;
        const url = (engineUrls[engine] || engineUrls.baidu)(query);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // 回车触发搜索
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') window.handleSearch();
    });


    /* ──────────────────────────────────────────
       3. 汉堡菜单 & 侧边栏
    ────────────────────────────────────────── */
    const openSidebar = () => {
        sidebar.classList.add('open');
        hamburgerBtn.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    };

    hamburgerBtn?.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    // 遮罩点击关闭
    overlay?.addEventListener('click', closeSidebar);

    // ESC键关闭侧边栏
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSidebar();
    });

    // 窗口变宽时自动重置侧边栏状态（避免从手机转PC后侧边栏卡住）
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeSidebar();
            document.body.style.overflow = ''; // 确保解锁滚动
        }
    });


    /* ──────────────────────────────────────────
       4. 卡片入场动画错峰延迟
    ────────────────────────────────────────── */
    document.querySelectorAll('.card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.06}s`;
    });


    /* ──────────────────────────────────────────
       5. 导航高亮联动（侧边栏 + 底部导航同步）
    ────────────────────────────────────────── */
    const setActiveNav = (sectionId) => {
        // 同步侧边栏高亮
        sidebarItems.forEach(item => {
            const match = item.dataset.section === sectionId;
            item.classList.toggle('active', match);
        });
        // 同步底部导航高亮
        bottomItems.forEach(item => {
            const match = item.dataset.section === sectionId;
            item.classList.toggle('active', match);
        });
    };


    /* ──────────────────────────────────────────
       6. 点击导航平滑滚动
    ────────────────────────────────────────── */
    const handleNavClick = (item, e) => {
        const sectionId = item.dataset.section;
        const target = document.getElementById(sectionId);

        if (target) {
            e.preventDefault();
            // 计算滚动偏移（考虑顶部导航栏高度）
            const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH - 12;

            // 在主内容区滚动（PC端）或整页滚动（移动端）
            if (mainContent && window.innerWidth >= 1024) {
                mainContent.scrollTo({ top: target.offsetTop - 12, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }

            setActiveNav(sectionId);

            // 移动端点击后关闭侧边栏
            if (window.innerWidth < 1024) closeSidebar();
        }
    };

    sidebarItems.forEach(item => {
        item.addEventListener('click', e => handleNavClick(item, e));
    });

    bottomItems.forEach(item => {
        item.addEventListener('click', e => handleNavClick(item, e));
    });


    /* ──────────────────────────────────────────
       7. 滚动监听自动高亮（IntersectionObserver）
    ────────────────────────────────────────── */
    if (sections.length > 0) {
        const observer = new IntersectionObserver(
            (entries) => {
                // 找到当前可见度最高的section
                let maxRatio = 0;
                let activeSectionId = null;
                entries.forEach(entry => {
                    if (entry.intersectionRatio > maxRatio) {
                        maxRatio = entry.intersectionRatio;
                        activeSectionId = entry.target.id;
                    }
                });
                if (activeSectionId) setActiveNav(activeSectionId);
            },
            {
                root: null,
                rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '64')}px 0px -40% 0px`,
                threshold: [0, 0.25, 0.5, 0.75, 1.0],
            }
        );

        sections.forEach(section => observer.observe(section));
    }


    /* ──────────────────────────────────────────
       8. 卡片波纹点击效果（Ripple Effect）
    ────────────────────────────────────────── */
    document.querySelectorAll('.card:not(.card-placeholder)').forEach(card => {
        card.addEventListener('pointerdown', function(e) {
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
            `;
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

});


/* ──────────────────────────────────────────
   9. 全局动态样式注入（Ripple + Shake）
────────────────────────────────────────── */
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
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
.shake { animation: shake 0.4s var(--ease-smooth); }
`;
document.head.appendChild(dynamicStyles);