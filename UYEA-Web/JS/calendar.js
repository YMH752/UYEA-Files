// calendar.js — 日历核心逻辑（修复版：超时、缓存、错误处理）
(function() {
    const todayDate = new Date();
    let currentCalendarYear = todayDate.getFullYear();
    let currentCalendarMonth = todayDate.getMonth() + 1;
    let selectedDate = todayDate;
    let isAnimating = false;
    let holidayData = {};
    let holidayCache = {};
    let festivalCacheYears = new Set(); // 记录已加载的年份，避免重复加载

    const MANUAL_JSON_URL = UYEA_CONFIG.dataFiles.holidays;

    // 公历固定节日定义
    const SOLAR_FIXED_FESTIVALS = {
        '元旦': '1-1',
        '劳动节': '5-1',
        '国庆节': '10-1'
    };

    let fixedFestivals = { solar: {}, lunar: {}, event: {} };

    /**
     * 从本地JSON加载节日定义
     * @returns {Promise}
     */
    async function loadFixedFestivals() {
        try {
            const resp = await fetchWithTimeout(MANUAL_JSON_URL, UYEA_CONFIG.timeouts.fetch);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            if (json.fixed_festivals) {
                fixedFestivals = json.fixed_festivals;
                console.log('✓ 节日定义加载成功');
            }
        } catch (e) {
            console.warn('节日定义加载失败，使用默认值:', e.message);
        }
    }

    /**
     * 带超时的fetch包装
     * @param {string} url URL
     * @param {number} timeout 超时毫秒数
     * @returns {Promise<Response>}
     */
    function fetchWithTimeout(url, timeout = 8000) {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    /**
     * 获取指定节日的实际日期
     * @param {number} year 年份
     * @param {string} festName 节日名称
     * @returns {Object|null} {month, day} 或 null
     */
    function getActualFestivalDate(year, festName) {
        // 公历固定节日
        if (SOLAR_FIXED_FESTIVALS[festName]) {
            const [m, d] = SOLAR_FIXED_FESTIVALS[festName].split('-').map(Number);
            return { month: m, day: d };
        }

        // 清明节特殊处理（需要节气计算）
        if (festName === '清明' || festName === '清明节') {
            if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') return null;
            try {
                for (let m = 3; m <= 5; m++) {
                    const days = new Date(year, m, 0).getDate();
                    for (let d = 1; d <= days; d++) {
                        const solar = Solar.fromYmd(year, m, d);
                        const lunar = Lunar.fromSolar(solar);
                        if (lunar.getJieQi && lunar.getJieQi() === '清明') {
                            return { month: m, day: d };
                        }
                    }
                }
            } catch (e) {
                console.warn('清明节计算失败:', e.message);
            }
        }

        // 农历节日查找
        if (typeof Solar === 'undefined' || typeof Lunar === 'undefined' || typeof LunarUtil === 'undefined') {
            return null;
        }

        try {
            for (let m = 1; m <= 12; m++) {
                const days = new Date(year, m, 0).getDate();
                for (let d = 1; d <= days; d++) {
                    const solar = Solar.fromYmd(year, m, d);
                    const lunar = Lunar.fromSolar(solar);
                    const lunarKey = `${lunar.getMonth()}-${lunar.getDay()}`;
                    if (LunarUtil.FESTIVAL && LunarUtil.FESTIVAL[lunarKey] === festName) {
                        return { month: m, day: d };
                    }
                }
            }
        } catch (e) {
            // 农历库未加载，正常情况
        }

        return null;
    }

    /**
     * 添加农历节日到日期对象
     * @param {number} year 年份
     * @param {Object} holidays 日期→节日的映射对象
     */
    function addLunarHolidays(year, holidays) {
        // 公历固定节日
        for (const [key, names] of Object.entries(fixedFestivals.solar || {})) {
            const [m, d] = key.split('-').map(Number);
            const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            names.forEach(name => {
                if (!holidays[dateStr].some(h => h.name === name)) {
                    holidays[dateStr].push({ name, isRest: false });
                }
            });
        }

        // 事件纪念日
        for (const [key, names] of Object.entries(fixedFestivals.event || {})) {
            const [m, d] = key.split('-').map(Number);
            const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            names.forEach(name => {
                if (!holidays[dateStr].some(h => h.name === name)) {
                    holidays[dateStr].push({ name, isRest: false });
                }
            });
        }

        // 法定公历节日
        for (const [name, date] of Object.entries(SOLAR_FIXED_FESTIVALS)) {
            const [m, d] = date.split('-').map(Number);
            const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            if (!holidays[dateStr].some(h => h.name === name)) {
                holidays[dateStr].push({ name, isRest: true });
            }
        }

        // 农历节日
        if (typeof Solar === 'undefined' || typeof Lunar === 'undefined' || typeof LunarUtil === 'undefined') {
            return;
        }

        try {
            for (let month = 1; month <= 12; month++) {
                const days = new Date(year, month, 0).getDate();
                for (let day = 1; day <= days; day++) {
                    try {
                        const solar = Solar.fromYmd(year, month, day);
                        const lunar = Lunar.fromSolar(solar);
                        const lunarKey = `${lunar.getMonth()}-${lunar.getDay()}`;
                        if (LunarUtil.FESTIVAL && LunarUtil.FESTIVAL[lunarKey]) {
                            const lunarFest = LunarUtil.FESTIVAL[lunarKey];
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            if (!holidays[dateStr]) holidays[dateStr] = [];
                            if (!holidays[dateStr].some(h => h.name === lunarFest)) {
                                holidays[dateStr].push({ name: lunarFest, isRest: false });
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        } catch (e) {
            console.warn('农历节日处理失败:', e.message);
        }
    }

    /**
     * 加载指定年份的节假日数据（带缓存）
     * @param {number} year 年份
     * @returns {Promise<Object>} 节假日对象
     */
    async function loadHolidaysForYear(year) {
        // 检查缓存
        if (holidayCache[year]) {
            return holidayCache[year];
        }

        // 避免重复fetch同一文件（文件包含所有年份）
        if (festivalCacheYears.size === 0) {
            try {
                const resp = await fetchWithTimeout(MANUAL_JSON_URL, UYEA_CONFIG.timeouts.fetch);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const allData = await resp.json();

                // 缓存所有年份的API返回数据
                if (allData[year]) {
                    let holidays = { ...allData[year] };
                    addLunarHolidays(year, holidays);
                    holidayCache[year] = holidays;
                }

                // 标记已加载过此文件
                festivalCacheYears.add('_fetched');
                console.log(`✓ 节假日数据已加载`);
            } catch (e) {
                console.warn('节假日加载失败，使用本地定义:', e.message);
                let holidays = {};
                addLunarHolidays(year, holidays);
                holidayCache[year] = holidays;
                festivalCacheYears.add('_fetched');
            }
        } else {
            // 文件已加载过，只需添加本地节日定义
            let holidays = {};
            addLunarHolidays(year, holidays);
            holidayCache[year] = holidays;
        }

        return holidayCache[year] || {};
    }

    /**
     * 渲染日历网格
     */
    function renderCalendar() {
        const year = currentCalendarYear;
        const month = currentCalendarMonth;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const grid = document.getElementById('calendarGrid');
        const title = document.getElementById('calendarTitle');

        if (title) {
            title.textContent = `${year}年${month}月`;
        }

        if (!grid) return;

        grid.innerHTML = '';

        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);

            const isToday =
                d.getFullYear() === todayDate.getFullYear() &&
                d.getMonth() === todayDate.getMonth() &&
                d.getDate() === todayDate.getDate();

            const isSelected =
                d.getFullYear() === selectedDate.getFullYear() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getDate() === selectedDate.getDate();

            const isOtherMonth = d.getMonth() !== month - 1;

            if (isToday) cell.classList.add('today');
            if (isSelected) cell.classList.add('selected');
            if (isOtherMonth) cell.classList.add('other-month');

            let html = `<div class="cell-solar">${d.getDate()}</div>`;

            // 农历
            if (typeof Lunar !== 'undefined' && typeof Solar !== 'undefined') {
                try {
                    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
                    const lunar = Lunar.fromSolar(solar);
                    html += `<div class="cell-lunar">${lunar.getDayInChinese()}</div>`;
                } catch (e) {
                    // 农历计算失败，跳过
                }
            }

            // 节日
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const hols = holidayData[dateStr];
            if (hols && hols.length > 0) {
                const holName = hols[0].name;
                const isRest = hols.some(h => h.isRest);
                html += `<div class="cell-holiday">${holName}</div>`;
                if (isRest) {
                    html += `<div class="cell-rest">休</div>`;
                }
            }

            cell.innerHTML = html;
            cell.addEventListener('click', () => {
                selectedDate = new Date(d);
                renderCalendar();
            });

            grid.appendChild(cell);
        }

        renderHolidayBar();
    }

    /**
     * 渲染月份节假日标签栏
     */
    function renderHolidayBar() {
        const bar = document.getElementById('holidayBar');
        if (!bar) return;

        const thisMonthHolidays = [];
        for (const [dateStr, hols] of Object.entries(holidayData)) {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (y === currentCalendarYear && m === currentCalendarMonth) {
                hols.forEach(h => {
                    if (!thisMonthHolidays.find(x => x.name === h.name)) {
                        thisMonthHolidays.push(h);
                    }
                });
            }
        }

        if (thisMonthHolidays.length === 0) {
            bar.classList.add('empty');
        } else {
            bar.classList.remove('empty');
            bar.innerHTML = thisMonthHolidays
                .map(h => `<span class="holiday-tag">${h.name}</span>`)
                .join('');
        }
    }

    /**
     * 更新日历显示
     */
    async function updateCalendar() {
        if (isAnimating) return;
        isAnimating = true;

        try {
            holidayData = await loadHolidaysForYear(currentCalendarYear);
            renderCalendar();
        } catch (e) {
            console.error('日历更新失败:', e);
        } finally {
            isAnimating = false;
        }
    }

    // 月份导航按钮
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (isAnimating) return;
            currentCalendarMonth--;
            if (currentCalendarMonth < 1) {
                currentCalendarMonth = 12;
                currentCalendarYear--;
            }
            updateCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (isAnimating) return;
            currentCalendarMonth++;
            if (currentCalendarMonth > 12) {
                currentCalendarMonth = 1;
                currentCalendarYear++;
            }
            updateCalendar();
        });
    }

    // ==================== 模态框处理 ====================
    const modalOverlay = document.getElementById('modalOverlay');
    const modalJump = document.getElementById('modalJump');
    const calendarTitleEl = document.getElementById('calendarTitle');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const jumpYear = document.getElementById('jumpYear');
    const jumpMonth = document.getElementById('jumpMonth');
    const jumpDay = document.getElementById('jumpDay');

    // 点击月份标题打开跳转模态框（替代旧的跳转按钮）
    if (calendarTitleEl) {
        calendarTitleEl.addEventListener('click', () => {
            if (modalOverlay) modalOverlay.classList.add('show');
            if (modalJump) modalJump.classList.add('show');
        });
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', () => {
            if (modalOverlay) modalOverlay.classList.remove('show');
            if (modalJump) modalJump.classList.remove('show');
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            modalOverlay.classList.remove('show');
            if (modalJump) modalJump.classList.remove('show');
        });
    }

    if (modalConfirm) {
        modalConfirm.addEventListener('click', () => {
            const type = document.querySelector('input[name="calendarType"]:checked').value;
            const y = parseInt(jumpYear.value, 10);
            const m = parseInt(jumpMonth.value, 10);
            const d = parseInt(jumpDay.value, 10);

            if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) {
                return;
            }

            let targetDate;
            if (type === 'solar') {
                targetDate = new Date(y, m - 1, d);
            } else {
                // 农历转公历
                if (typeof Lunar === 'undefined') {
                    return;
                }
                try {
                    const lunar = Lunar.fromYmd(y, m, d);
                    const solar = lunar.toSolar();
                    targetDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
                } catch (e) {
                    console.error('农历转换错误:', e.message);
                    return;
                }
            }

            currentCalendarYear = targetDate.getFullYear();
            currentCalendarMonth = targetDate.getMonth() + 1;
            selectedDate = targetDate;

            if (modalOverlay) modalOverlay.classList.remove('show');
            if (modalJump) modalJump.classList.remove('show');

            updateCalendar();
        });
    }

    // 初始化
    loadFixedFestivals().then(() => updateCalendar());

    // ==================== 每日一言 ====================
    const QUOTES = [
        { text: '千里之行，始于足下。', author: '老子' },
        { text: '不积跬步，无以至千里。', author: '荀子' },
        { text: '学而时习之，不亦说乎？', author: '孔子' },
        { text: '天行健，君子以自强不息。', author: '《周易》' },
        { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
        { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '古训' },
        { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
        { text: '一寸光阴一寸金，寸金难买寸光阴。', author: '王贞白' },
        { text: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿' },
        { text: '三人行，必有我师焉。', author: '孔子' },
        { text: '知之者不如好之者，好之者不如乐之者。', author: '孔子' },
        { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
        { text: '问渠那得清如许？为有源头活水来。', author: '朱熹' },
        { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
        { text: '会当凌绝顶，一览众山小。', author: '杜甫' },
        { text: '海纳百川，有容乃大；壁立千仞，无欲则刚。', author: '林则徐' },
        { text: '静以修身，俭以养德。', author: '诸葛亮' },
        { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
        { text: '勿以恶小而为之，勿以善小而不为。', author: '刘备' },
        { text: '穷则独善其身，达则兼济天下。', author: '孟子' }
    ];

    let quoteIndex = Math.floor(Math.random() * QUOTES.length);

    function renderQuote() {
        const textEl = document.getElementById('quoteText');
        const authorEl = document.getElementById('quoteAuthor');
        if (!textEl || !authorEl) return;
        const q = QUOTES[quoteIndex];
        textEl.style.opacity = '0';
        authorEl.style.opacity = '0';
        setTimeout(() => {
            textEl.textContent = q.text;
            authorEl.textContent = '— ' + q.author;
            textEl.style.transition = 'opacity 0.3s ease';
            authorEl.style.transition = 'opacity 0.3s ease';
            textEl.style.opacity = '1';
            authorEl.style.opacity = '1';
        }, 150);
    }

    const quoteRefresh = document.getElementById('quoteRefresh');
    if (quoteRefresh) {
        quoteRefresh.addEventListener('click', () => {
            quoteIndex = (quoteIndex + 1) % QUOTES.length;
            renderQuote();
        });
    }

    renderQuote();

    // ==================== 节日倒计时 ====================
    // 公历固定节日列表（月-日 → 名称）
    const COUNTDOWN_FESTIVALS = [
        { date: '1-1', name: '元旦' },
        { date: '2-14', name: '情人节' },
        { date: '3-8', name: '妇女节' },
        { date: '3-12', name: '植树节' },
        { date: '4-1', name: '愚人节' },
        { date: '5-1', name: '劳动节' },
        { date: '5-4', name: '青年节' },
        { date: '6-1', name: '儿童节' },
        { date: '7-1', name: '建党节' },
        { date: '8-1', name: '建军节' },
        { date: '9-10', name: '教师节' },
        { date: '10-1', name: '国庆节' },
        { date: '10-31', name: '万圣节' },
        { date: '11-11', name: '光棍节' },
        { date: '12-24', name: '平安夜' },
        { date: '12-25', name: '圣诞节' }
    ];

    function getNextFestival() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const festivals = [];

        for (const f of COUNTDOWN_FESTIVALS) {
            const [m, d] = f.date.split('-').map(Number);
            // 今年的节日
            let dateThisYear = new Date(now.getFullYear(), m - 1, d);
            if (dateThisYear >= today) {
                festivals.push({ name: f.name, date: dateThisYear });
            }
            // 明年的节日
            let dateNextYear = new Date(now.getFullYear() + 1, m - 1, d);
            festivals.push({ name: f.name, date: dateNextYear });
        }

        // 按日期排序，取最近的
        festivals.sort((a, b) => a.date - b.date);
        return festivals[0] || null;
    }

    function renderCountdown() {
        const nameEl = document.getElementById('countdownName');
        const numberEl = document.getElementById('countdownNumber');
        const dateEl = document.getElementById('countdownDate');
        if (!nameEl || !numberEl || !dateEl) return;

        const next = getNextFestival();
        if (!next) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffMs = next.date - today;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        nameEl.textContent = next.name;
        numberEl.textContent = diffDays;
        dateEl.textContent = `${next.date.getFullYear()}年${next.date.getMonth() + 1}月${next.date.getDate()}日`;
    }

    renderCountdown();

    // ==================== 快捷操作面板 ====================
    const qaCopyTime = document.getElementById('qaCopyTime');
    const qaToggleTheme = document.getElementById('qaToggleTheme');
    const qaFullscreen = document.getElementById('qaFullscreen');
    const qaToTop = document.getElementById('qaToTop');
    const qaShare = document.getElementById('qaShare');
    const qaRandom = document.getElementById('qaRandom');

    // 复制当前时间
    if (qaCopyTime) {
        qaCopyTime.addEventListener('click', async () => {
            const now = new Date();
            const text = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                console.warn('复制失败:', e.message);
            }
        });
    }

    // 切换主题
    if (qaToggleTheme) {
        qaToggleTheme.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('uyea_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('uyea_theme', 'dark');
            }
        });
    }

    // 全屏切换
    if (qaFullscreen) {
        qaFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        });
    }

    // 返回顶部
    if (qaToTop) {
        qaToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 分享
    if (qaShare) {
        qaShare.addEventListener('click', async () => {
            const shareData = {
                title: 'UYEA 悠野导航',
                text: '悠野导航 - AI智能体、生活、工具网站导航',
                url: window.location.href
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (e) {
                    // 用户取消分享，无需处理
                }
            } else {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                } catch (e) {
                    console.warn('分享功能不可用:', e.message);
                }
            }
        });
    }

    // 随机访问一个导航站点
    if (qaRandom) {
        qaRandom.addEventListener('click', () => {
            const cards = document.querySelectorAll('.card-item[href]');
            if (cards.length === 0) return;
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            const url = randomCard.getAttribute('href');
            window.open(url, '_blank', 'noopener');
        });
    }
})();
