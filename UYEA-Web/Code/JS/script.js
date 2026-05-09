/* ============================================================
   UYEA 悠野工作室 · script.js (重构版)
   功能：菜单控制、搜索、图标加载、语言切换、主题切换、日历农历
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const i18nMessages = {
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

    // ========== 菜单控制 ==========
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    function toggleMenu() {
        if (!menuToggleBtn || !dropdownMenu) return;
        const isOpen = dropdownMenu.classList.toggle('show');
        menuToggleBtn.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    }

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (dropdownMenu) dropdownMenu.classList.remove('show');
            if (menuToggleBtn) menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('click', (e) => {
        if (dropdownMenu && !dropdownMenu.contains(e.target) && menuToggleBtn && !menuToggleBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            if (menuToggleBtn) menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu && dropdownMenu.classList.contains('show')) toggleMenu();
    });

    // ========== 语言切换 ==========
    const langButtons = document.querySelectorAll('.lang-btn');
    const STORAGE_KEY_LANG = 'uyea-lang';

    function updateI18n(lang) {
        const messages = i18nMessages[lang] || i18nMessages['zh-CN'];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (messages[key]) el.textContent = messages[key];
        });
        document.documentElement.lang = lang;
        document.body.setAttribute('data-lang', lang);
        try { localStorage.setItem(STORAGE_KEY_LANG, lang); } catch (e) {}
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateI18n(lang);
            moveLangHighlight(btn);
        });
    });

    function initLanguage() {
        let savedLang = null;
        try { savedLang = localStorage.getItem(STORAGE_KEY_LANG); } catch (e) {}
        const lang = savedLang || document.documentElement.lang || 'zh-CN';
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
        updateI18n(lang);
        const active = document.querySelector('.lang-btn.active');
        if (active) moveLangHighlight(active);
    }
    initLanguage();

    // 语言切换滑动高亮
    const langSelector = document.getElementById('langSelector');
    const langHighlight = document.getElementById('langHighlight');

    function moveLangHighlight(targetBtn) {
        if (!targetBtn || !langHighlight || !langSelector) return;
        const selectorRect = langSelector.getBoundingClientRect();
        const btnRect = targetBtn.getBoundingClientRect();
        langHighlight.style.width = `${btnRect.width}px`;
        langHighlight.style.transform = `translateX(${btnRect.left - selectorRect.left}px)`;
    }

    // ========== 搜索引擎切换 ==========
    const engineDropdownWrapper = document.getElementById('engineDropdownWrapper');
    const engineTriggerBtn = document.getElementById('engineTriggerBtn');
    const engineTriggerLabel = document.getElementById('engineTriggerLabel');
    const engineOptionItems = document.querySelectorAll('.engine-option-item');
    const searchInput = document.getElementById('searchInput');
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchDropdown = document.getElementById('searchDropdown');
    const cardItems = document.querySelectorAll('.card-item');
    const sections = document.querySelectorAll('.section-group');

    const engineUrls = {
        site: null,
        baidu: "https://www.baidu.com/s?wd=",
        google: "https://www.google.com/search?q=",
        bing: "https://cn.bing.com/search?q="
    };

    const STORAGE_KEY_ENGINE = 'uyea-search-engine';
    let currentEngine = 'baidu';

    function initSearchEngine() {
        try { currentEngine = localStorage.getItem(STORAGE_KEY_ENGINE) || 'baidu'; } catch (e) { currentEngine = 'baidu'; }
        if (!engineUrls.hasOwnProperty(currentEngine)) currentEngine = 'baidu';
        engineOptionItems.forEach(item => {
            if (item.getAttribute('data-value') === currentEngine) {
                item.classList.add('selected');
                if (engineTriggerLabel) engineTriggerLabel.textContent = item.textContent.trim();
            } else { item.classList.remove('selected'); }
        });
    }
    initSearchEngine();

    engineOptionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const engine = this.getAttribute('data-value');
            if (!engineUrls.hasOwnProperty(engine)) return;
            currentEngine = engine;
            engineOptionItems.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            if (engineTriggerLabel) engineTriggerLabel.textContent = this.textContent.trim();
            if (engineTriggerBtn) {
                engineTriggerBtn.classList.add('clicking');
                setTimeout(() => engineTriggerBtn.classList.remove('clicking'), 200);
            }
            try { localStorage.setItem(STORAGE_KEY_ENGINE, engine); } catch (e) {}
            // 切换引擎后清空输入，重置卡片显示
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                resetCardDisplay();
            }
        });
    });

    function resetCardDisplay() {
        cardItems.forEach(card => { card.style.display = 'flex'; });
        sections.forEach(section => { section.style.display = 'block'; });
    }

    if (searchIconBtn && searchDropdown) {
        searchIconBtn.addEventListener('click', () => {
            searchDropdown.classList.toggle('show');
            if (searchDropdown.classList.contains('show') && searchInput) {
                setTimeout(() => searchInput.focus(), 50);
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchDropdown.contains(e.target) && e.target !== searchIconBtn) {
                searchDropdown.classList.remove('show');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (currentEngine === 'site') {
                const keyword = this.value.toLowerCase().trim();
                cardItems.forEach(card => {
                    const title = card.querySelector('.card-title');
                    if (title) {
                        card.style.display = title.textContent.toLowerCase().includes(keyword) ? 'flex' : 'none';
                    }
                });
                sections.forEach(section => {
                    const hasVisible = Array.from(section.querySelectorAll('.card-item')).some(c => c.style.display !== 'none');
                    section.style.display = hasVisible ? 'block' : 'none';
                });
            }
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const keyword = this.value.trim();
                if (currentEngine !== 'site' && keyword !== '') {
                    window.open(engineUrls[currentEngine] + encodeURIComponent(keyword), '_blank');
                }
            }
        });
    }

    // ========== 图标加载优化 ==========
    const iconBase = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/ICONS/';
    const emojiFallback = {
        'chatgpt': '🤖',
        'gemini': '✨',
        'claude': '🎯',
        'deepseek': '🧠',
        'yiyan': '📝',
        'qianwen': '💬',
        'kimi': '🌟',
        'doubao': '🫘',
        'yuanbao': '💰',
        'perplexity': '🔍',
        'copilot': '👨‍✈️',
        'grok': '🧬',
        'xiaohongshu': '📕',
        'bilibili': '📺',
        'zhihu': '💡',
        'github': '🐙',
        'tinypng': '🐼',
        'v0': '🌀'
    };

    function showEmoji(cardIcon, siteName) {
        const emoji = emojiFallback[siteName] || '🔗';
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'icon-emoji';
        emojiSpan.textContent = emoji;
        emojiSpan.title = siteName;
        cardIcon.innerHTML = '';
        cardIcon.appendChild(emojiSpan);
    }

    function loadIconImage(img) {
        const siteName = img.getAttribute('data-site-name');
        if (!siteName) return;
        const cardIcon = img.parentElement;
        if (!cardIcon) return;

        // 显示加载指示器
        const loader = document.createElement('div');
        loader.className = 'icon-loading';
        cardIcon.appendChild(loader);

        img.src = `${iconBase}${siteName}.ico`;
        img.onload = () => {
            loader.remove();
            img.style.display = '';
        };
        img.onerror = () => {
            loader.remove();
            img.remove();
            showEmoji(cardIcon, siteName);
        };
    }

    // 对已存在的图片直接处理
    document.querySelectorAll('.card-icon img[data-site-name]').forEach(img => loadIconImage(img));

    // 动态加载导航数据后的图标也会被MutationObserver捕获
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mu => {
            mu.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches && node.matches('img[data-site-name]')) {
                        loadIconImage(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img[data-site-name]').forEach(img => loadIconImage(img));
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ========== 动态加载导航分类数据 ==========
    async function loadNavigation() {
        try {
            const resp = await fetch('/Data/JSON/navigation.json');
            const nav = await resp.json();
            renderSection('ai-section', nav.ai);
            renderSection('life-section', nav.life);
            renderSection('tools-section', nav.tools);
        } catch (e) {
            console.warn('导航数据加载失败', e);
        }
    }

    function renderSection(sectionId, items) {
        const section = document.getElementById(sectionId);
        if (!section || !items) return;
        const grid = section.querySelector('.grid-container');
        if (!grid) return;
        grid.innerHTML = items.map(item => `
            <a href="${item.url}" target="_blank" class="card-item">
                <div class="card-icon">
                    <img src="" data-site-name="${item.icon}" loading="lazy" width="48" height="48" style="display:none">
                </div>
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                </div>
            </a>
        `).join('');
        // 图标加载将由观察者处理，但为了速度，手动触发一次可见的
        grid.querySelectorAll('img[data-site-name]').forEach(img => loadIconImage(img));
    }

    if (document.getElementById('ai-section')) {
        loadNavigation();
    }

    // ========== 时钟更新 ==========
    function updateClock() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const clockTimeMain = document.getElementById('clockTimeMain');
        if (clockTimeMain) clockTimeMain.textContent = `${hours}:${minutes}:${seconds}`;
        const clockDateGregorian = document.getElementById('clockDateGregorian');
        if (clockDateGregorian) clockDateGregorian.textContent = `${year}年${month}月${day}日`;
        const clockDateLunar = document.getElementById('clockDateLunar');
        if (clockDateLunar && typeof Solar !== 'undefined' && typeof Lunar !== 'undefined') {
            try {
                const solar = Solar.fromYmd(year, month, day);
                const lunar = Lunar.fromSolar(solar);
                clockDateLunar.textContent = `（农历${lunar.getMonthInChinese()}${lunar.getDayInChinese()}）`;
            } catch (e) {}
        }
    }

    function initClock() {
        if (typeof Lunar !== 'undefined') {
            updateClock();
            setInterval(updateClock, 1000);
        } else setTimeout(initClock, 100);
    }
    initClock();
});