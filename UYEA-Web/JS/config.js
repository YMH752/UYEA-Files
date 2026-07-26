/**
 * UYEA 全局配置文件
 * 集中管理所有URL、API、路径、超时等配置
 * 更新此文件以改变应用行为，无需修改其他文件
 */

const UYEA_CONFIG = {
  // 资源路径（统一管理，避免重复定义）
  paths: {
    css: '/CSS/',
    js: '/JS/',
    json: '/JSON/',
    icons: '/IMAGE/ICO/',
    images: '/IMAGE/JPG/',
  },

  // 便捷访问（从 paths 派生，保持向后兼容）
  get iconBase() { return this.paths.icons; },
  get iconBaseFallback() { return this.paths.icons; },
  get backgroundBase() { return this.paths.images; },

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
      'section.ai': 'AI 智能体',
      'section.life': '生活',
      'section.tools': '工具',
      'forum.subtitle': '分享 AI 心得、工具作品与生活点滴',
      'nav.subtitle': 'AI智能体、生活、工具网站导航，集成时钟日历',
      'tools.subtitle': '纯前端在线工具，开箱即用，数据不出本地',
      'forum.cat.announcement': '公告',
      'forum.cat.ai': 'AI 探讨',
      'forum.cat.tools': '工具',
      'forum.cat.life': '生活',
      'forum.cat.feedback': '反馈',
      'forum.newPost': '发布新帖',
      'forum.searchPlaceholder': '搜索帖子、话题或用户...',
      'forum.noResults': '未找到匹配的帖子',
      'forum.failed': '帖子数据加载失败',
      'search.placeholder': '输入关键词搜索...',
      'search.engine.baidu': '百度',
      'search.engine.google': 'Google',
      'search.engine.bing': 'Bing',
      'search.engine.site': '站内',
      'bottom.recommend': '推荐',
      'bottom.follow': '关注',
      'bottom.favorite': '收藏'
    },
    'zh-TW': {
      'nav.home': '網站導航',
      'nav.tools': '線上工具',
      'nav.forum': '悠野社區',
      'btn.register': '註冊',
      'section.ai': 'AI 智能體',
      'section.life': '生活',
      'section.tools': '工具',
      'forum.subtitle': '分享 AI 心得、工具作品與生活點滴',
      'nav.subtitle': 'AI智能體、生活、工具網站導航，集成時鐘日曆',
      'tools.subtitle': '純前端線上工具，開箱即用，數據不出本地',
      'forum.cat.announcement': '公告',
      'forum.cat.ai': 'AI 探討',
      'forum.cat.tools': '工具',
      'forum.cat.life': '生活',
      'forum.cat.feedback': '反饋',
      'forum.newPost': '發佈新帖',
      'forum.searchPlaceholder': '搜索帖子、話題或用戶...',
      'forum.noResults': '未找到匹配的帖子',
      'forum.failed': '帖子數據加載失敗',
      'search.placeholder': '輸入關鍵詞搜索...',
      'search.engine.baidu': '百度',
      'search.engine.google': 'Google',
      'search.engine.bing': 'Bing',
      'search.engine.site': '站內',
      'bottom.recommend': '推薦',
      'bottom.follow': '關注',
      'bottom.favorite': '收藏'
    },
    'en': {
      'nav.home': 'Navigation',
      'nav.tools': 'Tools',
      'nav.forum': 'Community',
      'btn.register': 'Register',
      'section.ai': 'AI Assistants',
      'section.life': 'Lifestyle',
      'section.tools': 'Tools',
      'forum.subtitle': 'Share AI insights, tool creations & life moments',
      'nav.subtitle': 'AI assistants, lifestyle & tools directory',
      'tools.subtitle': 'Pure front-end online tools, ready to use, data stays local',
      'forum.cat.announcement': 'Announcements',
      'forum.cat.ai': 'AI Discussion',
      'forum.cat.tools': 'Tools',
      'forum.cat.life': 'Lifestyle',
      'forum.cat.feedback': 'Feedback',
      'forum.newPost': 'New Post',
      'forum.searchPlaceholder': 'Search posts, topics or users...',
      'forum.noResults': 'No matching posts found',
      'forum.failed': 'Failed to load posts',
      'search.placeholder': 'Enter keywords to search...',
      'search.engine.baidu': 'Baidu',
      'search.engine.google': 'Google',
      'search.engine.bing': 'Bing',
      'search.engine.site': 'Site',
      'bottom.recommend': 'Recommend',
      'bottom.follow': 'Following',
      'bottom.favorite': 'Favorites'
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
