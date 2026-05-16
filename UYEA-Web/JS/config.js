/**
 * UYEA 全局配置文件
 * 集中管理所有URL、API、路径、超时等配置
 * 更新此文件以改变应用行为，无需修改其他文件
 */

const UYEA_CONFIG = {
  // 资源路径
  paths: {
    css: '/CSS/',
    js: '/JS/',
    json: '/JSON/',
    icons: '/Image/Icons/',
  },

  // 远程资源
  resources: {
    // GitHub 图标库（主源）
    iconBase: 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/Icons/',
    // 本地图标库备用（相对路径）
    iconBaseFallback: '/Image/Icons/',
  },

  // API 配置
  api: {
    // 节假日 API
    holiday: {
      url: 'https://timor.tech/api/holiday/year/',
      timeout: 5000, // 毫秒
      retryTimes: 1, // 重试次数
    },
  },

  // 本地数据文件
  dataFiles: {
    navigation: '/JSON/navigation.json',
    posts: '/JSON/posts.json',
    holidays: '/JSON/holidays.json',
  },

  // 超时配置（毫秒）
  timeouts: {
    fetch: 8000,
    apiHoliday: 5000,
  },

  // localStorage 键前缀（避免冲突）
  storagePrefix: 'uyea_',

  // 存储键名
  storageKeys: {
    language: 'lang',
    searchEngine: 'engine',
  },

  // 默认语言
  defaultLanguage: 'zh-CN',

  // 默认搜索引擎
  defaultSearchEngine: 'baidu',

  // emoji 备选（图标加载失败时使用）
  emojiMap: {
    chatgpt: '🤖', gemini: '✨', claude: '🎯', deepseek: '🧠',
    yiyan: '📝', qianwen: '💬', kimi: '🌟', doubao: '🫘',
    yuanbao: '💰', perplexity: '🔍', copilot: '👨‍✈️', grok: '🧬',
    xiaohongshu: '📕', bilibili: '📺', zhihu: '💡',
    github: '🐙', tinypng: '🐼', v0: '🌀'
  },

  // 搜索引擎URL
  searchEngines: {
    site: null,
    baidu: 'https://www.baidu.com/s?wd=',
    google: 'https://www.google.com/search?q=',
    bing: 'https://cn.bing.com/search?q='
  },

  // 国际化翻译数据
  i18n: {
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
  },

  /**
   * 获取存储键（带前缀）
   * @param {string} key 键名
   * @returns {string} 带前缀的键名
   */
  getStorageKey: function(key) {
    return this.storagePrefix + key;
  },

  /**
   * 获取搜索引擎URL
   * @param {string} engine 搜索引擎代码
   * @returns {string|null} URL模板或null
   */
  getSearchEngineUrl: function(engine) {
    return this.searchEngines[engine] || this.searchEngines.baidu;
  },

  /**
   * 获取翻译
   * @param {string} lang 语言代码
   * @param {string} key 翻译键
   * @returns {string} 翻译内容
   */
  getTranslation: function(lang, key) {
    const msgs = this.i18n[lang] || this.i18n[this.defaultLanguage];
    return msgs[key] || key;
  }
};

// 兼容性导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UYEA_CONFIG;
}
