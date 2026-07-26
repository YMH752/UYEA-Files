/**
 * UYEA Tools Page - tools.js
 * 纯前端在线工具集（JSON / Base64 / 正则 / 时间戳 / 颜色 / UUID）
 * 所有计算在浏览器本地完成，不依赖任何后端服务
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 分类标签切换 ====================
    const tabs = document.querySelectorAll('.tab-item');
    const groups = document.querySelectorAll('.tool-group');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const cat = this.dataset.category;
            groups.forEach(g => {
                g.style.display = (cat === 'all' || g.dataset.category === cat) ? 'block' : 'none';
            });
        });
    });
    // 初始全部显示
    groups.forEach(g => { g.style.display = 'block'; });

    // ==================== 排序 + 搜索（仿论坛页） ====================
    let currentSort = 'all'; // all / az / latest
    let currentCategory = 'all';
    let toolsSearchTimer = null;

    // 收集全部工具卡片数据（扁平化）
    const allToolCards = [];
    document.querySelectorAll('#toolsGroupedView .card-item').forEach((card, index) => {
        const group = card.closest('.tool-group');
        allToolCards.push({
            el: card.cloneNode(true),
            title: card.dataset.title || card.querySelector('.card-title')?.textContent || '',
            category: group ? group.dataset.category : 'other',
            index: index
        });
    });

    function applyToolsFilter() {
        const searchInput = document.getElementById('toolsSearchInput');
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const groupedView = document.getElementById('toolsGroupedView');
        const flatView = document.getElementById('toolsFlatView');
        const flatGrid = document.getElementById('toolsFlatGrid');
        const noResults = document.getElementById('toolsNoResults');
        if (!groupedView || !flatView || !flatGrid) return;

        // 全部模式 + 无搜索 + 无分类过滤：显示分组视图
        if (currentSort === 'all' && !keyword && currentCategory === 'all') {
            groupedView.style.display = '';
            flatView.style.display = 'none';
            if (noResults) noResults.classList.remove('show');
            return;
        }

        // 全部模式 + 有分类过滤 + 无搜索：仍用分组视图（分类标签控制显示）
        if (currentSort === 'all' && !keyword && currentCategory !== 'all') {
            groupedView.style.display = '';
            flatView.style.display = 'none';
            if (noResults) noResults.classList.remove('show');
            return;
        }

        // 扁平化视图：A-Z / 最新 / 有搜索
        groupedView.style.display = 'none';
        flatView.style.display = '';

        let items = allToolCards;
        // 分类过滤
        if (currentCategory !== 'all') {
            items = items.filter(item => item.category === currentCategory);
        }
        // 搜索过滤
        if (keyword) {
            items = items.filter(item => item.title.toLowerCase().includes(keyword));
        }
        // 排序
        if (currentSort === 'az') {
            items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        } else if (currentSort === 'latest') {
            items = [...items].reverse();
        }

        flatGrid.innerHTML = items.map(item => item.el.outerHTML).join('');

        // 重新绑定扁平视图中的工具卡片点击事件
        flatGrid.querySelectorAll('[data-tool]').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                openTool(card.dataset.tool);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTool(card.dataset.tool);
                }
            });
        });

        // 重新绑定开发中功能卡片（静默处理）
        flatGrid.querySelectorAll('[data-coming-soon]').forEach(card => {
            card.addEventListener('click', (e) => { e.preventDefault(); });
        });

        if (noResults) noResults.classList.toggle('show', items.length === 0);
    }

    // 底部导航栏排序切换
    document.querySelectorAll('.bottom-nav-item[data-sort]').forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) return;
            document.querySelectorAll('.bottom-nav-item[data-sort]').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            currentSort = item.dataset.sort;
            // 清空搜索框
            const searchInput = document.getElementById('toolsSearchInput');
            if (searchInput) searchInput.value = '';
            applyToolsFilter();
        });
    });

    // 分类标签联动
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            currentCategory = this.dataset.category;
            applyToolsFilter();
        });
    });

    // 搜索过滤（防抖）
    const toolsSearchInput = document.getElementById('toolsSearchInput');
    if (toolsSearchInput) {
        toolsSearchInput.addEventListener('input', () => {
            clearTimeout(toolsSearchTimer);
            toolsSearchTimer = setTimeout(applyToolsFilter, 200);
        });
    }

    // ==================== 工具模态框管理 ====================
    const toolOverlay = document.getElementById('toolOverlay');
    const toolModal = document.getElementById('toolModal');
    const toolTitle = document.getElementById('toolModalTitle');
    const toolBody = document.getElementById('toolModalBody');
    const toolCloseBtn = document.getElementById('toolModalClose');

    let tsTimer = null; // 时间戳实时刷新定时器

    // 工具注册表：每个工具包含标题、渲染函数、初始化函数
    const toolRegistry = {
        json:      { title: 'JSON 格式化',     render: renderJson,      init: initJson },
        base64:    { title: 'Base64 编解码',   render: renderBase64,    init: initBase64 },
        regex:     { title: '正则表达式测试',   render: renderRegex,     init: initRegex },
        timestamp: { title: '时间戳转换',       render: renderTimestamp, init: initTimestamp },
        color:     { title: '颜色选择器',       render: renderColor,     init: initColor },
        uuid:      { title: 'UUID 生成器',      render: renderUuid,      init: initUuid }
    };

    function openTool(key) {
        const tool = toolRegistry[key];
        if (!tool) return;
        clearTimers();
        toolTitle.textContent = tool.title;
        toolBody.innerHTML = tool.render();
        try {
            tool.init(toolBody);
        } catch (e) {
            console.error('工具初始化失败:', e);
        }
        toolOverlay.classList.add('show');
        toolModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        // 聚焦首个可交互元素
        const firstField = toolBody.querySelector('input, textarea, select');
        if (firstField) setTimeout(() => firstField.focus(), 50);
    }

    function closeTool() {
        clearTimers();
        toolOverlay.classList.remove('show');
        toolModal.classList.remove('show');
        document.body.style.overflow = '';
        toolBody.innerHTML = '';
    }

    function clearTimers() {
        if (tsTimer) { clearInterval(tsTimer); tsTimer = null; }
    }

    // 工具卡片点击 / 键盘交互
    document.querySelectorAll('[data-tool]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            openTool(card.dataset.tool);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openTool(card.dataset.tool);
            }
        });
    });

    toolCloseBtn.addEventListener('click', closeTool);
    toolOverlay.addEventListener('click', closeTool);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toolModal.classList.contains('show')) {
            closeTool();
        }
    });

    // ==================== 通用辅助函数 ====================
    function copyText(text, btn) {
        if (text === '' || text == null) return;
        const done = () => {
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = '已复制';
                btn.disabled = true;
                setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
            }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else {
            fallbackCopy(text, done);
        }
    }

    function fallbackCopy(text, cb) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
        if (cb) cb();
    }

    function showError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
    }
    function hideError(el) {
        if (!el) return;
        el.textContent = '';
        el.classList.remove('show');
    }

    // ==================== 1. JSON 格式化 ====================
    function renderJson() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="jsonInput">输入 JSON</label>' +
                '<textarea class="tool-textarea" id="jsonInput" placeholder=\'例如: {"name":"UYEA","version":"0.3.0","tools":["json","base64"]}\'></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="jsonBeautify">格式化（美化）</button>' +
                '<button class="post-btn post-btn-secondary" id="jsonMinify">压缩（一行）</button>' +
                '<button class="post-btn post-btn-ghost" id="jsonClear">清空</button>' +
            '</div>' +
            '<div class="tool-error" id="jsonError"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="jsonOutput">输出结果</label>' +
                '<textarea class="tool-textarea" id="jsonOutput" readonly placeholder="格式化后的结果将显示在这里..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="jsonCopy">复制结果</button>' +
            '</div>';
    }
    function initJson(root) {
        const input = root.querySelector('#jsonInput');
        const output = root.querySelector('#jsonOutput');
        const error = root.querySelector('#jsonError');

        function doFormat(minify) {
            hideError(error);
            const raw = input.value.trim();
            if (!raw) { showError(error, '请输入 JSON 文本'); return; }
            try {
                const obj = JSON.parse(raw);
                output.value = minify ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
            } catch (e) {
                output.value = '';
                showError(error, 'JSON 解析失败：' + e.message);
            }
        }
        root.querySelector('#jsonBeautify').addEventListener('click', () => doFormat(false));
        root.querySelector('#jsonMinify').addEventListener('click', () => doFormat(true));
        root.querySelector('#jsonClear').addEventListener('click', () => {
            input.value = ''; output.value = ''; hideError(error); input.focus();
        });
        root.querySelector('#jsonCopy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
    }

    // ==================== 2. Base64 编解码 ====================
    function renderBase64() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label">操作模式</label>' +
                '<div class="tool-row">' +
                    '<label class="tool-checkbox"><input type="radio" name="b64mode" value="encode" checked> 编码（文本 → Base64）</label>' +
                    '<label class="tool-checkbox"><input type="radio" name="b64mode" value="decode"> 解码（Base64 → 文本）</label>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="b64Input">输入</label>' +
                '<textarea class="tool-textarea" id="b64Input" placeholder="输入文本或 Base64 字符串（支持中文 UTF-8）..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="b64Run">执行</button>' +
                '<button class="post-btn post-btn-ghost" id="b64Swap">↑↓ 结果转输入</button>' +
                '<button class="post-btn post-btn-ghost" id="b64Clear">清空</button>' +
            '</div>' +
            '<div class="tool-error" id="b64Error"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="b64Output">输出</label>' +
                '<textarea class="tool-textarea" id="b64Output" readonly placeholder="编解码结果..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="b64Copy">复制结果</button>' +
            '</div>';
    }
    function initBase64(root) {
        const input = root.querySelector('#b64Input');
        const output = root.querySelector('#b64Output');
        const error = root.querySelector('#b64Error');

        function getMode() {
            const checked = root.querySelector('input[name="b64mode"]:checked');
            return checked ? checked.value : 'encode';
        }
        function run() {
            hideError(error);
            const raw = input.value;
            if (!raw) { showError(error, '请输入内容'); return; }
            try {
                output.value = getMode() === 'encode' ? utf8ToBase64(raw) : base64ToUtf8(raw.trim());
            } catch (e) {
                output.value = '';
                showError(error, '转换失败：' + e.message + '（解码时请确认输入为合法 Base64）');
            }
        }
        root.querySelector('#b64Run').addEventListener('click', run);
        root.querySelector('#b64Swap').addEventListener('click', () => {
            if (output.value) { input.value = output.value; output.value = ''; hideError(error); input.focus(); }
        });
        root.querySelector('#b64Clear').addEventListener('click', () => {
            input.value = ''; output.value = ''; hideError(error); input.focus();
        });
        root.querySelector('#b64Copy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
    }
    // UTF-8 安全的 Base64 编解码
    function utf8ToBase64(str) {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }
    function base64ToUtf8(b64) {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    // ==================== 3. 正则表达式测试 ====================
    function renderRegex() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="regexPattern">正则表达式</label>' +
                '<div class="tool-row">' +
                    '<span class="tool-prefix">/</span>' +
                    '<input type="text" class="tool-input" id="regexPattern" placeholder="例如 \\d+ 匹配数字" style="flex:1;min-width:120px">' +
                    '<span class="tool-prefix">/</span>' +
                    '<input type="text" class="tool-input" id="regexFlags" placeholder="标志" style="width:80px" value="g">' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="regexText">测试文本</label>' +
                '<textarea class="tool-textarea" id="regexText" placeholder="输入要匹配的文本..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="regexTest">执行测试</button>' +
                '<button class="post-btn post-btn-ghost" id="regexClear">清空</button>' +
            '</div>' +
            '<div class="tool-error" id="regexError"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label">高亮匹配</label>' +
                '<div class="tool-result-box tool-regex-highlight" id="regexHighlight">（结果将显示在这里）</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label">匹配详情</label>' +
                '<div class="tool-result-box" id="regexMatches" style="white-space:normal">—</div>' +
            '</div>';
    }
    function initRegex(root) {
        const patternEl = root.querySelector('#regexPattern');
        const flagsEl = root.querySelector('#regexFlags');
        const textEl = root.querySelector('#regexText');
        const highlight = root.querySelector('#regexHighlight');
        const matchesBox = root.querySelector('#regexMatches');
        const error = root.querySelector('#regexError');

        function escapeHtml(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function run() {
            hideError(error);
            const patternStr = patternEl.value;
            const flags = flagsEl.value;
            const text = textEl.value;
            if (!patternStr) { showError(error, '请输入正则表达式'); return; }
            if (!text) { showError(error, '请输入测试文本'); return; }

            let re;
            try {
                re = new RegExp(patternStr, flags);
            } catch (e) {
                showError(error, '正则表达式语法错误：' + e.message);
                highlight.innerHTML = '（结果将显示在这里）';
                matchesBox.innerHTML = '—';
                return;
            }

            // 收集所有匹配
            const matches = [];
            if (flags.indexOf('g') !== -1) {
                let m;
                let safety = 0;
                while ((m = re.exec(text)) !== null && safety++ < 100000) {
                    matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
                    if (m[0] === '') re.lastIndex++; // 避免零宽匹配死循环
                }
            } else {
                const m = re.exec(text);
                if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
            }

            // 高亮匹配
            if (matches.length === 0) {
                highlight.innerHTML = escapeHtml(text) + '<br><span style="color:var(--text-muted)">（无匹配）</span>';
                matchesBox.innerHTML = '<span style="color:var(--text-muted)">无匹配项</span>';
                return;
            }

            let html = '';
            let last = 0;
            matches.forEach(m => {
                html += escapeHtml(text.slice(last, m.index));
                html += '<mark>' + escapeHtml(m.match) + '</mark>';
                last = m.index + m.match.length;
            });
            html += escapeHtml(text.slice(last));
            highlight.innerHTML = html;

            // 匹配详情
            let detail = '<div style="margin-bottom:6px;font-weight:600;color:var(--primary)">共 ' + matches.length + ' 处匹配</div>';
            matches.forEach((m, i) => {
                let line = '<div class="tool-match-item"><span class="group-label">#' + (i + 1) + ' [pos:' + m.index + ']</span> ' + escapeHtml(m.match);
                if (m.groups && m.groups.length > 0) {
                    m.groups.forEach((g, gi) => {
                        line += '<br><span class="group-label">组' + (gi + 1) + ':</span> ' + (g !== undefined ? escapeHtml(g) : '(undefined)');
                    });
                }
                line += '</div>';
                detail += line;
            });
            matchesBox.innerHTML = detail;
        }
        root.querySelector('#regexTest').addEventListener('click', run);
        root.querySelector('#regexClear').addEventListener('click', () => {
            patternEl.value = ''; flagsEl.value = 'g'; textEl.value = '';
            hideError(error);
            highlight.innerHTML = '（结果将显示在这里）';
            matchesBox.innerHTML = '—';
            patternEl.focus();
        });
    }

    // ==================== 4. 时间戳转换 ====================
    function renderTimestamp() {
        return '' +
            '<div class="tool-info-bar">' +
                '<span>当前时间戳：</span>' +
                '<span class="tool-ts-current" id="tsNowSec">—</span><span>秒</span>' +
                '<span style="color:var(--accent-4)">｜</span>' +
                '<span class="tool-ts-current" id="tsNowMs">—</span><span>毫秒</span>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label">时间戳 → 日期</label>' +
                '<div class="tool-row">' +
                    '<input type="text" class="tool-input" id="tsInput" placeholder="如 1690000000" style="flex:1;min-width:140px">' +
                    '<select class="tool-select" id="tsUnit">' +
                        '<option value="s">秒</option>' +
                        '<option value="ms">毫秒</option>' +
                    '</select>' +
                    '<button class="post-btn" id="tsToDate">转换</button>' +
                '</div>' +
                '<div class="tool-result-box" id="tsDateResult" style="margin-top:8px">—</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label">日期 → 时间戳</label>' +
                '<div class="tool-row">' +
                    '<input type="datetime-local" class="tool-input" id="tsDateInput" style="flex:1;min-width:160px">' +
                    '<button class="post-btn" id="tsToTs">转换</button>' +
                    '<button class="post-btn post-btn-ghost" id="tsNow">取当前</button>' +
                '</div>' +
                '<div class="tool-result-box" id="tsTsResult" style="margin-top:8px">秒：— ｜ 毫秒：—</div>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="tsCopySec">复制秒级时间戳</button>' +
                '<button class="post-btn post-btn-secondary" id="tsCopyMs">复制毫秒时间戳</button>' +
            '</div>';
    }
    function initTimestamp(root) {
        const nowSec = root.querySelector('#tsNowSec');
        const nowMs = root.querySelector('#tsNowMs');
        const tsInput = root.querySelector('#tsInput');
        const tsUnit = root.querySelector('#tsUnit');
        const tsDateResult = root.querySelector('#tsDateResult');
        const tsDateInput = root.querySelector('#tsDateInput');
        const tsTsResult = root.querySelector('#tsTsResult');

        function pad(n) { return String(n).padStart(2, '0'); }
        const WEEK = '日一二三四五六';
        function formatDate(d) {
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
                ' （星期' + WEEK[d.getDay()] + '）';
        }
        function toLocalInput(d) {
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        }
        function tzLabel(d) {
            const off = d.getTimezoneOffset(); // 分钟，东区为负
            const sign = off <= 0 ? '+' : '-';
            const hh = pad(Math.floor(Math.abs(off) / 60));
            const mm = pad(Math.abs(off) % 60);
            return 'UTC' + sign + hh + (mm !== '00' ? ':' + mm : '');
        }

        // 实时刷新当前时间戳
        function updateNow() {
            const now = Date.now();
            nowMs.textContent = now;
            nowSec.textContent = Math.floor(now / 1000);
        }
        updateNow();
        tsTimer = setInterval(updateNow, 1000);

        // 时间戳 → 日期
        root.querySelector('#tsToDate').addEventListener('click', () => {
            const raw = tsInput.value.trim();
            if (!raw || isNaN(Number(raw))) {
                tsDateResult.textContent = '请输入有效的数字时间戳';
                tsDateResult.style.color = '#DC2626';
                return;
            }
            let ms = Number(raw);
            if (tsUnit.value === 's') ms = ms * 1000;
            const d = new Date(ms);
            if (isNaN(d.getTime())) {
                tsDateResult.textContent = '时间戳无效';
                tsDateResult.style.color = '#DC2626';
                return;
            }
            tsDateResult.style.color = '';
            tsDateResult.textContent = formatDate(d) + '  (' + tzLabel(d) + ')';
        });

        // 日期 → 时间戳
        function dateToTs() {
            const val = tsDateInput.value;
            if (!val) {
                tsTsResult.textContent = '请选择日期时间';
                tsTsResult.style.color = '#DC2626';
                return;
            }
            const d = new Date(val);
            if (isNaN(d.getTime())) {
                tsTsResult.textContent = '日期无效';
                tsTsResult.style.color = '#DC2626';
                return;
            }
            tsTsResult.style.color = '';
            const s = Math.floor(d.getTime() / 1000);
            const ms = d.getTime();
            tsTsResult.textContent = '秒：' + s + '  ｜  毫秒：' + ms;
            tsTsResult.dataset.sec = s;
            tsTsResult.dataset.ms = ms;
        }
        root.querySelector('#tsToTs').addEventListener('click', dateToTs);
        root.querySelector('#tsNow').addEventListener('click', () => {
            tsDateInput.value = toLocalInput(new Date());
            dateToTs();
        });

        root.querySelector('#tsCopySec').addEventListener('click', (e) => {
            const s = tsTsResult.dataset.sec || nowSec.textContent;
            copyText(s, e.currentTarget);
        });
        root.querySelector('#tsCopyMs').addEventListener('click', (e) => {
            const m = tsTsResult.dataset.ms || nowMs.textContent;
            copyText(m, e.currentTarget);
        });

        // 初始日期输入为当前时间
        tsDateInput.value = toLocalInput(new Date());
    }

    // ==================== 5. 颜色选择器 ====================
    function renderColor() {
        return '' +
            '<div class="tool-color-preview" id="colorPreview" style="background:#2563EB"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="colorPicker">选择颜色</label>' +
                '<input type="color" class="tool-color-picker" id="colorPicker" value="#2563EB">' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="colorHex">HEX</label>' +
                '<div class="tool-row">' +
                    '<input type="text" class="tool-input" id="colorHex" value="#2563EB" style="flex:1;min-width:120px;text-transform:uppercase">' +
                    '<button class="post-btn post-btn-secondary" data-copy-target="colorHex">复制</button>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="colorRgb">RGB</label>' +
                '<div class="tool-row">' +
                    '<input type="text" class="tool-input" id="colorRgb" value="rgb(37, 99, 235)" style="flex:1;min-width:120px">' +
                    '<button class="post-btn post-btn-secondary" data-copy-target="colorRgb">复制</button>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="colorHsl">HSL</label>' +
                '<div class="tool-row">' +
                    '<input type="text" class="tool-input" id="colorHsl" value="hsl(221, 83%, 53%)" style="flex:1;min-width:120px">' +
                    '<button class="post-btn post-btn-secondary" data-copy-target="colorHsl">复制</button>' +
                '</div>' +
            '</div>';
    }
    function initColor(root) {
        const picker = root.querySelector('#colorPicker');
        const preview = root.querySelector('#colorPreview');
        const hexEl = root.querySelector('#colorHex');
        const rgbEl = root.querySelector('#colorRgb');
        const hslEl = root.querySelector('#colorHsl');

        function hexToRgb(hex) {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
            const num = parseInt(h, 16);
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        }
        function rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        }
        function rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0;
            const l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                    case g: h = ((b - r) / d + 2); break;
                    case b: h = ((r - g) / d + 4); break;
                }
                h *= 60;
            }
            return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
        }
        function hslToRgb(h, s, l) {
            h /= 360; s /= 100; l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
        }
        function updateAll(hex, source) {
            const rgb = hexToRgb(hex);
            if (!rgb) return;
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            if (source !== 'hex') hexEl.value = hex.toUpperCase();
            if (source !== 'rgb') rgbEl.value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
            if (source !== 'hsl') hslEl.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
            preview.style.background = hex;
            picker.value = hex.toLowerCase();
        }

        picker.addEventListener('input', () => updateAll(picker.value));

        // HEX 输入框编辑
        hexEl.addEventListener('change', () => {
            let v = hexEl.value.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (hexToRgb(v)) updateAll(v, 'hex');
            else updateAll(picker.value);
        });
        // RGB 输入框编辑
        rgbEl.addEventListener('change', () => {
            const m = rgbEl.value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (m) {
                const r = Math.min(255, Math.max(0, parseInt(m[1], 10)));
                const g = Math.min(255, Math.max(0, parseInt(m[2], 10)));
                const b = Math.min(255, Math.max(0, parseInt(m[3], 10)));
                updateAll(rgbToHex(r, g, b), 'rgb');
            } else { updateAll(picker.value); }
        });
        // HSL 输入框编辑
        hslEl.addEventListener('change', () => {
            const m = hslEl.value.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
            if (m) {
                const rgb = hslToRgb(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
                updateAll(rgbToHex(rgb.r, rgb.g, rgb.b), 'hsl');
            } else { updateAll(picker.value); }
        });

        // 复制按钮
        root.querySelectorAll('[data-copy-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = root.querySelector('#' + btn.dataset.copyTarget);
                if (target && target.value) copyText(target.value, e.currentTarget);
            });
        });
    }

    // ==================== 6. UUID 生成器 ====================
    function renderUuid() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="uuidCount">生成数量</label>' +
                '<div class="tool-row">' +
                    '<input type="number" class="tool-input" id="uuidCount" value="5" min="1" max="500" style="width:90px">' +
                    '<label class="tool-checkbox"><input type="checkbox" id="uuidUpper"> 大写</label>' +
                    '<label class="tool-checkbox"><input type="checkbox" id="uuidHyphen" checked> 含连字符</label>' +
                    '<button class="post-btn" id="uuidGen">生成</button>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="uuidOutput">UUID 列表（v4）</label>' +
                '<textarea class="tool-textarea" id="uuidOutput" readonly style="min-height:220px" placeholder="点击「生成」按钮..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="uuidCopy">复制全部</button>' +
                '<button class="post-btn post-btn-ghost" id="uuidClear">清空</button>' +
            '</div>';
    }
    function initUuid(root) {
        const countEl = root.querySelector('#uuidCount');
        const upperEl = root.querySelector('#uuidUpper');
        const hyphenEl = root.querySelector('#uuidHyphen');
        const output = root.querySelector('#uuidOutput');

        function uuidv4() {
            // 优先使用原生 API（需安全上下文）
            if (window.crypto && window.crypto.randomUUID) {
                return window.crypto.randomUUID();
            }
            // 回退方案：基于 crypto.getRandomValues
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = (window.crypto && window.crypto.getRandomValues)
                    ? window.crypto.getRandomValues(new Uint8Array(1))[0] % 16
                    : Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        function generate() {
            let n = parseInt(countEl.value, 10);
            if (isNaN(n) || n < 1) n = 1;
            if (n > 500) n = 500;
            countEl.value = n;
            const list = [];
            for (let i = 0; i < n; i++) {
                let id = uuidv4();
                if (!hyphenEl.checked) id = id.replace(/-/g, '');
                if (upperEl.checked) id = id.toUpperCase();
                list.push(id);
            }
            output.value = list.join('\n');
        }
        root.querySelector('#uuidGen').addEventListener('click', generate);
        root.querySelector('#uuidClear').addEventListener('click', () => { output.value = ''; });
        root.querySelector('#uuidCopy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
        // 首次自动生成
        generate();
    }
});
