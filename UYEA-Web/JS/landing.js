/**
 * Landing Page Interactions
 * 处理块卡片点击、开发中弹窗、页面过渡
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== 初始化 ====================
    const devModal = document.getElementById('devModal');
    const devModalOverlay = document.getElementById('devModalOverlay');
    const devModalCloseBtn = document.getElementById('devModalCloseBtn');
    const petBlock = document.getElementById('petBlock');
    const chatBlock = document.getElementById('chatBlock');

    // ==================== 开发中弹窗管理 ====================
    /**
     * 显示开发中弹窗
     * @param {string} title - 弹窗标题
     * @param {string} text - 弹窗文本
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

    // 关闭按钮点击
    devModalCloseBtn.addEventListener('click', hideDevModal);

    // 点击背景关闭
    devModalOverlay.addEventListener('click', hideDevModal);

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && devModal.classList.contains('show')) {
            hideDevModal();
        }
    });

    // ==================== 禁用块点击处理 ====================
    petBlock.addEventListener('click', (e) => {
        e.preventDefault();
        showDevModal('桌面宠物', '桌面宠物功能开发中，敬请期待！🎉');
    });

    chatBlock.addEventListener('click', (e) => {
        e.preventDefault();
        showDevModal('实时聊天', '实时聊天功能开发中，敬请期待！💬');
    });

    // ==================== 页面加载动画 ====================
    /**
     * 为链接添加页面加载动画
     */
    function setupPageTransition() {
        const enabledBlocks = document.querySelectorAll('.landing-block-enabled');
        
        enabledBlocks.forEach(block => {
            block.addEventListener('click', (e) => {
                // 仅在目标是新页面链接时添加过渡
                if (block.tagName === 'A' && block.href) {
                    // 添加淡出动画
                    const main = document.querySelector('.landing-main');
                    main.style.animation = 'pageLoadFadeOut 0.4s ease-in forwards';
                    
                    // 延迟导航以展示动画
                    setTimeout(() => {
                        window.location.href = block.href;
                    }, 300);
                    
                    e.preventDefault();
                }
            });
        });
    }

    setupPageTransition();

    // ==================== 多语言支持集成 ====================
    /**
     * 为 landing 页面扩展 i18n 翻译
     */
    function extendI18nConfig() {
        if (typeof UYEA_CONFIG === 'undefined') {
            console.warn('UYEA_CONFIG 未加载');
            return;
        }

        // 扩展中文简体
        UYEA_CONFIG.i18n['zh-CN'] = {
            ...UYEA_CONFIG.i18n['zh-CN'],
            'nav.explore': '开始探索',
            'landing.title': '开始探索',
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
        };

        // 扩展繁体中文
        UYEA_CONFIG.i18n['zh-TW'] = {
            ...UYEA_CONFIG.i18n['zh-TW'],
            'nav.explore': '開始探索',
            'landing.title': '開始探索',
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
        };

        // 扩展英文
        UYEA_CONFIG.i18n['en'] = {
            ...UYEA_CONFIG.i18n['en'],
            'nav.explore': 'Explore',
            'landing.title': 'Begin Exploring',
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
        };
    }

    extendI18nConfig();

    // ==================== 背景图预加载 ====================
    /**
     * 预加载背景图，确保丝滑过渡
     */
    function preloadBackgroundImages() {
        const mobileImg = new Image();
        const desktopImg = new Image();

        mobileImg.src = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/JPG/Peter_Thomas(2-1).jpg';
        desktopImg.src = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/JPG/Peter_Thomas(2-2).jpg';

        // 静默加载，不阻塞页面
        mobileImg.onerror = () => console.warn('移动端背景图加载失败');
        desktopImg.onerror = () => console.warn('桌面端背景图加载失败');
    }

    preloadBackgroundImages();

    // ==================== 响应式背景适配 ====================
    /**
     * 监听窗口大小变化，确保背景图在断点处自动切换
     */
    function setupResponsiveBackgroundSwitch() {
        let lastWidth = window.innerWidth;

        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;
            const oldIsMobile = lastWidth <= 1024;
            const newIsMobile = currentWidth <= 1024;

            // 仅在跨越断点时触发更新
            if (oldIsMobile !== newIsMobile) {
                // 触发 CSS 重新评估 @media 规则
                document.querySelector('.landing-main').style.animation = 'none';
                setTimeout(() => {
                    document.querySelector('.landing-main').style.animation = '';
                }, 10);
                lastWidth = currentWidth;
            }
        });
    }

    setupResponsiveBackgroundSwitch();
});

// ==================== 页面卸载动画 ====================
/**
 * 页面离开时的淡出动画
 */
function pageLoadFadeOut() {
    const main = document.querySelector('.landing-main');
    if (main) {
        main.style.animation = 'pageLoadFadeOut 0.4s ease-in forwards';
    }
}
