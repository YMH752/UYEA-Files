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
    const jumpBtnHeader = document.getElementById('jumpBtnHeader');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const jumpYear = document.getElementById('jumpYear');
    const jumpMonth = document.getElementById('jumpMonth');
    const jumpDay = document.getElementById('jumpDay');

    if (jumpBtnHeader) {
        jumpBtnHeader.addEventListener('click', () => {
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
                alert('请输入有效的日期');
                return;
            }

            let targetDate;
            if (type === 'solar') {
                targetDate = new Date(y, m - 1, d);
            } else {
                // 农历转公历
                if (typeof Lunar === 'undefined') {
                    alert('农历库未加载，无法转换农历日期');
                    return;
                }
                try {
                    const lunar = Lunar.fromYmd(y, m, d);
                    const solar = lunar.toSolar();
                    targetDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
                } catch (e) {
                    alert('日期转换失败，请检查农历日期是否有效');
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
})();
