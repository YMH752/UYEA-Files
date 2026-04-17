/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
   ✅ 新增：GitHub本地ico图标加载 + emoji备用方案
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ────────────────────────────────────────────
       1. 元素引用
       ──────────────────────────────────────────── */
    const searchEngine = document.getElementById('searchEngine');
    const searchInput  = document.getElementById('searchInput');
    const sidebarItems = document.querySelectorAll('.sidebar .nav-item[data-section]');
    const bottomItems  = document.querySelectorAll('.bottom-nav .bottom-nav-item[data-section]');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    /* ────────────────────────────────────────────
       2. 搜索引擎配置
       ──────────────────────────────────────────── */
    const engineUrls = {
        baidu:  q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
        google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        bing:   q => `https://cn.bing.com/search?q=${encodeURIComponent(q)}`
    };

    /* ✅ 优化：localStorage 保存搜索引擎选择 */
    const savedEngine = localStorage.getItem('uyea_preferred_search_engine') || 'baidu';
    if (searchEngine && engineUrls[savedEngine]) {
        searchEngine.value = savedEngine;
    }

    /* ────────────────────────────────────────────
       3. 搜索跳转逻辑
       ──────────────────────────────────────────── */
    const handleSearch = () => {
        const engine = searchEngine ? searchEngine.value : 'baidu';
        const query = searchInput.value.trim();
        if (query && engineUrls[engine]) {
            window.open(engineUrls[engine](query), '_blank');
        } else if (!query) {
            searchInput.classList.add('shake');
            setTimeout(() => searchInput.classList.remove('shake'), 300);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    if (searchEngine) {
        searchEngine.addEventListener('change', () => {
            localStorage.setItem('uyea_preferred_search_engine', searchEngine.value);
        });
    }

    /* ────────────────────────────────────────────
       4. 侧边栏与底部导航联动 (Section滚动)
       ──────────────────────────────────────────── */
    const scrollToSection = (sectionId) => {
        const target = document.getElementById(sectionId);
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // 移动端点击后自动收起侧边栏
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        }
    };

    [...sidebarItems, ...bottomItems].forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = item.getAttribute('data-section');
            if (sectionId && document.getElementById(sectionId)) {
                e.preventDefault();
                scrollToSection(sectionId);
                
                // 更新激活状态
                [...sidebarItems, ...bottomItems].forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    /* ────────────────────────────────────────────
       5. 移动端菜单开关逻辑
       ──────────────────────────────────────────── */
    const openSidebar = () => {
        sidebar.style.display = 'block';
        setTimeout(() => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        }, 10);
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        setTimeout(() => {
            sidebar.style.display = '';
        }, 300);
    };

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    /* ────────────────────────────────────────────
       6. GitHub本地图标加载配置
       ──────────────────────────────────────────── */
    const GITHUB_CONFIG = {
        username: 'YMH752',
        repo: 'UYEA-Files',
        branch: 'main',
        path: 'UYEA-Web/Code/icons'
    };

    const getGitHubIconUrl = (iconName) => {
        return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}/${iconName}.ico`;
    };

    // 映射表：数据标识 -> 图标文件名
    const iconMap = {
        'chatgpt': 'chatgpt',
        'claude': 'claude',
        'kimi': 'kimi',
        'midjourney': 'midjourney',
        'liblib': 'liblib'
    };

    // 备用Emoji表
    const emojiFallback = {
        'chatgpt': '🤖',
        'claude': '🧠',
        'kimi': '🌙',
        'midjourney': '🎨',
        'liblib': '🖼️'
    };

    /* ────────────────────────────────────────────
       7. 初始化所有卡片图标
       ──────────────────────────────────────────── */
    const initIcons = () => {
        const cards = document.querySelectorAll('.card-item[data-icon]');
        
        cards.forEach(card => {
            const iconKey = card.getAttribute('data-icon');
            const iconContainer = card.querySelector('.card-icon');
            if (!iconContainer || !iconKey) return;

            const iconUrl = getGitHubIconUrl(iconMap[iconKey] || iconKey);
            
            const img = new Image();
            img.src = iconUrl;
            img.alt = iconKey;
            img.className = 'fade-in';

            // 加载成功
            img.onload = () => {
                iconContainer.innerHTML = '';
                iconContainer.appendChild(img);
            };

            // 加载失败或超时 (5秒)
            const timeout = setTimeout(() => {
                if (!img.complete || img.naturalWidth === 0) {
                    showEmoji(iconContainer, iconKey);
                }
            }, 5000);

            img.onerror = () => {
                clearTimeout(timeout);
                showEmoji(iconContainer, iconKey);
            };
        });
    };

    const showEmoji = (container, key) => {
        const emoji = emojiFallback[key] || '🔗';
        container.innerHTML = `<div class="icon-emoji">${emoji}</div>`;
    };

    initIcons();
});

/* ────────────────────────────────────────────
   8. 全局辅助样式 (用于JS动画)
   ──────────────────────────────────────────── */
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar { transition: transform 0.3s ease; }
        @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%); position: fixed; z-index: 1001; }
            .sidebar.open { transform: translateX(0); }
        }
        .sidebar-overlay { transition: opacity 0.3s ease; pointer-events: none; opacity: 0; }
        .sidebar-overlay.active { pointer-events: auto; opacity: 1; }
        
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .shake { 
            animation: shake 0.3s ease-in-out; 
        }

        /* ✅ 图标加载失败时的emoji样式 */
        .icon-emoji {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 600;
            user-select: none;
        }
    `;
    document.head.appendChild(style);
})();
