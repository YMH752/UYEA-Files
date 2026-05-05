/* ============================================================
   UYEA 悠野工作室 · script.js (修复版)
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
            'section.ai': 'AI Agents',
            'section.life': 'Life',
            'section.tools': 'Tools'
        }
    };

    /* ════════════════════════════════════════════════════════════
       1. 移动端菜单切换
       ════════════════════════════════════════════════════════════ */
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    /* ════════════════════════════════════════════════════════════
       2. 搜索功能 (仅在首页有 searchInput 时生效)
       ════════════════════════════════════════════════════════════ */
    const searchInput = document.getElementById('searchInput');
    const cardItems = document.querySelectorAll('.card-item');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            cardItems.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const desc = card.querySelector('.card-desc').textContent.toLowerCase();
                if (title.includes(keyword) || desc.includes(keyword)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    /* ════════════════════════════════════════════════════════════
       3. 图标加载 (GitHub Raw 内容加载)
       ════════════════════════════════════════════════════════════ */
    function loadIcons() {
        const iconElements = document.querySelectorAll('.icon-placeholder[data-icon]');
        iconElements.forEach(el => {
            const iconName = el.getAttribute('data-icon');
            // 这里假设图标存放在 GitHub 仓库的 icons 目录下
            const iconUrl = `https://raw.githubusercontent.com/uyea/icons/main/${iconName}.svg`;
            
            // 简单的 SVG 加载逻辑，实际可根据需要调整
            el.innerHTML = `<img src="${iconUrl}" alt="${iconName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PC9zdmc+'">`;
        });
    }
    loadIcons();

    /* ════════════════════════════════════════════════════════════
       4. 时钟与日历逻辑
       ════════════════════════════════════════════════════════════ */
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.padStart ? now.getMinutes() : now.getMinutes()).toString().padStart(2, '0');
        
        const timeElement = document.getElementById('clockTime');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }

        const dateGregorian = document.getElementById('dateGregorian');
        if (dateGregorian) {
            const y = now.getFullYear();
            const m = now.getMonth() + 1;
            const d = now.getDate();
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const w = weekDays[now.getDay()];
            dateGregorian.textContent = `${y}年${m}月${d}日 ${w}`;
        }

        // 农历显示
        const dateLunar = document.getElementById('dateLunar');
        if (dateLunar) {
            const lunar = getLunarDate(now);
            dateLunar.textContent = `农历 ${lunar.month}月${lunar.day}`;
        }
    }

    function updateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthElement = document.getElementById('calendarMonth');
        if (!calendarGrid || !monthElement) return;

        const now = new Date();
        const year = now.getFullYear();
        // BUG 修复点 1：移除 + 1，保持 JavaScript 原生 0-11 月份
        const month = now.getMonth(); 
        const today = now.getDate();

        // BUG 修复点 2：显示标题时进行 + 1 补偿
        monthElement.textContent = `${year}年${month + 1}月`;

        // 获取当月天数和第一天是周几
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // 这里的 month 已经是 0-11，所以 new Date(year, month, 1) 指向正确的当月第一天
        const firstDay = new Date(year, month, 1).getDay();

        calendarGrid.innerHTML = '';

        // 填充空白
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day';
            calendarGrid.appendChild(emptyDiv);
        }

        // 填充日期
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if (i === today) {
                dayDiv.classList.add('today');
            }
            dayDiv.textContent = i;
            calendarGrid.appendChild(dayDiv);
        }
    }

    // 极简农历转换函数 (示例简化版)
    function getLunarDate(date) {
        // 实际上完整农历算法非常复杂，这里仅作演示返回占位，实际开发中建议引入 lunar.js
        return { month: '三', day: '十六' }; 
    }

    setInterval(updateClock, 1000);
    updateClock();
    updateCalendar();

    /* ════════════════════════════════════════════════════════════
       5. 语言切换逻辑
       ════════════════════════════════════════════════════════════ */
    const langBtns = document.querySelectorAll('.lang-btn');
    
    function switchLanguage(lang) {
        const messages = i18nMessages[lang] || i18nMessages['zh-CN'];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (messages[key]) {
                el.textContent = messages[key];
            }
        });
        
        // 更新激活状态
        langBtns.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 存储选择
        localStorage.setItem('uyea-lang', lang);
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    // 初始化语言
    const savedLang = localStorage.getItem('uyea-lang') || 'zh-CN';
    switchLanguage(savedLang);

    /* ════════════════════════════════════════════════════════════
       6. 按钮涟漪效果
       ════════════════════════════════════════════════════════════ */
    const buttons = document.querySelectorAll('.btn-primary, .lang-btn, .nav-link');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const x = e.clientX - e.target.offsetLeft;
            const y = e.clientY - e.target.offsetTop;
            const ripple = document.createElement('span');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.classList.add('ripple');
            this.style.position = 'relative';
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
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
        }
    `;
    document.head.appendChild(style);
});