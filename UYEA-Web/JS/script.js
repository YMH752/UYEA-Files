document.addEventListener('DOMContentLoaded', () => {
    // ==================== 多语言系统 ====================
    const setLang = (lang) => {
        const msgs = UYEA_CONFIG.i18n[lang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (msgs[el.dataset.i18n]) el.textContent = msgs[el.dataset.i18n];
        });
        try { 
            localStorage.setItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language), lang); 
        } catch (e) { 
            console.warn('localStorage unavailable:', e.message); 
        }
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
    const savedLang = localStorage.getItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language)) || UYEA_CONFIG.defaultLanguage;
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
    const engineBtn = document.getElementById('engineTriggerBtn');
    const engineLabel = document.getElementById('engineTriggerLabel');
    const engineItems = document.querySelectorAll('.engine-option-item');
    const searchInput = document.getElementById('searchInput');
    const searchIcon = document.getElementById('searchIconBtn');
    const searchDropdown = document.getElementById('searchDropdown');

    let current = localStorage.getItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine)) || UYEA_CONFIG.defaultSearchEngine;
    if (!UYEA_CONFIG.searchEngines[current]) current = UYEA_CONFIG.defaultSearchEngine;

    // 初始化搜索引擎
    engineItems.forEach(i => {
        if (i.dataset.value === current) {
            i.classList.add('selected');
            if (engineLabel) engineLabel.textContent = i.textContent.trim();
        }
    });

    engineItems.forEach(i => {
        i.addEventListener('click', (e) => {
            e.stopPropagation();
            current = i.dataset.value;
            engineItems.forEach(x => x.classList.remove('selected'));
            i.classList.add('selected');
            if (engineLabel) engineLabel.textContent = i.textContent.trim();
            try {
                localStorage.setItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.searchEngine), current);
            } catch (e) {
                console.warn('localStorage unavailable:', e.message);
            }
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
        });
    });

    // 搜索下拉菜单
    if (searchIcon && searchDropdown) {
        searchIcon.addEventListener('click', () => {
            searchDropdown.classList.toggle('show');
            if (searchDropdown.classList.contains('show') && searchInput) {
                searchInput.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchDropdown.contains(e.target) && e.target !== searchIcon) {
                searchDropdown.classList.remove('show');
            }
        });
    }

    // 搜索提交
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (!query) return;
                
                if (current === 'site') {
                    // 站内搜索提示
                    showComingSoon('站内搜索');
                    searchInput.value = '';
                } else {
                    const engineUrl = UYEA_CONFIG.getSearchEngineUrl(current);
                    if (engineUrl) {
                        window.open(engineUrl + encodeURIComponent(query), '_blank');
                    }
                }
            }
        });
    }

    // ==================== 开发中提示模态框 ====================
    const comingSoonModal = document.getElementById('comingSoonModal');
    const comingSoonOverlay = document.getElementById('comingSoonOverlay');

    function showComingSoon(title = '功能开发中', text = '该功能正在开发中，敬请期待！') {
        const titleEl = document.getElementById('comingSoonTitle');
        const textEl = document.getElementById('comingSoonText');
        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = text;
        if (comingSoonModal) comingSoonModal.classList.add('show');
        if (comingSoonOverlay) comingSoonOverlay.classList.add('show');
    }

    function hideComingSoon() {
        if (comingSoonModal) comingSoonModal.classList.remove('show');
        if (comingSoonOverlay) comingSoonOverlay.classList.remove('show');
    }

    const comingSoonClose = document.getElementById('comingSoonClose');
    if (comingSoonClose) comingSoonClose.addEventListener('click', hideComingSoon);
    if (comingSoonOverlay) comingSoonOverlay.addEventListener('click', hideComingSoon);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideComingSoon();
    });

    document.querySelectorAll('[data-coming-soon]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const title = btn.dataset.comingSoon || '功能开发中';
            showComingSoon(title);
        });
    });

    // ==================== 图标加载系统 ====================
    /**
     * 尝试从多个源加载图标，失败降级到emoji
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

        // 优先使用同域图标
        const sources = [
            UYEA_CONFIG.resources.iconBaseFallback + name + '.png',
            UYEA_CONFIG.resources.iconBase + name + '.png'
        ];
        let sourceIndex = 0;

        function tryNextSource() {
            if (sourceIndex >= sources.length) {
                // 所有源都失败，降级到emoji
                if (loader.parentElement) loader.remove();
                img.remove();
                const span = document.createElement('span');
                span.className = 'icon-emoji';
                span.textContent = UYEA_CONFIG.emojiMap[name] || '🔗';
                parent.appendChild(span);
                return;
            }

            const src = sources[sourceIndex++];
            img.src = src;
            img.style.display = 'none';

            // 成功加载
            img.onload = () => {
                if (loader.parentElement) loader.remove();
                img.style.display = '';
                img.dataset.iconLoaded = 'true';
                delete img.dataset.iconLoading;
            };

            // 失败重试
            img.onerror = () => {
                tryNextSource();
            };
        }

        tryNextSource();
    }

    function loadIconsIn(container) {
        if (!container) return;
        container.querySelectorAll('img[data-site-name]').forEach(loadIcon);
    }

    document.querySelectorAll('img[data-site-name]').forEach(loadIcon);

    // 使用 MutationObserver 监听动态插入的图标
    new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(n => {
                if (n.nodeType === 1) {
                    if (n.matches && n.matches('img[data-site-name]')) {
                        loadIcon(n);
                    } else if (n.querySelectorAll) {
                        n.querySelectorAll('img[data-site-name]').forEach(loadIcon);
                    }
                }
            });
        });
    }).observe(document.body, { childList: true, subtree: true });

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
                                <a href="${item.url}" target="_blank" class="card-item" title="${item.title}">
                                    <div class="card-icon">
                                        <img src="" data-site-name="${item.icon}" style="display:none" alt="${item.title}">
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

    // ==================== 时钟系统 ====================
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

    updateClock();
    setInterval(updateClock, 1000);

    // ==================== 字体异步加载 ====================
    if (document.fonts && document.fonts.load) {
        document.fonts.load('400 14px Noto Sans SC', 'UYEA')
            .catch(err => console.warn('字体预加载失败:', err));
    }
});
