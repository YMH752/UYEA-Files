/* ============================================================
   UYEA 悠野工作室 · script.js (优化版)
   优化内容：菜单统一、图标加载、localStorage保存、汉堡菜单
   ✅ 新增：国内百度+搜狗favicon服务 + Promise.race并行加载
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
       ✅ 10. 新增：国内favicon服务 + Promise.race并行加载
       方案说明：
       - 方案1：百度favicon服务（国内可用）
       - 方案2：搜狗favicon服务（国内可用）
       - 降级方案：随机颜色渐变 + 网站首字母
       
       核心特点：
       - 使用Promise.race()并行加载，谁快用谁
       - 每个请求4秒超时，保证不会太慢
       - 支持所有跨域加载方式
       ──────────────────────────────────────────── */

    /* ✅ 生成随机颜色函数（支持渐变） */
    function generateRandomGradient() {
        // ✅ 生成两个随机HSL颜色用于渐变
        const hue1 = Math.random() * 360;
        // ✅ 第二个颜色相隔60-120度，保证颜色搭配美观
        const hue2 = (hue1 + 60 + Math.random() * 60) % 360;
        // ✅ 中等饱和度和亮度，保证易读性
        const saturation = 60 + Math.random() * 30; // 60-90%
        const lightness = 50 + Math.random() * 20; // 50-70%
        
        const color1 = `hsl(${hue1}, ${saturation}%, ${lightness}%)`;
        const color2 = `hsl(${hue2}, ${saturation}%, ${lightness}%)`;
        
        return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    }

    /* ✅ 获取网站名称的首个字符 */
    function getFirstChar(siteName) {
        // ✅ 移除特殊字符，提取首个有意义的字符
        const cleanName = siteName.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '');
        return cleanName.charAt(0).toUpperCase() || '?';
    }

    /* ✅ 为单个img标签加载图标（使用Promise.race） */
    function loadIconWithRace(img, domain, siteName) {
        // ✅ 构建百度和搜狗的favicon URL
        const baiduUrl = `https://www.baidu.com/favicon.ico?domain=${domain}`;
        const sogouUrl = `https://www.sogou.com/favicon.ico?domain=${domain}`;
        
        // ✅ 创建百度Promise - 4秒超时
        const baiduPromise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Baidu timeout'));
            }, 4000);

            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            testImg.onload = () => {
                clearTimeout(timer);
                resolve(baiduUrl);
            };
            testImg.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Baidu failed'));
            };
            testImg.src = baiduUrl;
        });

        // ✅ 创建搜狗Promise - 4秒超时
        const sogouPromise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Sogou timeout'));
            }, 4000);

            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            testImg.onload = () => {
                clearTimeout(timer);
                resolve(sogouUrl);
            };
            testImg.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Sogou failed'));
            };
            testImg.src = sogouUrl;
        });

        // ✅ 使用Promise.race - 哪个先成功就用哪个
        Promise.race([baiduPromise, sogouPromise])
            .then(successUrl => {
                // ✅ 有一个成功，立即设置src并加载
                img.onload = () => {
                    img.style.opacity = '1';
                    const source = successUrl.includes('baidu') ? 'Baidu' : 'Sogou';
                    console.log(`✅ Icon loaded successfully for ${domain} from ${source}`);
                };
                img.onerror = () => {
                    console.warn(`Icon load failed after race success for ${domain}`);
                    handleIconLoadFailure(img, siteName);
                };
                img.crossOrigin = 'anonymous';
                img.src = successUrl;
            })
            .catch(error => {
                // ✅ 两个都失败，使用随机颜色备用方案
                console.warn(`Both Baidu and Sogou failed for ${domain}:`, error.message);
                handleIconLoadFailure(img, siteName);
            });
    }

    /* ✅ 降级方案：生成随机颜色背景 + 网站首字母 */
    function handleIconLoadFailure(img, siteName) {
        // ✅ 隐藏失败的img标签
        img.style.display = 'none';
        
        // ✅ 创建随机颜色的备用方案
        const fallback = document.createElement('div');
        fallback.className = 'icon-fallback';
        fallback.textContent = getFirstChar(siteName);
        fallback.style.background = generateRandomGradient();
        
        // ✅ 将备用方案插入到父容器中
        img.parentElement.appendChild(fallback);
        console.log(`📌 Using fallback for ${siteName} with first char: ${getFirstChar(siteName)}`);
    }

    /* ✅ 初始化所有卡片的图标加载 */
    function initializeIconLoading() {
        document.querySelectorAll('.card-icon img').forEach(img => {
            const domain = img.getAttribute('data-domain');
            const siteName = img.getAttribute('data-site-name');
            
            if (!domain || !siteName) {
                console.warn('Missing domain or site-name attribute');
                return;
            }

            // ✅ 使用Promise.race方案加载图标
            loadIconWithRace(img, domain, siteName);
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

        /* ✅ 图标加载失败时的备用样式 */
        .icon-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            user-select: none;
        }
    `;
    document.head.appendChild(style);
})();

/* ────────────────────────────────────────────
   13. 图标服务配置说明
   ──────────────────────────────────────────── */
/* 
 * 国内favicon服务配置
 * 
 * 使用的服务：
 * 1. 百度图标服务：https://www.baidu.com/favicon.ico?domain=xxx
 * 2. 搜狗图标服务：https://www.sogou.com/favicon.ico?domain=xxx
 * 
 * 加载策略：
 * - 使用Promise.race()并行请求两个服务
 * - 谁先成功就用谁的结果
 * - 每个请求4秒超时
 * - 都失败则显示随机颜色+首字母
 * 
 * 为什么选择这两个？
 * - 百度和搜狗是国内最大的搜索引擎
 * - 在国内网络环境最稳定
 * - 都提供免费的favicon查询API
 * - 使用并行加载可以充分利用它们的速度优势
 */
const FAVICON_SERVICES = {
    baidu: (domain) => `https://www.baidu.com/favicon.ico?domain=${domain}`,
    sogou: (domain) => `https://www.sogou.com/favicon.ico?domain=${domain}`
};
