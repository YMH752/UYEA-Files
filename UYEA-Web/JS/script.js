document.addEventListener('DOMContentLoaded', () => {
    // ==================== 多语言系统 ====================
    const i18n = {
        'zh-CN': {
            'nav.home': '网站导航',
            'nav.tools': '线上工具',
            'nav.forum': '悠野社区',
            'btn.register': '注册',
            'btn.auth': '登录/注册',
            'section.ai': 'AI 智能体',
            'section.life': '生活',
            'section.tools': '工具'
        },
        'zh-TW': {
            'nav.home': '網站導航',
            'nav.tools': '線上工具',
            'nav.forum': '悠野社區',
            'btn.register': '註冊',
            'btn.auth': '登入/註冊',
            'section.ai': 'AI 智能體',
            'section.life': '生活',
            'section.tools': '工具'
        },
        'en': {
            'nav.home': 'Navigation',
            'nav.tools': 'Tools',
            'nav.forum': 'Community',
            'btn.register': 'Register',
            'btn.auth': 'Sign In / Sign Up',
            'section.ai': 'AI Assistants',
            'section.life': 'Lifestyle',
            'section.tools': 'Tools'
        }
    };

    const setLang = (lang) => {
        const msgs = i18n[lang] || i18n['zh-CN'];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (msgs[el.dataset.i18n]) el.textContent = msgs[el.dataset.i18n];
        });
        try { localStorage.setItem('uyea-lang', lang); } catch (e) { }
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
    const savedLang = localStorage.getItem('uyea-lang') || 'zh-CN';
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === savedLang));
    setLang(savedLang);
    const activeBtn = document.querySelector('.lang-btn.active');
    if (activeBtn) moveLangHighlight(activeBtn);

    function moveLangHighlight(btn) {
        const hl = document.getElementById('langHighlight');
        const sel = document.getElementById('langSelector');
        if (!hl || !sel) return;
        const sr = sel.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        hl.style.width = br.width + 'px';
        hl.style.transform = `translateX(${br.left - sr.left}px)`;
    }

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

    const engines = {
        site: null,
        baidu: 'https://www.baidu.com/s?wd=',
        google: 'https://www.google.com/search?q=',
        bing: 'https://cn.bing.com/search?q='
    };

    let current = localStorage.getItem('uyea-engine') || 'baidu';
    if (!engines[current]) current = 'baidu';

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
            localStorage.setItem('uyea-engine', current);
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
            if (e.key === 'Enter' && current !== 'site' && searchInput.value.trim()) {
                window.open(
                    engines[current] + encodeURIComponent(searchInput.value.trim()),
                    '_blank'
                );
            }
        });
    }

    // ==================== 图标加载系统 ====================
    const iconBase = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/Icons/';
    const emojiMap = {
        chatgpt: '🤖', gemini: '✨', claude: '🎯', deepseek: '🧠',
        yiyan: '📝', qianwen: '💬', kimi: '🌟', doubao: '🫘',
        yuanbao: '💰', perplexity: '🔍', copilot: '👨‍✈️', grok: '🧬',
        xiaohongshu: '📕', bilibili: '📺', zhihu: '💡',
        github: '🐙', tinypng: '🐼', v0: '🌀'
    };

    function loadIcon(img) {
        const name = img.dataset.siteName;
        if (!name) return;
        const parent = img.parentElement;
        if (!parent) return;

        const loader = document.createElement('div');
        loader.className = 'icon-loading';
        parent.appendChild(loader);

        img.src = iconBase + name + '.ico';
        img.style.display = 'none';

        // 成功加载
        img.onload = () => {
            if (loader.parentElement) loader.remove();
            img.style.display = '';
        };

        // 失败回退到emoji
        img.onerror = () => {
            if (loader.parentElement) loader.remove();
            img.remove();
            const s = document.createElement('span');
            s.className = 'icon-emoji';
            s.textContent = emojiMap[name] || '🔗';
            parent.appendChild(s);
        };
    }

    document.querySelectorAll('img[data-site-name]').forEach(loadIcon);

    // 监听DOM插入新的图标
    new MutationObserver(muts => {
        muts.forEach(m => {
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
        fetch('/JSON/navigation.json')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load navigation');
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
                    }
                });
            })
            .catch(err => {
                console.warn('Navigation data load failed:', err);
                // 静默失败，使用空布局
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
                console.warn('Lunar date calculation failed:', e);
            }
        } else {
            // 农历库未加载，隐藏农历显示
            const l = document.getElementById('clockDateLunar');
            if (l) l.style.display = 'none';
        }
    }

    updateClock();
    setInterval(updateClock, 1000);

    // ==================== 字体延迟加载 ====================
    // 使用font-display: swap 的方式让用户看到内容，同时在后台加载自定义字体
    if (document.readyState !== 'loading') {
        loadFontsAsync();
    } else {
        document.addEventListener('DOMContentLoaded', loadFontsAsync);
    }

    function loadFontsAsync() {
        // 预加载Google Fonts (可选，如需高优先级)
        if (document.fonts && document.fonts.load) {
            document.fonts.load('400 14px Noto Sans SC', 'UYEA')
                .catch(err => console.warn('Font preload skipped:', err));
        }
    }
});
