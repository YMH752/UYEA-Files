/* ============================================================
   UYEA 悠野工作室 · style.css
   优化版：响应式自适应 + 性能优化 + Bug修复
   ============================================================ */

:root {
    --primary:          #1A1A1A;
    --primary-dark:     #000000;
    --primary-light:    #F5F5F5;
    --accent-1:         #333333;
    --accent-2:         #666666;
    --accent-3:         #999999;
    --accent-4:         #CCCCCC;
    --accent-5:         #E0E0E0;
    --bg:               #F5F5F5;
    --surface:          #FFFFFF;
    --border:           #E0E0E0;
    --text-primary:     #1A1A1A;
    --text-secondary:   #666666;
    --text-muted:       #999999;
    --holiday-cn:       #FF6B6B;
    --holiday-intl:     #4A90E2;
    --header-h:         70px;
    --radius-sm:        8px;
    --radius-md:        12px;
    --radius-lg:        16px;
    --duration:         0.3s;
    --shadow-sm:        0 2px 8px rgba(0, 0, 0, 0.08);
    --shadow-md:        0 10px 30px rgba(0, 0, 0, 0.12);
    --shadow-lg:        0 20px 50px rgba(0, 0, 0, 0.15);
}

html[data-theme="dark"] {
    --bg:               #0F0F0F;
    --surface:          #1A1A1A;
    --border:           #333333;
    --text-primary:     #F5F5F5;
    --text-secondary:   #CCCCCC;
    --text-muted:       #888888;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', system-ui, sans-serif;
    background-color: var(--bg);
    color: var(--text-primary);
    overflow-x: hidden;
    line-height: 1.6;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* 顶部导航 */
.top-header {
    width: 100%;
    height: var(--header-h);
    background: var(--surface);
    border-bottom: 2px solid var(--accent-1);
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: var(--shadow-sm);
}

.header-container {
    height: 100%;
    max-width: 100%;
    padding: 0 clamp(12px, 4vw, 24px);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo-section {
    display: flex;
    align-items: center;
}

.logo-text {
    font-family: system-ui, 'Outfit', monospace;
    font-size: clamp(20px, 5vw, 32px);
    font-weight: 900;
    background: linear-gradient(135deg, var(--primary), var(--accent-1), var(--accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-decoration: none;
    letter-spacing: clamp(1px, 0.5vw, 3px);
    transition: transform 0.2s ease;
}

.logo-text:hover { transform: scale(1.05); }

.header-right {
    display: flex;
    align-items: center;
    gap: clamp(8px, 2vw, 16px);
    margin-left: auto;
}

/* 语言选择器 */
.lang-selector {
    display: flex;
    gap: 0;
    background: #000000;
    border-radius: 8px;
    padding: 4px;
    position: relative;
    isolation: isolate;
}

.lang-highlight {
    position: absolute;
    top: 4px;
    left: 4px;
    height: calc(100% - 8px);
    background: #333333;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1;
    pointer-events: none;
}

.lang-btn {
    padding: 6px clamp(6px, 1vw, 12px);
    border: none;
    background: transparent;
    color: #FFFFFF;
    font-size: clamp(10px, 1vw, 12px);
    font-weight: 600;
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.2s ease;
    position: relative;
    z-index: 2;
    white-space: nowrap;
}

.lang-btn.active {
    color: #FFFFFF;
    font-weight: 700;
}

/* 搜索 */
.search-container {
    display: flex;
    align-items: center;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
    height: 40px;
    overflow: visible;
}

.engine-dropdown-wrapper {
    position: relative;
    flex-shrink: 0;
}

.engine-trigger-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 clamp(8px, 1vw, 12px);
    height: 40px;
    background: var(--accent-1);
    color: white;
    border: none;
    border-radius: 8px 0 0 8px;
    font-size: clamp(10px, 1vw, 12px);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
}

.engine-trigger-btn:hover { background: var(--accent-2); }

.engine-trigger-btn:active,
.engine-trigger-btn.clicking {
    animation: buttonBounce 0.2s ease-out;
}

.engine-dropdown-list {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    z-index: 200;
    overflow: hidden;
    animation: dropdownSlideIn 0.3s ease-out;
}

.engine-dropdown-wrapper:hover .engine-dropdown-list,
.engine-dropdown-wrapper.open .engine-dropdown-list { display: block; }

.engine-option-item {
    padding: 10px clamp(8px, 1vw, 12px);
    font-size: clamp(10px, 1vw, 12px);
    cursor: pointer;
    text-align: center;
    border-bottom: 1px solid var(--border);
    transition: all 0.2s ease;
}

.engine-option-item:last-child { border-bottom: none; }

.engine-option-item:hover {
    background: var(--bg);
    color: var(--primary);
}

.engine-option-item.selected {
    color: var(--primary);
    font-weight: 700;
}

.search-input {
    border: none;
    background: transparent;
    outline: none;
    width: clamp(100px, 30vw, 180px);
    padding: 0 clamp(8px, 1vw, 12px);
    font-size: clamp(11px, 1vw, 13px);
    color: var(--text-primary);
}

.search-input::placeholder { color: var(--text-muted); }

.search-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    font-size: clamp(12px, 2vw, 15px);
    color: var(--text-primary);
    transition: all 0.2s ease;
}

.search-icon-btn:hover {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
}

.search-dropdown {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: clamp(280px, 90vw, 320px);
    background: var(--surface);
    border: 2px solid var(--accent-1);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    z-index: 300;
    padding: 16px;
    animation: fadeUp 0.2s ease;
}

.search-dropdown.show { display: block; }

.search-dropdown .search-container { width: 100%; border: 1px solid var(--border); }

.search-dropdown .search-input { width: 100%; }

/* 汉堡菜单 */
.menu-toggle {
    display: flex;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    flex-direction: column;
    gap: 6px;
}

.menu-toggle span {
    width: 24px;
    height: 2px;
    background: var(--text-primary);
    border-radius: 2px;
    transition: all 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

.menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 6px);
}

.menu-toggle.active span:nth-child(2) {
    opacity: 0;
    transform: scale(0.5);
}

.menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -6px);
}

.dropdown-menu {
    display: none;
    position: fixed;
    top: var(--header-h);
    left: 0;
    right: 0;
    background: var(--surface);
    border-bottom: 2px solid var(--border);
    box-shadow: var(--shadow-md);
    z-index: 999;
    animation: slideInRight 0.3s ease;
    max-width: 100%;
}

.dropdown-menu.show { display: flex; flex-direction: column; }

.menu-nav { display: flex; flex-direction: column; padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px); }

.menu-item {
    padding: clamp(8px, 2vw, 12px) 0;
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;
    font-size: clamp(12px, 2vw, 14px);
    transition: color 0.2s ease;
}

.menu-item:hover { color: var(--primary); }

.menu-item.active { color: var(--primary); }

.menu-divider { height: 1px; background: var(--border); margin: 0; }

.menu-auth-section { padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px); border-top: 1px solid var(--border); }

.register-btn {
    width: 100%;
    padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px);
    background: linear-gradient(135deg, var(--accent-3), var(--primary));
    color: white;
    border: none;
    border-radius: 6px;
    font-size: clamp(11px, 2vw, 13px);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.register-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

/* 内容容器 */
.main-content {
    min-height: calc(100vh - var(--header-h));
    background: var(--bg);
    padding: clamp(8px, 2vw, 16px) 0;
}

.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 clamp(8px, 2vw, 16px);
}

/* 时钟日历区域 */
.clock-display {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(16px, 4vw, 32px);
    background: var(--surface);
    padding: clamp(16px, 4vw, 24px);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    margin-bottom: clamp(24px, 5vw, 40px);
    border: 1px solid var(--border);
}

@media (max-width: 768px) {
    .clock-display {
        grid-template-columns: 1fr;
        gap: clamp(16px, 3vw, 24px);
    }
}

.clock-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: clamp(12px, 3vw, 16px);
}

.clock-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    padding: clamp(12px, 3vw, 16px);
}

.clock-time-main {
    font-family: 'Courier New', monospace;
    font-size: clamp(32px, 10vw, 48px);
    font-weight: 700;
    letter-spacing: 0;
    color: var(--text-primary);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
    margin-bottom: clamp(8px, 2vw, 12px);
}

.clock-date-gregorian {
    text-align: center;
    font-size: clamp(13px, 2.5vw, 16px);
    font-weight: 500;
    margin-bottom: clamp(4px, 1vw, 6px);
}

.clock-date-lunar {
    text-align: center;
    font-size: clamp(11px, 2vw, 14px);
    font-weight: 400;
    white-space: nowrap;
    color: var(--text-secondary);
}

.calendar-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: clamp(8px, 2vw, 12px);
    position: relative;
}

.calendar-title {
    font-size: clamp(14px, 3vw, 18px);
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
}

.calendar-jump-btn-header {
    position: absolute;
    right: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--primary);
    border-radius: 0;
    font-size: clamp(10px, 1.5vw, 12px);
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: underline;
}

.calendar-jump-btn-header:hover {
    color: var(--accent-2);
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: clamp(6px, 1vw, 8px);
}

.calendar-weekdays div {
    text-align: center;
    font-size: clamp(11px, 1.5vw, 13px);
    color: var(--text-secondary);
    padding: clamp(2px, 1vw, 4px) 0;
    font-weight: 600;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: clamp(8px, 2vw, 12px);
}

.calendar-cell {
    min-height: clamp(24px, 6vw, 36px);
    padding: clamp(2px, 1vw, 4px);
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: auto;
    overflow: visible !important;
    border: 1px solid transparent;
}

.calendar-cell:hover {
    background: var(--bg);
    border-color: var(--border);
}

.calendar-cell.selected {
    outline: 2px solid var(--primary);
    outline-offset: -1px;
    background: var(--primary-light);
}

.cell-solar {
    font-size: clamp(12px, 2vw, 16px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
}

.calendar-cell.today .cell-solar {
    font-weight: 800;
    color: white;
}

.cell-lunar {
    font-size: clamp(8px, 1.5vw, 10px);
    font-weight: 400;
    color: var(--text-muted);
    line-height: 1;
    margin-top: 0;
}

.calendar-cell.today .cell-lunar {
    color: rgba(255, 255, 255, 0.85);
}

.cell-holiday {
    font-size: clamp(7px, 1.2vw, 9px);
    font-weight: 600;
    color: var(--primary);
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.calendar-cell.today .cell-holiday {
    color: rgba(255, 255, 255, 0.85);
}

/* 休字 - 无背景黑字，今日显示白色 */
.cell-rest {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: clamp(9px, 1.5vw, 12px);
    font-weight: 700;
    color: var(--primary);          /* 黑色文字 */
    background: transparent;        /* 无背景 */
    border-radius: 2px;
    padding: 0 1px;
    line-height: 1;
    white-space: nowrap;
    z-index: 1;
}

.calendar-cell.today .cell-rest {
    color: white;                   /* 今日时变白 */
}

.calendar-cell.other-month {
    opacity: 0.2;
}

.calendar-nav-btn {
    width: 100%;
    height: 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: clamp(12px, 2vw, 14px);
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.calendar-nav-btn:hover {
    opacity: 1;
    color: var(--primary);
}

.calendar-nav-up { margin-bottom: 4px; }
.calendar-nav-down { margin-top: 4px; }

.holiday-bar {
    margin-top: clamp(6px, 1vw, 8px);
    width: 100%;
    min-height: clamp(18px, 3vw, 24px);
    padding: clamp(3px, 1vw, 5px) clamp(6px, 1vw, 8px);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(8px);
    display: flex;
    gap: clamp(3px, 1vw, 4px);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    transition: all 0.3s ease;
}

[data-theme="dark"] .holiday-bar {
    background: rgba(255, 255, 255, 0.1);
}

.holiday-bar.empty {
    transform: translateX(100%);
    opacity: 0;
    min-height: 0;
    padding: 0;
    margin-top: 0;
}

.holiday-tag {
    padding: clamp(2px, 0.8vw, 4px) clamp(6px, 1vw, 8px);
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: clamp(9px, 1.5vw, 10px);
    white-space: nowrap;
    scroll-snap-align: start;
    flex-shrink: 0;
    color: var(--text-primary);
    line-height: 1.2;
}

/* 分区 */
.section-group {
    margin-bottom: clamp(32px, 6vw, 48px);
}

.section-header {
    margin-bottom: clamp(16px, 3vw, 24px);
}

.section-title {
    font-size: clamp(20px, 5vw, 28px);
    font-weight: 700;
    color: var(--text-primary);
}

/*
  关键修改：auto-fill → auto-fit
  auto-fit 会将剩余空间平均分配给现有列，消除右侧留白，
  同时保持卡片最小宽度不低于 180~240px（视口自适应）。
*/
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(180px, 28vw, 240px), 1fr));
    gap: clamp(12px, 2vw, 20px);
}

@media (max-width: 768px) {
    .grid-container {
        grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 28vw, 200px), 1fr));
    }
}

.card-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: clamp(14px, 2.5vw, 20px);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--text-primary);
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
}

.card-item:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-2);
}

.card-icon {
    width: clamp(48px, 12vw, 64px);
    height: clamp(48px, 12vw, 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: clamp(8px, 2vw, 12px);
    font-size: clamp(28px, 8vw, 40px);
    border-radius: var(--radius-sm);
    background: var(--bg);
    flex-shrink: 0;
}

.card-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.icon-loading {
    position: absolute;
    width: clamp(32px, 8vw, 48px);
    height: clamp(32px, 8vw, 48px);
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.icon-emoji {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(24px, 8vw, 40px);
    font-weight: 600;
    user-select: none;
}

.card-info {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.card-title {
    font-size: clamp(13px, 2vw, 16px);
    font-weight: 600;
    text-align: center;
    color: var(--text-primary);
    line-height: 1.3;
}

/* 模态框 */
.modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-overlay.show { display: block; }

.modal-jump {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: clamp(280px, 90vw, 320px);
    padding: clamp(14px, 3vw, 20px);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
}

.modal-jump.show { display: block; animation: modalPop 0.2s ease; }

.modal-title {
    font-size: clamp(14px, 2.5vw, 16px);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: clamp(10px, 2vw, 12px);
}

.modal-radio-group {
    display: flex;
    gap: clamp(8px, 2vw, 12px);
    margin-bottom: clamp(10px, 2vw, 12px);
    flex-wrap: wrap;
}

.modal-radio-group label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: clamp(11px, 1.5vw, 12px);
    color: var(--text-secondary);
    cursor: pointer;
}

.modal-inputs-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(4px, 1vw, 6px);
    margin-bottom: clamp(10px, 2vw, 12px);
}

.modal-inputs-wrapper input {
    flex: 1;
    min-width: clamp(50px, 20vw, 70px);
    height: 32px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-primary);
    text-align: center;
    font-size: clamp(11px, 1.5vw, 12px);
    outline: none;
    transition: all 0.2s ease;
}

.modal-inputs-wrapper input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
}

.modal-btn {
    padding: clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px);
    border-radius: 4px;
    border: none;
    font-size: clamp(11px, 1.5vw, 12px);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
}

.modal-btn-cancel {
    background: var(--bg);
    color: var(--text-secondary);
    border: 1px solid var(--border);
}

.modal-btn-cancel:hover { background: var(--border); }

.modal-btn-confirm {
    background: var(--primary);
    color: white;
}

.modal-btn-confirm:hover { background: var(--accent-1); }

/* ==================== FORUM 页面样式 ==================== */

.forum-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(12px, 3vw, 16px);
    margin-bottom: clamp(24px, 4vw, 32px);
    align-items: center;
}

.post-btn {
    padding: clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px);
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: clamp(12px, 1.5vw, 14px);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.post-btn:hover {
    background: var(--accent-1);
    transform: translateY(-2px);
}

.forum-search {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: clamp(200px, 50vw, 300px);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0 clamp(10px, 2vw, 14px);
    height: 40px;
    gap: 8px;
}

.forum-search span {
    font-size: clamp(14px, 2vw, 16px);
    flex-shrink: 0;
}

.forum-search input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: clamp(12px, 1.5vw, 14px);
    color: var(--text-primary);
}

.forum-search input::placeholder {
    color: var(--text-muted);
}

.post-list {
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 2vw, 16px);
}

.post-item {
    display: block;
    padding: clamp(14px, 3vw, 18px);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--text-primary);
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
}

.post-item:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-2);
}

.post-meta {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(6px, 1.5vw, 10px);
    margin-bottom: clamp(8px, 1.5vw, 10px);
    font-size: clamp(11px, 1.5vw, 12px);
    color: var(--text-secondary);
    align-items: center;
}

.post-tag {
    display: inline-block;
    padding: clamp(3px, 0.8vw, 5px) clamp(8px, 1.5vw, 10px);
    background: var(--bg);
    border-radius: 4px;
    font-size: clamp(10px, 1.3vw, 11px);
    font-weight: 600;
    color: var(--primary);
    white-space: nowrap;
}

.post-title {
    font-size: clamp(14px, 2.5vw, 16px);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: clamp(6px, 1.5vw, 10px);
    line-height: 1.4;
}

.post-excerpt {
    font-size: clamp(12px, 1.8vw, 14px);
    color: var(--text-secondary);
    line-height: 1.5;
}

.no-results {
    display: none;
    text-align: center;
    padding: clamp(40px, 10vw, 60px) clamp(16px, 4vw, 32px);
}

.no-results.show { display: block; }

.no-results-icon {
    font-size: clamp(40px, 15vw, 60px);
    margin-bottom: clamp(12px, 2vw, 16px);
}

.no-results-text {
    font-size: clamp(14px, 2vw, 16px);
    color: var(--text-secondary);
}

/* ==================== TOOLS 页面样式 ==================== */

.category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(8px, 2vw, 12px);
    margin-bottom: clamp(24px, 4vw, 32px);
    border-bottom: 2px solid var(--border);
    padding-bottom: clamp(12px, 2vw, 16px);
}

.tab-item {
    padding: clamp(8px, 2vw, 12px) clamp(12px, 2vw, 16px);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-size: clamp(12px, 1.5vw, 14px);
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.tab-item:hover {
    color: var(--text-primary);
    background: var(--bg);
}

.tab-item.active {
    color: var(--primary);
    background: var(--primary-light);
    border-bottom: 2px solid var(--primary);
}

.tool-group {
    margin-bottom: clamp(32px, 6vw, 48px);
}

.tool-group[style*="display: none"] {
    display: none !important;
}

/* 动画 */
@keyframes buttonBounce {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
}

@keyframes dropdownSlideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes modalPop {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* 响应式调整 */
@media (max-width: 600px) {
    .header-container {
        padding: 0 clamp(8px, 3vw, 16px);
    }
    
    .search-icon-btn {
        width: 36px;
        height: 36px;
    }
    
    .lang-selector {
        display: none;
    }
}

/* 打印优化 */
@media print {
    .top-header, .dropdown-menu, .modal-overlay, .modal-jump {
        display: none !important;
    }
}

/* 性能优化 */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}