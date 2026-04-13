/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
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
       7. 移动端汉堡菜单（✅新增）
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
       10. ✅ 图片加载失败处理（重要：快速显示）
       ──────────────────────────────────────────── */
    document.querySelectorAll('.card-icon img').forEach(img => {
        // ✅ 添加加载中的视觉反馈
        img.loading = 'lazy';
        
        img.addEventListener('error', function() {
            console.warn('Failed to load icon:', this.src);
            this.style.display = 'none';
            
            // ✅ 加载失败时显示备用图标
            const fallback = document.createElement('span');
            fallback.className = 'icon-fallback';
            fallback.textContent = '🔗';
            fallback.setAttribute('title', '图标加载失败，点击访问');
            
            this.parentElement.appendChild(fallback);
        });

        // ✅ 添加加载成功的过度效果
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });

});

/* ────────────────────────────────────────────
   11. 动态样式注入
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

/* ────────────────────────────────────────────
   12. ✅ 图标URL映射表（便于后续更新）
   ──────────────────────────────────────────── */
/* 
 * 说明：这个映射表用于快速更新图标源
 * 当某个网站的favicon改变时，只需修改这里的URL
 * 无需修改HTML中的图片标签
 * 
 * 使用方法：
 * 1. 如果icon.horse / cdn.jsdelivr无法获取最新图标
 * 2. 可以从官网直接获取：website.com/favicon.ico
 * 3. 更新对应的URL即可
 * 
 * 当前策略：
 * - 优先使用官网favicon：website.com/favicon.ico
 * - 备选使用jsDelivr CDN：cdn.jsdelivr.net
 */
const ICON_URLS = {
    'gemini.google.com': 'https://www.google.com/favicon.ico',
    'chatgpt.com': 'https://chatgpt.com/favicon.ico',
    'deepseek.com': 'https://www.deepseek.com/favicon.ico',
    'doubao.com': 'https://www.doubao.com/favicon.ico',
    'yiyan.baidu.com': 'https://yiyan.baidu.com/favicon.ico',
    'qianwen.aliyun.com': 'https://qianwen.aliyun.com/favicon.ico',
    'grok.com': 'https://grok.com/favicon.ico',
    'claude.ai': 'https://www.claude.ai/favicon.ico',
    'yuanbao.com': 'https://www.yuanbao.com/favicon.ico',
    'kimi.ai': 'https://www.kimi.ai/favicon.ico',
    'perplexity.ai': 'https://www.perplexity.ai/favicon.ico',
    'microsoft.com': 'https://www.microsoft.com/favicon.ico',
    'xiaohongshu.com': 'https://www.xiaohongshu.com/favicon.ico',
    'weibo.com': 'https://weibo.com/favicon.ico',
    'zhihu.com': 'https://www.zhihu.com/favicon.ico',
    'taobao.com': 'https://www.taobao.com/favicon.ico',
    'jd.com': 'https://www.jd.com/favicon.ico',
    'baidu.com': 'https://www.baidu.com/favicon.ico',
    'mozilla.org': 'https://developer.mozilla.org/favicon.ico',
    'stackoverflow.com': 'https://stackoverflow.com/favicon.ico'
};

// ✅ 可选：定期清理过期的localStorage缓存
function cleanupLocalStorage() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('icon_cache_') && Date.now() - parseInt(localStorage.getItem(key + '_time')) > 7 * 24 * 60 * 60 * 1000) {
            // 清理7天以前的缓存
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_time');
        }
    });
}

// 每次页面加载时清理缓存
cleanupLocalStorage();
