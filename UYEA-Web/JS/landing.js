/**
 * UYEA Landing Page - landing.js v0.4.0
 * 
 * 核心功能：
 * - 实时时钟和日期显示（多语言支持）
 * - 禁用卡片的开发中模态框管理
 * - 页面过渡动画
 * - 背景图预加载与容错
 * - 与 i18n 系统的集成
 * 
 * @author UYEA
 * @version 0.4.0
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==================== 常量定义 ====================

  /**
   * 多语言周数映射
   */
  const WEEKDAYS = {
    'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    'zh-HK': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  /**
   * DOM 元素缓存
   */
  const DOM = {
    clockTime: document.getElementById('clockTime'),
    clockDate: document.getElementById('clockDate'),
    devModal: document.getElementById('devModal'),
    devModalOverlay: document.getElementById('devModalOverlay'),
    devModalTitle: document.getElementById('devModalTitle'),
    devModalText: document.getElementById('devModalText'),
    devModalCloseBtn: document.getElementById('devModalCloseBtn'),
    petCard: document.getElementById('petCard'),
    chatCard: document.getElementById('chatCard')
  };

  /**
   * 状态管理
   */
  const STATE = {
    isModalAnimating: false,
    clockInterval: null
  };

  // ==================== 时钟/日期模块 ====================

  /**
   * 格式化时间显示 HH:MM
   * @param {Date} date - 日期对象
   * @returns {string} 格式化的时间字符串
   */
  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 格式化日期显示 YYYY-M-D + 星期
   * @param {Date} date - 日期对象
   * @param {string} lang - 语言代码
   * @returns {string} 格式化的日期字符串
   */
  function formatDate(date, lang = 'zh-CN') {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.getDay();

    // 获取对应语言的周数名称，若不存在则使用简体中文
    const weekdayArray = WEEKDAYS[lang] || WEEKDAYS['zh-CN'];
    const weekdayStr = weekdayArray[weekday];

    return `${year}-${month}-${day} ${weekdayStr}`;
  }

  /**
   * 更新时钟显示
   */
  function updateClock() {
    const now = new Date();

    if (DOM.clockTime) {
      DOM.clockTime.textContent = formatTime(now);
    }

    if (DOM.clockDate) {
      const lang = document.body.getAttribute('data-lang') || 'zh-CN';
      DOM.clockDate.textContent = formatDate(now, lang);
    }
  }

  /**
   * 初始化时钟
   */
  function initClock() {
    // 立即更新一次
    updateClock();

    // 每秒更新
    if (STATE.clockInterval) {
      clearInterval(STATE.clockInterval);
    }
    STATE.clockInterval = setInterval(updateClock, 1000);
  }

  /**
   * 销毁时钟（清理资源）
   */
  function destroyClock() {
    if (STATE.clockInterval) {
      clearInterval(STATE.clockInterval);
      STATE.clockInterval = null;
    }
  }

  // ==================== 模态框模块 ====================

  /**
   * 显示开发中模态框
   * @param {string} title - 模态框标题
   * @param {string} text - 模态框文本
   */
  function showDevModal(title = '功能开发中', text = '敬请期待更新！') {
    // 防止动画中重复触发
    if (STATE.isModalAnimating) return;

    STATE.isModalAnimating = true;
    DOM.devModalTitle.textContent = title;
    DOM.devModalText.textContent = text;
    DOM.devModal.classList.add('show');
    DOM.devModalOverlay.classList.add('show');

    // 动画持续时间后重置标志
    setTimeout(() => {
      STATE.isModalAnimating = false;
    }, 400);
  }

  /**
   * 隐藏开发中模态框
   */
  function hideDevModal() {
    if (STATE.isModalAnimating) return;

    STATE.isModalAnimating = true;
    DOM.devModal.classList.remove('show');
    DOM.devModalOverlay.classList.remove('show');

    setTimeout(() => {
      STATE.isModalAnimating = false;
    }, 400);
  }

  /**
   * 初始化模态框事件监听
   */
  function initModalEvents() {
    // 关闭按钮点击
    if (DOM.devModalCloseBtn) {
      DOM.devModalCloseBtn.addEventListener('click', hideDevModal);
    }

    // 点击背景关闭（防止事件冒泡）
    if (DOM.devModalOverlay) {
      DOM.devModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.devModalOverlay) {
          hideDevModal();
        }
      });
    }

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.devModal.classList.contains('show')) {
        hideDevModal();
      }
    });

    // 禁用卡片点击处理
    if (DOM.petCard) {
      DOM.petCard.addEventListener('click', (e) => {
        e.preventDefault();
        showDevModal('桌面宠物', '桌面宠物功能开发中，敬请期待！🎉');
      });
    }

    if (DOM.chatCard) {
      DOM.chatCard.addEventListener('click', (e) => {
        e.preventDefault();
        showDevModal('实时聊天', '实时聊天功能开发中，敬请期待！💬');
      });
    }
  }

  // ==================== 页面过渡模块 ====================

  /**
   * 为启用的卡片添加页面过渡效果
   */
  function setupPageTransition() {
    const enabledCards = document.querySelectorAll('.landing-card-enabled');

    enabledCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (card.tagName === 'A' && card.href) {
          // 延迟导航以展示过渡动画
          setTimeout(() => {
            window.location.href = card.href;
          }, 200);

          e.preventDefault();
        }
      });
    });
  }

  // ==================== i18n 集成模块 ====================

  /**
   * 初始化 i18n 事件监听
   */
  function initI18nIntegration() {
    // 检查 i18n 是否可用
    if (typeof i18n !== 'undefined' && typeof i18n.subscribe === 'function') {
      // 监听语言变更
      i18n.subscribe((lang) => {
        // 语言切换时更新时钟显示
        updateClock();
      });

      console.log('[landing.js] i18n 集成成功');
    } else {
      console.warn('[landing.js] i18n 系统不可用，时钟日期格式不会自动更新');
    }
  }

  // ==================== 背景图预加载模块 ====================

  /**
   * 预加载背景图，添加容错降级
   */
  function preloadBackgroundImages() {
    const mobileImg = new Image();
    const desktopImg = new Image();

    const mobileUrl = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/IMAGE/JPG/Peter_Thomas(2-1).jpg';
    const desktopUrl = 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/IMAGE/JPG/Peter_Thomas(2-2).jpg';

    mobileImg.src = mobileUrl;
    desktopImg.src = desktopUrl;

    /**
     * 处理图片加载失败 - 降级到渐变背景
     */
    const handleImageError = (type) => {
      return () => {
        console.warn(`[landing.js] ${type}背景图加载失败，使用降级方案`);
        const landingMain = document.querySelector('.landing-main');
        if (landingMain) {
          // 使用深灰色渐变作为降级背景
          landingMain.style.backgroundImage = 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0a0a0a 100%)';
          landingMain.style.backgroundAttachment = 'fixed';
        }
      };
    };

    mobileImg.onerror = handleImageError('移动端');
    desktopImg.onerror = handleImageError('桌面端');

    // 可选：记录成功加载
    mobileImg.onload = () => {
      console.log('[landing.js] 移动端背景图加载成功');
    };
    desktopImg.onload = () => {
      console.log('[landing.js] 桌面端背景图加载成功');
    };
  }

  // ==================== 初始化执行 ====================

  /**
   * 执行所有初始化操作
   */
  function init() {
    console.log('[landing.js] 开始初始化...');

    try {
      // 1. 初始化时钟
      initClock();

      // 2. 初始化模态框事件
      initModalEvents();

      // 3. 设置页面过渡
      setupPageTransition();

      // 4. 集成 i18n 系统
      initI18nIntegration();

      // 5. 预加载背景图
      preloadBackgroundImages();

      console.log('[landing.js] 初始化完成');
    } catch (error) {
      console.error('[landing.js] 初始化错误:', error);
    }
  }

  /**
   * 页面卸载时清理资源
   */
  window.addEventListener('beforeunload', () => {
    destroyClock();
  });

  // 执行初始化
  init();
});
