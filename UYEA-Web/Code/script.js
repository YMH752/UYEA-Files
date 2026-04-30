/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
   ✅ 新增：GitHub本地ico图标加载 + emoji备用方案
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ════════════════════════════════════════════════════════════
       ✅ 0. SIDEBAR 终极锁定方案 - 用 JavaScript 强制固定位置
       目的：消灭页面切换时的所有跳动
       原理：监听窗口事件，实时重新计算和锁定sidebar位置
       ════════════════════════════════════════════════════════════ */
    
    function initSidebarLock() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // ✅ 定义sidebar的"标准"尺寸（这些值永远不变）
        const SIDEBAR_WIDTH = 210; // px
        const SIDEBAR_HEIGHT = window.innerHeight; // 100vh
        
        /**
         * ✅ 核心锁定函数：强制sidebar保持在正确位置
         * - 即使滚动条出现/消失，sidebar也不会跳动
         * - 即使页面高度变化，sidebar也不会跳动
         * - 即使窗口大小改变，sidebar也立即重新锁定
         */
        function lockSidebarPosition() {
            // ✅ 获取当前html元素的实际宽度（包含滚动条）
            const htmlWidth = document.documentElement.clientWidth;
            
            // ✅ 强制设置sidebar的精确位置
            sidebar.style.position = 'fixed';
            sidebar.style.left = '0px';
            sidebar.style.top = '0px';
            sidebar.style.width = SIDEBAR_WIDTH + 'px';
            sidebar.style.height = '100vh';
            sidebar.style.zIndex = '1000';
            
            // ✅ 防止任何transform或其他属性影响位置
            if (!sidebar.classList.contains('open')) {
                sidebar.style.transform = 'translateX(0)';
            }
        }

        // ✅ 方案1：页面加载完成后立即锁定
        lockSidebarPosition();

        // ✅ 方案2：监听窗口大小变化（包括滚动条出现/消失）
        window.addEventListener('resize', () => {
            lockSidebarPosition();
        });

        // ✅ 方案3：监听滚动事件（防止滚动时位置改变）
        window.addEventListener('scroll', () => {
            // sidebar的top始终是0，不会因滚动而改变
            if (sidebar.style.top !== '0px') {
                sidebar.style.top = '0px';
            }
        });

        // ✅ 方案4：监听DOM变化（内容加载导致滚动条变化时）
        const observer = new MutationObserver(() => {
            // 当DOM改变时（比如内容动态加载），重新锁定一次
            setTimeout(() => {
                lockSidebarPosition();
            }, 50);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false
        });

        // ✅ 方案5：监听页面加载完成（所有资源加载后）
        window.addEventListener('load', () => {
            lockSidebarPosition();
        });

        // ✅ 方案6：定期检查（保险起见，每100ms检查一次）
        setInterval(() => {
            if (sidebar.style.position !== 'fixed' || 
                sidebar.style.left !== '0px' || 
                sidebar.style.top !== '0px') {
                lockSidebarPosition();
            }
        }, 100);
    }

    // ✅ 页面加载时立即初始化sidebar锁定
    initSidebarLock();


    // [修改] 移除 searchEngine/searchInput（与index.html内嵌脚本ID不匹配，造成冲突）
    // [修改] 移除 sidebarItems/bottomItems（三页均无data-section属性，静默失效）
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    /* ────────────────────────────────────────────
       2. 搜索引擎配置
       ──────────────────────────────────────────── */
    // [修改] 移除 engineUrls / savedEngine（引擎切换逻辑已移至index.html内嵌脚本，此处不再需要）

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
    // [修改] 移除 doSearch() 函数及 Enter 监听（依赖已移除的searchEngine/searchInput，各页内嵌脚本已独立实现）

    /* ────────────────────────────────────────────
       5. 搜索引擎切换（带localStorage保存）
       ──────────────────────────────────────────── */
    // [修改] 移除引擎切换逻辑（engineBtn/engineDropdown ID与index.html不匹配，已移至index.html内嵌脚本）

    /* ────────────────────────────────────────────
       6. 侧边栏导航点击切换
       ──────────────────────────────────────────── */
    // [修改] 移除 setActiveNav / sidebarItems 逻辑（三页均无data-section属性，完全静默失效）

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
    // [修改] .card-item 改为 .card-item:has(.card-icon)
    // 修改前：对所有.card-item生效，工具页无图标卡片触发后overflow:hidden裁切内容，显示异常
    // 修改后：仅对含.card-icon的卡片生效，工具页卡片不受影响
    document.querySelectorAll('.card, .nav-item, .bottom-nav-item, .empty-text-card, .card-item:has(.card-icon)').forEach(el => {
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

    /* ✅ 加载单个图标 */
    function loadLocalIcon(img, iconFileName, siteName, domain) {
        // ✅ 构建GitHub图标URL
        const iconUrl = buildGitHubIconUrl(iconFileName);
        
        // ✅ 设置3秒超时（[修改] 5000ms → 3000ms，减少用户等待时间）
        const timeoutId = setTimeout(() => {
            if (!img.complete || img.naturalHeight === 0) {
                // [新增] 超时也移除骨架屏class
                img.closest('.card-icon')?.classList.remove('skeleton');
                handleIconLoadFailure(img, siteName, domain);
            }
        }, 3000);

        // ✅ 图标加载成功
        img.onload = () => {
            clearTimeout(timeoutId);
            // [修改] 移除 console.log 调试输出，生产环境无需打印每个图标加载状态
            // [新增] 加载成功移除骨架屏class，触发图标显示
            img.closest('.card-icon')?.classList.remove('skeleton');
            img.style.opacity = '1';
        };

        // ✅ 图标加载失败
        img.onerror = () => {
            clearTimeout(timeoutId);
            // [修改] 移除 console.warn 调试输出
            // [新增] 加载失败也移除骨架屏class
            img.closest('.card-icon')?.classList.remove('skeleton');
            handleIconLoadFailure(img, siteName, domain);
        };

        // ✅ 设置跨域属性并加载
        img.crossOrigin = 'anonymous';
        img.src = iconUrl;
    }

    /* ✅ 降级方案：显示emoji */
    function handleIconLoadFailure(img, siteName, domain) {
        // ✅ 隐藏失败的img标签
        img.style.display = 'none';
        
        // ✅ 获取对应的emoji（如果没有则用默认的链接emoji）
        const emoji = EMOJI_FALLBACK[domain] || '🔗';
        
        // ✅ 创建emoji元素
        const emojiElement = document.createElement('div');
        emojiElement.className = 'icon-emoji';
        emojiElement.textContent = emoji;
        emojiElement.title = `${siteName} - 图标加载失败`;
        
        // ✅ 将emoji元素插入到父容器中
        img.parentElement.appendChild(emojiElement);
        // [修改] 移除 console.log emoji调试输出
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

    /* ✅ 初始化所有卡片的图标加载（懒加载版本）
       [修改] 原：页面加载后立即并发请求全部图标
       现：IntersectionObserver监听，图标进入视口时才发起请求
       未进入视口的图标保持skeleton骨架屏占位，不占用网络带宽 */
    function initializeIconLoading() {
        // [新增] 检测IntersectionObserver支持，不支持则降级为立即加载
        const useObserver = 'IntersectionObserver' in window;

        const observer = useObserver ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                const domain = img.getAttribute('data-domain');
                const siteName = img.getAttribute('data-site-name');
                const iconFileName = ICON_FILE_MAPPING[domain];
                if (iconFileName) {
                    loadLocalIcon(img, iconFileName, siteName, domain);
                } else {
                    img.closest('.card-icon')?.classList.remove('skeleton');
                    handleIconLoadFailure(img, siteName, domain);
                }
                obs.unobserve(img);
            });
        }, {
            rootMargin: '100px' // 提前100px开始加载，避免进入视口时才开始出现骨架
        }) : null;

        document.querySelectorAll('.card-icon img').forEach(img => {
            const domain = img.getAttribute('data-domain');
            const siteName = img.getAttribute('data-site-name');

            if (!domain || !siteName) {
                return;
            }

            // [新增] 添加骨架屏占位class
            img.closest('.card-icon')?.classList.add('skeleton');

            if (useObserver) {
                // 懒加载：交给IntersectionObserver在进入视口时处理
                observer.observe(img);
            } else {
                // 降级：立即加载
                const iconFileName = ICON_FILE_MAPPING[domain];
                if (!iconFileName) {
                    img.closest('.card-icon')?.classList.remove('skeleton');
                    handleIconLoadFailure(img, siteName, domain);
                    return;
                }
                loadLocalIcon(img, iconFileName, siteName, domain);
            }
        });
    }

    /* ✅ 页面加载完成后初始化图标 */
    initializeIconLoading();

    /* ────────────────────────────────────────────
       11. 可选：定期清理过期的localStorage缓存
       ──────────────────────────────────────────── */
    function cleanupLocalStorage() {
        // [修改] 加前缀过滤，只遍历 icon_cache_ 开头的key
        // 修改前：Object.keys(localStorage) 遍历所有key，包含无关数据
        // 修改后：先过滤出目标前缀key，避免无意义遍历
        const keys = Object.keys(localStorage).filter(k => k.startsWith('icon_cache_') && !k.endsWith('_time'));
        keys.forEach(key => {
            if (Date.now() - parseInt(localStorage.getItem(key + '_time')) > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
            }
        });
    }

    // ✅ 每次页面加载时清理缓存
    cleanupLocalStorage();

    /* ────────────────────────────────────────────
       [新增] 主题切换（暗色/亮色模式）
       ────────────────────────────────────────────
       功能说明：
       - 首次访问：检测 prefers-color-scheme，自动适配设备主题
       - 手动切换：点击圆角矩形按钮，滑块丝滑滑动，emoji 高亮切换
       - 记忆功能：localStorage 保存用户选择，下次访问优先读取
       - 系统监听：未手动设置时，跟随系统主题变化自动切换
       修改目的：按需求重新构建暗色模式切换按钮 */
    function initThemeToggle() {
        const STORAGE_KEY = 'uyea-theme';
        const html = document.documentElement;
        const toggles = document.querySelectorAll('.theme-toggle');

        function applyTheme(theme) {
            if (theme === 'dark') {
                html.setAttribute('data-theme', 'dark');
            } else {
                html.removeAttribute('data-theme');
            }
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (e) {}
        }

        function getSavedTheme() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return saved;
            } catch (e) {}
            return null;
        }

        // 初始化：优先 localStorage，其次设备偏好
        const saved = getSavedTheme();
        if (saved) {
            applyTheme(saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        }

        // 点击切换
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                applyTheme(current === 'dark' ? 'light' : 'dark');
            });
        });

        // 监听系统主题变化（仅在用户未手动设置时生效）
        if (window.matchMedia) {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            mql.addEventListener('change', (e) => {
                if (!getSavedTheme()) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    initThemeToggle();

    /* ────────────────────────────────────────────
       [新增] 14. 页面切换过渡（方案C）
       原生：检测到View Transitions API → startViewTransition跳转
       降级：无API → body.leaving淡出 → 延迟跳转 → 新页body.loaded淡入
       仅拦截站内同域链接，外链/hash链接不处理
       ──────────────────────────────────────────── */
    /* [修改] 删除此注释下方的页面切换过渡逻辑（loaded类、navigateTo函数、链接点击拦截）
       修改前：页面加载时添加loaded类淡入，拦截站内链接用navigateTo执行淡出/View Transition后跳转
       修改后：彻底移除，恢复默认浏览器跳转行为
       修改目的：按需求彻底去掉三个页面的切换动画 */

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
