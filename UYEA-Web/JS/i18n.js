/**
 * UYEA i18n 国际化管理系统 v1.0
 * 
 * 核心功能：
 * - 自动翻译所有标记了 data-i18n 属性的元素
 * - 支持文本、placeholder、title、alt、自定义属性等多种类型
 * - 语言切换时自动更新整个页面
 * - 事件订阅机制，其他脚本可监听语言变更
 * - localStorage 自动保存用户语言偏好
 * - 完全零依赖，原生 JavaScript 实现
 * 
 * @author UYEA
 * @version 1.0.0
 */

class I18nManager {
  /**
   * 构造函数 - 初始化属性
   */
  constructor() {
    this.config = null;
    this.currentLang = null;
    this.translations = {};
    this.observers = [];
    this.isInitialized = false;
  }

  /**
   * 初始化 i18n 管理器
   * @param {Object} config - UYEA_CONFIG 配置对象
   * @returns {boolean} 初始化是否成功
   */
  init(config) {
    // 验证配置
    if (!config || !config.i18n || typeof config.i18n !== 'object') {
      console.error('[i18n] 错误：UYEA_CONFIG 或 i18n 配置未加载或格式不正确');
      return false;
    }

    this.config = config;
    this.translations = config.i18n;

    // 获取初始语言
    this.currentLang = this.getStoredLanguage() || config.defaultLanguage;

    // 验证当前语言是否支持
    if (!this.translations[this.currentLang]) {
      console.warn(`[i18n] 警告：语言 "${this.currentLang}" 不支持，使用默认语言 "${config.defaultLanguage}"`);
      this.currentLang = config.defaultLanguage;
    }

    // 初始化页面翻译
    this.applyTranslations(this.currentLang);

    // 绑定语言切换监听器
    this.bindLanguageSwitcher();

    this.isInitialized = true;
    console.log(`[i18n] 初始化完成，当前语言: ${this.currentLang}`);

    return true;
  }

  /**
   * 从 localStorage 获取存储的语言偏好
   * @returns {string|null} 存储的语言代码或 null
   */
  getStoredLanguage() {
    if (!this.config || !window.localStorage) {
      return null;
    }

    try {
      const storageKey = this.config.getStorageKey(this.config.storageKeys.language);
      return localStorage.getItem(storageKey);
    } catch (e) {
      console.warn('[i18n] localStorage 访问被拒绝:', e.message);
      return null;
    }
  }

  /**
   * 保存语言偏好到 localStorage
   * @param {string} lang - 语言代码
   * @returns {boolean} 保存是否成功
   */
  saveLanguagePreference(lang) {
    if (!this.config || !window.localStorage) {
      return false;
    }

    try {
      const storageKey = this.config.getStorageKey(this.config.storageKeys.language);
      localStorage.setItem(storageKey, lang);
      return true;
    } catch (e) {
      console.warn('[i18n] 保存语言偏好失败:', e.message);
      return false;
    }
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键（如 'landing.nav_title'）
   * @param {string|null} lang - 语言代码（可选，默认当前语言）
   * @returns {string} 翻译文本或原始键
   */
  t(key, lang = null) {
    const targetLang = lang || this.currentLang;
    
    // 获取目标语言的翻译表，若不存在则使用默认语言
    const msgs = this.translations[targetLang] || this.translations[this.config?.defaultLanguage];
    
    // 返回翻译内容，若无翻译则返回键本身
    return msgs ? (msgs[key] || key) : key;
  }

  /**
   * 应用翻译到整个页面
   * @param {string} lang - 目标语言代码
   * @returns {boolean} 是否成功应用
   */
  applyTranslations(lang) {
    // 验证语言支持
    if (!this.translations[lang]) {
      console.warn(`[i18n] 不支持的语言 "${lang}"`);
      return false;
    }

    this.currentLang = lang;

    // 更新页面中所有需要翻译的元素
    this.translateElements(lang);

    // 通知所有订阅者
    this.notifyObservers(lang);

    return true;
  }

  /**
   * 翻译所有标记了 data-i18n 属性的元素
   * @param {string} lang - 目标语言代码
   */
  translateElements(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    let translateCount = 0;

    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translation = this.t(key, lang);
      const type = el.getAttribute('data-i18n-type') || 'text';

      // 根据类型选择合适的更新方式
      switch (type) {
        case 'placeholder':
          el.placeholder = translation;
          break;

        case 'title':
          el.title = translation;
          break;

        case 'alt':
          el.alt = translation;
          break;

        case 'attr':
          const attrName = el.getAttribute('data-i18n-attr');
          if (attrName) {
            el.setAttribute(attrName, translation);
          }
          break;

        case 'html':
          el.innerHTML = translation;
          break;

        case 'text':
        default:
          el.textContent = translation;
      }

      translateCount++;
      this.triggerElementCallback(el, lang);
    });

    console.log(`[i18n] 已翻译 ${translateCount} 个元素到 "${lang}"`);
  }

  /**
   * 触发元素上定义的回调函数（如果有）
   * @param {Element} el - 要处理的元素
   * @param {string} lang - 当前语言
   */
  triggerElementCallback(el, lang) {
    const callback = el.getAttribute('data-i18n-callback');
    if (callback && typeof window[callback] === 'function') {
      try {
        window[callback](el, lang);
      } catch (e) {
        console.warn(`[i18n] 回调执行错误 "${callback}":`, e);
      }
    }
  }

  /**
   * 绑定语言切换按钮的事件监听
   */
  bindLanguageSwitcher() {
    const langButtons = document.querySelectorAll('[data-lang]');

    if (langButtons.length === 0) {
      console.warn('[i18n] 未找到语言切换按钮（[data-lang] 元素）');
      return;
    }

    langButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const targetLang = btn.getAttribute('data-lang');
        if (!targetLang) return;

        // 防止重复切换
        if (this.currentLang === targetLang) return;

        // 更新按钮状态
        this.updateActiveLangButton(targetLang);

        // 应用翻译
        this.applyTranslations(targetLang);

        // 保存语言偏好
        this.saveLanguagePreference(targetLang);

        // 更新 document 属性
        document.documentElement.lang = targetLang;
        if (document.body) {
          document.body.setAttribute('data-lang', targetLang);
        }

        console.log(`[i18n] 语言已切换至 "${targetLang}"`);
      });
    });
  }

  /**
   * 更新语言按钮的 active 状态
   * @param {string} targetLang - 目标语言
   */
  updateActiveLangButton(targetLang) {
    const allLangButtons = document.querySelectorAll('[data-lang]');

    allLangButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === targetLang;
      btn.classList.toggle('active', isActive);
      
      // 更新 aria-pressed 属性
      if (btn.hasAttribute('aria-pressed')) {
        btn.setAttribute('aria-pressed', isActive);
      }
    });
  }

  /**
   * 注册翻译变更观察器
   * @param {Function} callback - 翻译变更时的回调函数 (lang) => {}
   * @returns {Function} 注销观察器的函数
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.observers.push(callback);

      // 返回注销函数
      return () => {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
          this.observers.splice(index, 1);
        }
      };
    }

    return () => {};
  }

  /**
   * 触发所有观察器的回调
   * @param {string} lang - 当前语言
   */
  notifyObservers(lang) {
    this.observers.forEach((callback, index) => {
      try {
        callback(lang);
      } catch (e) {
        console.warn(`[i18n] 观察器 #${index} 执行错误:`, e);
      }
    });
  }

  /**
   * 获取当前语言代码
   * @returns {string} 当前语言代码
   */
  getCurrentLang() {
    return this.currentLang;
  }

  /**
   * 切换语言（编程方式）
   * @param {string} lang - 目标语言代码
   * @returns {boolean} 切换是否成功
   */
  switchLanguage(lang) {
    if (!this.translations[lang]) {
      console.error(`[i18n] 不支持的语言 "${lang}"`);
      return false;
    }

    // 尝试找到对应的语言按钮并点击
    const langBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (langBtn) {
      langBtn.click();
    } else {
      // 如果没有按钮，直接切换
      this.updateActiveLangButton(lang);
      this.applyTranslations(lang);
      this.saveLanguagePreference(lang);
      document.documentElement.lang = lang;
      if (document.body) {
        document.body.setAttribute('data-lang', lang);
      }
    }

    return true;
  }

  /**
   * 获取所有支持的语言列表
   * @returns {Array<string>} 语言代码数组
   */
  getSupportedLanguages() {
    return Object.keys(this.translations);
  }

  /**
   * 检查是否初始化
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }
}

/**
 * 全局单例实例
 */
const i18n = new I18nManager();

/**
 * 自动初始化：监听 DOMContentLoaded 和 UYEA_CONFIG 加载
 */
(function autoInit() {
  const tryInit = () => {
    if (typeof UYEA_CONFIG !== 'undefined' && !i18n.isReady()) {
      i18n.init(UYEA_CONFIG);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

  // 备用：检查 UYEA_CONFIG 是否延迟加载
  setTimeout(() => {
    tryInit();
  }, 100);
})();
