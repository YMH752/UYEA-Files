// calendar.js — 日历、节日处理核心逻辑
(function() {
    const todayDate = new Date();
    let currentCalendarYear = todayDate.getFullYear();
    let currentCalendarMonth = todayDate.getMonth() + 1;
    let selectedDate = todayDate;
    let isAnimating = false;
    let holidayData = {};
    let fetchLock = false;

    const API_URL = 'https://timor.tech/api/holiday/year/';
    const MANUAL_JSON_URL = '/Data/JSON/holidays.json';
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
            const json = await resp.json();
            if (json.fixed_festivals) {
                fixedFestivals = json.fixed_festivals;
            }
        } catch (e) {}
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
                    const solar = Solar.fromYmd(year, m, d);
                    const lunar = Lunar.fromSolar(solar);
                    if (lunar.getJieQi() === '清明') {
                        return { month: m, day: d };
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
        } catch (e) {}
        return null;
    }

    function addLunarHolidays(year, holidays) {
        // 公历固定节日（来自 fixed_festivals.solar）
        for (const [key, names] of Object.entries(fixedFestivals.solar)) {
            const [m, d] = key.split('-').map(Number);
            const dateStr = `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            names.forEach(name => {
                if (!holidays[dateStr].some(h => h.name === name)) {
                    holidays[dateStr].push({ name, isRest: false });
                }
            });
        }
        // 中国重大事件纪念日
        for (const [key, names] of Object.entries(fixedFestivals.event)) {
            const [m, d] = key.split('-').map(Number);
            const dateStr = `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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
            const dateStr = `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            if (!holidays[dateStr].some(h => h.name === name)) {
                holidays[dateStr].push({ name, isRest: true });
            }
        }
        // 农历、节气、民俗
        try {
            for (let month = 1; month <= 12; month++) {
                const daysInMonth = new Date(year, month, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    try {
                        const solar = Solar.fromYmd(year, month, day);
                        const lunar = Lunar.fromSolar(solar);
                        const jieQi = lunar.getJieQi();
                        if (jieQi) {
                            if (!holidays[dateStr]) holidays[dateStr] = [];
                            if (!holidays[dateStr].some(h => h.name === jieQi)) {
                                holidays[dateStr].push({ name: jieQi, isRest: false });
                            }
                        }
                        const lunarKey = `${lunar.getMonth()}-${lunar.getDay()}`;
                        const lunarFest = LunarUtil.FESTIVAL[lunarKey];
                        if (lunarFest) {
                            if (!holidays[dateStr]) holidays[dateStr] = [];
                            if (!holidays[dateStr].some(h => h.name === lunarFest)) {
                                holidays[dateStr].push({ name: lunarFest, isRest: false });
                            }
                        }
                        const extraFest = fixedFestivals.lunar[lunarKey];
                        if (extraFest) {
                            if (!holidays[dateStr]) holidays[dateStr] = [];
                            extraFest.forEach(name => {
                                if (!holidays[dateStr].some(h => h.name === name)) {
                                    holidays[dateStr].push({ name, isRest: false });
                                }
                            });
                        }
                    } catch (e) {}
                }
            }
            // 除夕
            const lunarYearObj = LunarYear.fromYear(year);
            const months = lunarYearObj.getMonths();
            for (const m of months) {
                if (m.getYear() === year && m.getMonth() === 1 && !m.isLeap()) {
                    const firstDaySolar = Solar.fromJulianDay(m.getFirstJulianDay());
                    const firstDayDateStr = `${firstDaySolar.getYear()}-${String(firstDaySolar.getMonth()).padStart(2,'0')}-${String(firstDaySolar.getDay()).padStart(2,'0')}`;
                    if (!holidays[firstDayDateStr]) holidays[firstDayDateStr] = [];
                    if (!holidays[firstDayDateStr].some(h => h.name === '春节')) {
                        holidays[firstDayDateStr].push({ name: '春节', isRest: false });
                    }
                    const evSolar = firstDaySolar.next(-1);
                    const evDateStr = `${evSolar.getYear()}-${String(evSolar.getMonth()).padStart(2,'0')}-${String(evSolar.getDay()).padStart(2,'0')}`;
                    if (!holidays[evDateStr]) holidays[evDateStr] = [];
                    if (!holidays[evDateStr].some(h => h.name === '除夕')) {
                        holidays[evDateStr].push({ name: '除夕', isRest: false });
                    }
                    break;
                }
            }
        } catch (e) {}
    }

    function adjustHolidays(year, holidays) {
        const nowYear = new Date().getFullYear();
        if (year === nowYear) return;
        for (const dateStr in holidays) {
            const entries = holidays[dateStr];
            if (Array.isArray(entries)) {
                entries.forEach(h => { h.isRest = false; });
            }
        }
    }

    async function processHolidayData(year, data) {
        await loadFixedFestivals();
        addLunarHolidays(year, data);
        adjustHolidays(year, data);
        return data;
    }

    async function fetchHolidaysByYear(year) {
        if (holidayCache[year]) {
            return processHolidayData(year, holidayCache[year]);
        }

        try {
            const apiResp = await fetch(`${API_URL}${year}`);
            const apiResult = await apiResp.json();
            if (apiResult && apiResult.holiday) {
                let data = buildFromApi(year, apiResult.holiday);
                data = await processHolidayData(year, data);
                holidayCache[year] = data;
                return data;
            }
        } catch (e) {}

        try {
            const jsonResp = await fetch(MANUAL_JSON_URL);
            const remoteData = await jsonResp.json();
            if (remoteData[year]) {
                let data = buildFromRemoteConfig(year, remoteData[year]);
                data = await processHolidayData(year, data);
                holidayCache[year] = data;
                return data;
            }
        } catch (e) {}

        let data = buildFallbackHolidays(year);
        data = await processHolidayData(year, data);
        holidayCache[year] = data;
        return data;
    }

    function buildFromApi(year, holidayObj) {
        const holidays = {};
        for (const [key, val] of Object.entries(holidayObj)) {
            if (!val.holiday) continue;
            const dateStr = `${year}-${key}`;
            const name = val.name;
            const actual = getActualFestivalDate(year, name);
            const isActualDay = actual && parseInt(key.split('-')[0]) === actual.month && parseInt(key.split('-')[1]) === actual.day;
            if (!holidays[dateStr]) holidays[dateStr] = [];
            holidays[dateStr].push({
                name: isActualDay ? name : '',
                isRest: true
            });
        }
        return holidays;
    }

    function buildFromRemoteConfig(year, config) {
        const holidays = {};
        for (const [name, info] of Object.entries(config)) {
            const start = info.start;
            const days = info.days;
            const actualStart = info.actual || start;
            const [sMonth, sDay] = start.split('-').map(Number);
            for (let i = 0; i < days; i++) {
                const d = new Date(year, sMonth - 1, sDay + i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                if (!holidays[dateStr]) holidays[dateStr] = [];
                const showName = (dateStr === `${year}-${actualStart}`);
                holidays[dateStr].push({
                    name: showName ? name : '',
                    isRest: true
                });
            }
        }
        return holidays;
    }

    function buildFallbackHolidays(year) {
        return {};
    }

    async function initializeHolidayData() {
        const skeleton = document.getElementById('calendarSkeleton');
        const grid = document.getElementById('calendarGrid');
        if (skeleton) skeleton.classList.remove('hidden');
        if (grid) grid.style.display = 'none';
        holidayData = await fetchHolidaysByYear(currentCalendarYear);
        renderCalendar(currentCalendarYear, currentCalendarMonth);
        renderHolidayBar(currentCalendarYear, currentCalendarMonth);
        if (skeleton) skeleton.classList.add('hidden');
        if (grid) grid.style.display = 'grid';
    }

    function solarToLunar(year, month, day) {
        try {
            const solar = Solar.fromYmd(year, month, day);
            return Lunar.fromSolar(solar).getDayInChinese();
        } catch (e) {}
        return '';
    }

    function renderCalendar(year, month) {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = firstDay - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell other-month';
            cell.innerHTML = `<div class="cell-solar">${daysInPrevMonth - i}</div>`;
            grid.appendChild(cell);
        }
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === day;
            if (isToday) cell.classList.add('today');

            let cellHTML = `<div class="cell-solar">${day}</div>`;

            const holidays = holidayData[dateStr];
            if (holidays && holidays.length > 0) {
                const restHoliday = holidays.find(h => h.isRest);
                if (restHoliday) {
                    cellHTML += `<div class="cell-rest">休</div>`;
                }
                const namedHoliday = holidays.find(h => h.name && h.name.trim() !== '');
                if (namedHoliday) {
                    cellHTML += `<div class="cell-holiday">${namedHoliday.name}</div>`;
                } else {
                    const lunarStr = solarToLunar(year, month, day);
                    if (lunarStr) cellHTML += `<div class="cell-lunar">${lunarStr}</div>`;
                }
            } else {
                const lunarStr = solarToLunar(year, month, day);
                if (lunarStr) cellHTML += `<div class="cell-lunar">${lunarStr}</div>`;
            }

            cell.innerHTML = cellHTML;
            cell.addEventListener('click', () => {
                const alreadySelected = cell.classList.contains('selected');
                document.querySelectorAll('.calendar-cell.selected').forEach(c => c.classList.remove('selected'));
                if (!alreadySelected && !cell.classList.contains('other-month')) {
                    cell.classList.add('selected');
                    selectedDate = new Date(year, month - 1, day);
                }
            });
            grid.appendChild(cell);
        }
        const totalCells = grid.children.length;
        let nextMonthDay = 1;
        while (totalCells + (nextMonthDay - 1) < 42) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell other-month';
            cell.innerHTML = `<div class="cell-solar">${nextMonthDay}</div>`;
            grid.appendChild(cell);
            nextMonthDay++;
        }
        document.getElementById('calendarTitle').textContent = `${year}年${month}月`;
    }

    function renderHolidayBar(year, month) {
        const holidayBar = document.getElementById('holidayBar');
        if (!holidayBar) return;
        holidayBar.innerHTML = '';
        const daysInMonth = new Date(year, month, 0).getDate();
        const addedNames = new Set();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const holidays = holidayData[dateStr];
            if (!holidays || holidays.length === 0) continue;
            holidays.forEach(h => {
                if (h.name && h.name.trim() !== '' && !addedNames.has(h.name)) {
                    addedNames.add(h.name);
                    const tag = document.createElement('div');
                    tag.className = 'holiday-tag';
                    tag.textContent = h.name;
                    holidayBar.appendChild(tag);
                }
            });
        }
        if (addedNames.size === 0) holidayBar.classList.add('empty');
        else holidayBar.classList.remove('empty');
    }

    document.getElementById('clockDisplay').style.display = 'flex';

    const changeMonth = (delta) => {
        if (isAnimating) return;
        isAnimating = true;
        const grid = document.getElementById('calendarGrid');
        const skeleton = document.getElementById('calendarSkeleton');
        const calendarTitle = document.getElementById('calendarTitle');

        if (grid) {
            grid.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
            grid.style.transform = 'scale(0.95)';
            grid.style.opacity = '0';
        }
        if (skeleton) skeleton.classList.remove('hidden');

        setTimeout(() => {
            currentCalendarMonth += delta;
            if (currentCalendarMonth > 12) { currentCalendarMonth = 1; currentCalendarYear++; }
            else if (currentCalendarMonth < 1) { currentCalendarMonth = 12; currentCalendarYear--; }

            (async () => {
                if (fetchLock) return;
                fetchLock = true;
                try {
                    holidayData = await fetchHolidaysByYear(currentCalendarYear);
                    renderCalendar(currentCalendarYear, currentCalendarMonth);
                    renderHolidayBar(currentCalendarYear, currentCalendarMonth);
                    if (skeleton) skeleton.classList.add('hidden');
                    if (grid) {
                        grid.style.display = 'grid';
                        grid.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
                        grid.style.transform = 'scale(1)';
                        grid.style.opacity = '1';
                    }
                    calendarTitle.textContent = `${currentCalendarYear}年${currentCalendarMonth}月`;
                } finally { fetchLock = false; }
                setTimeout(() => { isAnimating = false; }, 250);
            })();
        }, 160);
    };

    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    // 模态框逻辑
    const modalOverlay = document.getElementById('modalOverlay');
    const modalJump = document.getElementById('modalJump');
    function openModal() { modalOverlay.classList.add('show'); modalJump.classList.add('show'); }
    function closeModal() { modalOverlay.classList.remove('show'); modalJump.classList.remove('show'); }
    document.getElementById('jumpBtnHeader').addEventListener('click', openModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalConfirm').addEventListener('click', () => {
        const type = document.querySelector('input[name="calendarType"]:checked').value;
        const y = parseInt(document.getElementById('jumpYear').value, 10);
        const m = parseInt(document.getElementById('jumpMonth').value, 10);
        const d = parseInt(document.getElementById('jumpDay').value, 10);
        if (!y || !m || !d) { alert('请输入完整的年月日'); return; }
        let targetYear = y, targetMonth = m, targetDay = d;
        if (type === 'lunar' && typeof Lunar !== 'undefined') {
            try {
                const lunar = Lunar.fromYmd(y, m, d);
                const solar = lunar.getSolar();
                targetYear = solar.getYear(); targetMonth = solar.getMonth(); targetDay = solar.getDay();
            } catch (e) { alert('农历日期转换失败'); return; }
        }
        const maxDay = new Date(targetYear, targetMonth, 0).getDate();
        if (targetDay < 1 || targetDay > maxDay) { alert(`${targetMonth}月最多有${maxDay}天`); return; }
        currentCalendarYear = targetYear; currentCalendarMonth = targetMonth;
        selectedDate = new Date(targetYear, targetMonth - 1, targetDay);
        closeModal();
        const grid = document.getElementById('calendarGrid');
        const skeleton = document.getElementById('calendarSkeleton');
        if (grid) {
            grid.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
            grid.style.transform = 'scale(0.95)';
            grid.style.opacity = '0';
        }
        if (skeleton) skeleton.classList.remove('hidden');
        setTimeout(async () => {
            holidayData = await fetchHolidaysByYear(currentCalendarYear);
            renderCalendar(currentCalendarYear, currentCalendarMonth);
            renderHolidayBar(currentCalendarYear, currentCalendarMonth);
            if (skeleton) skeleton.classList.add('hidden');
            if (grid) {
                grid.style.display = 'grid';
                grid.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
                grid.style.transform = 'scale(1)';
                grid.style.opacity = '1';
            }
        }, 160);
    });
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // 启动
    loadFixedFestivals().then(() => initializeHolidayData());
})();