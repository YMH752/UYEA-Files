/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
   ✅ 新增：GitHub本地ico图标加载 + emoji备用方案
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ────────────────────────────────────────────
       1. 元素引用
       ──────────────────────────────────────────── */
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
        
        // ✅ 设置5秒超时
        const timeoutId = setTimeout(() => {
            if (!img.complete || img.naturalHeight === 0) {
                console.warn(`Icon load timeout for ${siteName}`);
                handleIconLoadFailure(img, siteName, domain);
            }
        }, 5000);

        // ✅ 图标加载成功
        img.onload = () => {
            clearTimeout(timeoutId);
            img.style.opacity = '1';
            console.log(`✅ Icon loaded successfully for ${siteName} from GitHub`);
        };

        // ✅ 图标加载失败
        img.onerror = () => {
            clearTimeout(timeoutId);
            console.warn(`Failed to load icon for ${siteName} from GitHub`);
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
                handleIconLoadFailure(img, siteName, domain);
                return;
            }

            // ✅ 加载本地GitHub图标
            loadLocalIcon(img, iconFileName, siteName, domain);
        });
    }

    /* ✅ 页面加载完成后初始化图标 */
    initializeIconLoading();

    /* ────────────────────────────────────────────
       11. 可选：定期清理过期的localStorage缓存
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
