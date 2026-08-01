/**
 * UYEA Widgets - widgets.js
 * 论坛页右侧小组件：时钟、日历、天气、统计
 */

document.addEventListener('DOMContentLoaded', () => {
    const WIDGETS = ['widgetClock', 'widgetCalendar', 'widgetWeather', 'widgetStats'];
    let clockTimer = null;

    function getEl(id) { return document.getElementById(id); }

    // 根据帖子数量决定显示几个小组件
    // 规则：帖子越多，右侧空间利用越多；帖子少则少显示几个避免空旷
    function updateWidgetVisibility(postCount) {
        const widgets = WIDGETS.map(id => getEl(id)).filter(Boolean);
        let visibleCount = 1;
        if (postCount >= 2) visibleCount = 2;
        if (postCount >= 5) visibleCount = 3;
        if (postCount >= 8) visibleCount = 4;

        widgets.forEach((w, i) => {
            w.style.display = i < visibleCount ? '' : 'none';
        });
    }

    // 时钟
    function initClock() {
        const timeEl = getEl('clockTime');
        const dateEl = getEl('clockDate');
        if (!timeEl || !dateEl) return;

        function tick() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            dateEl.textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' });
        }
        tick();
        clockTimer = setInterval(tick, 1000);
    }

    // 日历
    function initCalendar() {
        const grid = getEl('calendarGrid');
        if (!grid) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const headers = ['日', '一', '二', '三', '四', '五', '六'];
        let html = headers.map(h => `<div class="cal-header">${h}</div>`).join('');

        // 上月末尾日期
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="cal-day other">${daysInPrevMonth - i}</div>`;
        }
        // 当月日期
        for (let d = 1; d <= daysInMonth; d++) {
            const cls = d === today ? 'cal-day today' : 'cal-day';
            html += `<div class="${cls}">${d}</div>`;
        }
        // 下月开头日期（补齐6行）
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            html += `<div class="cal-day other">${d}</div>`;
        }

        grid.innerHTML = html;
    }

    // 天气代码映射（WMO）
    function weatherCodeToIcon(code) {
        const map = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️',
            71: '🌨️', 73: '🌨️', 75: '🌨️',
            80: '🌦️', 81: '🌧️', 82: '🌧️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return map[code] || '⛅';
    }

    function weatherCodeToText(code) {
        const map = {
            0: '晴朗', 1: '主要晴朗', 2: '多云', 3: '阴天',
            45: '雾', 48: '雾凇',
            51: '毛毛雨', 53: '中度毛毛雨', 55: '密集毛毛雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            71: '小雪', 73: '中雪', 75: '大雪',
            80: '小阵雨', 81: '中阵雨', 82: '大阵雨',
            95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨伴冰雹'
        };
        return map[code] || '多云';
    }

    // 天气：使用 Open-Meteo 免费API（无需Key）
    async function initWeather() {
        const iconEl = getEl('weatherIcon');
        const tempEl = getEl('weatherTemp');
        const descEl = getEl('weatherDesc');
        if (!iconEl || !tempEl || !descEl) return;

        const setFallback = (city) => {
            iconEl.textContent = '⛅';
            tempEl.textContent = '--°';
            descEl.textContent = city ? `${city} · 天气数据暂不可用` : '天气数据暂不可用';
        };

        try {
            const pos = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) return reject(new Error('不支持定位'));
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
            });
            const { latitude, longitude } = pos.coords;

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
            if (!res.ok) throw new Error('天气接口异常');
            const data = await res.json();
            const cw = data.current_weather;

            iconEl.textContent = weatherCodeToIcon(cw.weathercode);
            tempEl.textContent = Math.round(cw.temperature) + '°';
            descEl.textContent = weatherCodeToText(cw.weathercode);
        } catch (e) {
            // 定位失败时使用北京作为默认城市
            try {
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current_weather=true&timezone=auto');
                if (!res.ok) throw new Error('默认天气接口异常');
                const data = await res.json();
                const cw = data.current_weather;
                iconEl.textContent = weatherCodeToIcon(cw.weathercode);
                tempEl.textContent = Math.round(cw.temperature) + '°';
                descEl.textContent = `北京 · ${weatherCodeToText(cw.weathercode)}`;
            } catch (e2) {
                setFallback();
            }
        }
    }

    // 统计
    function initStats(posts) {
        const postsEl = getEl('statPosts');
        const tagsEl = getEl('statTags');
        if (!postsEl || !tagsEl) return;

        postsEl.textContent = posts ? posts.length : '--';
        const tagSet = new Set();
        if (Array.isArray(posts)) {
            posts.forEach(p => { if (p.tag) tagSet.add(p.tag); });
        }
        tagsEl.textContent = tagSet.size || '--';
    }

    // 初始化并监听帖子渲染
    function initWidgets() {
        initClock();
        initCalendar();
        initWeather();

        const list = getEl('postList');
        if (list) {
            const observer = new MutationObserver(() => {
                const posts = list.querySelectorAll('.post-item');
                const count = posts.length;
                updateWidgetVisibility(count);
                // 尝试从全局读取帖子数据更新统计
                if (window.__uyea_allPosts) {
                    initStats(window.__uyea_allPosts);
                }
            });
            observer.observe(list, { childList: true });

            // 初始状态
            const initialCount = list.querySelectorAll('.post-item').length;
            updateWidgetVisibility(initialCount);
        }
    }

    // 暴露给 forum.js：渲染完帖子后调用
    window.updateForumWidgets = function(posts) {
        if (Array.isArray(posts)) {
            window.__uyea_allPosts = posts;
            updateWidgetVisibility(posts.length);
            initStats(posts);
        }
    };

    initWidgets();
});
