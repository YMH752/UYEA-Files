/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
   ✅ 新增：GitHub本地ico图标加载 + emoji备用方案
   ✅ 修改：从 index.html 迁移搜索/下拉/滚动逻辑，统一全站
   ✅ 修复：选择器匹配、侧边栏类名、动画选择器
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ────────────────────────────────────────────
       1. 元素引用
       ──────────────────────────────────────────── */
    const searchEngine = document.getElementById('searchEngineSelector');
    const searchInput  = document.getElementById('searchInput');
    const sidebarItems = document.querySelectorAll('.sidebar .nav-item[data-section]');
    const bottomItems  = document.querySelectorAll('.bottom-nav .bottom-nav-item[data-section]');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    /* ────────────────────────────────────────────
       ✅ 新增：从 index.html 迁移的搜索相关元素引用
       ──────────────────────────────────────────── */
    const engineSelector   = document.getElementById('searchEngineSelector');
    const engineWrapper    = document.getElementById('engineDropdownWrapper');
    const engineTriggerBtn = document.getElementById('engineTriggerBtn');
    const engineTriggerLabel = document.getElementById('engineTriggerLabel');
    const engineOptionItems  = document.querySelectorAll('.engine-option-item');
    const cardItems        = document.querySelectorAll('.card-item');
    const sections         = document.querySelectorAll('.section-group');

    /* ────────────────────────────────────────────
       ✅ 新增：从 index.html 迁移的"全部导航"下拉元素引用
       ──────────────────────────────────────────── */
    const allNavTrigger = document.getElementById('allNavTrigger');
    const subNavMenu    = document.getElementById('subNavMenu');

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
       ✅ 新增：从 index.html 迁移的搜索功能（统一全站）
       修改位置：原 index.html 内联脚本 → script.js
       前后逻辑：原 index.html 独立实现，现与 script.js 合并
       修改目的：消除双轨逻辑，消除控制台报错
       ──────────────────────────────────────────── */
    
    /* ── 引擎下拉切换 ── */
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
                engineSelector.value = this.dataset.value;
                engineTriggerLabel.textContent = this.textContent.trim();
                engineOptionItems.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                engineWrapper.classList.remove('open');
                if (engineSelector.value === 'site') {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    document.addEventListener('click', () => {
        if (engineWrapper) engineWrapper.classList.remove('open');
    });

    /* ── 站内搜索过滤 + 外链跳转 ── */
    if (searchInput) {
        searchInput.addEventListener('input', function() {
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

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const type = engineSelector ? engineSelector.value : 'site';
                const keyword = this.value.trim();
                if (type !== 'site' && keyword !== '') {
                    const url = engineUrls[type](keyword);
                    if (isValidUrl(url)) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }
                }
            }
        });
    }

    /* ────────────────────────────────────────────
       ✅ 新增：从 index.html 迁移的"全部导航"下拉展开逻辑
       修改位置：原 index.html 内联脚本 → script.js
       前后逻辑：原 index.html 独立实现，现与 script.js 合并
       修改目的：统一全站交互逻辑，消除重复代码
       ──────────────────────────────────────────── */
    if (allNavTrigger) {
        allNavTrigger.addEventListener('click', function() {
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
            if (isHomePage) {
                const isOpening = !this.classList.contains('menu-open');
                this.classList.toggle('menu-open', isOpening);
                if (subNavMenu) subNavMenu.style.display = isOpening ? 'block' : 'none';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    /* ── 子菜单锚点平滑滚动 ── */
    document.querySelectorAll('.sub-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                /* ✅ 修改：侧边栏关闭类名 active → open，与全站逻辑一致 */
                if (window.innerWidth <= 1024) {
                    if (sidebar) sidebar.classList.remove('open');
                    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
                }
            }
        });
    });

    /* ────────────────────────────────────────────
       4. 搜索功能（保留原有 doSearch，但适配新选择器）
       ──────────────────────────────────────────── */
    window.doSearch = function() {
        const query = searchInput.value.trim();
        
        if (!query) {
            searchInput.classList.remove('shake');
            void searchInput.offsetWidth;
            searchInput.classList.add('shake');
            return;
        }

        const engine = searchEngine.value;

        if (!engineUrls[engine]) {
            console.error('Invalid search engine:', engine);
            return;
        }

        const url = engineUrls[engine](query);

        if (!isValidUrl(url)) {
            console.error('Generated invalid URL:', url);
            return;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    };

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
            
            if (!engineUrls[val]) {
                console.error('Invalid engine option:', val);
                return;
            }

            searchEngine.value = val;
            engineLabel.textContent = this.textContent.trim();
            
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
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
            setActiveNav(sectionId);
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
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
            toggleSidebar();
        }
    });

    /* ────────────────────────────────────────────
       ✅ 修改：卡片动画选择器修正（.card → .card-item）
       修改位置：script.js 动画绑定选择器
       前后逻辑：原绑定 .card 和 .empty-text-card，但 index.html 实际使用 .card-item 和 .text-status-card
       修改目的：使进入动画真正生效
       ──────────────────────────────────────────── */
    document.querySelectorAll('.card-item, .text-status-card').forEach((el, i) => {
        el.style.animation = `fadeUp 0.5s ease forwards`;
        el.style.animationDelay = `${i * 0.05}s`;
    });

    /* ────────────────────────────────────────────
       9. 波纹特效（Ripple Effect）
       ──────────────────────────────────────────── */
    document.querySelectorAll('.card-item, .nav-item, .bottom-nav-item, .text-status-card').forEach(el => {
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
        return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}/${iconFileName}`;
    }

    /* ✅ 加载单个图标 */
    function loadLocalIcon(img, iconFileName, siteName, domain) {
        const iconUrl = buildGitHubIconUrl(iconFileName);
        
        const timeoutId = setTimeout(() => {
            if (!img.complete || img.naturalHeight === 0) {
                console.warn(`Icon load timeout for ${siteName}`);
                handleIconLoadFailure(img, siteName, domain);
            }
        }, 5000);

        img.onload = () => {
            clearTimeout(timeoutId);
            img.style.opacity = '1';
            console.log(`✅ Icon loaded successfully for ${siteName} from GitHub`);
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            console.warn(`Failed to load icon for ${siteName} from GitHub`);
            handleIconLoadFailure(img, siteName, domain);
        };

        img.crossOrigin = 'anonymous';
        img.src = iconUrl;
    }

    /* ✅ 降级方案：显示emoji */
    function handleIconLoadFailure(img, siteName, domain) {
        img.style.display = 'none';
        
        const emoji = EMOJI_FALLBACK[domain] || '🔗';
        
        const emojiElement = document.createElement('div');
        emojiElement.className = 'icon-emoji';
        emojiElement.textContent = emoji;
        emojiElement.title = `${siteName} - 图标加载失败`;
        
        img.parentElement.appendChild(emojiElement);
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

            const iconFileName = ICON_FILE_MAPPING[domain];
            
            if (!iconFileName) {
                console.warn(`No icon file mapping found for ${domain}`);
                handleIconLoadFailure(img, siteName, domain);
                return;
            }

            loadLocalIcon(img, iconFileName, siteName, domain);
        });
    }

    initializeIconLoading();

    /* ────────────────────────────────────────────
       11. 可选：定期清理过期的localStorage缓存
       ──────────────────────────────────────────── */
    function cleanupLocalStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('icon_cache_') && Date.now() - parseInt(localStorage.getItem(key + '_time')) > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
            }
        });
    }

    cleanupLocalStorage();

});

/* ────────────────────────────────────────────
   12. 动态样式注入
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

/* ────────────────────────────────────────────
   13. GitHub本地图标加载配置说明
   ──────────────────────────────────────────── */
/* 
 * GitHub Raw CDN 本地ico图标加载配置
 * 
 * 配置说明：
 * - GITHUB_CONFIG.username：你的GitHub用户名（YMH752）
 * - GITHUB_CONFIG.repo：仓库名称（UYEA-Files）
 * - GITHUB_CONFIG.branch：分支名称（main 或 master）
 * - GITHUB_CONFIG.path：图标文件夹路径（UYEA-Web/Code/icons）
 * 
 * 完整URL示例：
 * https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Code/icons/chatgpt.ico
 * 
 * 加载策略：
 * - 从GitHub Raw CDN加载本地ico文件
 * - 5秒超时，防止加载过慢
 * - 加载失败则显示对应的emoji（不显示渐变）
 * 
 * Emoji映射表（EMOJI_FALLBACK）：
 * - 每个网站域名对应一个独特的emoji
 * - 如果没有对应的emoji，则使用默认的链接emoji（🔗）
 * - 可以根据需要修改emoji映射
 * 
 * 为什么用GitHub Raw CDN？
 * - raw.githubusercontent.com 在中国相对稳定
 * - 完全免费，无需额外部署
 * - 版本管理和代码在一起
 * - 修改图标直接push更新
 * 
 * 注意事项：
 * - 确保GitHub仓库设置为public（否则无法访问Raw文件）
 * - 提交后可能需要1-2分钟才能生效（GitHub缓存）
 * - 如果修改配置，只需改上面的GITHUB_CONFIG即可
 * - emoji加载失败时会显示，不影响页面效果
 */
