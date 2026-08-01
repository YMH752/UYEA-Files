/**
 * UYEA Widgets - widgets.js
 * 论坛页右侧小组件系统：固定显示、可编辑、本地持久化
 */

function initWidgets() {
    const STORAGE_KEY = 'uyea_active_widgets';
    const container = document.getElementById('widgetContainer');
    const editBtn = document.getElementById('widgetEditBtn');
    if (!container || !editBtn) {
        console.warn('[widgets] 容器或编辑按钮未找到，跳过初始化');
        return;
    }

    let isEditing = false;
    let clockTimer = null;
    let activeIds = loadActiveIds();

    // 默认显示的组件：时钟、日历、天气
    const DEFAULT_WIDGETS = ['clock', 'calendar', 'weather'];

    function loadActiveIds() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_WIDGETS.slice();
        } catch (e) {
            return DEFAULT_WIDGETS.slice();
        }
    }

    function saveActiveIds() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeIds));
        } catch (e) {}
    }

    function esc(str) {
        return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ========== 各组件渲染器 ==========
    const WIDGET_DEFS = {
        clock: {
            title: '当前时间',
            icon: '🕐',
            render(id) {
                return `<div class="widget-label">当前时间</div>
                        <div class="widget-clock-time" id="${id}-time">--:--</div>
                        <div class="widget-clock-date" id="${id}-date">----/--/--</div>`;
            },
            init(id) {
                const timeEl = document.getElementById(`${id}-time`);
                const dateEl = document.getElementById(`${id}-date`);
                if (!timeEl || !dateEl) return;
                const tick = () => {
                    const now = new Date();
                    timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    dateEl.textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' });
                };
                tick();
                clockTimer = setInterval(tick, 1000);
            }
        },
        calendar: {
            title: '日历',
            icon: '📅',
            render(id) {
                return `<div class="widget-label">日历</div>
                        <div class="widget-calendar-grid" id="${id}-grid"></div>`;
            },
            init(id) {
                const grid = document.getElementById(`${id}-grid`);
                if (!grid) return;
                const now = new Date();
                const year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const daysInPrevMonth = new Date(year, month, 0).getDate();
                const headers = ['日', '一', '二', '三', '四', '五', '六'];
                let html = headers.map(h => `<div class="cal-header">${h}</div>`).join('');
                for (let i = firstDay - 1; i >= 0; i--) html += `<div class="cal-day other">${daysInPrevMonth - i}</div>`;
                for (let d = 1; d <= daysInMonth; d++) {
                    html += `<div class="cal-day ${d === today ? 'today' : ''}">${d}</div>`;
                }
                const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
                for (let d = 1; d <= remaining; d++) html += `<div class="cal-day other">${d}</div>`;
                grid.innerHTML = html;
            }
        },
        weather: {
            title: '天气',
            icon: '🌤️',
            render(id) {
                return `<div class="widget-label">天气</div>
                        <div class="widget-weather-main">
                            <div class="widget-weather-icon" id="${id}-icon">⛅</div>
                            <div class="widget-weather-temp" id="${id}-temp">--°</div>
                        </div>
                        <div class="widget-weather-desc" id="${id}-desc">北京</div>`;
            },
            init(id) {
                const iconEl = document.getElementById(`${id}-icon`);
                const tempEl = document.getElementById(`${id}-temp`);
                const descEl = document.getElementById(`${id}-desc`);
                if (!iconEl || !tempEl || !descEl) return;

                const codeMap = {
                    0: ['☀️', '晴朗'], 1: ['🌤️', '主要晴朗'], 2: ['⛅', '多云'], 3: ['☁️', '阴天'],
                    45: ['🌫️', '雾'], 48: ['🌫️', '雾凇'],
                    51: ['🌦️', '毛毛雨'], 53: ['🌦️', '中度毛毛雨'], 55: ['🌧️', '密集毛毛雨'],
                    61: ['🌧️', '小雨'], 63: ['🌧️', '中雨'], 65: ['🌧️', '大雨'],
                    71: ['🌨️', '小雪'], 73: ['🌨️', '中雪'], 75: ['🌨️', '大雪'],
                    80: ['🌦️', '小阵雨'], 81: ['🌧️', '中阵雨'], 82: ['🌧️', '大阵雨'],
                    95: ['⛈️', '雷雨'], 96: ['⛈️', '雷雨伴冰雹'], 99: ['⛈️', '强雷雨伴冰雹']
                };

                const apply = (code, temp, city) => {
                    const [icon, text] = codeMap[code] || ['⛅', '多云'];
                    iconEl.textContent = icon;
                    tempEl.textContent = Math.round(temp) + '°';
                    descEl.textContent = city ? `${city} · ${text}` : text;
                };

                const fetchWeather = async (lat, lon, city) => {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
                    if (!res.ok) throw new Error('fail');
                    const data = await res.json();
                    apply(data.current_weather.weathercode, data.current_weather.temperature, city);
                };

                // 默认北京，点击后请求定位
                apply(0, 0, '北京');
                fetchWeather(39.9042, 116.4074, '北京');

                descEl.style.cursor = 'pointer';
                descEl.title = '点击获取当前位置天气';
                descEl.addEventListener('click', () => {
                    if (!navigator.geolocation) {
                        descEl.textContent = '浏览器不支持定位';
                        return;
                    }
                    descEl.textContent = '定位中...';
                    navigator.geolocation.getCurrentPosition(
                        pos => {
                            fetchWeather(pos.coords.latitude, pos.coords.longitude, null).catch(() => {
                                descEl.textContent = '定位天气获取失败';
                            });
                        },
                        () => {
                            descEl.textContent = '定位被拒绝，已恢复北京';
                            setTimeout(() => fetchWeather(39.9042, 116.4074, '北京'), 1500);
                        },
                        { timeout: 10000 }
                    );
                });
            }
        },
        stats: {
            title: '社区统计',
            icon: '📊',
            render(id) {
                return `<div class="widget-label">社区统计</div>
                        <div class="widget-stat-row"><span>帖子</span><strong id="${id}-posts">--</strong></div>
                        <div class="widget-stat-row"><span>标签</span><strong id="${id}-tags">--</strong></div>`;
            },
            init(id) {
                updateStats(id);
            }
        },
        todo: {
            title: '待办事项',
            icon: '✅',
            render(id) {
                return `<div class="widget-label">待办事项</div>
                        <div class="widget-todo-list" id="${id}-list"></div>
                        <div class="widget-todo-add">
                            <input type="text" id="${id}-input" placeholder="添加待办..." maxlength="30">
                            <button id="${id}-add">+</button>
                        </div>`;
            },
            init(id) {
                const listEl = document.getElementById(`${id}-list`);
                const input = document.getElementById(`${id}-input`);
                const addBtn = document.getElementById(`${id}-add`);
                if (!listEl || !input || !addBtn) return;

                const key = `uyea_todo_${id}`;
                let items = [];
                try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}

                const render = () => {
                    if (items.length === 0) {
                        listEl.innerHTML = '<div class="widget-todo-empty">暂无待办</div>';
                    } else {
                        listEl.innerHTML = items.map((item, i) => `
                            <label class="widget-todo-item ${item.done ? 'done' : ''}">
                                <input type="checkbox" data-idx="${i}" ${item.done ? 'checked' : ''}>
                                <span>${esc(item.text)}</span>
                            </label>
                        `).join('');
                    }
                    localStorage.setItem(key, JSON.stringify(items));
                };

                const add = () => {
                    const text = input.value.trim();
                    if (!text) return;
                    items.push({ text, done: false });
                    input.value = '';
                    render();
                };

                addBtn.addEventListener('click', add);
                input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
                listEl.addEventListener('change', e => {
                    const idx = e.target.dataset.idx;
                    if (idx == null) return;
                    items[+idx].done = e.target.checked;
                    render();
                });
                render();
            }
        },
        quote: {
            title: '每日一言',
            icon: '💬',
            render(id) {
                return `<div class="widget-label">每日一言</div>
                        <div class="widget-quote-text" id="${id}-text">加载中...</div>
                        <div class="widget-quote-refresh" id="${id}-refresh">换一条</div>`;
            },
            init(id) {
                const textEl = document.getElementById(`${id}-text`);
                const refreshEl = document.getElementById(`${id}-refresh`);
                if (!textEl || !refreshEl) return;
                const quotes = [
                    '种一棵树最好的时间是十年前，其次是现在。',
                    '保持热爱，奔赴山海。',
                    '代码是写给人看的，顺便给机器运行。',
                    '简单的事情重复做，重复的事情用心做。',
                    '今日事，今日毕。',
                    '学而不思则罔，思而不学则殆。',
                    '行到水穷处，坐看云起时。'
                ];
                const show = () => {
                    const idx = Math.floor(Math.random() * quotes.length);
                    textEl.textContent = quotes[idx];
                };
                show();
                refreshEl.addEventListener('click', show);
            }
        },
        theme: {
            title: '主题切换',
            icon: '🎨',
            render(id) {
                return `<div class="widget-label">主题切换</div>
                        <div class="widget-theme-options" id="${id}-options">
                            <button class="widget-theme-btn" data-theme="light">☀️ 浅色</button>
                            <button class="widget-theme-btn" data-theme="dark">🌙 深色</button>
                            <button class="widget-theme-btn" data-theme="coffee">☕ 咖啡</button>
                        </div>`;
            },
            init(id) {
                const wrap = document.getElementById(`${id}-options`);
                if (!wrap) return;
                const current = document.documentElement.getAttribute('data-theme') || 'light';
                wrap.querySelectorAll('.widget-theme-btn').forEach(btn => {
                    if (btn.dataset.theme === current) btn.classList.add('active');
                    btn.addEventListener('click', () => {
                        const theme = btn.dataset.theme;
                        document.documentElement.setAttribute('data-theme', theme);
                        try { localStorage.setItem('uyea_theme', theme); } catch (e) {}
                        wrap.querySelectorAll('.widget-theme-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
            }
        },
        links: {
            title: '快捷链接',
            icon: '🔗',
            render(id) {
                return `<div class="widget-label">快捷链接</div>
                        <div class="widget-links" id="${id}-links">
                            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
                            <a href="https://stackoverflow.com" target="_blank" rel="noopener">Stack Overflow</a>
                            <a href="https://developer.mozilla.org" target="_blank" rel="noopener">MDN</a>
                        </div>`;
            },
            init(id) {}
        },
        countdown: {
            title: '倒计时',
            icon: '⏳',
            render(id) {
                return `<div class="widget-label">距离周末</div>
                        <div class="widget-countdown" id="${id}-time">--</div>`;
            },
            init(id) {
                const el = document.getElementById(`${id}-time`);
                if (!el) return;
                const update = () => {
                    const now = new Date();
                    const day = now.getDay();
                    const target = new Date(now);
                    target.setDate(now.getDate() + ((6 - day + 7) % 7 || 7));
                    target.setHours(0, 0, 0, 0);
                    const diff = target - now;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    el.textContent = `${h}时 ${m}分`;
                };
                update();
                setInterval(update, 60000);
            }
        }
    };

    function updateStats(widgetId) {
        const posts = window.__uyea_allPosts || [];
        const postsEl = document.getElementById(`${widgetId}-posts`);
        const tagsEl = document.getElementById(`${widgetId}-tags`);
        if (postsEl) postsEl.textContent = posts.length || '--';
        if (tagsEl) {
            const tagSet = new Set();
            posts.forEach(p => { if (p.tag) tagSet.add(p.tag); });
            tagsEl.textContent = tagSet.size || '--';
        }
    }

    // ========== 渲染 ==========
    function renderWidget(type, index) {
        const def = WIDGET_DEFS[type];
        if (!def) return null;
        const id = `widget-${type}-${index}`;
        const el = document.createElement('div');
        el.className = 'widget';
        el.id = id;
        el.dataset.type = type;
        el.innerHTML = def.render(id);
        if (def.init) def.init(id);
        return el;
    }

    function renderAll() {
        if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
        container.innerHTML = '';
        const counts = {};
        activeIds.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
            const w = renderWidget(type, counts[type]);
            if (w) container.appendChild(w);
        });
        if (isEditing) attachRemoveButtons();
    }

    function attachRemoveButtons() {
        container.querySelectorAll('.widget').forEach(w => {
            if (w.querySelector('.widget-remove')) return;
            const btn = document.createElement('button');
            btn.className = 'widget-remove';
            btn.innerHTML = '−';
            btn.title = '移除组件';
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const type = w.dataset.type;
                const idx = activeIds.indexOf(type);
                if (idx > -1) {
                    activeIds.splice(idx, 1);
                    saveActiveIds();
                    renderAll();
                }
            });
            w.appendChild(btn);
        });
    }

    // ========== 编辑面板 ==========
    function toggleEdit() {
        isEditing = !isEditing;
        editBtn.textContent = isEditing ? '完成' : '编辑组件';
        editBtn.classList.toggle('active', isEditing);

        let panel = document.getElementById('widgetEditPanel');
        if (!isEditing) {
            if (panel) panel.remove();
            renderAll();
            return;
        }

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'widgetEditPanel';
            panel.className = 'widget-edit-panel';
            editBtn.parentNode.insertBefore(panel, editBtn.nextSibling);
        }

        renderPanel(panel);
        attachRemoveButtons();
    }

    function renderPanel(panel) {
        const types = Object.keys(WIDGET_DEFS);
        panel.innerHTML = `
            <div class="widget-edit-title">添加组件</div>
            <div class="widget-edit-grid">
                ${types.map(type => {
                    const def = WIDGET_DEFS[type];
                    const added = activeIds.includes(type);
                    return `
                        <div class="widget-edit-item ${added ? 'added' : ''}" data-type="${type}">
                            <span class="widget-edit-icon">${def.icon}</span>
                            <span class="widget-edit-name">${def.title}</span>
                            <button class="widget-edit-toggle" title="${added ? '已添加' : '添加'}">${added ? '−' : '+'}</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        panel.querySelectorAll('.widget-edit-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.widget-edit-toggle')) e.stopPropagation();
                const type = item.dataset.type;
                const idx = activeIds.indexOf(type);
                if (idx > -1) {
                    activeIds.splice(idx, 1);
                } else {
                    activeIds.push(type);
                }
                saveActiveIds();
                renderAll();
                renderPanel(panel);
            });
        });
    }

    editBtn.addEventListener('click', toggleEdit);

    // 暴露给 forum.js
    window.updateForumWidgets = function(posts) {
        window.__uyea_allPosts = posts || [];
        container.querySelectorAll('.widget[data-type="stats"]').forEach(w => {
            updateStats(w.id);
        });
    };

    renderAll();
}

// 兼容 defer 脚本在 DOMContentLoaded 之后执行的情况
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
} else {
    initWidgets();
}
