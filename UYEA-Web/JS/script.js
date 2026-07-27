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

    // ==================== 下拉菜单互斥机制 ====================
    // 打开任一下拉菜单时，自动关闭其他所有下拉菜单，防止重叠
    const DROPDOWN_PAIRS = [
        { btnId: 'langIconBtn', menuId: 'langDropdown' },
        { btnId: 'searchIconBtn', menuId: 'searchDropdown' },
        { btnId: 'themeIconBtn', menuId: 'themeDropdown' },
        { btnId: 'menuToggleBtn', menuId: 'dropdownMenu' }
    ];

    function closeAllDropdowns(exceptBtnId) {
        DROPDOWN_PAIRS.forEach(({ btnId, menuId }) => {
            if (btnId === exceptBtnId) return;
            const btn = document.getElementById(btnId);
            const menu = document.getElementById(menuId);
            if (menu) menu.classList.remove('show');
            if (btn) btn.classList.remove('active');
        });
    }

    // ==================== 多语言系统 ====================
    let currentLang = UYEA_CONFIG.defaultLanguage;

    // 语言缩写映射
    const langAbbr = { 'zh-CN': '中', 'zh-TW': '繁', 'en': 'EN' };

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
        // 更新语言缩写显示
        const langCurrent = document.getElementById('langCurrent');
        if (langCurrent) langCurrent.textContent = langAbbr[lang] || '中';
        // 更新下拉菜单选中状态
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
        safeSetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language), lang);
        // 通知其他模块语言已切换
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    };

    // 语言图标按钮：点击切换下拉菜单
    const langIconBtn = document.getElementById('langIconBtn');
    const langDropdown = document.getElementById('langDropdown');
    if (langIconBtn && langDropdown) {
        langIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns('langIconBtn');
            const open = langDropdown.classList.toggle('show');
            langIconBtn.classList.toggle('active', open);
        });
        // 点击外部关闭下拉
        document.addEventListener('click', (e) => {
            if (!langDropdown.contains(e.target) && e.target !== langIconBtn && !langIconBtn.contains(e.target)) {
                langDropdown.classList.remove('show');
                langIconBtn.classList.remove('active');
            }
        });
    }

    // 语言选项点击事件
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            langOptions.forEach(x => x.classList.remove('active'));
            opt.classList.add('active');
            setLang(opt.dataset.lang);
            // 关闭下拉菜单
            if (langDropdown) langDropdown.classList.remove('show');
            if (langIconBtn) langIconBtn.classList.remove('active');
        });
    });

    // 初始化语言
    const savedLang = safeGetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language)) || UYEA_CONFIG.defaultLanguage;
    setLang(savedLang);

    // ==================== 菜单系统 ====================
    const menuToggle = document.getElementById('menuToggleBtn');
    const dropdown = document.getElementById('dropdownMenu');
    if (menuToggle && dropdown) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns('menuToggleBtn');
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
            closeAllDropdowns('searchIconBtn');
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

    // ==================== 图标占位符系统（底色+边框，待后续替换为真实图标） ====================
    // 卡片图标使用首字母占位符，由 navCardHtml 内联生成，无需异步加载

    // ==================== 导航数据加载 + 分类筛选/搜索 ====================
    let navInitialized = false;
    let navCurrentCategory = 'all';
    let navSearchTimer = null;

    // HTML 转义
    function navEsc(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // 生成单张卡片 HTML（图标用首字母占位符，底色+边框）
    function navCardHtml(item) {
        const firstChar = (item.title || '?').charAt(0).toUpperCase();
        return `<a href="${navEsc(item.url)}" target="_blank" rel="noopener" class="card-item" data-title="${navEsc(item.title)}" title="${navEsc(item.title)}">
            <div class="card-icon">
                <span class="icon-placeholder">${navEsc(firstChar)}</span>
            </div>
            <div class="card-info">
                <div class="card-title">${navEsc(item.title)}</div>
            </div>
        </a>`;
    }

    // 生成添加网站卡片 HTML（加号按钮，用于后续网站上传功能）
    function addCardHtml() {
        const msgs = UYEA_CONFIG.i18n[currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
        const text = msgs['nav.addSite'] || '添加网站';
        return `<button class="add-card" aria-label="${navEsc(text)}">
            <div class="card-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <div class="card-info">
                <div class="card-title add-card-title" data-i18n="nav.addSite">${navEsc(text)}</div>
            </div>
        </button>`;
    }

    // 计算grid容器当前列数
    function getGridColumns(grid, cards) {
        if (!grid || !cards || cards.length === 0) return 1;
        const gridWidth = grid.clientWidth;
        const cardWidth = cards[0].getBoundingClientRect().width;
        if (cardWidth <= 0) return 1;
        const gap = 16;
        return Math.max(1, Math.floor((gridWidth + gap) / (cardWidth + gap)));
    }

    // 分类筛选 + 搜索过滤 + 2行限制（仅作用于#navView内）
    function applyNavFilter() {
        const searchInput = document.getElementById('navSearchInput');
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const noResults = document.getElementById('navNoResults');
        let visibleCount = 0;
        const isLimited = (navCurrentCategory === 'all' && !keyword);

        document.querySelectorAll('#navView .section-group').forEach(section => {
            const sectionCat = section.dataset.category;
            if (navCurrentCategory !== 'all' && sectionCat !== navCurrentCategory) {
                section.style.display = 'none';
                return;
            }
            section.style.display = '';
            const cards = section.querySelectorAll('.card-item');
            const grid = section.querySelector('.grid-container');
            cards.forEach(c => { c.style.display = ''; });

            let maxVisible = Infinity;
            if (isLimited && grid && cards.length > 0) {
                const columns = getGridColumns(grid, cards);
                maxVisible = columns * 2;
            }

            let sectionVisible = 0;
            cards.forEach(card => {
                const title = (card.dataset.title || card.querySelector('.card-title')?.textContent || '').toLowerCase();
                const matchSearch = !keyword || title.includes(keyword);
                const withinLimit = sectionVisible < maxVisible;
                const show = matchSearch && (withinLimit || !isLimited);
                card.style.display = show ? '' : 'none';
                if (show) sectionVisible++;
            });

            section.style.display = (sectionVisible > 0) ? '' : 'none';
            if (sectionVisible > 0) section.classList.add('revealed');
            visibleCount += sectionVisible;
        });

        if (noResults) noResults.classList.toggle('show', visibleCount === 0);

        const showMoreBtns = (navCurrentCategory === 'all' && !keyword);
        document.querySelectorAll('#navView .more-btn[data-target-category]').forEach(btn => {
            btn.style.display = showMoreBtns ? '' : 'none';
        });
        const showAddCards = (navCurrentCategory !== 'all');
        document.querySelectorAll('#navView .add-card').forEach(btn => {
            btn.style.display = showAddCards ? '' : 'none';
        });
    }

    // 初始化导航视图（页面加载时即预加载数据，首次切换时再计算布局）
    let navFilterApplied = false;
    function initNavView() {
        if (navInitialized) {
            if (document.getElementById('navView')?.style.display !== 'none') {
                applyNavFilter();
                navFilterApplied = true;
            }
            bindNavEvents();
            return;
        }
        navInitialized = true;

        fetch(UYEA_CONFIG.dataFiles.navigation, { cache: 'no-cache' })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}: 导航数据加载失败`);
                return r.json();
            })
            .then(nav => {
                ['ai', 'social', 'tools', 'creative', 'shopping', 'news', 'life'].forEach(cat => {
                    const section = document.getElementById(cat + '-section');
                    if (section && nav[cat]) {
                        const grid = section.querySelector('.grid-container');
                        grid.innerHTML = nav[cat].map(navCardHtml).join('') + addCardHtml();
                    }
                });
                // 如果导航视图当前可见，立即应用筛选；否则延迟到首次切换
                if (document.getElementById('navView')?.style.display !== 'none') {
                    applyNavFilter();
                    navFilterApplied = true;
                }
                document.querySelectorAll('#navView .add-card').forEach(btn => {
                    btn.addEventListener('click', (e) => { e.preventDefault(); });
                });
                bindNavEvents();
                // 通知加载动画：导航模块已就绪
                window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'nav' } }));
            })
            .catch(err => {
                console.warn('导航数据加载失败:', err);
                // 即使失败也通知就绪，避免加载动画卡死
                window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'nav' } }));
            });
    }

    // 绑定导航视图事件（底部导航切换后需重新绑定）
    function bindNavEvents() {
        document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]').forEach(x => x.classList.remove('active'));
                item.classList.add('active');
                navCurrentCategory = item.dataset.category;
                // 滚动底部导航到激活项
                scrollBottomNavToActive();
                const searchInput = document.getElementById('navSearchInput');
                if (searchInput) searchInput.value = '';
                applyNavFilter();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        document.querySelectorAll('#navView .more-btn[data-target-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetCat = btn.dataset.targetCategory;
                const targetNavBtn = document.querySelector(`#bottomNav .bottom-nav-item[data-category="${targetCat}"]`);
                if (targetNavBtn) targetNavBtn.click();
            });
        });

        const navSearchInput = document.getElementById('navSearchInput');
        if (navSearchInput) {
            navSearchInput.addEventListener('input', () => {
                clearTimeout(navSearchTimer);
                navSearchTimer = setTimeout(applyNavFilter, 200);
            });
        }
    }

    // 窗口resize时重新计算2行限制（防抖）
    let navResizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(navResizeTimer);
        navResizeTimer = setTimeout(() => {
            if (document.getElementById('navView')?.style.display !== 'none') applyNavFilter();
        }, 200);
    });

    // 监听视图切换：切换到导航视图时恢复分类状态并重新应用筛选
    window.addEventListener('viewchange', (e) => {
        if (e.detail.view === 'nav') {
            if (!navInitialized) {
                setTimeout(initNavView, 50);
                return;
            }
            // 恢复底部导航active状态（switchView会重置底部导航HTML）
            document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]').forEach(x => x.classList.remove('active'));
            const activeBtn = document.querySelector(`#bottomNav .bottom-nav-item[data-category="${navCurrentCategory}"]`);
            if (activeBtn) activeBtn.classList.add('active');
            // 重新应用筛选（视图从隐藏变可见，需重新计算布局）
            setTimeout(() => {
                applyNavFilter();
                navFilterApplied = true;
                if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
            }, 50);
        }
    });

    // 页面加载时立即预加载导航数据（不等待视图切换）
    initNavView();

    // ==================== 字体异步加载 ====================
    if (document.fonts && document.fonts.load) {
        document.fonts.load('400 14px Noto Sans SC', 'UYEA')
            .catch(err => console.warn('字体预加载失败:', err));
    }

    // ==================== 主题切换（三主题：浅色/深色/极客） ====================
    const themeIconBtn = document.getElementById('themeIconBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    const savedTheme = safeGetItem('uyea_theme') ||
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        // 更新下拉菜单选中状态
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
        // 通知液态玻璃模块重新应用
        document.dispatchEvent(new CustomEvent('uyea:themeChanged'));
    }

    // 初始化主题
    applyTheme(savedTheme);

    // 主题图标按钮：点击切换下拉菜单
    if (themeIconBtn && themeDropdown) {
        themeIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns('themeIconBtn');
            const open = themeDropdown.classList.toggle('show');
            themeIconBtn.classList.toggle('active', open);
        });
        // 点击外部关闭下拉
        document.addEventListener('click', (e) => {
            if (!themeDropdown.contains(e.target) && e.target !== themeIconBtn && !themeIconBtn.contains(e.target)) {
                themeDropdown.classList.remove('show');
                themeIconBtn.classList.remove('active');
            }
        });
    }

    // 主题选项点击事件
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const theme = opt.dataset.theme;
            themeOptions.forEach(x => x.classList.remove('active'));
            opt.classList.add('active');
            applyTheme(theme);
            safeSetItem('uyea_theme', theme);
            // 关闭下拉菜单
            if (themeDropdown) themeDropdown.classList.remove('show');
            if (themeIconBtn) themeIconBtn.classList.remove('active');
        });
    });

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
