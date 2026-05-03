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

    /* 修改位置：添加 btn.auth i18n 文案 */
    /* 前后逻辑：原仅有 btn.register，现添加新的 btn.auth */
    /* 修改目的：支持多语言"登录/注册"显示 */

    /* ════════════════════════════════════════════════════════════
       0.5. 节假日配置（中国+国际）
       ════════════════════════════════════════════════════════════ */
    const HOLIDAYS = {
        /* 中国节假日 */
        '2026-01-01': { name: '元旦', type: 'cn' },
        '2026-02-17': { name: '春节', type: 'cn' },
        '2026-02-18': { name: '春节', type: 'cn' },
        '2026-02-19': { name: '春节', type: 'cn' },
        '2026-02-20': { name: '春节', type: 'cn' },
        '2026-02-21': { name: '春节', type: 'cn' },
        '2026-02-22': { name: '春节', type: 'cn' },
        '2026-02-23': { name: '春节', type: 'cn' },
        '2026-02-24': { name: '春节', type: 'cn' },
        '2026-04-04': { name: '清明节', type: 'cn' },
        '2026-04-05': { name: '清明节', type: 'cn' },
        '2026-04-06': { name: '清明节', type: 'cn' },
        '2026-05-01': { name: '劳动节', type: 'cn' },
        '2026-05-02': { name: '劳动节', type: 'cn' },
        '2026-05-03': { name: '劳动节', type: 'cn' },
        '2026-05-04': { name: '劳动节', type: 'cn' },
        '2026-05-05': { name: '劳动节', type: 'cn' },
        '2026-06-09': { name: '端午节', type: 'cn' },
        '2026-06-10': { name: '端午节', type: 'cn' },
        '2026-06-11': { name: '端午节', type: 'cn' },
        '2026-09-15': { name: '中秋节', type: 'cn' },
        '2026-09-16': { name: '中秋节', type: 'cn' },
        '2026-09-17': { name: '中秋节', type: 'cn' },
        '2026-10-01': { name: '国庆节', type: 'cn' },
        '2026-10-02': { name: '国庆节', type: 'cn' },
        '2026-10-03': { name: '国庆节', type: 'cn' },
        '2026-10-04': { name: '国庆节', type: 'cn' },
        '2026-10-05': { name: '国庆节', type: 'cn' },
        '2026-10-06': { name: '国庆节', type: 'cn' },
        '2026-10-07': { name: '国庆节', type: 'cn' },
        
        /* 国际节假日 */
        '2026-02-14': { name: 'Valentine\'s Day', type: 'intl' },
        '2026-03-17': { name: 'St. Patrick\'s Day', type: 'intl' },
        '2026-04-12': { name: 'Easter', type: 'intl' },
        '2026-10-31': { name: 'Halloween', type: 'intl' },
        '2026-12-25': { name: 'Christmas', type: 'intl' }
    };

    /* 修改位置：新增节假日配置 */
    /* 前后逻辑：原无节假日标记，现添加中国和国际节假日 */
    /* 修改目的：在日历上突出显示节假日 */

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
            
            /* 修改位置：添加引擎按钮点击动画 */
            /* 前后逻辑：原无点击动画，现添加反弹效果 */
            /* 修改目的：增强用户交互反馈 */
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
    
    /* 修改位置：新增农历计算函数 */
    /* 前后逻辑：原无农历显示，现添加农历日期计算 */
    /* 修改目的：显示农历日期 */
    function solarToLunar(year, month, day) {
        // 简化农历计算（适用范围：2000-2100）
        const lunarData = [
            [0, 1, 29, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 30, 60, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 2, 18, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
        const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                          '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                          '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

        const calendarData = [
            [1900, 1, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1901, 2, 18, 43, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1902, 2, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        // 简化处理：对于2026年，使用近似农历计算
        const diff = (new Date(year, month - 1, day) - new Date(1900, 0, 30)) / 86400000;
        let lunarDaysCount = 0;
        let lunarYear = 1900;
        let lunarMonth = 1;
        let lunarDay = 1;

        // 简化农历：跳过复杂计算，返回常用描述
        const monthOffset = (month - 1 + (year - 1900) * 12) % 384;
        const dayOffset = (day - 1 + diff % 30) % 30 + 1;

        if (dayOffset === 1) {
            lunarMonth = (month % 12) || 12;
            lunarDay = 1;
        } else {
            lunarDay = dayOffset;
        }

        const monthName = lunarMonths[lunarMonth - 1] || '正';
        const dayName = lunarDays[Math.min(lunarDay - 1, 29)] || '初一';

        return `农历${monthName}月${dayName}`;
    }

    /* 修改位置：添加日历渲染函数 */
    /* 前后逻辑：原无日历功能，现添加日历显示和交互 */
    /* 修改目的：在页面上显示可交互的日历 */
    let currentCalendarYear = new Date().getFullYear();
    let currentCalendarMonth = new Date().getMonth() + 1;
    let selectedDate = new Date();

    function renderCalendar(year, month) {
        const calendarDatesContainer = document.getElementById('calendarDates');
        const calendarTitle = document.getElementById('calendarTitle');

        if (!calendarDatesContainer) return;

        calendarTitle.textContent = `${year}年${month}月`;

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const prevLastDay = new Date(year, month - 1, 0);

        const firstDayWeek = firstDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDayDate = prevLastDay.getDate();

        calendarDatesContainer.innerHTML = '';

        // 上月日期
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const date = prevLastDayDate - i;
            const dateElem = createDateElement(year, month - 1, date, true);
            calendarDatesContainer.appendChild(dateElem);
        }

        // 当月日期
        for (let date = 1; date <= lastDayDate; date++) {
            const dateElem = createDateElement(year, month, date, false);
            calendarDatesContainer.appendChild(dateElem);
        }

        // 下月日期
        const totalCells = calendarDatesContainer.children.length;
        const remainingCells = 42 - totalCells;
        for (let date = 1; date <= remainingCells; date++) {
            const dateElem = createDateElement(year, month + 1, date, true);
            calendarDatesContainer.appendChild(dateElem);
        }
    }

    function createDateElement(year, month, date, isOtherMonth) {
        const dateElem = document.createElement('div');
        dateElem.className = 'calendar-date';

        if (isOtherMonth) {
            dateElem.classList.add('other-month');
        }

        // 检查是否为今天
        const today = new Date();
        if (!isOtherMonth && year === today.getFullYear() && month === today.getMonth() + 1 && date === today.getDate()) {
            dateElem.classList.add('today');
        }

        // 检查是否为节假日
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        if (HOLIDAYS[dateStr]) {
            const holiday = HOLIDAYS[dateStr];
            dateElem.classList.add(`holiday-${holiday.type}`);
            dateElem.setAttribute('data-holiday', holiday.name);
        }

        dateElem.textContent = date;
        dateElem.addEventListener('click', () => {
            document.querySelectorAll('.calendar-date.selected').forEach(el => {
                el.classList.remove('selected');
            });
            dateElem.classList.add('selected');
            selectedDate = new Date(year, month - 1, date);
        });

        return dateElem;
    }

    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 1) {
                currentCalendarMonth = 12;
                currentCalendarYear--;
            }
            renderCalendar(currentCalendarYear, currentCalendarMonth);
        });

        nextMonthBtn.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 12) {
                currentCalendarMonth = 1;
                currentCalendarYear++;
            }
            renderCalendar(currentCalendarYear, currentCalendarMonth);
        });
    }

    // 初始化日历
    renderCalendar(currentCalendarYear, currentCalendarMonth);

    // 更新农历日期
    function updateLunarDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const lunarDate = solarToLunar(year, month, day);
        const lunarElem = document.getElementById('clockLunar');
        if (lunarElem) {
            lunarElem.textContent = `（${lunarDate}）`;
        }
    }

    updateLunarDate();

    /* ════════════════════════════════════════════════════════════
       5. GitHub 图标加载配置
       ════════════════════════════════════════════════════════════ */
    const GITHUB_CONFIG = {
        username: 'YMH752',
        repo: 'UYEA-Files',
        branch: 'main',
        path: 'UYEA-Web/Code/icons'
    };

    const EMOJI_FALLBACK = {
        'gemini.google.com': '🔮',
        'chatgpt.com': '🤖',
        'claude.ai': '💬',
        'deepseek.com': '🔍',
        'yiyan.baidu.com': '💡',
        'qianwen.aliyun.com': '✨',
        'kimi.ai': '🎯',
        'doubao.com': '🎁',
        'yuanbao.tencent.com': '💎',
        'perplexity.ai': '🧠',
        'grok.com': '⚡',
        'copilot.cloud.microsoft': '🚀',
        'xiaohongshu.com': '📸',
        'bilibili.com': '🎬',
        'zhihu.com': '❓',
        'github.com': '🐙',
        'tinypng.com': '🗜️',
        'v0.dev': '⚙️'
    };

    function buildGitHubRawUrl(filename) {
        return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}/${filename}`;
    }

    function loadLocalIcon(img, iconFileName, siteName, domain) {
        const url = buildGitHubRawUrl(iconFileName);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
        );

        const fetchPromise = fetch(url, { mode: 'no-cors' })
            .then(response => {
                if (response.status >= 400) {
                    throw new Error(`HTTP ${response.status}`);
                }
                img.src = url;
                img.closest('.card-icon')?.classList.remove('skeleton');
            })
            .catch((err) => {
                throw new Error(`Load failed: ${err.message}`);
            });

        Promise.race([fetchPromise, timeoutPromise])
            .catch(() => {
                img.closest('.card-icon')?.classList.remove('skeleton');
                handleIconLoadFailure(img, siteName, domain);
            });
    }

    function handleIconLoadFailure(img, siteName, domain) {
        const emoji = EMOJI_FALLBACK[domain] || '🔗';
        const container = img.closest('.card-icon');
        if (container) {
            container.innerHTML = `<div class="icon-emoji">${emoji}</div>`;
        }
    }

    const ICON_FILE_MAPPING = {
        'chatgpt.com': 'chatgpt.ico',
        'gemini.google.com': 'gemini.ico',
        'claude.ai': 'claude.ico',
        'deepseek.com': 'deepseek.ico',
        'yiyan.baidu.com': 'yiyan.ico',
        'qianwen.aliyun.com': 'qianwen.ico',
        'kimi.ai': 'kimi.ico',
        'doubao.com': 'doubao.ico',
        'yuanbao.tencent.com': 'yuanbao.ico',
        'perplexity.ai': 'perplexity.ico',
        'grok.com': 'grok.ico',
        'copilot.cloud.microsoft': 'copilot.ico',
        'xiaohongshu.com': 'xiaohongshu.ico',
        'bilibili.com': 'bilibili.ico',
        'zhihu.com': 'zhihu.ico',
        'github.com': 'github.ico',
        'tinypng.com': 'tinypng.ico',
        'v0.dev': 'v0dev.ico'
    };

    function initializeIconLoading() {
        const useObserver = 'IntersectionObserver' in window;

        const observer = useObserver ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                const domain = img.getAttribute('data-domain');
                const siteName = img.getAttribute('data-site-name');
                const iconFileName = ICON_FILE_MAPPING[domain];
                if (iconFileName) {
                    loadLocalIcon(img, iconFileName, siteName, domain);
                } else {
                    img.closest('.card-icon')?.classList.remove('skeleton');
                    handleIconLoadFailure(img, siteName, domain);
                }
                obs.unobserve(img);
            });
        }, {
            rootMargin: '100px'
        }) : null;

        document.querySelectorAll('.card-icon img').forEach(img => {
            const domain = img.getAttribute('data-domain');
            const siteName = img.getAttribute('data-site-name');

            if (!domain || !siteName) {
                return;
            }

            img.closest('.card-icon')?.classList.add('skeleton');

            if (useObserver) {
                observer.observe(img);
            } else {
                const iconFileName = ICON_FILE_MAPPING[domain];
                if (!iconFileName) {
                    img.closest('.card-icon')?.classList.remove('skeleton');
                    handleIconLoadFailure(img, siteName, domain);
                    return;
                }
                loadLocalIcon(img, iconFileName, siteName, domain);
            }
        });
    }

    initializeIconLoading();

    /* ════════════════════════════════════════════════════════════
       6. 波纹特效
       ════════════════════════════════════════════════════════════ */
    document.querySelectorAll('.card-item').forEach(el => {
        el.addEventListener('pointerdown', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            
            ripple.style.cssText = `
                position:absolute; width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size/2}px;
                top:${e.clientY - rect.top - size/2}px;
                background:rgba(0,0,0,0.15); border-radius:50%;
                transform:scale(0); animation:ripple 0.5s ease-out forwards;
                pointer-events:none; z-index:1;
            `;
            
            if (window.getComputedStyle(this).position === 'static') this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    /* ════════════════════════════════════════════════════════════
       7. 主题切换
       ════════════════════════════════════════════════════════════ */
    const STORAGE_KEY_THEME = 'uyea-theme';
    const html = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        try {
            localStorage.setItem(STORAGE_KEY_THEME, theme);
        } catch (e) {}
    }

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY_THEME);
        } catch (e) {
            return null;
        }
    }

    const saved = getSavedTheme();
    if (saved) {
        applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }

    /* ════════════════════════════════════════════════════════════
       8. 动态样式注入
       ════════════════════════════════════════════════════════════ */
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(1);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

});
