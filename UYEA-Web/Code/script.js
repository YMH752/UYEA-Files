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
       3. URL验证函数（安全防护）
       ──────────────────────────────────────────── */
    function isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        } catch (e) {
            console.error('Invalid URL:', e);
            return false;
        }
    }

    /* ────────────────────────────────────────────
       4. 搜索功能
       ──────────────────────────────────────────── */
    window.doSearch = function() {
        const query = searchInput.value.trim();
        
        if (!query) {
            // ✅ 输入为空时的反馈：抖动动画
            searchInput.classList.remove('shake');
            void searchInput.offsetWidth;
            searchInput.classList.add('shake');
            return;
        }

        const engine = searchEngine.value;

        // ✅ 验证搜索引擎类型是否合法
        if (!engineUrls[engine]) {
            console.error('Invalid search engine:', engine);
            return;
        }

        const url = engineUrls[engine](query);

        // ✅ 验证生成的URL是否有效
        if (!isValidUrl(url)) {
            console.error('Generated invalid URL:', url);
            return;
        }

        // ✅ 使用 noopener,noreferrer 防止安全漏洞
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // ✅ 监听回车键
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
    }

    /* ────────────────────────────────────────────
       5. 搜索引擎切换（带localStorage保存）
       ──────────────────────────────────────────── */
    const engineBtn = document.getElementById('engineBtn');
    const engineDropdown = document.getElementById('engineDropdown');
    const engineLabel = document.getElementById('engineLabel');
    const engineOptions = engineDropdown?.querySelectorAll('.engine-option') || [];

    if (engineBtn) {
        engineBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isNowOpen = engineDropdown.classList.toggle('open');
            engineBtn.classList.toggle('open', isNowOpen);
        });
    }

    engineOptions.forEach(opt => {
        opt.addEventListener('click', function(e) {
            e.stopPropagation();
            const val = this.dataset.value;
            
            // ✅ 验证选项合法性
            if (!engineUrls[val]) {
                console.error('Invalid engine option:', val);
                return;
            }

            searchEngine.value = val;
            engineLabel.textContent = this.textContent.trim();
            
            // ✅ 保存到localStorage
            try {
                localStorage.setItem('uyea_preferred_search_engine', val);
            } catch (e) {
                console.warn('localStorage not available:', e);
            }
            
            engineOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            engineDropdown.classList.remove('open');
            engineBtn.classList.remove('open');
        });
    });

    document.addEventListener('click', () => {
        engineDropdown?.classList.remove('open');
        engineBtn?.classList.remove('open');
    });

    /* ────────────────────────────────────────────
       6. 侧边栏导航点击切换
       ──────────────────────────────────────────── */
    function setActiveNav(sectionId) {
        sidebarItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });
        bottomItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            const target = document.getElementById(sectionId);
            if (target) {
                // ✅ 平滑滚动到目标区域
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
            setActiveNav(sectionId);
            // ✅ 移动端关闭菜单
            if (window.innerWidth <= 1023) {
                toggleSidebar();
            }
        });
    });

    /* ────────────────────────────────────────────
       7. 移动端汉堡菜单
       ──────────────────────────────────────────── */
    function toggleSidebar() {
        const isOpen = sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('open', isOpen);
        hamburgerBtn.setAttribute('aria-expanded', isOpen);
        
        // ✅ 阻止body滚动
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // ✅ ESC键关闭菜单
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
            toggleSidebar();
        }
    });

    /* ────────────────────────────────────────────
       8. 卡片动画（性能优化）
       ──────────────────────────────────────────── */
    document.querySelectorAll('.card, .empty-text-card').forEach((el, i) => {
        el.style.animation = `fadeUp 0.5s ease backwards`;
        el.style.animationDelay = `${i * 0.05}s`;
    });

    /* ────────────────────────────────────────────
       9. 波纹特效（Ripple Effect）
       ──────────────────────────────────────────── */
    document.querySelectorAll('.card, .nav-item, .bottom-nav-item, .empty-text-card').forEach(el => {
        el.addEventListener('pointerdown', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            
            ripple.style.cssText = `
                position:absolute; width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size/2}px;
                top:${e.clientY - rect.top - size/2}px;
                background:rgba(0,120,212,0.1); border-radius:50%;
                transform:scale(0); animation:ripple 0.5s ease-out forwards;
                pointer-events:none; z-index:0;
            `;
            
            if (window.getComputedStyle(this).position === 'static') this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    /* ────────────────────────────────────────────
       ✅ 10. 新增：GitHub本地ico图标加载
       方案说明：
       - 从GitHub raw.githubusercontent.com加载本地ico文件
       - 5秒超时防止加载过慢
       - 加载失败则显示emoji（不显示渐变）
       
       GitHub图标URL格式：
       https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Code/icons/chatgpt.ico
       ──────────────────────────────────────────── */

    /* ✅ GitHub配置（请根据实际修改） */
    const GITHUB_CONFIG = {
        username: 'YMH752',        // ✅ 你的GitHub用户名
        repo: 'UYEA-Files',        // ✅ 你的仓库名
        branch: 'main',            // ✅ 分支名（通常是main或master）
        path: 'UYEA-Web/Code/icons' // ✅ 图标文件夹路径
    };

    /* ✅ Emoji映射表（加载失败时显示） */
    const EMOJI_FALLBACK = {
        // ✅ AI部分
        'gemini.google.com': '🔮',
        'chatgpt.com': '🤖',
        'claude.ai': '💬',
        'deepseek.com': '🔍',
        'yiyan.baidu.com': '💡',
        'qianwen.aliyun.com': '✨',
        'kimi.ai': '🎯',
        'doubao.com': '🎁',
        'yuanbao.tencent.com': '💎',
        'perplexity.ai': '🧠',
        'grok.com': '⚡',
        'copilot.cloud.microsoft': '🚀',
        
        // ✅ 生活部分
        'xiaohongshu.com': '📸',
        'bilibili.com': '🎬',
        'zhihu.com': '❓',
        
        // ✅ 工具部分
        'github.com': '🐙',
        'tinypng.com': '🗜️',
        'v0.dev': '⚙️'
    };

    /* ✅ 构建GitHub RAW URL */
    function buildGitHubIconUrl(iconFileName) {
        // ✅ 构建完整的GitHub Raw CDN URL
        return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}/${iconFileName}`;
    }

    /* ✅ 加载单个图标 (优化项 3/5：修改此函数) */
    function loadLocalIcon(img, iconFileName, siteName, domain) {
        const iconContainer = img.parentElement; // 获取.card-icon容器
        // 优化项 3/5：为容器添加加载中状态
        iconContainer.classList.add('loading');
        
        const iconUrl = buildGitHubIconUrl(iconFileName);
        
        const timeoutId = setTimeout(() => {
            if (!img.complete || img.naturalHeight === 0) {
                console.warn(`Icon load timeout for ${siteName}`);
                handleIconLoadFailure(img, siteName, domain, iconContainer);
            }
        }, 5000);

        // ✅ 图标加载成功
        img.onload = () => {
            clearTimeout(timeoutId);
            // 优化项 3/5：移除加载中状态，添加加载成功类，触发淡入
            iconContainer.classList.remove('loading');
            img.classList.add('loaded');
            console.log(`✅ Icon loaded successfully for ${siteName} from GitHub`);
        };

        // ✅ 图标加载失败
        img.onerror = () => {
            clearTimeout(timeoutId);
            console.warn(`Failed to load icon for ${siteName} from GitHub`);
            handleIconLoadFailure(img, siteName, domain, iconContainer);
        };

        // ✅ 设置跨域属性并加载
        img.crossOrigin = 'anonymous';
        img.src = iconUrl;
    }

    /* ✅ 降级方案：显示emoji (优化项 3/5：修改此函数) */
    function handleIconLoadFailure(img, siteName, domain, iconContainer) {
        // 优化项 3/5：确保移除加载中状态
        iconContainer.classList.remove('loading');
        
        // ✅ 隐藏失败的img标签
        img.style.display = 'none';
        
        // ✅ 获取对应的emoji（如果没有则用默认的链接emoji）
        const emoji = EMOJI_FALLBACK[domain] || '🔗';
        
        // ✅ 创建emoji元素
        const emojiElement = document.createElement('div');
        emojiElement.className = 'icon-emoji';
        emojiElement.textContent = emoji;
        emojiElement.title = `${siteName}`; // 简化和美化提示文字
        
        // ✅ 将emoji元素插入到父容器中
        iconContainer.appendChild(emojiElement);
        console.log(`😊 Using emoji for ${siteName}: ${emoji}`);
    }

    /* ✅ 图标文件名映射表 */
    const ICON_FILE_MAPPING = {
        // ✅ AI部分
        'gemini.google.com': 'gemini.ico',
        'chatgpt.com': 'chatgpt.ico',
        'claude.ai': 'claude.ico',
        'deepseek.com': 'deepseek.ico',
        'yiyan.baidu.com': 'yiyan.ico',
        'qianwen.aliyun.com': 'qianwen.ico',
        'kimi.ai': 'kimi.ico',
        'doubao.com': 'doubao.ico',
        'yuanbao.tencent.com': 'yuanbao.ico',
        'perplexity.ai': 'perplexity.ico',
        'grok.com': 'grok.ico',
        'copilot.cloud.microsoft': 'copilot.ico',
        
        // ✅ 生活部分
        'xiaohongshu.com': 'xiaohongshu.ico',
        'bilibili.com': 'bilibili.ico',
        'zhihu.com': 'zhihu.ico',
        
        // ✅ 工具部分
        'github.com': 'github.ico',
        'tinypng.com': 'tinypng.ico',
        'v0.dev': 'v0dev.ico'
    };

    /* ✅ 初始化所有卡片的图标加载 */
    function initializeIconLoading() {
        document.querySelectorAll('.card-icon img').forEach(img => {
            const domain = img.getAttribute('data-domain');
            const siteName = img.getAttribute('data-site-name');
            
            if (!domain || !siteName) {
                console.warn('Missing domain or site-name attribute');
                return;
            }

            // ✅ 从映射表获取图标文件名
            const iconFileName = ICON_FILE_MAPPING[domain];
            
            if (!iconFileName) {
                console.warn(`No icon file mapping found for ${domain}`);
                handleIconLoadFailure(img, siteName, domain, img.parentElement);
                return;
            }

            // ✅ 加载本地GitHub图标
            loadLocalIcon(img, iconFileName, siteName, domain);
        });
    }

    /* ✅ 页面加载完成后初始化图标 */
    initializeIconLoading();

    /* ────────────────────────────────────────────
       ✅ 11. 由 index.html 和 tools.html 迁移的通用脚本逻辑
       ──────────────────────────────────────────── */

    /* 首页 (index.html) 侧边栏“全部导航”下拉菜单逻辑 */
    const allNavTrigger = document.getElementById('allNavTrigger');
    const subNavMenu    = document.getElementById('subNavMenu');
    if (allNavTrigger && subNavMenu) {
        allNavTrigger.addEventListener('click', function() {
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
            if (isHomePage) {
                const isOpening = !this.classList.contains('menu-open');
                this.classList.toggle('menu-open', isOpening);
                subNavMenu.style.display = isOpening ? 'block' : 'none';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    /* 首页 (index.html) 侧边栏子菜单锚点平滑滚动 */
    document.querySelectorAll('.sub-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar').classList.remove('active');
                    document.getElementById('sidebarOverlay').classList.remove('active');
                }
            }
        });
    });

    /* 首页 (index.html) 顶栏搜索引擎切换与搜索逻辑 */
    const searchInput2      = document.getElementById('searchInput');
    const engineSelector   = document.getElementById('searchEngineSelector');
    const engineWrapper    = document.getElementById('engineDropdownWrapper');
    const engineTriggerBtn = document.getElementById('engineTriggerBtn');
    const engineTriggerLabel = document.getElementById('engineTriggerLabel');
    const engineOptionItems  = document.querySelectorAll('.engine-option-item');
    const cardItems        = document.querySelectorAll('.card-item');
    const sections         = document.querySelectorAll('.section-group');

    const engineUrls2 = {
        baidu:  "https://www.baidu.com/s?wd=",
        google: "https://www.google.com/search?q=",
        bing:   "https://cn.bing.com/search?q="
    };

    if (engineTriggerBtn) {
        engineTriggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            engineWrapper.classList.toggle('open');
        });
    }

    if (engineOptionItems.length > 0) {
        engineOptionItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                if (engineSelector) engineSelector.value = this.dataset.value;
                engineTriggerLabel.textContent = this.textContent.trim();
                engineOptionItems.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                engineWrapper.classList.remove('open');
                if (engineSelector && engineSelector.value === 'site' && searchInput2) searchInput2.dispatchEvent(new Event('input'));
            });
        });
    }

    document.addEventListener('click', () => { if(engineWrapper) engineWrapper.classList.remove('open'); });

    if (searchInput2) {
        searchInput2.addEventListener('input', function() {
            if (engineSelector && engineSelector.value === 'site') {
                const keyword = this.value.toLowerCase().trim();
                cardItems.forEach(card => {
                    const title = card.querySelector('.card-title').textContent.toLowerCase();
                    card.style.display = title.includes(keyword) ? 'flex' : 'none';
                });
                sections.forEach(section => {
                    const hasVisibleCards = Array.from(section.querySelectorAll('.card-item')).some(c => c.style.display !== 'none');
                    section.style.display = hasVisibleCards ? 'block' : 'none';
                });
            }
        });

        searchInput2.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const type = engineSelector ? engineSelector.value : 'site';
                const keyword = this.value.trim();
                if (type !== 'site' && keyword !== '') {
                    window.open(engineUrls2[type] + encodeURIComponent(keyword), '_blank');
                }
            }
        });
    }

    /* 工具页 (tools.html) 侧边栏“实用工具”下拉菜单逻辑 */
    const toolsNavTrigger = document.getElementById('toolsNavTrigger');
    const toolsSubMenu = document.getElementById('toolsSubMenu');
    if (toolsNavTrigger && toolsSubMenu) {
        toolsNavTrigger.addEventListener('click', function() {
            const isOpening = this.classList.toggle('menu-open');
            toolsSubMenu.style.display = isOpening ? 'block' : 'none';
        });
    }

    /* 工具页 (tools.html) 内容区分类标签切换与搜索逻辑 */
    const tabItems = document.querySelectorAll('.tab-item');
    const toolGroups = document.querySelectorAll('.tool-group');
    if (tabItems.length > 0) {
        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                tabItems.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const cat = this.dataset.category;
                toolGroups.forEach(g => {
                    g.style.display = (cat === 'all' || g.dataset.category === cat) ? 'block' : 'none';
                });
            });
        });
    }

    const toolSearchInput = document.getElementById('toolSearchInput');
    const toolCards = document.querySelectorAll('.card-item'); // 注意：此选择器在工具页和首页都会生效，但在不同页面上下文不同
    if (toolSearchInput && toolGroups.length > 0) {
        toolSearchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            toolCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                card.style.display = title.includes(keyword) ? 'flex' : 'none';
            });
            toolGroups.forEach(group => {
                const hasVisible = Array.from(group.querySelectorAll('.card-item')).some(c => c.style.display !== 'none');
                group.style.display = hasVisible ? 'block' : 'none';
            });
        });
    }

    /* ────────────────────────────────────────────
       12. 可选：定期清理过期的localStorage缓存
       ──────────────────────────────────────────── */
    function cleanupLocalStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('icon_cache_') && Date.now() - parseInt(localStorage.getItem(key + '_time')) > 7 * 24 * 60 * 60 * 1000) {
                // ✅ 清理7天以前的缓存
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
            }
        });
    }

    // ✅ 每次页面加载时清理缓存
    cleanupLocalStorage();

});

/* ────────────────────────────────────────────
   13. 动态样式注入
   ──────────────────────────────────────────── */
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* ── 进入动画 ── */
        @keyframes fadeUp {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        /* ── 波纹特效 ── */
        @keyframes ripple { 
            to { 
                transform: scale(1); 
                opacity: 0; 
            } 
        }

        /* ── 抖动反馈 ── */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .shake { 
            animation: shake 0.3s ease-in-out; 
        }
    `;
    document.head.appendChild(style);
})();
