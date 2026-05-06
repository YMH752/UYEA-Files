/* ============================================================
   UYEA 悠野工作室 · script.js (重构版)
   功能：菜单控制、搜索、图标加载、语言切换、主题切换、日历农历
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ════════════════════════════════════════════════════════════
       0. 国际化文案配置
       ════════════════════════════════════════════════════════════ */
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

    /* ════════════════════════════════════════════════════════════
       1. 菜单控制
       ════════════════════════════════════════════════════════════ */
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    function toggleMenu() {
        const isOpen = dropdownMenu.classList.toggle('show');
        menuToggleBtn.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
            menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !menuToggleBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('show')) {
            toggleMenu();
        }
    });

    /* ════════════════════════════════════════════════════════════
       2. 语言切换
       ════════════════════════════════════════════════════════════ */
    const langButtons = document.querySelectorAll('.lang-btn');
    const STORAGE_KEY_LANG = 'uyea-lang';

    function updateI18n(lang) {
        const messages = i18nMessages[lang] || i18nMessages['zh-CN'];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (messages[key]) {
                el.textContent = messages[key];
            }
        });

        document.documentElement.lang = lang;
        document.body.setAttribute('data-lang', lang);
        
        try {
            localStorage.setItem(STORAGE_KEY_LANG, lang);
        } catch (e) {}
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            updateI18n(lang);
        });
    });

    function initLanguage() {
        let savedLang = null;
        try {
            savedLang = localStorage.getItem(STORAGE_KEY_LANG);
        } catch (e) {}
        
        const lang = savedLang || document.documentElement.lang || 'zh-CN';
        
        langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        updateI18n(lang);
    }

    initLanguage();

    /* ════════════════════════════════════════════════════════════
       3. 搜索功能（搜索引擎切换 + 本地搜索）
       ════════════════════════════════════════════════════════════ */
    const engineDropdownWrapper = document.getElementById('engineDropdownWrapper');
    const engineTriggerBtn = document.getElementById('engineTriggerBtn');
    const engineTriggerLabel = document.getElementById('engineTriggerLabel');
    const engineOptionItems = document.querySelectorAll('.engine-option-item');
    const searchInput = document.getElementById('searchInput');
    const pageSearchInput = document.getElementById('pageSearchInput');
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
        try {
            currentEngine = localStorage.getItem(STORAGE_KEY_ENGINE) || 'baidu';
        } catch (e) {
            currentEngine = 'baidu';
        }

        if (!engineUrls.hasOwnProperty(currentEngine)) {
            currentEngine = 'baidu';
        }

        engineOptionItems.forEach(item => {
            if (item.getAttribute('data-value') === currentEngine) {
                item.classList.add('selected');
                engineTriggerLabel.textContent = item.textContent.trim();
            } else {
                item.classList.remove('selected');
            }
        });
    }

    initSearchEngine();

    engineOptionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const engine = this.getAttribute('data-value');
            
            if (!engineUrls.hasOwnProperty(engine)) {
                return;
            }
            
            currentEngine = engine;
            
            engineOptionItems.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            engineTriggerLabel.textContent = this.textContent.trim();
            
            engineTriggerBtn.classList.add('clicking');
            setTimeout(() => {
                engineTriggerBtn.classList.remove('clicking');
            }, 200);
            
            try {
                localStorage.setItem(STORAGE_KEY_ENGINE, engine);
            } catch (e) {}
        });
    });

    [searchInput, pageSearchInput].forEach(input => {
        if (!input) return;

        input.addEventListener('input', function() {
            if (currentEngine === 'site') {
                const keyword = this.value.toLowerCase().trim();
                cardItems.forEach(card => {
                    const title = card.querySelector('.card-title').textContent.toLowerCase();
                    card.style.display = title.includes(keyword) ? 'flex' : 'none';
                });
                sections.forEach(section => {
                    const hasVisible = Array.from(section.querySelectorAll('.card-item')).some(c => c.style.display !== 'none');
                    section.style.display = hasVisible ? 'block' : 'none';
                });
            }
        });

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const keyword = this.value.trim();
                if (currentEngine !== 'site' && keyword !== '') {
                    window.open(engineUrls[currentEngine] + encodeURIComponent(keyword), '_blank');
                }
            }
        });
    });

    /* ════════════════════════════════════════════════════════════
       4. 日历和农历功能
       ════════════════════════════════════════════════════════════ */
    
    /* ════════════════════════════════════════════════════════════
       5. 实时时钟更新（包括农历）
       ════════════════════════════════════════════════════════════ */
    
    function updateClock() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // 更新数字时钟
        const clockTimeMain = document.getElementById('clockTimeMain');
        if (clockTimeMain) {
            clockTimeMain.textContent = `${hours}:${minutes}:${seconds}`;
        }
        
        // 更新公历日期
        const clockDateGregorian = document.getElementById('clockDateGregorian');
        if (clockDateGregorian) {
            clockDateGregorian.textContent = `${year}年${month}月${day}日`;
        }
        
        // 更新农历日期
        const clockDateLunar = document.getElementById('clockDateLunar');
        if (clockDateLunar && typeof Solar !== 'undefined' && typeof Lunar !== 'undefined') {
            try {
                const solar = Solar.fromYmd(year, month, day);
                const lunar = Lunar.fromSolar(solar);
                const lunarMonthStr = lunar.getMonthInChinese();
                const lunarDayStr = lunar.getDayInChinese();
                clockDateLunar.textContent = `（农历${lunarMonthStr}${lunarDayStr}）`;
            } catch (e) {
                console.warn('农历更新失败:', e);
            }
        }
    }
    
    // 初始化时钟（等待Lunar库加载）
    function initClock() {
        if (typeof Lunar !== 'undefined') {
            updateClock();
            setInterval(updateClock, 1000);
        } else {
            // 如果Lunar库还未加载，继续等待
            setTimeout(initClock, 100);
        }
    }
    initClock();
});
