/**
 * UYEA Landing Page - landing.js v0.3.0（优化版）
 * 时钟/日期实时显示 + 卡片交互 + 开发中弹窗
 * Apple + Nothing + Linear 风格
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== 时钟/日期实时显示 ====================

    /**
     * 周数映射（多语言）
     */
    const weekdaysCN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekdaysTW = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekdaysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /**
     * 格式化时间显示 HH:MM
     */
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 格式化日期显示 YYYY-M-D + 星期
     */
    function formatDate(date, lang = 'zh-CN') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = date.getDay();

        let weekdayStr;
        if (lang === 'en') {
            weekdayStr = weekdaysEN[weekday];
        } else {
            weekdayStr = weekdaysCN[weekday];
        }

        return `${year}-${month}-${day} ${weekdayStr}`;
    }

    /**
     * 更新时钟显示
     */
    function updateClock() {
        const now = new Date();
        const clockTimeEl = document.getElementById('clockTime');
        const clockDateEl = document.getElementById('clockDate');

        if (clockTimeEl) {
            clockTimeEl.textContent = formatTime(now);
        }

        if (clockDateEl) {
            const lang = document.body.getAttribute('data-lang') || 'zh-CN';
            const langCode = lang === 'en' ? 'en' : 'zh-CN';
            clockDateEl.textContent = formatDate(now, langCode);
        }
    }

    // 初始更新
    updateClock();
    // 每秒更新一次
    setInterval(updateClock, 1000);

    // ==================== 开发中弹窗管理 ====================

    const devModal = document.getElementById('devModal');
    const devModalOverlay = document.getElementById('devModalOverlay');
    const devModalCloseBtn = document.getElementById('devModalCloseBtn');
    const petCard = document.getElementById('petCard');
    const chatCard = document.getElementById('chatCard');

    /**
     * 显示开发中弹窗
     */
    function showDevModal(title = '功能开发中', text = '敬请期待更新！') {
        document.getElementById('devModalTitle').textContent = title;
        document.getElementById('devModalText').textContent = text;
        devModal.classList.add('show');
        devModalOverlay.classList.add('show');
    }

    /**
     * 隐藏开发中弹窗
     */
    function hideDevModal() {
        devModal.classList.remove('show');
        devModalOverlay.classList.remove('show');
    }

    // 关闭按钮
    if (devModalCloseBtn) {
        devModalCloseBtn.addEventListener('click', hideDevModal);
    }

    // 点击背景关闭
    if (devModalOverlay) {
        devModalOverlay.addEventListener('click', hideDevModal);
    }

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && devModal.classList.contains('show')) {
            hideDevModal();
        }
    });

    // ==================== 禁用卡片点击处理 ====================

    if (petCard) {
        petCard.addEventListener('click', (e) => {
            e.preventDefault();
            showDevModal('桌面宠物', '桌面宠物功能开发中，敬请期待！🎉');
        });
    }

    if (chatCard) {
        chatCard.addEventListener('click', (e) => {
            e.preventDefault();
            showDevModal('实时聊天', '实时聊天功能开发中，敬请期待！💬');
        });
    }

    // ==================== 页面跳转过渡动画 ====================

    /**
     * 为启用的卡片添加页面过渡效果
     */
    function setupPageTransition() {
        const enabledCards = document.querySelectorAll('.landing-card-enabled');

        enabledCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.tagName === 'A' && card.href) {
                    // 延迟导航以展示动画（保持100ms以内，避免影响Core Web Vitals）
                    setTimeout(() => {
                        window.location.href = card.href;
                    }, 80);

                    e.preventDefault();
                }
            });
        });
    }

    setupPageTransition();

    // ==================== 多语言支持扩展 ====================

    /**
     * 为 landing 页面扩展 i18n 翻译
     */
    function extendI18nConfig() {
        if (typeof UYEA_CONFIG === 'undefined') {
            console.warn('UYEA_CONFIG 未加载');
            return;
        }

        // 扩展中文简体
        if (UYEA_CONFIG.i18n['zh-CN']) {
            Object.assign(UYEA_CONFIG.i18n['zh-CN'], {
                'nav.explore': '开始探索',
                'landing.nav_title': '网站导航',
                'landing.nav_desc': '分享实用网站',
                'landing.tools_title': '线上工具',
                'landing.tools_desc': '在线工具，提高效率',
                'landing.forum_title': '社区论坛',
                'landing.forum_desc': '解答疑问，分享经验',
                'landing.pet_title': '桌面宠物',
                'landing.pet_desc': '增添趣味，放松身心',
                'landing.chat_title': '实时聊天',
                'landing.chat_desc': '随时随地，在线交流'
            });
        }

        // 扩展繁体中文
        if (UYEA_CONFIG.i18n['zh-TW']) {
            Object.assign(UYEA_CONFIG.i18n['zh-TW'], {
                'nav.explore': '開始探索',
                'landing.nav_title': '網站導航',
                'landing.nav_desc': '分享實用網站',
                'landing.tools_title': '線上工具',
                'landing.tools_desc': '線上工具，提高效率',
                'landing.forum_title': '社區論壇',
                'landing.forum_desc': '解答疑問，分享經驗',
                'landing.pet_title': '桌面寵物',
                'landing.pet_desc': '增添趣味，放鬆身心',
                'landing.chat_title': '實時聊天',
                'landing.chat_desc': '隨時隨地，在線交流'
            });
        }

        // 扩展英文
        if (UYEA_CONFIG.i18n['en']) {
            Object.assign(UYEA_CONFIG.i18n['en'], {
                'nav.explore': 'Explore',
                'landing.nav_title': 'Navigation',
                'landing.nav_desc': 'Share useful websites',
                'landing.tools_title': 'Online Tools',
                'landing.tools_desc': 'Tools to boost productivity',
                'landing.forum_title': 'Community Forum',
                'landing.forum_desc': 'Q&A and experience sharing',
                'landing.pet_title': 'Desktop Pet',
                'landing.pet_desc': 'Add fun and relax',
                'landing.chat_title': 'Live Chat',
                'landing.chat_desc': 'Anytime, anywhere communication'
            });
        }
    }

    extendI18nConfig();

    // ==================== 语言切换事件 ====================

    /**
     * 监听语言切换，更新日期显示
     */
    const langButtons = document.querySelectorAll('.landing-lang-item');

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的 active 类
            langButtons.forEach(b => b.classList.remove('active'));
            // 添加 active 类到当前按钮
            btn.classList.add('active');

            // 更新页面 lang 属性
            const lang = btn.getAttribute('data-lang');
            document.body.setAttribute('data-lang', lang);

            // 更新时钟显示
            updateClock();

            // 保存语言偏好到 localStorage
            try {
                localStorage.setItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language), lang);
            } catch (e) {
                console.warn('localStorage unavailable:', e.message);
            }
        });
    });

    // 恢复上次选择的语言
    try {
        const savedLang = localStorage.getItem(UYEA_CONFIG.getStorageKey(UYEA_CONFIG.storageKeys.language)) || UYEA_CONFIG.defaultLanguage;
        const savedBtn = document.querySelector(`.landing-lang-item[data-lang="${savedLang}"]`);
        if (savedBtn) {
            langButtons.forEach(b => b.classList.remove('active'));
            savedBtn.classList.add('active');
            document.body.setAttribute('data-lang', savedLang);
            updateClock();
        }
    } catch (e) {
        console.warn('Failed to restore language preference:', e.message);
    }

    // ==================== 背景图预加载 ====================

    /**
     * 预加载背景图，确保丝滑过渡
     */
    function preloadBackgroundImages() {
        const img = new Image();
        img.src = window.innerWidth > 1024
            ? '/IMAGE/JPG/Peter_Thomas(2-2).webp'
            : '/IMAGE/JPG/Peter_Thomas(2-1).webp';
        img.onerror = () => console.warn('背景图预加载失败');
    }

    preloadBackgroundImages();
});