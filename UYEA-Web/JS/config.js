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
    images: '/Image/',
  },

  // 远程资源
  resources: {
    // GitHub 图标库（主源）
    iconBase: 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/Icons/',
    // 本地图标库备用（相对路径）
    iconBaseFallback: '/Image/Icons/',
    // 背景图库
    backgroundBase: 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/JPG/',
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
      'nav.explore': '开始探索',
      'btn.register': '注册',
      'btn.auth': '登录/注册',
      'section.ai': 'AI 智能体',
      'section.life': '生活',
      'section.tools': '工具',
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
    },
    'zh-TW': {
      'nav.home': '網站導航',
      'nav.tools': '線上工具',
      'nav.forum': '悠野社區',
      'nav.explore': '開始探索',
      'btn.register': '註冊',
      'btn.auth': '登入/註冊',
      'section.ai': 'AI 智能體',
      'section.life': '生活',
      'section.tools': '工具',
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
    },
    'en': {
      'nav.home': 'Navigation',
      'nav.tools': 'Tools',
      'nav.forum': 'Community',
      'nav.explore': 'Explore',
      'btn.register': 'Register',
      'btn.auth': 'Sign In / Sign Up',
      'section.ai': 'AI Assistants',
      'section.life': 'Lifestyle',
      'section.tools': 'Tools',
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
