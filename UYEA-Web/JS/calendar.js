// calendar.js — 日历、节日处理核心逻辑（优化版）
(function() {
    const todayDate = new Date();
    let currentCalendarYear = todayDate.getFullYear();
    let currentCalendarMonth = todayDate.getMonth() + 1;
    let selectedDate = todayDate;
    let isAnimating = false;
    let holidayData = {};
    let fetchLock = false;

    const API_URL = 'https://timor.tech/api/holiday/year/';
    const MANUAL_JSON_URL = '/JSON/holidays.json';
    const holidayCache = {};
    let fixedFestivals = { solar: {}, lunar: {}, event: {} };

    const SOLAR_FIXED_FESTIVALS = {
        '元旦': '1-1',
        '劳动节': '5-1',
        '国庆节': '10-1'
    };

    async function loadFixedFestivals() {
        try {
            const resp = await fetch(MANUAL_JSON_URL);
            if (!resp.ok) throw new Error('Failed to fetch holidays');
            const json = await resp.json();
            if (json.fixed_festivals) {
                fixedFestivals = json.fixed_festivals;
            }
        } catch (e) {
            console.warn('Fixed festivals load failed, using defaults:', e);
            // 使用默认值继续
        }
    }

    function getActualFestivalDate(year, festName) {
        if (SOLAR_FIXED_FESTIVALS[festName]) {
            const [m, d] = SOLAR_FIXED_FESTIVALS[festName].split('-').map(Number);
            return { month: m, day: d };
        }
        if (festName === '清明' || festName === '清明节') {
            for (let m = 1; m <= 12; m++) {
                const days = new Date(year, m, 0).getDate();
                for (let d = 1; d <= days; d++) {
                    try {
                        const solar = Solar.fromYmd(year, m, d);
                        const lunar = Lunar.fromSolar(solar);
                        if (lunar.getJieQi() === '清明') {
                            return { month: m, day: d };
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        }
        try {
            for (let m = 1; m <= 12; m++) {
                const days = new Date(year, m, 0).getDate();
                for (let d = 1; d <= days; d++) {
                    const solar = Solar.fromYmd(year, m, d);
                    const lunar = Lunar.fromSolar(solar);
                    const lunarKey = `${lunar.getMonth()}-${lunar.getDay()}`;
                    const lunarFest = LunarUtil.FESTIVAL[lunarKey];
                    if (lunarFest === festName) {
                        return { month: m, day: d };
                    }
                }
            }
        } catch (e) {
            console.warn('Lunar festival lookup failed:', festName);
        }
        return null;
    }

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

        // 中国重大事件纪念日
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

        // 农历、节气、民俗
        if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') {
            console.warn('Lunar library not loaded, skipping lunar festivals');
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
                        const lunarFest = LunarUtil.FESTIVAL[lunarKey];
                        if (lunarFest) {
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
            console.warn('Lunar holiday processing failed:', e);
        }
    }

    async function loadHolidaysForYear(year) {
        if (holidayCache[year]) return holidayCache[year];
        if (fetchLock) return {};

        fetchLock = true;
        try {
            let holidays = {};

            // 尝试从远程API加载
            try {
                const resp = await fetch(API_URL + year, { timeout: 5000 });
                if (resp.ok) {
                    const data = await resp.json();
                    holidays = data;
                    console.log(`Loaded holidays from API for ${year}`);
                }
            } catch (apiErr) {
                console.warn(`API failed for ${year}, falling back to local data:`, apiErr);
            }

            // 添加本地固定节日
            addLunarHolidays(year, holidays);
            holidayCache[year] = holidays;
            return holidays;
        } catch (e) {
            console.error('Holiday loading error:', e);
            return {};
        } finally {
            fetchLock = false;
        }
    }

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
            if (typeof Lunar !== 'undefined') {
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

    async function updateCalendar() {
        if (isAnimating) return;
        isAnimating = true;

        holidayData = await loadHolidaysForYear(currentCalendarYear);
        renderCalendar();

        isAnimating = false;
    }

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

    // 模态框处理
    const modalOverlay = document.getElementById('modalOverlay');
    const modalJump = document.getElementById('modalJump');
    const jumpBtnHeader = document.getElementById('jumpBtnHeader');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const jumpYear = document.getElementById('jumpYear');
    const jumpMonth = document.getElementById('jumpMonth');
    const jumpDay = document.getElementById('jumpDay');
    const calendarType = document.querySelectorAll('input[name="calendarType"]');

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
                    alert('农历库未加载，无法转换');
                    return;
                }
                try {
                    const lunar = Lunar.fromYmd(y, m, d);
                    const solar = lunar.toSolar();
                    targetDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
                } catch (e) {
                    alert('日期转换失败，请检查输入');
                    console.error('Lunar conversion error:', e);
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
