/**
 * UYEA 用户认证模块 - auth.js
 * 纯前端登录/注册/会话管理
 * 密码使用 SHA-256 哈希存储，会话通过 localStorage 维持
 * 注意：纯前端方案仅用于演示，生产环境需后端验证
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 工具函数 ====================
    function safeGetItem(key) {
        try { return localStorage.getItem(key); }
        catch (e) { return null; }
    }
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); }
        catch (e) { /* 静默忽略 */ }
    }
    function safeRemoveItem(key) {
        try { localStorage.removeItem(key); }
        catch (e) { /* 静默忽略 */ }
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // SHA-256 哈希（使用 Web Crypto API）
    async function sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 获取当前语言翻译
    function t(key) {
        const lang = window.currentLang || (window.UYEA_CONFIG && UYEA_CONFIG.defaultLanguage) || 'zh-CN';
        const msgs = (window.UYEA_CONFIG && UYEA_CONFIG.i18n && UYEA_CONFIG.i18n[lang]) || {};
        return msgs[key] || key;
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

    // 登录表单 HTML
    function renderLoginForm() {
        return `
            <div class="auth-form" id="loginForm">
                <div class="auth-avatar">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="loginUsername">${t('auth.username')}</label>
                    <input type="text" class="auth-input" id="loginUsername" placeholder="${t('auth.usernamePlaceholder')}" autocomplete="username" autocapitalize="none">
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="loginPassword">${t('auth.password')}</label>
                    <div class="auth-password-wrap">
                        <input type="password" class="auth-input" id="loginPassword" placeholder="${t('auth.passwordPlaceholder')}" autocomplete="current-password">
                        <button class="auth-password-toggle" id="loginPasswordToggle" type="button" aria-label="${t('auth.togglePassword')}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </div>
                <div class="auth-error" id="loginError"></div>
                <div class="auth-actions">
                    <button class="post-btn auth-submit-btn" id="loginSubmitBtn">${t('auth.login')}</button>
                </div>
                <div class="auth-switch">
                    <span>${t('auth.noAccount')}</span>
                    <button class="auth-switch-btn" id="switchToRegister">${t('auth.register')}</button>
                </div>
                <div class="auth-hint">${t('auth.demoHint')}</div>
            </div>
        `;
    }

    // 注册表单 HTML
    function renderRegisterForm() {
        return `
            <div class="auth-form" id="registerForm">
                <div class="auth-avatar">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regUsername">${t('auth.username')}</label>
                    <input type="text" class="auth-input" id="regUsername" placeholder="${t('auth.usernamePlaceholder')}" autocomplete="username" autocapitalize="none" maxlength="20">
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regNickname">${t('auth.nickname')}</label>
                    <input type="text" class="auth-input" id="regNickname" placeholder="${t('auth.nicknamePlaceholder')}" maxlength="20">
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regPassword">${t('auth.password')}</label>
                    <div class="auth-password-wrap">
                        <input type="password" class="auth-input" id="regPassword" placeholder="${t('auth.passwordPlaceholder')}" autocomplete="new-password" minlength="6" maxlength="32">
                        <button class="auth-password-toggle" id="regPasswordToggle" type="button" aria-label="${t('auth.togglePassword')}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="regPasswordConfirm">${t('auth.confirmPassword')}</label>
                    <input type="password" class="auth-input" id="regPasswordConfirm" placeholder="${t('auth.confirmPasswordPlaceholder')}" autocomplete="new-password">
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

    // 已登录用户面板 HTML
    function renderUserProfile(session) {
        const avatarLetter = (session.nickname || session.username || 'U').charAt(0).toUpperCase();
        return `
            <div class="auth-profile">
                <div class="auth-profile-avatar">${escapeHtml(avatarLetter)}</div>
                <div class="auth-profile-info">
                    <div class="auth-profile-name">${escapeHtml(session.nickname || session.username)}</div>
                    <div class="auth-profile-role">${session.role === 'admin' ? t('auth.roleAdmin') : t('auth.roleUser')}</div>
                </div>
                <div class="auth-profile-actions">
                    <button class="post-btn post-btn-ghost auth-logout-btn" id="logoutBtn">${t('auth.logout')}</button>
                </div>
            </div>
            <div class="auth-profile-meta">
                <div class="auth-meta-item">
                    <span class="auth-meta-label">${t('auth.username')}</span>
                    <span class="auth-meta-value">${escapeHtml(session.username)}</span>
                </div>
                <div class="auth-meta-item">
                    <span class="auth-meta-label">${t('auth.loginTime')}</span>
                    <span class="auth-meta-value">${new Date(session.loginAt).toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    // 设为首页引导弹窗 HTML
    function renderSetHomepageGuide() {
        return `
            <div class="homepage-guide">
                <div class="homepage-guide-intro">${t('homepage.intro')}</div>
                <div class="homepage-browser-list">
                    <div class="homepage-browser-item">
                        <div class="homepage-browser-name">Chrome / Edge</div>
                        <div class="homepage-browser-steps">
                            <p>1. ${t('homepage.chrome.step1')}</p>
                            <p>2. ${t('homepage.chrome.step2')}</p>
                            <p>3. ${t('homepage.chrome.step3')}</p>
                        </div>
                    </div>
                    <div class="homepage-browser-item">
                        <div class="homepage-browser-name">Firefox</div>
                        <div class="homepage-browser-steps">
                            <p>1. ${t('homepage.firefox.step1')}</p>
                            <p>2. ${t('homepage.firefox.step2')}</p>
                            <p>3. ${t('homepage.firefox.step3')}</p>
                        </div>
                    </div>
                    <div class="homepage-browser-item">
                        <div class="homepage-browser-name">Safari</div>
                        <div class="homepage-browser-steps">
                            <p>1. ${t('homepage.safari.step1')}</p>
                            <p>2. ${t('homepage.safari.step2')}</p>
                        </div>
                    </div>
                    <div class="homepage-browser-item">
                        <div class="homepage-browser-name">${t('homepage.mobile.title')}</div>
                        <div class="homepage-browser-steps">
                            <p>1. ${t('homepage.mobile.step1')}</p>
                            <p>2. ${t('homepage.mobile.step2')}</p>
                        </div>
                    </div>
                </div>
                <div class="homepage-guide-url">
                    <input type="text" class="homepage-url-input" id="homepageUrl" readonly value="https://uyea-files.pages.dev/">
                    <button class="post-btn post-btn-secondary" id="copyHomepageUrl">${t('homepage.copyUrl')}</button>
                </div>
                <div class="homepage-guide-note">${t('homepage.note')}</div>
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
    }

    function closeAuthModal() {
        authOverlay.classList.remove('show');
        authModal.classList.remove('show');
        document.body.style.overflow = '';
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
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');

        async function doLogin() {
            hideAuthError('loginError');
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username) { showAuthError('loginError', t('auth.errorUsernameRequired')); usernameInput.focus(); return; }
            if (!password) { showAuthError('loginError', t('auth.errorPasswordRequired')); passwordInput.focus(); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = t('auth.loggingIn');

            try {
                const users = await loadUsers();
                const user = users.find(u => u.username === username);
                if (!user) {
                    showAuthError('loginError', t('auth.errorUserNotFound'));
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
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); passwordInput.focus(); }
        });

        // 切换到注册
        document.getElementById('switchToRegister').addEventListener('click', () => {
            currentAuthMode = 'register';
            renderAuthModal();
        });

        // 自动聚焦用户名输入框
        setTimeout(() => usernameInput.focus(), 50);
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

            submitBtn.disabled = true;
            submitBtn.textContent = t('auth.registering');

            try {
                const users = await loadUsers();
                if (users.some(u => u.username === username)) {
                    showAuthError('registerError', t('auth.errorUserExists'));
                    submitBtn.disabled = false;
                    submitBtn.textContent = t('auth.register');
                    return;
                }

                const passwordHash = await sha256(password);
                const newUser = {
                    id: Date.now(),
                    username: username,
                    passwordHash: passwordHash,
                    nickname: nickname,
                    avatar: '',
                    email: '',
                    role: 'user',
                    joinDate: new Date().toISOString().split('T')[0],
                    bio: ''
                };

                // 保存到 localStorage（注册用户覆盖存储）
                const stored = safeGetItem(STORAGE_KEYS.users);
                let registered = [];
                if (stored) {
                    try { registered = JSON.parse(stored); } catch (e) { /* 忽略 */ }
                }
                registered.push(newUser);
                saveRegisteredUsers(registered);

                // 自动登录
                setSession(newUser);
                submitBtn.textContent = t('auth.registerSuccess');
                setTimeout(() => {
                    closeAuthModal();
                    updateUserBtnState();
                }, 500);
            } catch (e) {
                console.error('注册失败:', e);
                showAuthError('registerError', t('auth.errorNetwork'));
                submitBtn.disabled = false;
                submitBtn.textContent = t('auth.register');
            }
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
