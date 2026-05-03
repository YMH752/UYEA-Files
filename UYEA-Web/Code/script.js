/* ============================================================
   UYEA 悠野工作室 · script.js (重构版)
   功能：菜单控制、搜索、图标加载、语言切换、主题切换
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
            'section.ai': 'AI 智能体',
            'section.life': '生活',
            'section.tools': '工具'
        },
        'zh-TW': {
            'nav.home': '網站導航',
            'nav.tools': '線上工具',
            'nav.forum': '悠野社區',
            'btn.register': '註冊',
            'section.ai': 'AI 智能體',
            'section.life': '生活',
            'section.tools': '工具'
        },
        'en': {
            'nav.home': 'Navigation',
            'nav.tools': 'Tools',
            'nav.forum': 'Community',
            'btn.register': 'Register',
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

    // 点击菜单项时关闭菜单
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
            menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // 点击菜单外时关闭
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !menuToggleBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            menuToggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ESC键关闭菜单
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
        
        // 更新所有带 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (messages[key]) {
                el.textContent = messages[key];
            }
        });

        // 更新body的lang属性和data-lang属性
        document.documentElement.lang = lang;
        document.body.setAttribute('data-lang', lang);
        
        // 保存语言选择
        try {
            localStorage.setItem(STORAGE_KEY_LANG, lang);
        } catch (e) {}
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            
            // 更新按钮状态
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新语言
            updateI18n(lang);
        });
    });

    // 初始化语言（优先读取保存的语言设置）
    function initLanguage() {
        let savedLang = null;
        try {
            savedLang = localStorage.getItem(STORAGE_KEY_LANG);
        } catch (e) {}
        
        const lang = savedLang || document.documentElement.lang || 'zh-CN';
        
        // 设置对应按钮为active
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

    /* 修改位置：engineUrls 增加 site: null */
    /* 前后逻辑：原仅有百度/谷歌/必应3个URL，现增加 site 键 */
    /* 修改目的：支持站内搜索选项，site 不跳转外部URL而执行本地过滤 */

    const STORAGE_KEY_ENGINE = 'uyea-search-engine';

    // 保存的搜索引擎
    let currentEngine = 'baidu';

    // 初始化搜索引擎
    function initSearchEngine() {
        try {
            currentEngine = localStorage.getItem(STORAGE_KEY_ENGINE) || 'baidu';
        } catch (e) {
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

    // 搜索引擎选择
    engineOptionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const engine = this.getAttribute('data-value');
            currentEngine = engine;
            
            engineOptionItems.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            engineTriggerLabel.textContent = this.textContent.trim();
            
            try {
                localStorage.setItem(STORAGE_KEY_ENGINE, engine);
            } catch (e) {}
        });
    });

    // 搜索输入和提交
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
       4. GitHub 图标加载配置
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

        const fetchPromise = fetch(url, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
                img.src = url;
                img.closest('.card-icon')?.classList.remove('skeleton');
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
       5. 波纹特效
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

    /* 修改位置：波纹特效背景色 */
    /* 前后逻辑：原为 rgba(255,107,107,0.15) 红色半透明，现为 rgba(0,0,0,0.15) 黑色半透明 */
    /* 修改目的：黑白配色 */

    /* ════════════════════════════════════════════════════════════
       6. 主题切换
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

    // 初始化主题
    const saved = getSavedTheme();
    if (saved) {
        applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }

    /* ════════════════════════════════════════════════════════════
       7. 动态样式注入
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
