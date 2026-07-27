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
    window.currentLang = currentLang; // 初始暴露给其他模块

    // 语言缩写映射
    const langAbbr = { 'zh-CN': '中', 'zh-TW': '繁', 'en': 'EN' };

    const setLang = (lang) => {
        currentLang = lang;
        window.currentLang = lang; // 暴露给其他模块（auth.js等）
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
    // 常驻搜索栏元素（顶部居中）
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerSearchBtn = document.getElementById('headerSearchBtn');
    const headerEngineSelect = document.getElementById('headerEngineSelect');
    const headerEngineDropdown = document.getElementById('headerEngineDropdown');
    const headerEngineCurrent = document.getElementById('headerEngineCurrent');
    const headerEngineOptions = document.querySelectorAll('.header-engine-option');

    // 搜索引擎名称映射（用于常驻栏显示）
    const ENGINE_NAMES = {
        'baidu': { 'zh-CN': '百度', 'zh-TW': '百度', 'en': 'Baidu' },
        'google': { 'zh-CN': 'Google', 'zh-TW': 'Google', 'en': 'Google' },
        'bing': { 'zh-CN': 'Bing', 'zh-TW': 'Bing', 'en': 'Bing' },
        'site': { 'zh-CN': '站内', 'zh-TW': '站內', 'en': 'Site' }
    };

    let current = safeGetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine)) || UYEA_CONFIG.defaultSearchEngine;
    if (!UYEA_CONFIG.searchEngines[current] && current !== 'site') current = UYEA_CONFIG.defaultSearchEngine;

    // 更新常驻栏引擎名称显示
    function updateHeaderEngineLabel() {
        if (!headerEngineCurrent) return;
        const names = ENGINE_NAMES[current] || ENGINE_NAMES[UYEA_CONFIG.defaultSearchEngine];
        headerEngineCurrent.textContent = names[currentLang] || names['zh-CN'];
    }

    // 同步引擎选择UI的active状态
    function syncEngineTabs() {
        headerEngineOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.value === current);
        });
        updateHeaderEngineLabel();
    }
    syncEngineTabs();

    // 统一切换搜索引擎函数
    function switchEngine(value) {
        current = value;
        syncEngineTabs();
        safeSetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine), current);
    }

    // 常驻栏引擎选择下拉
    if (headerEngineSelect) {
        headerEngineSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(null);
            headerEngineDropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (headerEngineDropdown && !headerEngineSelect.contains(e.target)) {
                headerEngineDropdown.classList.remove('show');
            }
        });
    }
    headerEngineOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            switchEngine(opt.dataset.value);
            headerEngineDropdown.classList.remove('show');
            if (headerSearchInput) headerSearchInput.focus();
        });
    });

    // ==================== 站内搜索功能 ====================
    let siteSearchData = { posts: null, nav: null };

    // 加载站内搜索所需数据（懒加载，首次站内搜索时触发）
    async function loadSiteSearchData() {
        const tasks = [];
        if (!siteSearchData.posts) {
            tasks.push(
                fetch(UYEA_CONFIG.dataFiles.posts, { cache: 'no-cache' })
                    .then(r => r.ok ? r.json() : [])
                    .then(data => { siteSearchData.posts = Array.isArray(data) ? data : []; })
                    .catch(() => { siteSearchData.posts = []; })
            );
        }
        if (!siteSearchData.nav) {
            tasks.push(
                fetch(UYEA_CONFIG.dataFiles.navigation, { cache: 'no-cache' })
                    .then(r => r.ok ? r.json() : {})
                    .then(data => { siteSearchData.nav = data || {}; })
                    .catch(() => { siteSearchData.nav = {}; })
            );
        }
        if (tasks.length > 0) await Promise.all(tasks);
    }

    // 搜索论坛帖子
    function searchForumPosts(query) {
        if (!siteSearchData.posts) return [];
        const q = query.toLowerCase();
        return siteSearchData.posts.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.excerpt || '').toLowerCase().includes(q) ||
            (p.author || '').toLowerCase().includes(q) ||
            (p.tag || '').toLowerCase().includes(q)
        ).slice(0, 20); // 最多显示20条
    }

    // 搜索导航网站
    function searchNavSites(query) {
        if (!siteSearchData.nav) return [];
        const q = query.toLowerCase();
        const results = [];
        for (const cat in siteSearchData.nav) {
            const sites = siteSearchData.nav[cat];
            if (!Array.isArray(sites)) continue;
            sites.forEach(site => {
                if ((site.title || '').toLowerCase().includes(q)) {
                    results.push(site);
                }
            });
        }
        return results.slice(0, 30); // 最多显示30条
    }

    // 搜索工具（从DOM读取工具卡片）
    function searchTools(query) {
        const q = query.toLowerCase();
        const results = [];
        document.querySelectorAll('#toolsView .card-item[data-title]').forEach(card => {
            const title = (card.dataset.title || '').toLowerCase();
            if (title.includes(q)) {
                results.push({
                    title: card.dataset.title,
                    tool: card.dataset.tool,
                    comingSoon: card.hasAttribute('data-coming-soon'),
                    element: card
                });
            }
        });
        return results.slice(0, 30);
    }

    // 渲染站内搜索结果
    function renderSiteSearchResults(query) {
        const forumResults = searchForumPosts(query);
        const navResults = searchNavSites(query);
        const toolsResults = searchTools(query);

        const totalCount = forumResults.length + navResults.length + toolsResults.length;

        // 更新副标题
        const subtitle = document.getElementById('searchResultsSubtitle');
        if (subtitle) {
            const msgs = UYEA_CONFIG.i18n[currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
            const tpl = msgs['search.resultsCount'] || '关键词「{q}」共找到 {n} 条结果';
            subtitle.textContent = tpl.replace('{q}', query).replace('{n}', totalCount);
        }

        // 论坛结果
        const forumSection = document.getElementById('searchForumSection');
        const forumResultsEl = document.getElementById('searchForumResults');
        const forumCount = document.getElementById('searchForumCount');
        if (forumResults.length > 0) {
            forumSection.style.display = '';
            forumCount.textContent = forumResults.length;
            // 帖子标签 i18n 映射
            const TAG_I18N_MAP = {
                '公告': 'forum.cat.announcement', 'AI 探讨': 'forum.cat.ai',
                '工具': 'forum.cat.tools', '生活': 'forum.cat.life', '反馈': 'forum.cat.feedback'
            };
            const msgs = UYEA_CONFIG.i18n[currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
            function translateTag(tag) {
                const key = TAG_I18N_MAP[tag];
                return key ? (msgs[key] || tag) : tag;
            }
            forumResultsEl.innerHTML = forumResults.map(p => {
                const hasUrl = p.url && p.url !== '#';
                const href = hasUrl ? navEsc(p.url) : 'javascript:void(0)';
                const targetAttr = hasUrl ? ' target="_blank" rel="noopener"' : '';
                return `<a href="${href}" class="post-item"${targetAttr}>
                    <div class="post-meta">
                        <span class="post-tag">${navEsc(translateTag(p.tag))}</span>
                        <span class="dot">•</span>
                        <span>${navEsc(p.author)}</span>
                        <span class="dot">•</span>
                        <span>${navEsc(p.time)}</span>
                    </div>
                    <div class="post-title">${navEsc(p.title)}</div>
                    <div class="post-excerpt">${navEsc(p.excerpt)}</div>
                </a>`;
            }).join('');
        } else {
            forumSection.style.display = 'none';
        }

        // 导航结果
        const navSection = document.getElementById('searchNavSection');
        const navResultsEl = document.getElementById('searchNavResults');
        const navCount = document.getElementById('searchNavCount');
        if (navResults.length > 0) {
            navSection.style.display = '';
            navCount.textContent = navResults.length;
            navResultsEl.innerHTML = navResults.map(item => {
                const firstChar = (item.title || '?').charAt(0).toUpperCase();
                return `<a href="${navEsc(item.url)}" target="_blank" rel="noopener" class="card-item" data-title="${navEsc(item.title)}" title="${navEsc(item.title)}">
                    <div class="card-icon"><span class="icon-placeholder">${navEsc(firstChar)}</span></div>
                    <div class="card-info"><div class="card-title">${navEsc(item.title)}</div></div>
                </a>`;
            }).join('');
        } else {
            navSection.style.display = 'none';
        }

        // 工具结果
        const toolsSection = document.getElementById('searchToolsSection');
        const toolsResultsEl = document.getElementById('searchToolsResults');
        const toolsCount = document.getElementById('searchToolsCount');
        if (toolsResults.length > 0) {
            toolsSection.style.display = '';
            toolsCount.textContent = toolsResults.length;
            toolsResultsEl.innerHTML = toolsResults.map(item => {
                const firstChar = (item.title || '?').charAt(0).toUpperCase();
                const clickAttr = item.comingSoon ? ' data-coming-soon="' + navEsc(item.title) + '"' : ' data-tool="' + navEsc(item.tool) + '"';
                return `<a class="card-item" role="button" tabindex="0"${clickAttr} data-title="${navEsc(item.title)}" title="${navEsc(item.title)}">
                    <div class="card-icon"><span class="icon-placeholder">${navEsc(firstChar)}</span></div>
                    <div class="card-info"><div class="card-title">${navEsc(item.title)}</div></div>
                </a>`;
            }).join('');

            // 绑定工具卡片点击事件
            toolsResultsEl.querySelectorAll('.card-item[data-tool]').forEach(card => {
                card.addEventListener('click', (e) => {
                    // 触发对应的工具打开（通过模拟点击原工具卡片）
                    const toolName = card.dataset.tool;
                    const originalCard = document.querySelector('#toolsView .card-item[data-tool="' + toolName + '"]');
                    if (originalCard) originalCard.click();
                });
            });
            // coming-soon 工具静默处理
            toolsResultsEl.querySelectorAll('[data-coming-soon]').forEach(card => {
                card.addEventListener('click', (e) => e.preventDefault());
            });
        } else {
            toolsSection.style.display = 'none';
        }

        // 无结果提示
        document.getElementById('searchNoResults').style.display = totalCount === 0 ? '' : 'none';
    }

    // 切换到搜索结果视图
    let previousView = 'forum';
    function showSearchView(query) {
        // 记住当前视图，用于返回
        if (currentView !== 'search') previousView = currentView;

        // 隐藏所有视图
        document.querySelectorAll('.view-container').forEach(v => {
            v.style.display = 'none';
            v.style.animation = '';
        });

        const searchView = document.getElementById('searchView');
        if (searchView) {
            searchView.style.display = 'block';
            searchView.style.animation = 'none';
            searchView.offsetHeight;
            searchView.style.animation = '';
        }

        // 隐藏底部导航栏（搜索结果页不需要）
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'none';

        // 更新 nav-link active 状态
        document.querySelectorAll('.nav-link[data-view]').forEach(link => {
            link.classList.remove('active');
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 渲染搜索结果
        renderSiteSearchResults(query);

        currentView = 'search';
    }

    // 返回之前的视图
    function backFromSearch() {
        const searchView = document.getElementById('searchView');
        if (searchView) searchView.style.display = 'none';

        // 恢复底部导航栏
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = '';

        // 恢复之前的视图
        const targetView = document.getElementById(previousView + 'View');
        if (targetView) {
            targetView.style.display = 'block';
            targetView.style.animation = 'none';
            targetView.offsetHeight;
            targetView.style.animation = '';
        }

        // 恢复 nav-link active
        document.querySelectorAll('.nav-link[data-view]').forEach(link => {
            link.classList.toggle('active', link.dataset.view === previousView);
        });

        // 恢复底部导航内容
        if (bottomNav && typeof BOTTOM_NAVS !== 'undefined' && BOTTOM_NAVS[previousView]) {
            bottomNav.innerHTML = BOTTOM_NAVS[previousView];
            bottomNav.scrollTo({ left: 0, behavior: 'smooth' });
        }

        // 通知视图切换
        window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: previousView } }));

        currentView = previousView;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 搜索返回按钮
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) {
        searchBackBtn.addEventListener('click', backFromSearch);
    }

    // 执行搜索（统一入口）
    async function executeSearch(inputEl) {
        if (!inputEl) return;
        const query = inputEl.value.trim();
        if (!query) return;

        if (current === 'site') {
            // 站内搜索：加载数据并展示结果
            inputEl.value = '';
            // 显示加载状态
            const subtitle = document.getElementById('searchResultsSubtitle');
            if (subtitle) {
                const msgs = UYEA_CONFIG.i18n[currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
                subtitle.textContent = msgs['search.loading'] || '搜索中...';
            }
            showSearchView(query);
            await loadSiteSearchData();
            renderSiteSearchResults(query);
        } else {
            const engineUrl = UYEA_CONFIG.getSearchEngineUrl(current);
            if (engineUrl) {
                window.open(engineUrl + encodeURIComponent(query), '_blank');
            }
        }
    }

    // 常驻搜索栏事件绑定
    if (headerSearchInput) {
        headerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch(headerSearchInput);
            }
        });
    }
    if (headerSearchBtn) {
        headerSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeSearch(headerSearchInput);
        });
    }

    // 语言切换时更新常驻栏引擎名称
    window.addEventListener('languagechange', () => {
        updateHeaderEngineLabel();
    });

    // ==================== 开发中功能（静默处理，不弹窗） ====================
    document.querySelectorAll('[data-coming-soon]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });

    // ==================== ESC键关闭所有下拉菜单 ====================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllDropdowns(null);
            DROPDOWN_PAIRS.forEach(({ btnId, menuId }) => {
                const btn = document.getElementById(btnId);
                const menu = document.getElementById(menuId);
                if (menu) menu.classList.remove('show');
                if (btn) btn.classList.remove('active');
            });
        }
    });

    // ==================== 图标占位符系统（底色+边框，待后续替换为真实图标） ====================
    // 卡片图标使用首字母占位符，由 navCardHtml 内联生成，无需异步加载

    // ==================== 导航数据加载 + 分类筛选/搜索 ====================
    let navInitialized = false;
    let navCurrentCategory = 'all';
    let navSearchTimer = null;
    // 调试：暴露闭包变量
    window.__debug = { get navCurrentCategory() { return navCurrentCategory; } };

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
    let moreBtnsBound = false;
    let navSearchBound = false;
    function bindNavEvents() {
        document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]').forEach(x => x.classList.remove('active'));
                item.classList.add('active');
                navCurrentCategory = item.dataset.category;
                // 滚动底部导航到激活项
                if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
                const searchInput = document.getElementById('navSearchInput');
                if (searchInput) searchInput.value = '';
                applyNavFilter();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // "更多"按钮只需绑定一次（静态HTML不会随视图切换重建）
        if (!moreBtnsBound) {
            moreBtnsBound = true;
            document.querySelectorAll('#navView .more-btn[data-target-category]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetCat = btn.dataset.targetCategory;
                    const targetNavBtn = document.querySelector(`#bottomNav .bottom-nav-item[data-category="${targetCat}"]`);
                    if (targetNavBtn) targetNavBtn.click();
                });
            });
        }

        if (!navSearchBound) {
            navSearchBound = true;
            const navSearchInput = document.getElementById('navSearchInput');
            if (navSearchInput) {
                navSearchInput.addEventListener('input', () => {
                    clearTimeout(navSearchTimer);
                    navSearchTimer = setTimeout(applyNavFilter, 200);
                });
            }
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
            // switchView替换了底部导航HTML，需重新绑定事件
            bindNavEvents();
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
