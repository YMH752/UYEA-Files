/**
 * UYEA 用户认证模块 - auth.js
 * 纯前端登录/注册/会话管理
 * 密码使用 SHA-256 哈希存储，会话通过 localStorage 维持
 * 注意：纯前端方案仅用于演示，生产环境需后端验证
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 引用共享工具函数
    const { safeGetItem, safeSetItem, safeRemoveItem, escapeHtml, t } = window.UYEA_UTILS;

    // SHA-256 哈希（使用 Web Crypto API）
    async function sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ==================== 用户数据管理 ====================
    const STORAGE_KEYS = {
        session: 'uyea_session',
        users: 'uyea_users_override' // 注册用户覆盖存储（默认用户从JSON加载）
    };

    let usersCache = null; // 用户数据缓存

    // 加载用户数据（先从localStorage读取注册用户，再合并JSON默认用户）
    async function loadUsers() {
        if (usersCache) return usersCache;

        // 从 localStorage 读取注册的用户
        let registeredUsers = [];
        const stored = safeGetItem(STORAGE_KEYS.users);
        if (stored) {
            try { registeredUsers = JSON.parse(stored); } catch (e) { /* 忽略损坏数据 */ }
        }

        // 从 JSON 加载默认用户
        let defaultUsers = [];
        try {
            const resp = await fetch('/JSON/users.json', { cache: 'no-cache' });
            if (resp.ok) defaultUsers = await resp.json();
        } catch (e) { console.warn('加载用户数据失败:', e); }

        // 合并：默认用户 + 注册用户
        usersCache = [...defaultUsers, ...registeredUsers];
        return usersCache;
    }

    // 保存注册用户到 localStorage
    function saveRegisteredUsers(registeredUsers) {
        safeSetItem(STORAGE_KEYS.users, JSON.stringify(registeredUsers));
        usersCache = null; // 清除缓存，下次重新加载
    }

    // ==================== 会话管理 ====================
    function getSession() {
        const session = safeGetItem(STORAGE_KEYS.session);
        if (!session) return null;
        try {
            const data = JSON.parse(session);
            // 会话有效期：7天
            if (data.expires && Date.now() > data.expires) {
                safeRemoveItem(STORAGE_KEYS.session);
                return null;
            }
            return data;
        } catch (e) { return null; }
    }

    function setSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            nickname: user.nickname || user.username,
            role: user.role || 'user',
            loginAt: Date.now(),
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天有效
        };
        safeSetItem(STORAGE_KEYS.session, JSON.stringify(session));
    }

    function clearSession() {
        safeRemoveItem(STORAGE_KEYS.session);
    }

    function isLoggedIn() {
        return getSession() !== null;
    }

    // ==================== UI 渲染 ====================
    const authOverlay = document.getElementById('authOverlay');
    const authModal = document.getElementById('authModal');
    const authModalBody = document.getElementById('authModalBody');
    const authModalClose = document.getElementById('authModalClose');
    const userBtn = document.querySelector('.user-btn');

    // 登录表单 HTML（拖拽分栏布局：登录层覆盖注册层，拖拽手柄左滑揭示注册）
    function renderLoginForm() {
        return `
            <div class="auth-split" id="authSplit">
                <!-- 注册层（底层） -->
                <div class="auth-register-layer">
                    <div class="auth-dev-message">
                        <div class="auth-dev-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                        </div>
                        <div class="auth-dev-title">${t('auth.register')}</div>
                        <div class="auth-dev-text">${t('auth.underDevelopment')}</div>
                    </div>
                </div>
                <!-- 登录层（上层，clip-path 裁剪） -->
                <div class="auth-login-layer" id="authLoginLayer">
                    <div class="auth-form" id="loginForm">
                        <div class="auth-hero">
                            <div class="auth-hero-icon">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                            </div>
                            <div class="auth-hero-title">${t('auth.login')}</div>
                            <div class="auth-hero-subtitle">${t('auth.welcomeBack')}</div>
                        </div>
                        <div class="auth-field">
                            <label class="auth-label" for="loginEmail">${t('auth.email')}</label>
                            <div class="auth-input-wrap">
                                <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                <input type="email" class="auth-input" id="loginEmail" placeholder="${t('auth.emailPlaceholder')}" autocomplete="email" autocapitalize="none">
                            </div>
                        </div>
                        <div class="auth-field">
                            <label class="auth-label" for="loginPassword">${t('auth.password')}</label>
                            <div class="auth-input-wrap">
                                <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <input type="password" class="auth-input auth-input-password" id="loginPassword" placeholder="${t('auth.passwordPlaceholder')}" autocomplete="current-password">
                                <button class="auth-password-toggle" id="loginPasswordToggle" type="button" aria-label="${t('auth.togglePassword')}">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>
                        </div>
                        <div class="auth-error" id="loginError"></div>
                        <div class="auth-actions">
                            <button class="post-btn auth-submit-btn" id="loginSubmitBtn">${t('auth.login')}</button>
                        </div>
                    </div>
                </div>
                <!-- 拖拽手柄：左箭头，拖拽向左揭示注册 -->
                <div class="auth-split-handle" id="authSlideHandle" role="button" aria-label="${t('auth.register')}">
                    <svg class="auth-handle-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </div>
            </div>
        `;
    }

    // 注册表单 HTML（重新设计：液态玻璃卡片风格）
    function renderRegisterForm() {
        return `
            <div class="auth-form" id="registerForm">
                <div class="auth-hero">
                    <div class="auth-hero-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </div>
                    <div class="auth-hero-title">${t('auth.register')}</div>
                    <div class="auth-hero-subtitle">${t('auth.createAccount')}</div>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regUsername">${t('auth.username')}</label>
                    <div class="auth-input-wrap">
                        <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <input type="text" class="auth-input" id="regUsername" placeholder="${t('auth.usernamePlaceholder')}" autocomplete="username" autocapitalize="none" maxlength="20">
                    </div>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regNickname">${t('auth.nickname')}</label>
                    <div class="auth-input-wrap">
                        <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        <input type="text" class="auth-input" id="regNickname" placeholder="${t('auth.nicknamePlaceholder')}" maxlength="20">
                    </div>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regPassword">${t('auth.password')}</label>
                    <div class="auth-input-wrap">
                        <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <input type="password" class="auth-input auth-input-password" id="regPassword" placeholder="${t('auth.passwordPlaceholder')}" autocomplete="new-password" minlength="6" maxlength="32">
                        <button class="auth-password-toggle" id="regPasswordToggle" type="button" aria-label="${t('auth.togglePassword')}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regPasswordConfirm">${t('auth.confirmPassword')}</label>
                    <div class="auth-input-wrap">
                        <svg class="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <input type="password" class="auth-input" id="regPasswordConfirm" placeholder="${t('auth.confirmPasswordPlaceholder')}" autocomplete="new-password">
                    </div>
                </div>
                <div class="auth-error" id="registerError"></div>
                <div class="auth-actions">
                    <button class="post-btn auth-submit-btn" id="registerSubmitBtn">${t('auth.register')}</button>
                </div>
                <div class="auth-switch">
                    <span>${t('auth.hasAccount')}</span>
                    <button class="auth-switch-btn" id="switchToLogin">${t('auth.login')}</button>
                </div>
            </div>
        `;
    }

    // 已登录用户面板（简洁版：仅显示头像+昵称+退出，不显示账号详情）
    function renderUserProfile(session) {
        const avatarLetter = (session.nickname || session.username || 'U').charAt(0).toUpperCase();
        return `
            <div class="auth-form">
                <div class="auth-hero">
                    <div class="auth-hero-avatar">${escapeHtml(avatarLetter)}</div>
                    <div class="auth-hero-title">${escapeHtml(session.nickname || session.username)}</div>
                    <div class="auth-hero-subtitle">${session.role === 'admin' ? t('auth.roleAdmin') : t('auth.roleUser')}</div>
                </div>
                <div class="auth-actions">
                    <button class="post-btn post-btn-ghost auth-submit-btn" id="logoutBtn">${t('auth.logout')}</button>
                </div>
            </div>
        `;
    }

    // ==================== 设备/浏览器检测 ====================
    function detectBrowser() {
        const ua = navigator.userAgent;
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

        let browser = 'other', browserName = '浏览器';
        if (/MicroMessenger/i.test(ua)) { browser = 'wechat'; browserName = '微信'; }
        else if (/QQBrowser/i.test(ua) && !/MQQBrowser/i.test(ua)) { browser = 'qq-desktop'; browserName = 'QQ浏览器'; }
        else if (/MQQBrowser/i.test(ua)) { browser = 'qq-mobile'; browserName = 'QQ浏览器'; }
        else if (/UBrowser/i.test(ua)) { browser = 'uc-desktop'; browserName = 'UC浏览器'; }
        else if (/UCBrowser/i.test(ua)) { browser = 'uc-mobile'; browserName = 'UC浏览器'; }
        else if (/Quark/i.test(ua)) { browser = 'quark'; browserName = '夸克浏览器'; }
        else if (/360SE|360EE/i.test(ua)) { browser = '360-desktop'; browserName = '360浏览器'; }
        else if (/360 Aphone Browser/i.test(ua)) { browser = '360-mobile'; browserName = '360浏览器'; }
        else if (/SE 2\.|MetaSr/i.test(ua)) { browser = 'sogou'; browserName = '搜狗浏览器'; }
        else if (/baidubrowser|BaiduHD/i.test(ua)) { browser = 'baidu'; browserName = '百度浏览器'; }
        else if (/MiuiBrowser/i.test(ua)) { browser = 'xiaomi'; browserName = '小米浏览器'; }
        else if (/HuaweiBrowser|HBPC/i.test(ua)) { browser = 'huawei'; browserName = '华为浏览器'; }
        else if (/OppoBrowser|HeyTapBrowser/i.test(ua)) { browser = 'oppo'; browserName = 'OPPO浏览器'; }
        else if (/VivoBrowser/i.test(ua)) { browser = 'vivo'; browserName = 'vivo浏览器'; }
        else if (/Edg/i.test(ua)) { browser = 'edge'; browserName = 'Edge'; }
        else if (/Chrome/i.test(ua) && !/Edg|OPR|Brave|Vivaldi/i.test(ua)) { browser = 'chrome'; browserName = 'Chrome'; }
        else if (/Firefox/i.test(ua)) { browser = 'firefox'; browserName = 'Firefox'; }
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) { browser = 'safari'; browserName = 'Safari'; }
        else if (/OPR|Opera/i.test(ua)) { browser = 'opera'; browserName = 'Opera'; }
        else if (/Brave/i.test(ua)) { browser = 'brave'; browserName = 'Brave'; }
        else if (/Vivaldi/i.test(ua)) { browser = 'vivaldi'; browserName = 'Vivaldi'; }

        let os = 'unknown';
        if (/Windows/i.test(ua)) os = 'windows';
        else if (/Mac OS/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = 'mac';
        else if (/Android/i.test(ua)) os = 'android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios';

        return { browser, browserName, os, isMobile };
    }

    // 浏览器教程数据（platform: desktop/mobile/both）
    // 每个步骤用多语言对象 {zh, tw, en}
    function getBrowserGuides() {
        const lang = (window.currentLang || 'zh-CN');
        const lc = lang === 'en' ? 'en' : (lang === 'zh-TW' ? 'tw' : 'zh');
        const L = function(s) { return s[lc] || s['zh']; };

        return [
            // ===== 桌面端 =====
            { id: 'chrome', platform: 'desktop', name: 'Chrome', icon: 'C',
              steps: [
                  { zh: '点击右上角「⋯」菜单，选择「设置」', tw: '點擊右上角「⋯」選單，選擇「設定」', en: 'Click "⋯" menu > "Settings"' },
                  { zh: '在「启动时」选择「打开特定网页或一组网页」', tw: '在「啟動時」選擇「打開特定網頁」', en: 'Under "On startup" select "Open a specific page"' },
                  { zh: '点击「添加新网页」，粘贴网址后点击「添加」', tw: '點擊「添加新網頁」，貼上網址後點擊「添加」', en: 'Click "Add a new page", paste URL, click "Add"' }
              ]
            },
            { id: 'edge', platform: 'desktop', name: 'Edge', icon: 'E',
              steps: [
                  { zh: '点击右上角「⋯」菜单，选择「设置」', tw: '點擊右上角「⋯」選單，選擇「設定」', en: 'Click "⋯" menu > "Settings"' },
                  { zh: '在「开始、主页和新建标签页」中选择「打开以下页面」', tw: '在「開始、主頁和新建分頁」中選擇「打開以下頁面」', en: 'Under "Start, home, and new tabs" select "Open these pages"' },
                  { zh: '点击「添加新页面」，粘贴网址后保存', tw: '點擊「添加新頁面」，貼上網址後儲存', en: 'Click "Add a new page", paste URL, save' }
              ]
            },
            { id: 'firefox', platform: 'desktop', name: 'Firefox', icon: 'F',
              steps: [
                  { zh: '点击右上角「≡」菜单，选择「设置」', tw: '點擊右上角「≡」選單，選擇「設定」', en: 'Click "≡" menu > "Settings"' },
                  { zh: '在「主页」栏目中，将主页设为「自定义网址」', tw: '在「首頁」欄目中，將首頁設為「自訂網址」', en: 'Under "Home" set to "Custom URL"' },
                  { zh: '粘贴网址到输入框即可', tw: '貼上網址到輸入框即可', en: 'Paste URL into the input box' }
              ]
            },
            { id: 'safari', platform: 'desktop', name: 'Safari', icon: 'S',
              steps: [
                  { zh: '打开菜单栏「Safari > 设置（偏好设置）」', tw: '打開選單列「Safari > 設定」', en: 'Go to "Safari > Settings"' },
                  { zh: '在「通用」标签页中找到「主页」字段', tw: '在「一般」標籤頁中找到「首頁」欄位', en: 'Under "General" tab find "Homepage" field' },
                  { zh: '粘贴网址后关闭设置窗口', tw: '貼上網址後關閉設定視窗', en: 'Paste URL, close settings' }
              ]
            },
            { id: 'opera', platform: 'desktop', name: 'Opera', icon: 'O',
              steps: [
                  { zh: '点击右上角「≡」菜单，选择「设置」', tw: '點擊右上角「≡」選單，選擇「設定」', en: 'Click "≡" menu > "Settings"' },
                  { zh: '在「启动时」选择「打开特定页面」', tw: '在「啟動時」選擇「打開特定頁面」', en: 'Under "On startup" select "Open a specific page"' },
                  { zh: '粘贴网址后保存', tw: '貼上網址後儲存', en: 'Paste URL, save' }
              ]
            },
            { id: 'brave', platform: 'desktop', name: 'Brave', icon: 'B',
              steps: [
                  { zh: '点击右上角「≡」菜单，选择「设置」', tw: '點擊右上角「≡」選單，選擇「設定」', en: 'Click "≡" menu > "Settings"' },
                  { zh: '在「启动时」选择「打开特定网页」', tw: '在「啟動時」選擇「打開特定網頁」', en: 'Under "On startup" select "Open a specific page"' },
                  { zh: '粘贴网址后点击「添加」', tw: '貼上網址後點擊「添加」', en: 'Paste URL, click "Add"' }
              ]
            },
            { id: 'vivaldi', platform: 'desktop', name: 'Vivaldi', icon: 'V',
              steps: [
                  { zh: '点击左上角「V」图标，选择「设置」', tw: '點擊左上角「V」圖標，選擇「設定」', en: 'Click "V" icon > "Settings"' },
                  { zh: '在「启动时」选择「特定网页」', tw: '在「啟動時」選擇「特定網頁」', en: 'Under "On startup" select "Specific page"' },
                  { zh: '粘贴网址后保存', tw: '貼上網址後儲存', en: 'Paste URL, save' }
              ]
            },
            { id: '360-desktop', platform: 'desktop', name: '360浏览器', icon: '3',
              steps: [
                  { zh: '点击右上角「☰」菜单，选择「设置」', tw: '點擊右上角「☰」選單，選擇「設定」', en: 'Click "☰" menu > "Settings"' },
                  { zh: '在「基本设置」中找到「启动时打开」', tw: '在「基本設定」中找到「啟動時打開」', en: 'Under "Basic settings" find "Open on startup"' },
                  { zh: '选择「自定义网页」，粘贴网址后保存', tw: '選擇「自訂網頁」，貼上網址後儲存', en: 'Select "Custom URL", paste URL, save' }
              ]
            },
            { id: 'qq-desktop', platform: 'desktop', name: 'QQ浏览器', icon: 'Q',
              steps: [
                  { zh: '点击右上角「☰」菜单，选择「设置」', tw: '點擊右上角「☰」選單，選擇「設定」', en: 'Click "☰" menu > "Settings"' },
                  { zh: '在「常规」中找到「启动时打开」', tw: '在「常規」中找到「啟動時打開」', en: 'Under "General" find "Open on startup"' },
                  { zh: '选择「自定义网页」，粘贴网址后保存', tw: '選擇「自訂網頁」，貼上網址後儲存', en: 'Select "Custom URL", paste URL, save' }
              ]
            },
            { id: 'sogou', platform: 'desktop', name: '搜狗浏览器', icon: 'S',
              steps: [
                  { zh: '点击右上角「☰」菜单，选择「选项」', tw: '點擊右上角「☰」選單，選擇「選項」', en: 'Click "☰" menu > "Options"' },
                  { zh: '在「基本设置」中找到「主页」', tw: '在「基本設定」中找到「首頁」', en: 'Under "Basic settings" find "Homepage"' },
                  { zh: '粘贴网址后保存', tw: '貼上網址後儲存', en: 'Paste URL, save' }
              ]
            },
            { id: 'uc-desktop', platform: 'desktop', name: 'UC浏览器', icon: 'U',
              steps: [
                  { zh: '点击右上角「☰」菜单，选择「设置」', tw: '點擊右上角「☰」選單，選擇「設定」', en: 'Click "☰" menu > "Settings"' },
                  { zh: '在「常规」中找到「主页」设置', tw: '在「常規」中找到「首頁」設定', en: 'Under "General" find "Homepage" setting' },
                  { zh: '粘贴网址后保存', tw: '貼上網址後儲存', en: 'Paste URL, save' }
              ]
            },

            // ===== 移动端 Android =====
            { id: 'chrome-android', platform: 'mobile', name: 'Chrome (Android)', icon: 'C',
              steps: [
                  { zh: '点击右上角「⋮」菜单，选择「设置」', tw: '點擊右上角「⋮」選單，選擇「設定」', en: 'Tap "⋮" menu > "Settings"' },
                  { zh: '找到「主页」选项，选择「打开此网页」', tw: '找到「首頁」選項，選擇「打開此網頁」', en: 'Find "Homepage" > "Open this page"' },
                  { zh: '粘贴网址后返回即可', tw: '貼上網址後返回即可', en: 'Paste URL, go back' }
              ]
            },
            { id: 'firefox-android', platform: 'mobile', name: 'Firefox (Android)', icon: 'F',
              steps: [
                  { zh: '点击右上角「⋮」菜单，选择「设置」', tw: '點擊右上角「⋮」選單，選擇「設定」', en: 'Tap "⋮" menu > "Settings"' },
                  { zh: '找到「主页」选项，选择「自定义」', tw: '找到「首頁」選項，選擇「自訂」', en: 'Find "Homepage" > "Custom"' },
                  { zh: '粘贴网址后保存', tw: '貼上網址後儲存', en: 'Paste URL, save' }
              ]
            },
            { id: 'quark', platform: 'mobile', name: '夸克浏览器', icon: 'Q',
              steps: [
                  { zh: '点击右下角「☰」菜单，进入「设置」', tw: '點擊右下角「☰」選單，進入「設定」', en: 'Tap "☰" menu > "Settings"' },
                  { zh: '找到「主页」或「起始页」设置', tw: '找到「首頁」或「起始頁」設定', en: 'Find "Homepage" or "Start page" setting' },
                  { zh: '选择「自定义」，粘贴网址后保存', tw: '選擇「自訂」，貼上網址後儲存', en: 'Select "Custom", paste URL, save' }
              ]
            },
            { id: 'uc-mobile', platform: 'mobile', name: 'UC浏览器', icon: 'U',
              steps: [
                  { zh: '点击底部菜单「☰」，选择「设置」', tw: '點擊底部選單「☰」，選擇「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页设置」或「启动页」', tw: '找到「首頁設定」或「啟動頁」', en: 'Find "Homepage" or "Start page"' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: 'qq-mobile', platform: 'mobile', name: 'QQ浏览器', icon: 'Q',
              steps: [
                  { zh: '点击底部「☰」菜单，选择「设置」', tw: '點擊底部「☰」選單，選擇「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页」或「起始页」设置', tw: '找到「首頁」或「起始頁」設定', en: 'Find "Homepage" or "Start page"' },
                  { zh: '选择「自定义」，粘贴网址后保存', tw: '選擇「自訂」，貼上網址後儲存', en: 'Select "Custom", paste URL, save' }
              ]
            },
            { id: 'baidu', platform: 'mobile', name: '百度浏览器', icon: 'B',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页设置」选项', tw: '找到「首頁設定」選項', en: 'Find "Homepage" setting' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: 'xiaomi', platform: 'mobile', name: '小米浏览器', icon: 'M',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页」或「起始页」设置', tw: '找到「首頁」或「起始頁」設定', en: 'Find "Homepage" or "Start page"' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: 'huawei', platform: 'mobile', name: '华为浏览器', icon: 'H',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页设置」或「起始页」', tw: '找到「首頁設定」或「起始頁」', en: 'Find "Homepage" or "Start page"' },
                  { zh: '选择「自定义」，粘贴网址后保存', tw: '選擇「自訂」，貼上網址後儲存', en: 'Select "Custom", paste URL, save' }
              ]
            },
            { id: 'oppo', platform: 'mobile', name: 'OPPO浏览器', icon: 'O',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页」设置选项', tw: '找到「首頁」設定選項', en: 'Find "Homepage" setting' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: 'vivo', platform: 'mobile', name: 'vivo浏览器', icon: 'V',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页设置」选项', tw: '找到「首頁設定」選項', en: 'Find "Homepage" setting' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: '360-mobile', platform: 'mobile', name: '360浏览器', icon: '3',
              steps: [
                  { zh: '点击底部「☰」菜单，进入「设置」', tw: '點擊底部「☰」選單，進入「設定」', en: 'Tap bottom "☰" menu > "Settings"' },
                  { zh: '找到「主页设置」选项', tw: '找到「首頁設定」選項', en: 'Find "Homepage" setting' },
                  { zh: '选择「自定义网址」，粘贴后保存', tw: '選擇「自訂網址」，貼上後儲存', en: 'Select "Custom URL", paste, save' }
              ]
            },
            { id: 'wechat', platform: 'mobile', name: '微信内置浏览器', icon: 'W',
              steps: [
                  { zh: '微信内置浏览器无法设置首页', tw: '微信內置瀏覽器無法設置首頁', en: 'WeChat browser cannot set homepage' },
                  { zh: '建议点击右上角「⋯」选择「在浏览器打开」', tw: '建議點擊右上角「⋯」選擇「在瀏覽器打開」', en: 'Tap "⋯" > "Open in browser"' },
                  { zh: '在系统浏览器中按上述步骤设置', tw: '在系統瀏覽器中按上述步驟設定', en: 'Set homepage in system browser' }
              ]
            },

            // ===== 移动端 iOS =====
            { id: 'safari-ios', platform: 'mobile', name: 'Safari (iOS)', icon: 'S',
              steps: [
                  { zh: '打开「设置」App，向下滑动找到「Safari」', tw: '打開「設定」App，向下滑動找到「Safari」', en: 'Open "Settings" app, find "Safari"' },
                  { zh: '点击「主页」，选择「自定义」', tw: '點擊「首頁」，選擇「自訂」', en: 'Tap "Homepage" > "Custom"' },
                  { zh: '粘贴网址后返回即可', tw: '貼上網址後返回即可', en: 'Paste URL, go back' }
              ]
            },
            { id: 'chrome-ios', platform: 'mobile', name: 'Chrome (iOS)', icon: 'C',
              steps: [
                  { zh: '点击右下角「⋮」菜单，选择「设置」', tw: '點擊右下角「⋮」選單，選擇「設定」', en: 'Tap "⋮" menu > "Settings"' },
                  { zh: '找到「主页」选项，选择「自定义网页」', tw: '找到「首頁」選項，選擇「自訂網頁」', en: 'Find "Homepage" > "Custom page"' },
                  { zh: '粘贴网址后返回即可', tw: '貼上網址後返回即可', en: 'Paste URL, go back' }
              ]
            }
        ].map(function(g) {
            // 转换步骤为当前语言
            g.steps = g.steps.map(function(s, i) {
                return { num: i + 1, text: L(s) };
            });
            return g;
        });
    }

    // 将检测结果映射到教程ID
    function mapDetectedToGuide(detected) {
        var map = {
            'chrome': detected.isMobile ? 'chrome-android' : 'chrome',
            'edge': 'edge', 'firefox': detected.isMobile ? 'firefox-android' : 'firefox',
            'safari': detected.isMobile ? 'safari-ios' : 'safari',
            'opera': 'opera', 'brave': 'brave', 'vivaldi': 'vivaldi',
            '360-desktop': '360-desktop', '360-mobile': '360-mobile',
            'qq-desktop': 'qq-desktop', 'qq-mobile': 'qq-mobile',
            'sogou': 'sogou', 'uc-desktop': 'uc-desktop', 'uc-mobile': 'uc-mobile',
            'baidu': 'baidu', 'xiaomi': 'xiaomi', 'huawei': 'huawei',
            'oppo': 'oppo', 'vivo': 'vivo', 'wechat': 'wechat'
        };
        // iOS上的Chrome
        if (detected.os === 'ios' && detected.browser === 'chrome') return 'chrome-ios';
        return map[detected.browser] || null;
    }

    // 设为首页引导弹窗 HTML
    function renderSetHomepageGuide() {
        const detected = detectBrowser();
        const guides = getBrowserGuides();
        const detectedId = mapDetectedToGuide(detected);
        const defaultTab = detected.isMobile ? 'mobile' : 'desktop';

        const desktopGuides = guides.filter(g => g.platform === 'desktop');
        const mobileGuides = guides.filter(g => g.platform === 'mobile');

        function renderGuideCard(g) {
            const isDetected = (g.id === detectedId);
            return `<div class="hp-browser-card${isDetected ? ' hp-detected' : ''}" data-guide-id="${g.id}">
                <div class="hp-browser-header">
                    <span class="hp-browser-icon">${escapeHtml(g.icon)}</span>
                    <span class="hp-browser-name">${escapeHtml(g.name)}</span>
                    ${isDetected ? '<span class="hp-current-tag">' + escapeHtml(t('homepage.detected')) + ' ✓</span>' : ''}
                </div>
                <div class="hp-browser-steps">
                    ${g.steps.map(s => `<p>${s.num}. ${escapeHtml(s.text)}</p>`).join('')}
                </div>
            </div>`;
        }

        return `
            <div class="homepage-guide">
                <div class="homepage-guide-intro">${escapeHtml(t('homepage.intro'))}</div>
                ${detected.browser !== 'other' ? `
                <div class="hp-detected-banner">
                    <span class="hp-detected-icon">📍</span>
                    <span>${escapeHtml(t('homepage.detected'))} <strong>${escapeHtml(detected.browserName)}</strong>，${escapeHtml(t('homepage.followSteps'))}</span>
                </div>` : ''}
                <div class="hp-tabs">
                    <button class="hp-tab${defaultTab === 'desktop' ? ' active' : ''}" data-tab="desktop">${escapeHtml(t('homepage.tab.desktop'))}</button>
                    <button class="hp-tab${defaultTab === 'mobile' ? ' active' : ''}" data-tab="mobile">${escapeHtml(t('homepage.tab.mobile'))}</button>
                </div>
                <div class="hp-tab-content${defaultTab === 'desktop' ? '' : ' hp-hidden'}" id="hpTabDesktop">
                    ${desktopGuides.map(renderGuideCard).join('')}
                </div>
                <div class="hp-tab-content${defaultTab === 'mobile' ? '' : ' hp-hidden'}" id="hpTabMobile">
                    ${mobileGuides.map(renderGuideCard).join('')}
                </div>
                <div class="hp-scroll-hint">${escapeHtml(t('homepage.scrollHint'))}</div>
                <div class="homepage-guide-url">
                    <input type="text" class="homepage-url-input" id="homepageUrl" readonly value="https://uyea-files.pages.dev/">
                    <button class="post-btn post-btn-secondary" id="copyHomepageUrl">${escapeHtml(t('homepage.copyUrl'))}</button>
                </div>
                <div class="homepage-guide-note">${escapeHtml(t('homepage.note'))}</div>
            </div>
        `;
    }

    // ==================== 弹窗控制 ====================
    let currentAuthMode = 'login'; // 'login' | 'register' | 'profile'

    function openAuthModal(mode) {
        currentAuthMode = mode || (isLoggedIn() ? 'profile' : 'login');
        renderAuthModal();
        authOverlay.classList.add('show');
        authModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        const userBtn = document.querySelector('.user-btn');
        if (userBtn) userBtn.classList.add('active');
    }

    function closeAuthModal() {
        authOverlay.classList.remove('show');
        authModal.classList.remove('show');
        document.body.style.overflow = '';
        const userBtn = document.querySelector('.user-btn');
        if (userBtn) userBtn.classList.remove('active');
        // 重置滑动面板到登录位置
        if (typeof window._authSlideReset === 'function') window._authSlideReset();
    }

    function renderAuthModal() {
        const title = document.getElementById('authModalTitle');
        if (currentAuthMode === 'profile') {
            title.textContent = t('auth.profile');
            authModalBody.innerHTML = renderUserProfile(getSession());
            bindProfileEvents();
        } else if (currentAuthMode === 'register') {
            title.textContent = t('auth.register');
            authModalBody.innerHTML = renderRegisterForm();
            bindRegisterEvents();
        } else {
            title.textContent = t('auth.login');
            authModalBody.innerHTML = renderLoginForm();
            bindLoginEvents();
        }
    }

    // ==================== 事件绑定 ====================
    function showAuthError(elId, msg) {
        const el = document.getElementById(elId);
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
    }
    function hideAuthError(elId) {
        const el = document.getElementById(elId);
        if (!el) return;
        el.textContent = '';
        el.classList.remove('show');
    }

    // 密码可见性切换
    function bindPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (!toggle || !input) return;
        toggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.style.opacity = isPassword ? '0.6' : '1';
        });
    }

    function bindLoginEvents() {
        bindPasswordToggle('loginPasswordToggle', 'loginPassword');

        const submitBtn = document.getElementById('loginSubmitBtn');
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        async function doLogin() {
            hideAuthError('loginError');
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) { showAuthError('loginError', t('auth.errorEmailRequired')); emailInput.focus(); return; }
            if (!password) { showAuthError('loginError', t('auth.errorPasswordRequired')); passwordInput.focus(); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = t('auth.loggingIn');

            try {
                const users = await loadUsers();
                const user = users.find(u => u.email === email || u.username === email);
                if (!user) {
                    // 用户不存在：关闭弹窗，显示成就式提示
                    closeAuthModal();
                    if (typeof window.showAchievement === 'function') {
                        window.showAchievement(t('toast.comingSoon') || '正在完善中', t('toast.loginNotFound') || '登录功能正在完善中，敬请期待');
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = t('auth.login');
                    return;
                }

                const inputHash = await sha256(password);
                if (inputHash !== user.passwordHash) {
                    showAuthError('loginError', t('auth.errorPasswordWrong'));
                    submitBtn.disabled = false;
                    submitBtn.textContent = t('auth.login');
                    return;
                }

                // 登录成功
                setSession(user);
                submitBtn.textContent = t('auth.loginSuccess');
                setTimeout(() => {
                    closeAuthModal();
                    updateUserBtnState();
                }, 500);
            } catch (e) {
                console.error('登录失败:', e);
                showAuthError('loginError', t('auth.errorNetwork'));
                submitBtn.disabled = false;
                submitBtn.textContent = t('auth.login');
            }
        }

        submitBtn.addEventListener('click', doLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
        });
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); passwordInput.focus(); }
        });

        // 拖拽分栏手柄：点击切换 + 拖拽向左滑揭示注册
        const authSplit = document.getElementById('authSplit');
        const authLoginLayer = document.getElementById('authLoginLayer');
        const authSlideHandle = document.getElementById('authSlideHandle');

        if (authSlideHandle && authLoginLayer && authSplit) {
            const HANDLE_WIDTH = window.innerWidth <= 600 ? 44 : 48;
            const DRAG_THRESHOLD = 5;
            let isPressing = false;
            let isDragging = false;
            let startX = 0;
            let startDividerX = 0;

            // 更新分栏位置：dividerX = 手柄左边界位置
            function updateSplit(dividerX) {
                authLoginLayer.style.clipPath = `inset(0 calc(100% - ${dividerX}px) 0 0)`;
                authSlideHandle.style.left = `${dividerX}px`;
            }

            // 初始位置：手柄在右侧（显示登录）
            function initSplit() {
                const w = authSplit.offsetWidth;
                updateSplit(w - HANDLE_WIDTH);
                authSplit.classList.remove('show-register');
            }

            function slideToRegister() {
                const w = authSplit.offsetWidth;
                authLoginLayer.classList.remove('dragging');
                authSlideHandle.classList.remove('dragging');
                updateSplit(0);
                authSplit.classList.add('show-register');
                const title = document.getElementById('authModalTitle');
                if (title) title.textContent = t('auth.register');
            }

            function slideToLogin() {
                const w = authSplit.offsetWidth;
                authLoginLayer.classList.remove('dragging');
                authSlideHandle.classList.remove('dragging');
                updateSplit(w - HANDLE_WIDTH);
                authSplit.classList.remove('show-register');
                const title = document.getElementById('authModalTitle');
                if (title) title.textContent = t('auth.login');
            }

            // 暴露给 closeAuthModal 调用
            window._authSlideReset = slideToLogin;

            // 初始化分栏位置
            requestAnimationFrame(() => initSplit());

            authSlideHandle.addEventListener('pointerdown', (e) => {
                isPressing = true;
                isDragging = false;
                startX = e.clientX;
                const leftStr = authSlideHandle.style.left || '0';
                startDividerX = parseFloat(leftStr) || 0;
            });

            document.addEventListener('pointermove', (e) => {
                if (!isPressing) return;
                const deltaX = e.clientX - startX;
                if (!isDragging) {
                    if (Math.abs(deltaX) < DRAG_THRESHOLD) return;
                    isDragging = true;
                    authLoginLayer.classList.add('dragging');
                    authSlideHandle.classList.add('dragging');
                    authSlideHandle.setPointerCapture && authSlideHandle.setPointerCapture(e.pointerId);
                }
                if (isDragging) {
                    const w = authSplit.offsetWidth;
                    let newX = startDividerX + deltaX;
                    newX = Math.max(0, Math.min(w - HANDLE_WIDTH, newX));
                    updateSplit(newX);
                    e.preventDefault();
                }
            });

            function handlePointerEnd() {
                if (!isPressing) return;
                isPressing = false;
                if (!isDragging) {
                    // 纯点击：切换面板
                    if (authSplit.classList.contains('show-register')) slideToLogin();
                    else slideToRegister();
                    return;
                }
                isDragging = false;
                // 吸附到最近的面板
                const w = authSplit.offsetWidth;
                const leftStr = authSlideHandle.style.left || '0';
                const currentX = parseFloat(leftStr) || 0;
                if (currentX < w / 2 - HANDLE_WIDTH / 2) slideToRegister();
                else slideToLogin();
            }

            document.addEventListener('pointerup', handlePointerEnd);
            document.addEventListener('pointercancel', handlePointerEnd);
        }

        // 自动聚焦邮箱输入框
        setTimeout(() => {
            const emailEl = document.getElementById('loginEmail');
            if (emailEl) emailEl.focus();
        }, 50);
    }

    function bindRegisterEvents() {
        bindPasswordToggle('regPasswordToggle', 'regPassword');

        const submitBtn = document.getElementById('registerSubmitBtn');
        const usernameInput = document.getElementById('regUsername');
        const nicknameInput = document.getElementById('regNickname');
        const passwordInput = document.getElementById('regPassword');
        const confirmInput = document.getElementById('regPasswordConfirm');

        async function doRegister() {
            hideAuthError('registerError');
            const username = usernameInput.value.trim();
            const nickname = nicknameInput.value.trim() || username;
            const password = passwordInput.value;
            const confirm = confirmInput.value;

            if (!username) { showAuthError('registerError', t('auth.errorUsernameRequired')); return; }
            if (username.length < 2) { showAuthError('registerError', t('auth.errorUsernameTooShort')); return; }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) { showAuthError('registerError', t('auth.errorUsernameInvalid')); return; }
            if (!password) { showAuthError('registerError', t('auth.errorPasswordRequired')); return; }
            if (password.length < 6) { showAuthError('registerError', t('auth.errorPasswordTooShort')); return; }
            if (password !== confirm) { showAuthError('registerError', t('auth.errorPasswordMismatch')); return; }

            // 注册功能尚未开放（保留表单逻辑供未来使用）
            showAuthError('registerError', t('auth.underDevelopment'));
        }

        submitBtn.addEventListener('click', doRegister);
        confirmInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doRegister(); }
        });

        // 切换到登录
        document.getElementById('switchToLogin').addEventListener('click', () => {
            currentAuthMode = 'login';
            renderAuthModal();
        });

        setTimeout(() => usernameInput.focus(), 50);
    }

    function bindProfileEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                clearSession();
                closeAuthModal();
                updateUserBtnState();
            });
        }
    }

    // ==================== 用户按钮状态更新 ====================
    function updateUserBtnState() {
        if (!userBtn) return;
        const session = getSession();
        if (session) {
            // 已登录：显示首字母头像
            const letter = (session.nickname || session.username || 'U').charAt(0).toUpperCase();
            userBtn.innerHTML = `<span class="user-btn-avatar">${escapeHtml(letter)}</span>`;
            userBtn.removeAttribute('data-coming-soon');
            userBtn.title = session.nickname || session.username;
        } else {
            // 未登录：恢复默认图标
            userBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            userBtn.removeAttribute('data-coming-soon');
            userBtn.title = t('auth.login');
        }
    }

    // ==================== 事件绑定：用户按钮 + 弹窗关闭 ====================
    if (userBtn) {
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 关闭其他下拉菜单
            if (typeof window.closeAllDropdowns === 'function') window.closeAllDropdowns(null);
            openAuthModal(isLoggedIn() ? 'profile' : 'login');
        });
    }

    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }
    if (authOverlay) {
        authOverlay.addEventListener('click', closeAuthModal);
    }

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('show')) {
            closeAuthModal();
        }
    });

    // ==================== 设为首页引导 ====================
    const homepageGuideBtn = document.getElementById('homepageGuideBtn');
    if (homepageGuideBtn) {
        homepageGuideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openHomepageGuide();
        });
    }

    function openHomepageGuide() {
        const title = document.getElementById('authModalTitle');
        title.textContent = t('homepage.title');
        authModalBody.innerHTML = renderSetHomepageGuide();
        currentAuthMode = 'homepage';
        authOverlay.classList.add('show');
        authModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 绑定复制按钮
        const copyBtn = document.getElementById('copyHomepageUrl');
        const urlInput = document.getElementById('homepageUrl');
        if (copyBtn && urlInput) {
            copyBtn.addEventListener('click', () => {
                urlInput.select();
                try { document.execCommand('copy'); } catch (e) { /* 忽略 */ }
                const orig = copyBtn.textContent;
                copyBtn.textContent = t('homepage.copied');
                setTimeout(() => { copyBtn.textContent = orig; }, 1500);
            });
        }

        // 绑定标签页切换
        authModalBody.querySelectorAll('.hp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                authModalBody.querySelectorAll('.hp-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                authModalBody.querySelector('#hpTabDesktop').classList.toggle('hp-hidden', targetTab !== 'desktop');
                authModalBody.querySelector('#hpTabMobile').classList.toggle('hp-hidden', targetTab !== 'mobile');
            });
        });

        // 自动滚动到检测到的浏览器卡片
        setTimeout(() => {
            const detectedCard = authModalBody.querySelector('.hp-browser-card.hp-detected');
            if (detectedCard) {
                detectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    // ==================== 初始化 ====================
    updateUserBtnState();

    // 通知加载动画：认证模块已就绪
    window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'auth' } }));

    // 暴露API供外部调用
    window.UYEA_AUTH = {
        isLoggedIn,
        getSession,
        openAuthModal,
        closeAuthModal,
        logout: () => { clearSession(); updateUserBtnState(); }
    };
});
