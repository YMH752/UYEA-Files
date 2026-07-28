document.addEventListener('DOMContentLoaded', () => {
    // 引用共享工具函数（含守卫，防止 utils.js 加载失败时模块静默崩溃）
    if (!window.UYEA_UTILS) {
        console.error('[script] UYEA_UTILS 未加载，主脚本初始化失败');
        return;
    }
    const { safeGetItem, safeSetItem, escapeHtml: esc, getGridColumns, renderPostCard } = window.UYEA_UTILS;

    // ==================== 下拉菜单互斥机制 ====================
    // 打开任一下拉菜单时，自动关闭其他所有下拉菜单，防止重叠
    const DROPDOWN_PAIRS = [
        { btnId: 'langIconBtn', menuId: 'langDropdown' },
        { btnId: 'themeIconBtn', menuId: 'themeDropdown' },
        { btnId: 'menuToggleBtn', menuId: 'dropdownMenu' },
        { btnId: 'mobileSearchToggle', menuId: 'mobileSearchPanel' },
        { btnId: 'headerEngineSelect', menuId: 'headerEngineDropdown' }
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
    // 暴露给 auth.js 等其他模块调用
    window.closeAllDropdowns = closeAllDropdowns;

    // ==================== 多语言系统 ====================
    window.currentLang = UYEA_CONFIG.defaultLanguage; // 暴露给其他模块（auth.js等）

    // 语言缩写映射
    const langAbbr = { 'zh-CN': '中', 'zh-TW': '繁', 'en': 'EN' };

    const setLang = (lang) => {
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
        // 语言切换后重新计算底部导航栏指示器（文字长度变化后需自适应）
        requestAnimationFrame(() => {
            if (typeof window.updateBottomNavIndicator === 'function') window.updateBottomNavIndicator();
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
        });
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
    }

    // 语言选项点击事件（事件委托，绑定在 #langDropdown 父容器上，避免逐个选项绑定）
    const langOptions = document.querySelectorAll('.lang-option');
    if (langDropdown) {
        langDropdown.addEventListener('click', (e) => {
            const opt = e.target.closest('.lang-option');
            if (!opt) return;
            langOptions.forEach(x => x.classList.remove('active'));
            opt.classList.add('active');
            setLang(opt.dataset.lang);
            // 关闭下拉菜单
            langDropdown.classList.remove('show');
            if (langIconBtn) langIconBtn.classList.remove('active');
        });
    }

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
    }

    // ==================== 搜索系统 ====================
    // 常驻搜索栏元素（顶部居中）
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerSearchBtn = document.getElementById('headerSearchBtn');
    const headerEngineSelect = document.getElementById('headerEngineSelect');
    const headerEngineDropdown = document.getElementById('headerEngineDropdown');
    const headerEngineCurrent = document.getElementById('headerEngineCurrent');
    const headerEngineOptions = document.querySelectorAll('.header-engine-option');

    // 手机端搜索按钮 + 下拉面板
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchPanel = document.getElementById('mobileSearchPanel');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchSubmit = document.getElementById('mobileSearchSubmit');
    const mobileEngineOptions = document.querySelectorAll('.mobile-engine-option');

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
        headerEngineCurrent.textContent = names[window.currentLang] || names['zh-CN'];
    }

    // 同步引擎选择UI的active状态（同时更新桌面端和手机端）
    function syncEngineTabs() {
        headerEngineOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.value === current);
        });
        mobileEngineOptions.forEach(opt => {
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
            closeAllDropdowns('headerEngineSelect');
            headerEngineDropdown.classList.toggle('show');
        });
    }
    // 常驻栏引擎选项点击（事件委托，绑定在 #headerEngineDropdown 父容器上）
    if (headerEngineDropdown) {
        headerEngineDropdown.addEventListener('click', (e) => {
            const opt = e.target.closest('.header-engine-option');
            if (!opt) return;
            e.stopPropagation();
            switchEngine(opt.dataset.value);
            headerEngineDropdown.classList.remove('show');
            if (headerSearchInput) headerSearchInput.focus();
        });
    }

    // ==================== 手机端搜索面板 ====================
    // 手机端搜索面板展开/收起
    if (mobileSearchToggle && mobileSearchPanel) {
        mobileSearchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns('mobileSearchToggle');
            const open = mobileSearchPanel.classList.toggle('show');
            mobileSearchToggle.classList.toggle('active', open);
            if (open && mobileSearchInput) {
                setTimeout(() => mobileSearchInput.focus(), 100);
            }
        });
    }

    // 手机端引擎选项点击（事件委托，绑定在 #mobileSearchPanel 父容器上）
    if (mobileSearchPanel) {
        mobileSearchPanel.addEventListener('click', (e) => {
            const opt = e.target.closest('.mobile-engine-option');
            if (!opt) return;
            e.stopPropagation();
            switchEngine(opt.dataset.value);
            if (mobileSearchInput) mobileSearchInput.focus();
        });
    }

    // 手机端搜索提交
    function executeMobileSearch() {
        if (!mobileSearchInput) return;
        const query = mobileSearchInput.value.trim();
        if (!query) return;

        if (current === 'site') {
            mobileSearchInput.value = '';
            const subtitle = document.getElementById('searchResultsSubtitle');
            if (subtitle) {
                const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
                subtitle.textContent = msgs['search.loading'] || '搜索中...';
            }
            showSearchView(query);
            loadSiteSearchData().then(() => {
                renderSiteSearchResults(query);
            });
        } else {
            const engineUrl = UYEA_CONFIG.getSearchEngineUrl(current);
            if (engineUrl) {
                window.open(engineUrl + encodeURIComponent(query), '_blank');
            }
        }
        if (mobileSearchPanel) mobileSearchPanel.classList.remove('show');
        if (mobileSearchToggle) mobileSearchToggle.classList.remove('active');
    }

    if (mobileSearchSubmit) {
        mobileSearchSubmit.addEventListener('click', executeMobileSearch);
    }
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeMobileSearch();
            }
        });
    }

    // ==================== 站内搜索功能 ====================
    let siteSearchData = { posts: null, nav: null };
    let siteSearchPromise = null; // 进行中的加载（去重，防止并发搜索触发重复请求）

    // 加载站内搜索所需数据（懒加载，首次站内搜索时触发；promise 缓存去重）
    function loadSiteSearchData() {
        if (siteSearchPromise) return siteSearchPromise;
        siteSearchPromise = (async () => {
            const tasks = [];
            if (!siteSearchData.posts) {
                tasks.push(
                    UYEA_UTILS.fetchJsonCached(UYEA_CONFIG.dataFiles.posts)
                        .then(data => { siteSearchData.posts = Array.isArray(data) ? data : []; })
                        .catch(() => { siteSearchData.posts = []; })
                );
            }
            if (!siteSearchData.nav) {
                tasks.push(
                    UYEA_UTILS.fetchJsonCached(UYEA_CONFIG.dataFiles.navigation)
                        .then(data => { siteSearchData.nav = data || {}; })
                        .catch(() => { siteSearchData.nav = {}; })
                );
            }
            if (tasks.length > 0) await Promise.all(tasks);
        })().catch(err => {
            siteSearchPromise = null; // 失败时重置，允许后续重试
            throw err;
        });
        return siteSearchPromise;
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
                    comingSoon: card.hasAttribute('data-coming-soon')
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
            const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
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
            forumResultsEl.innerHTML = forumResults.map(p => renderPostCard(p, window.currentLang)).join('');
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
                return `<a href="${esc(item.url)}" target="_blank" rel="noopener" class="card-item" data-title="${esc(item.title)}" title="${esc(item.title)}">
                    <div class="card-icon"><span class="icon-placeholder">${esc(firstChar)}</span></div>
                    <div class="card-info"><div class="card-title">${esc(item.title)}</div></div>
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
                const clickAttr = item.comingSoon ? ' data-coming-soon="' + esc(item.title) + '"' : ' data-tool="' + esc(item.tool) + '"';
                return `<a class="card-item" role="button" tabindex="0"${clickAttr} data-title="${esc(item.title)}" title="${esc(item.title)}">
                    <div class="card-icon"><span class="icon-placeholder">${esc(firstChar)}</span></div>
                    <div class="card-info"><div class="card-title">${esc(item.title)}</div></div>
                </a>`;
            }).join('');

            // 绑定工具卡片点击事件
            toolsResultsEl.querySelectorAll('.card-item[data-tool]').forEach(card => {
                card.addEventListener('click', (e) => {
                    // 触发对应的工具打开（通过模拟点击原工具卡片）
                    const toolName = card.dataset.tool;
                    // 使用 dataset 比较而非字符串拼接选择器，防止 toolName 含特殊字符导致注入
                    const originalCard = Array.from(document.querySelectorAll('#toolsView .card-item[data-tool]')).find(c => c.dataset.tool === toolName);
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
        const searchNoResults = document.getElementById('searchNoResults');
        if (searchNoResults) searchNoResults.style.display = totalCount === 0 ? '' : 'none';
    }

    // 切换到搜索结果视图
    let previousView = 'forum';
    function showSearchView(query) {
        // 记住当前视图，用于返回（白名单校验，防止 currentView 异常时 previousView 变成 undefined）
        if (currentView !== 'search' && typeof VIEWS !== 'undefined' && VIEWS[currentView]) {
            previousView = currentView;
        } else if (!previousView || (typeof VIEWS !== 'undefined' && !VIEWS[previousView])) {
            previousView = 'forum';
        }

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

        // 恢复底部导航内容（含翻译、指示器、拖拽绑定，与 switchView 行为一致）
        if (bottomNav && typeof BOTTOM_NAVS !== 'undefined' && BOTTOM_NAVS[previousView]) {
            bottomNav.innerHTML = BOTTOM_NAVS[previousView];
            // 翻译新注入的底部导航项
            const navMsgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
            bottomNav.querySelectorAll('[data-i18n]').forEach(el => {
                if (navMsgs[el.dataset.i18n]) el.textContent = navMsgs[el.dataset.i18n];
            });
            bottomNav.scrollTo({ left: 0, behavior: 'smooth' });
            // 双 rAF 确保 DOM 渲染完成后再校准指示器位置 + 重新绑定拖拽
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (typeof window.updateBottomNavIndicator === 'function') window.updateBottomNavIndicator();
                    if (typeof window.bindBottomNavDrag === 'function') window.bindBottomNavDrag();
                });
            });
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
                const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
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
        headerSearchInput.addEventListener('keydown', (e) => {
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

    // ==================== 开发中功能：显示成就式提示弹窗 ====================
    document.querySelectorAll('[data-coming-soon]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = btn.getAttribute('data-coming-soon') || btn.dataset.title || '';
            const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
            if (typeof window.showAchievement === 'function') {
                window.showAchievement(msgs['toast.comingSoon'] || '正在完善中', name + (msgs['toast.comingSoonDesc'] || ' · 正在开发中，敬请期待'));
            }
        });
    });

    // ==================== ESC键 + 点击外部关闭所有下拉菜单 ====================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllDropdowns(null);
        }
    });

    // 统一的点击外部关闭下拉菜单（所有下拉菜单均在 DROPDOWN_PAIRS 中统一处理）
    document.addEventListener('click', (e) => {
        DROPDOWN_PAIRS.forEach(({ btnId, menuId }) => {
            const btn = document.getElementById(btnId);
            const menu = document.getElementById(menuId);
            if (menu && menu.classList.contains('show')) {
                if (!menu.contains(e.target) && e.target !== btn && (!btn || !btn.contains(e.target))) {
                    menu.classList.remove('show');
                    if (btn) btn.classList.remove('active');
                }
            }
        });
    });

    // ==================== 图标占位符系统（底色+边框，待后续替换为真实图标） ====================
    // 卡片图标使用首字母占位符，由 navCardHtml 内联生成，无需异步加载

    // ==================== 导航数据加载 + 分类筛选/搜索 ====================
    let navInitialized = false;
    let navCurrentCategory = 'all';

    // 生成单张卡片 HTML（图标用首字母占位符，底色+边框）
    function navCardHtml(item) {
        const firstChar = (item.title || '?').charAt(0).toUpperCase();
        return `<a href="${esc(item.url)}" target="_blank" rel="noopener" class="card-item" data-title="${esc(item.title)}" title="${esc(item.title)}">
            <div class="card-icon">
                <span class="icon-placeholder">${esc(firstChar)}</span>
            </div>
            <div class="card-info">
                <div class="card-title">${esc(item.title)}</div>
            </div>
        </a>`;
    }

    // 生成添加网站卡片 HTML（加号按钮，用于后续网站上传功能）
    function addCardHtml() {
        const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
        const text = msgs['nav.addSite'] || '添加网站';
        return `<button class="add-card" aria-label="${esc(text)}">
            <div class="card-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <div class="card-info">
                <div class="card-title add-card-title" data-i18n="nav.addSite">${esc(text)}</div>
            </div>
        </button>`;
    }

    // 分类筛选 + 搜索过滤 + 2行限制（仅作用于#navView内）
    function applyNavFilter() {
        const noResults = document.getElementById('navNoResults');
        let visibleCount = 0;
        const isLimited = (navCurrentCategory === 'all');
        const allVisibleCards = []; // 收集所有 section 的可见卡片，批量处理动画

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
                const withinLimit = sectionVisible < maxVisible;
                const show = (withinLimit || !isLimited);
                card.style.display = show ? '' : 'none';
                if (show) sectionVisible++;
            });

            section.style.display = (sectionVisible > 0) ? '' : 'none';
            if (sectionVisible > 0) section.classList.add('revealed');
            visibleCount += sectionVisible;

            // 收集可见卡片并禁用动画（统一在循环外做单次 reflow，避免每个 section 都强制回流）
            cards.forEach(card => {
                if (card.style.display !== 'none') {
                    card.style.animation = 'none';
                    allVisibleCards.push(card);
                }
            });
        });

        // 批量 reflow：单次强制回流重置所有卡片动画，再统一启用
        if (allVisibleCards.length > 0) {
            void document.body.offsetHeight;
            allVisibleCards.forEach((card, idx) => {
                card.style.animation = `cardSwitchIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(idx * 0.025, 0.3)}s both`;
            });
        }

        if (noResults) noResults.classList.toggle('show', visibleCount === 0);

        const showMoreBtns = (navCurrentCategory === 'all');
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
            return;
        }
        navInitialized = true;

        UYEA_UTILS.fetchJsonCached(UYEA_CONFIG.dataFiles.navigation)
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
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (typeof window.showAchievement === 'function') {
                            const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
                            window.showAchievement(msgs['toast.comingSoon'] || '正在完善中', msgs['toast.addSite'] || '添加网站功能正在开发中');
                        }
                    });
                });
                // 通知加载动画：导航模块已就绪
                window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'nav' } }));
            })
            .catch(err => {
                console.warn('导航数据加载失败:', err);
                // 即使失败也通知就绪，避免加载动画卡死
                window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'nav' } }));
            });
    }

    // ==================== 底部导航栏分类切换（事件委托） ====================
    // 使用事件委托绑定在持久的 #bottomNav 容器上，避免每次视图切换重新绑定
    // 导航页与工具页都使用 data-category，通过 currentView 区分当前激活视图
    const navBottomNav = document.getElementById('bottomNav');
    if (navBottomNav) {
        navBottomNav.addEventListener('click', (e) => {
            if (currentView !== 'nav') return;
            const item = e.target.closest('.bottom-nav-item[data-category]');
            if (!item || item.classList.contains('active')) return;
            navBottomNav.querySelectorAll('.bottom-nav-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            navCurrentCategory = item.dataset.category;
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
            applyNavFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // "更多"按钮只需绑定一次（静态HTML不会随视图切换重建）
    document.querySelectorAll('#navView .more-btn[data-target-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetCat = btn.dataset.targetCategory;
            const targetNavBtn = document.querySelector(`#bottomNav .bottom-nav-item[data-category="${targetCat}"]`);
            if (targetNavBtn) targetNavBtn.click();
        });
    });

    // 窗口resize时重新计算2行限制 + 搜索栏断点同步关闭下拉（防抖，复用 utils.debounce）
    let lastDesktopMode = window.innerWidth >= 1299;
    window.addEventListener('resize', UYEA_UTILS.debounce(function () {
        if (document.getElementById('navView')?.style.display !== 'none') applyNavFilter();
        // 跨越1299px断点时关闭搜索相关下拉，防止触发元素消失后下拉悬空
        const isDesktop = window.innerWidth >= 1299;
        if (isDesktop !== lastDesktopMode) {
            lastDesktopMode = isDesktop;
            // 桌面端：关闭手机搜索面板；手机端：关闭桌面引擎下拉
            const mobilePanel = document.getElementById('mobileSearchPanel');
            const headerDropdown = document.getElementById('headerEngineDropdown');
            if (mobilePanel) { mobilePanel.classList.remove('show'); }
            const mobileToggle = document.getElementById('mobileSearchToggle');
            if (mobileToggle) { mobileToggle.classList.remove('active'); }
            if (headerDropdown) { headerDropdown.classList.remove('show'); }
            const headerSelect = document.getElementById('headerEngineSelect');
            if (headerSelect) { headerSelect.classList.remove('active'); }
        }
    }, 150));

    // 监听视图切换：切换到导航视图时重置为第一个分类（全部）并重新应用筛选
    window.addEventListener('viewchange', (e) => {
        if (e.detail.view === 'nav') {
            if (!navInitialized) {
                setTimeout(initNavView, 50);
                return;
            }
            // 切换视图时统一重置为第一个分类（全部），不保留历史位置
            navCurrentCategory = 'all';
            // 底部导航HTML已默认第一项active，无需额外操作
            // 重新应用筛选（视图从隐藏变可见，需重新计算布局）
            setTimeout(() => {
                applyNavFilter();
                navFilterApplied = true;
                if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
            }, 50);
        }
    });

    // 导航数据延迟加载：首次切换到导航视图时才加载（viewchange 事件中处理）

    // ==================== 字体异步加载 ====================
    if (document.fonts && document.fonts.load) {
        document.fonts.load('400 14px Noto Sans SC', 'UYEA')
            .catch(err => console.warn('字体预加载失败:', err));
    }

    // ==================== 主题切换（三主题：浅色/深色/极客） ====================
    const themeIconBtn = document.getElementById('themeIconBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    const savedTheme = safeGetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.theme)) ||
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
    }

    // 主题选项点击事件
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const theme = opt.dataset.theme;
            themeOptions.forEach(x => x.classList.remove('active'));
            opt.classList.add('active');
            applyTheme(theme);
            safeSetItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.theme), theme);
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

        // 滚动进度条（使用 transform: scaleX() 代替 width，避免重排）
        if (scrollProgress) {
            scrollProgress.style.transform = 'scaleX(' + (docHeight > 0 ? (scrollY / docHeight) : 0) + ')';
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
