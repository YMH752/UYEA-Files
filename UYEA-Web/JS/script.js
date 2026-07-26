document.addEventListener('DOMContentLoaded', () => {
    // 安全读取 localStorage（隐私模式等场景可能不可用）
    function safeGetItem(key) {
        try { return localStorage.getItem(key); }
        catch (e) { return null; }
    }
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); }
        catch (e) { /* 静默忽略 */ }
    }

    // ==================== 多语言系统 ====================
    let currentLang = UYEA_CONFIG.defaultLanguage;

    const setLang = (lang) => {
        currentLang = lang;
        const msgs = UYEA_CONFIG.i18n[lang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
        // 翻译文本内容
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (msgs[el.dataset.i18n]) el.textContent = msgs[el.dataset.i18n];
        });
        // 翻译 placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            if (msgs[el.dataset.i18nPlaceholder]) el.placeholder = msgs[el.dataset.i18nPlaceholder];
        });
        safeSetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language), lang);
        // 通知其他模块语言已切换
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    };

    // 语言按钮事件
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(b => {
        b.addEventListener('click', () => {
            langBtns.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            setLang(b.dataset.lang);
            moveLangHighlight(b);
        });
    });

    // 初始化语言
    const savedLang = safeGetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language)) || UYEA_CONFIG.defaultLanguage;
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === savedLang));
    setLang(savedLang);
    const activeBtn = document.querySelector('.lang-btn.active');
    if (activeBtn) moveLangHighlight(activeBtn);

    // 语言高亮位置动画
    function moveLangHighlight(btn) {
        const hl = document.getElementById('langHighlight');
        const sel = document.getElementById('langSelector');
        if (!hl || !sel) return;
        const sr = sel.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        hl.style.width = br.width + 'px';
        hl.style.transform = `translateX(${br.left - sr.left}px)`;
    }

    // 响应式窗口重置语言高亮
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.lang-btn.active');
        if (activeBtn) moveLangHighlight(activeBtn);
    });

    // ==================== 菜单系统 ====================
    const menuToggle = document.getElementById('menuToggleBtn');
    const dropdown = document.getElementById('dropdownMenu');
    if (menuToggle && dropdown) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = dropdown.classList.toggle('show');
            menuToggle.classList.toggle('active', open);
        });
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== menuToggle) {
                dropdown.classList.remove('show');
                menuToggle.classList.remove('active');
            }
        });
    }

    // ==================== 搜索系统 ====================
    const engineTabs = document.querySelectorAll('.engine-tab');
    const searchInput = document.getElementById('searchInput');
    const searchSubmitBtn = document.getElementById('searchSubmitBtn');
    const searchIcon = document.getElementById('searchIconBtn');
    const searchDropdown = document.getElementById('searchDropdown');

    let current = safeGetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine)) || UYEA_CONFIG.defaultSearchEngine;
    if (!UYEA_CONFIG.searchEngines[current] && current !== 'site') current = UYEA_CONFIG.defaultSearchEngine;

    // 初始化搜索引擎标签 active 状态
    function syncEngineTabs() {
        engineTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.value === current);
        });
    }
    syncEngineTabs();

    // 搜索引擎标签点击切换
    engineTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            current = tab.dataset.value;
            syncEngineTabs();
            safeSetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine), current);
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
        });
    });

    // 搜索下拉菜单
    if (searchIcon && searchDropdown) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            searchDropdown.classList.toggle('show');
            if (searchDropdown.classList.contains('show') && searchInput) {
                searchInput.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchDropdown.contains(e.target) && !searchIcon.contains(e.target)) {
                searchDropdown.classList.remove('show');
            }
        });
    }

    // 执行搜索提交
    function executeSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if (!query) return;

        if (current === 'site') {
            // 站内搜索：静默处理
            searchInput.value = '';
        } else {
            const engineUrl = UYEA_CONFIG.getSearchEngineUrl(current);
            if (engineUrl) {
                window.open(engineUrl + encodeURIComponent(query), '_blank');
            }
        }
    }

    // 搜索提交：回车 + 点击按钮
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch();
            }
        });
    }
    if (searchSubmitBtn) {
        searchSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeSearch();
        });
    }

    // ==================== 开发中功能（静默处理，不弹窗） ====================
    document.querySelectorAll('[data-coming-soon]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });

    // ==================== 图标加载系统 ====================
    /**
     * 加载站点图标，失败降级到emoji
     * @param {HTMLImageElement} img 图片元素
     */
    function loadIcon(img) {
        const name = img.dataset.siteName;
        if (!name) return;
        const parent = img.parentElement;
        if (!parent) return;

        // 避免重复加载
        if (img.dataset.iconLoaded === 'true' || img.dataset.iconLoading === 'true') return;
        img.dataset.iconLoading = 'true';

        const loader = document.createElement('div');
        loader.className = 'icon-loading';
        parent.appendChild(loader);

        img.src = UYEA_CONFIG.iconBase + name + '.png';
        img.style.display = 'none';

        img.onload = () => {
            if (loader.parentElement) loader.remove();
            img.style.display = '';
            img.dataset.iconLoaded = 'true';
            delete img.dataset.iconLoading;
        };

        img.onerror = () => {
            // 加载失败，降级到emoji
            if (loader.parentElement) loader.remove();
            img.remove();
            const span = document.createElement('span');
            span.className = 'icon-emoji';
            span.textContent = UYEA_CONFIG.emojiMap[name] || '🔗';
            parent.appendChild(span);
        };
    }

    function loadIconsIn(container) {
        if (!container) return;
        container.querySelectorAll('img[data-site-name]').forEach(loadIcon);
    }

    document.querySelectorAll('img[data-site-name]').forEach(loadIcon);

    // 使用 MutationObserver 监听动态插入的图标（仅在动态加载图标的页面启动）
    const mainContent = document.querySelector('.main-content');
    if (mainContent && document.getElementById('ai-section')) {
        new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    if (n.nodeType === 1) {
                        if (n.matches && n.matches('img[data-site-name]')) {
                            loadIcon(n);
                        } else if (n.querySelectorAll && n.querySelectorAll('img[data-site-name]').length) {
                            n.querySelectorAll('img[data-site-name]').forEach(loadIcon);
                        }
                    }
                }
            }
        }).observe(mainContent, { childList: true, subtree: true });
    }

    // ==================== 导航数据加载 (仅index页) ====================
    if (document.getElementById('ai-section')) {
        fetch(UYEA_CONFIG.dataFiles.navigation)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: 导航数据加载失败`);
                return r.json();
            })
            .then(nav => {
                ['ai', 'life', 'tools'].forEach(cat => {
                    const section = document.getElementById(cat + '-section');
                    if (section && nav[cat]) {
                        section.querySelector('.grid-container').innerHTML = nav[cat]
                            .map(item => `
                                <a href="${item.url}" target="_blank" rel="noopener" class="card-item" title="${item.title}">
                                    <div class="card-icon">
                                        <img src="" data-site-name="${item.icon}" style="display:none" alt="${item.title}" loading="lazy">
                                    </div>
                                    <div class="card-info">
                                        <div class="card-title">${item.title}</div>
                                    </div>
                                </a>
                            `).join('');
                        loadIconsIn(section.querySelector('.grid-container'));
                    }
                });
            })
            .catch(err => {
                console.warn('导航数据加载失败，网站功能受限:', err);
                document.querySelectorAll('.grid-container').forEach(el => {
                    el.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">导航数据加载失败，请刷新重试</div>';
                });
            });
    }

    // ==================== 时钟系统（仅有时钟元素时启动） ====================
    function updateClock() {
        const now = new Date();
        const el = document.getElementById('clockTimeMain');
        if (el) {
            el.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
                .map(v => String(v).padStart(2, '0'))
                .join(':');
        }

        const g = document.getElementById('clockDateGregorian');
        if (g) {
            g.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        }

        // 农历更新 - 仅在lunar.js加载成功时执行
        if (typeof Solar !== 'undefined' && typeof Lunar !== 'undefined') {
            try {
                const lunar = Lunar.fromSolar(Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()));
                const l = document.getElementById('clockDateLunar');
                if (l) {
                    l.textContent = `（农历${lunar.getMonthInChinese()}${lunar.getDayInChinese()}）`;
                }
            } catch (e) {
                console.warn('农历计算失败:', e.message);
            }
        } else {
            const l = document.getElementById('clockDateLunar');
            if (l) {
                l.style.display = 'none';
            }
        }
    }

    // 仅在页面有时钟元素时启动定时器，避免无谓的每秒轮询
    if (document.getElementById('clockTimeMain') || document.getElementById('clockDateGregorian')) {
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ==================== 字体异步加载 ====================
    if (document.fonts && document.fonts.load) {
        document.fonts.load('400 14px Noto Sans SC', 'UYEA')
            .catch(err => console.warn('字体预加载失败:', err));
    }

    // ==================== 暗色模式切换 ====================
    const themeToggle = document.querySelector('.theme-toggle');
    const savedTheme = safeGetItem('uyea_theme') ||
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                safeSetItem('uyea_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                safeSetItem('uyea_theme', 'dark');
            }
            // 通知液态玻璃模块重新应用（blur 值随主题切换变化）
            document.dispatchEvent(new CustomEvent('uyea:themeChanged'));
        });
    }

    // ==================== 统一滚动处理（rAF节流） ====================
    const scrollProgress = document.querySelector('.scroll-progress');
    const backToTop = document.querySelector('.back-to-top');
    const header = document.querySelector('.top-header');

    let scrollTicking = false;
    function onScroll() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // 滚动进度条
        if (scrollProgress) {
            scrollProgress.style.width = (docHeight > 0 ? (scrollY / docHeight) * 100 : 0) + '%';
        }

        // 返回顶部按钮
        if (backToTop) {
            backToTop.classList.toggle('show', scrollY > 200);
        }

        // 头部滚动阴影
        if (header) {
            header.classList.toggle('scrolled', scrollY > 10);
        }

        scrollTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(onScroll);
            scrollTicking = true;
        }
    }, { passive: true });

    onScroll(); // 初始执行

    // 返回顶部点击
    if (backToTop) {
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        backToTop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ==================== 滚动触发动画（IntersectionObserver） ====================
    if ('IntersectionObserver' in window) {
        const revealTargets = document.querySelectorAll('.section-group, .tool-group');
        if (revealTargets.length > 0) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

            revealTargets.forEach(el => {
                el.classList.add('reveal');
                revealObserver.observe(el);
            });
        }
    }

    // ==================== 动态背景光球注入 ====================
    if (!document.querySelector('.bg-orbs')) {
        const orbs = document.createElement('div');
        orbs.className = 'bg-orbs';
        orbs.innerHTML = '<div class="bg-orb bg-orb-1"></div><div class="bg-orb bg-orb-2"></div><div class="bg-orb bg-orb-3"></div>';
        document.body.insertBefore(orbs, document.body.firstChild);
    }
});
