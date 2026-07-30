/**
 * UYEA Tools Page - tools.js
 * 纯前端在线工具集（JSON / Base64 / 正则 / 时间戳 / 颜色 / UUID）
 * 所有计算在浏览器本地完成，不依赖任何后端服务
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 引用共享工具函数（含守卫，防止 utils.js 加载失败时模块静默崩溃）
    if (!window.UYEA_UTILS) {
        console.error('[tools] UYEA_UTILS 未加载，工具模块初始化失败');
        return;
    }
    const { getGridColumns, escapeHtml } = window.UYEA_UTILS;

    // ==================== 工具卡片数据（替代 index.html 静态卡片） ====================
    const TOOLS_DATA = [
        {
            category: 'dev',
            titleKey: 'section.dev',
            defaultTitle: '开发者工具',
            tools: [
                { title: 'JSON 格式化', tool: 'json' },
                { title: 'Base64 编解码', tool: 'base64' },
                { title: 'URL 编解码', tool: 'url' },
                { title: '哈希生成', tool: 'hash' },
                { title: '正则表达式测试', tool: 'regex' },
                { title: '时间戳转换', tool: 'timestamp' },
                { title: 'JWT 解码', comingSoon: true },
                { title: 'Cron 表达式', comingSoon: true },
                { title: 'HTML 转义', comingSoon: true },
                { title: 'Hex 编解码', comingSoon: true },
                { title: 'SQL 格式化', comingSoon: true },
                { title: 'HTTP 状态码', comingSoon: true },
                { title: '代码对比', comingSoon: true },
                { title: 'XML 格式化', comingSoon: true },
                { title: 'MIME 类型', comingSoon: true },
                { title: 'User-Agent 解析', comingSoon: true },
                { title: 'YAML 转换', comingSoon: true },
                { title: 'JSONPath 查询', comingSoon: true },
                { title: 'CSS 压缩', comingSoon: true },
                { title: 'JS 压缩', comingSoon: true },
                { title: 'HTML 美化', comingSoon: true },
                { title: '代码混淆', comingSoon: true },
                { title: 'ASCII 艺术字', comingSoon: true },
                { title: 'Lorem Ipsum', comingSoon: true }
            ]
        },
        {
            category: 'text',
            titleKey: 'section.text',
            defaultTitle: '文本工具',
            tools: [
                { title: '字数统计', tool: 'wordcount' },
                { title: '文本对比', comingSoon: true },
                { title: '大小写转换', comingSoon: true },
                { title: '文本去重', comingSoon: true },
                { title: '文本反转', comingSoon: true },
                { title: '繁简转换', comingSoon: true },
                { title: '拼音转换', comingSoon: true },
                { title: '字符替换', comingSoon: true },
                { title: '行排序', comingSoon: true },
                { title: '进制转换', comingSoon: true },
                { title: '文本加密', comingSoon: true },
                { title: '文本转语音', comingSoon: true },
                { title: '文本脱敏', comingSoon: true },
                { title: '随机文本', comingSoon: true },
                { title: '文本分行', comingSoon: true },
                { title: '空格删除', comingSoon: true },
                { title: '全角半角转换', comingSoon: true },
                { title: 'Markdown 预览', comingSoon: true },
                { title: '文本拼接', comingSoon: true },
                { title: '文本截取', comingSoon: true },
                { title: '关键词提取', comingSoon: true },
                { title: '文本摘要', comingSoon: true },
                { title: '字频统计', comingSoon: true },
                { title: '文本 Diff', comingSoon: true }
            ]
        },
        {
            category: 'design',
            titleKey: 'section.design',
            defaultTitle: '设计美化',
            tools: [
                { title: '颜色选择器', tool: 'color' },
                { title: 'CSS 渐变生成', comingSoon: true },
                { title: '阴影生成器', comingSoon: true },
                { title: 'SVG 优化', comingSoon: true },
                { title: '屏幕取色器', comingSoon: true },
                { title: '调色板生成', comingSoon: true },
                { title: '字体预览', comingSoon: true },
                { title: '圆角生成器', comingSoon: true },
                { title: 'Favicon 生成', comingSoon: true },
                { title: '图片转 Base64', comingSoon: true },
                { title: 'CSS 单位转换', comingSoon: true },
                { title: '渐变色卡', comingSoon: true },
                { title: '图片占位符', comingSoon: true },
                { title: '按钮生成器', comingSoon: true },
                { title: 'CSS 动画生成', comingSoon: true },
                { title: '网格生成器', comingSoon: true },
                { title: '渐变文字', comingSoon: true },
                { title: '边框生成器', comingSoon: true },
                { title: '贝塞尔曲线', comingSoon: true },
                { title: '响应式预览', comingSoon: true },
                { title: '色值转换', comingSoon: true },
                { title: '配色方案', comingSoon: true }
            ]
        },
        {
            category: 'gen',
            titleKey: 'section.gen',
            defaultTitle: '生成工具',
            tools: [
                { title: 'UUID 生成器', tool: 'uuid' },
                { title: '随机密码生成', tool: 'password' },
                { title: '二维码生成', comingSoon: true },
                { title: '条形码生成', comingSoon: true },
                { title: '验证码生成', comingSoon: true },
                { title: 'Lorem 占位文本', comingSoon: true },
                { title: '名字生成', comingSoon: true },
                { title: 'IP 地址生成', comingSoon: true },
                { title: '颜色生成', comingSoon: true },
                { title: '数字序列生成', comingSoon: true },
                { title: '邮箱生成', comingSoon: true },
                { title: '手机号生成', comingSoon: true },
                { title: '时间生成', comingSoon: true },
                { title: '字符串生成', comingSoon: true },
                { title: 'GUID 生成', comingSoon: true },
                { title: '雪花 ID 生成', comingSoon: true },
                { title: '密钥生成', comingSoon: true },
                { title: '证书生成', comingSoon: true },
                { title: '身份证生成', comingSoon: true },
                { title: '地址生成', comingSoon: true },
                { title: '像素画生成', comingSoon: true }
            ]
        },
        {
            category: 'convert',
            titleKey: 'section.convert',
            defaultTitle: '转换工具',
            tools: [
                { title: 'PDF 转 Word', comingSoon: true },
                { title: 'Markdown 编辑器', comingSoon: true },
                { title: '文档格式转换', comingSoon: true },
                { title: '表格生成', comingSoon: true },
                { title: '思维导图', comingSoon: true },
                { title: 'CSV 转 JSON', comingSoon: true },
                { title: 'JSON 转 CSV', comingSoon: true },
                { title: 'Excel 转 JSON', comingSoon: true },
                { title: 'HTML 转 Markdown', comingSoon: true },
                { title: 'YAML 转 JSON', comingSoon: true },
                { title: 'XML 转 JSON', comingSoon: true },
                { title: '流程图绘制', comingSoon: true },
                { title: 'JSON 转 XML', comingSoon: true },
                { title: 'JSON 转 YAML', comingSoon: true },
                { title: 'HTML 转文本', comingSoon: true },
                { title: 'BBCode 转 HTML', comingSoon: true },
                { title: 'PDF 转 HTML', comingSoon: true },
                { title: 'Word 转 PDF', comingSoon: true },
                { title: '图片转 PDF', comingSoon: true },
                { title: 'PDF 合并', comingSoon: true },
                { title: 'PDF 拆分', comingSoon: true }
            ]
        },
        {
            category: 'net',
            titleKey: 'section.net',
            defaultTitle: '网络工具',
            tools: [
                { title: 'IP 查询', comingSoon: true },
                { title: 'DNS 查询', comingSoon: true },
                { title: '域名 Whois', comingSoon: true },
                { title: 'HTTP 请求测试', comingSoon: true },
                { title: '端口扫描', comingSoon: true },
                { title: '网速测试', comingSoon: true },
                { title: 'SSL 检测', comingSoon: true },
                { title: '短链生成', comingSoon: true },
                { title: '子网计算', comingSoon: true },
                { title: 'MAC 地址查询', comingSoon: true },
                { title: '路由追踪', comingSoon: true },
                { title: 'Ping 测试', comingSoon: true },
                { title: 'Header 查看', comingSoon: true },
                { title: 'WebSocket 测试', comingSoon: true },
                { title: 'Cookie 编辑', comingSoon: true },
                { title: '端口转发', comingSoon: true },
                { title: 'IP 归属地', comingSoon: true },
                { title: '域名解析', comingSoon: true },
                { title: 'CDN 检测', comingSoon: true },
                { title: '网站测速', comingSoon: true }
            ]
        },
        {
            category: 'office',
            titleKey: 'section.office',
            defaultTitle: '办公效率',
            tools: [
                { title: '日历生成', comingSoon: true },
                { title: '倒计时器', comingSoon: true },
                { title: '计算器', comingSoon: true },
                { title: '单位换算', comingSoon: true },
                { title: '汇率转换', comingSoon: true },
                { title: '世界时钟', comingSoon: true },
                { title: '番茄钟', comingSoon: true },
                { title: '备忘录', comingSoon: true },
                { title: '排班表', comingSoon: true },
                { title: '扫描计数', comingSoon: true },
                { title: '名片识别', comingSoon: true },
                { title: '发票识别', comingSoon: true },
                { title: '文字识别 OCR', comingSoon: true },
                { title: '翻译工具', comingSoon: true },
                { title: '计数器', comingSoon: true },
                { title: '批量重命名', comingSoon: true },
                { title: '电子签名', comingSoon: true },
                { title: '文档加密', comingSoon: true },
                { title: '日程管理', comingSoon: true },
                { title: '会议记录', comingSoon: true }
            ]
        },
        {
            category: 'media',
            titleKey: 'section.media',
            defaultTitle: '多媒体处理',
            tools: [
                { title: '图片压缩', comingSoon: true },
                { title: '视频转 GIF', comingSoon: true },
                { title: '图片格式转换', comingSoon: true },
                { title: '图片裁剪', comingSoon: true },
                { title: '音频转换', comingSoon: true },
                { title: '图片加水印', comingSoon: true },
                { title: '图片旋转', comingSoon: true },
                { title: '图片拼接', comingSoon: true },
                { title: '音频剪辑', comingSoon: true },
                { title: '视频剪辑', comingSoon: true },
                { title: '图片滤镜', comingSoon: true },
                { title: '图片缩放', comingSoon: true },
                { title: 'GIF 制作', comingSoon: true },
                { title: '音频提取', comingSoon: true },
                { title: '视频压缩', comingSoon: true },
                { title: '图片转 PDF', comingSoon: true },
                { title: '图片文字识别', comingSoon: true },
                { title: '视频转码', comingSoon: true },
                { title: '图片去背景', comingSoon: true },
                { title: '音频混音', comingSoon: true }
            ]
        }
    ];

    // 渲染工具卡片到各分类的 .grid-container，并在末尾追加"添加工具"按钮
    function renderToolsCards() {
        TOOLS_DATA.forEach(group => {
            const groupEl = document.querySelector('#toolsView .tool-group[data-category="' + group.category + '"]');
            if (!groupEl) return;
            const grid = groupEl.querySelector('.grid-container');
            if (!grid) return;
            const html = group.tools.map(tool => {
                if (tool.comingSoon) {
                    return '<a class="card-item" role="button" tabindex="0" data-coming-soon="' + escapeHtml(tool.title) + '" data-title="' + escapeHtml(tool.title) + '" title="' + escapeHtml(tool.title) + '"><div class="card-info"><div class="card-title">' + escapeHtml(tool.title) + '</div></div></a>';
                }
                return '<a class="card-item" role="button" tabindex="0" data-tool="' + escapeHtml(tool.tool) + '" data-title="' + escapeHtml(tool.title) + '" title="' + escapeHtml(tool.title) + '"><div class="card-info"><div class="card-title">' + escapeHtml(tool.title) + '</div></div></a>';
            }).join('');
            const addCardHtml = '<button class="add-card" data-category="' + group.category + '" data-i18n-title="tools.addTool" title="添加工具"><div class="card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div><div class="add-card-title" data-i18n="tools.addTool">添加工具</div></button>';
            grid.innerHTML = html + addCardHtml;
        });
    }

    // 先渲染工具卡片，确保后续 add-card 事件绑定能找到动态生成的按钮
    renderToolsCards();

    // ==================== 分类筛选 + 2行限制 ====================
    let currentCategory = 'all';

    function applyToolsFilter() {
        const noResults = document.getElementById('toolsNoResults');
        let visibleCount = 0;

        // "全部"视图时，限制每分类最多显示2行
        const isLimited = (currentCategory === 'all');

        // 收集所有分组的可见卡片，先批量禁用动画，循环结束后统一触发一次全局 reflow
        const groupsWithVisibleCards = [];

        document.querySelectorAll('#toolsView .tool-group').forEach(group => {
            const groupCat = group.dataset.category;
            // 分类过滤
            if (currentCategory !== 'all' && groupCat !== currentCategory) {
                group.style.display = 'none';
                return;
            }

            // 先显示 group，修复切换分类后 display:none 导致 grid.clientWidth=0 的 BUG
            group.style.display = '';

            const cards = group.querySelectorAll('.card-item');
            const grid = group.querySelector('.grid-container');

            // 先显示所有卡片，修复上一轮筛选隐藏 cards[0] 导致 getBoundingClientRect().width=0 的 BUG
            cards.forEach(c => { c.style.display = ''; });

            // 2行限制：计算当前列数，最多显示 columns*2 张卡片
            let maxVisible = Infinity;
            if (isLimited && grid && cards.length > 0) {
                const columns = getGridColumns(grid, cards);
                maxVisible = columns * 2;
            }

            // 2行限制
            let groupVisible = 0;
            cards.forEach(card => {
                const withinLimit = groupVisible < maxVisible;
                const show = withinLimit || !isLimited;
                card.style.display = show ? '' : 'none';
                if (show) groupVisible++;
            });

            // 该分组无可见卡片则隐藏整个分组
            group.style.display = (groupVisible > 0) ? '' : 'none';
            visibleCount += groupVisible;

            // 收集可见卡片并禁用动画（暂不触发 reflow，等所有分组处理完后统一回流）
            const visibleCards = [];
            cards.forEach(card => {
                if (card.style.display !== 'none') {
                    card.style.animation = 'none';
                    visibleCards.push(card);
                }
            });
            if (visibleCards.length > 0) {
                groupsWithVisibleCards.push(visibleCards);
            }
        });

        // 全局单次 reflow：所有分组的动画都已被禁用，此处统一触发一次回流，避免每个分组各回流一次
        if (groupsWithVisibleCards.length > 0) {
            void document.body.offsetHeight;
            // 重新启用动画，每组使用各自的 idx 实现错峰
            groupsWithVisibleCards.forEach(visibleCards => {
                visibleCards.forEach((card, idx) => {
                    card.style.animation = `cardSwitchIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(idx * 0.025, 0.3)}s both`;
                });
            });
        }

        if (noResults) noResults.classList.toggle('show', visibleCount === 0);

        // "更多"按钮只在"全部"视图显示，切到具体分类时隐藏
        const showMoreBtns = (currentCategory === 'all');
        document.querySelectorAll('#toolsView .more-btn[data-target-category]').forEach(btn => {
            btn.style.display = showMoreBtns ? '' : 'none';
        });

        // 加号按钮只在具体分类视图显示，"全部"视图隐藏
        const showAddCards = (currentCategory !== 'all');
        document.querySelectorAll('#toolsView .add-card').forEach(btn => {
            btn.style.display = showAddCards ? '' : 'none';
        });
    }

    // ==================== 底部导航栏分类切换（事件委托） ====================
    // 使用事件委托绑定在持久的 #bottomNav 容器上，避免每次视图切换重新绑定
    // 工具页与导航页都使用 data-category，通过 currentView 区分当前激活视图
    const toolsBottomNav = document.getElementById('bottomNav');
    if (toolsBottomNav) {
        toolsBottomNav.addEventListener('click', (e) => {
            if (currentView !== 'tools') return;
            const item = e.target.closest('.bottom-nav-item[data-category]');
            if (!item || item.classList.contains('active')) return;
            toolsBottomNav.querySelectorAll('.bottom-nav-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
            applyToolsFilter();
        });
    }

    // "更多"按钮只需绑定一次（静态HTML不会随视图切换重建）
    document.querySelectorAll('#toolsView .more-btn[data-target-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetCat = btn.dataset.targetCategory;
            // 使用 dataset 比较而非字符串拼接选择器，防止 targetCat 含特殊字符导致注入
            const targetNavBtn = Array.from(document.querySelectorAll('#bottomNav .bottom-nav-item[data-category]'))
                .find(c => c.dataset.category === targetCat);
            if (targetNavBtn) {
                targetNavBtn.click();
            }
        });
    });

    // 窗口大小变化时重新计算2行限制（仅在工具视图激活时，防抖复用 utils.debounce）
    window.addEventListener('resize', UYEA_UTILS.debounce(function () {
        const toolsView = document.getElementById('toolsView');
        if (!toolsView || toolsView.style.display === 'none') return;
        applyToolsFilter();
    }, 200));

    // 监听视图切换：切换到工具视图时恢复分类状态并重新应用筛选
    window.addEventListener('viewchange', (e) => {
        if (e.detail.view !== 'tools') return;
        // 切换视图时统一重置为第一个分类（全部），不保留历史位置
        currentCategory = 'all';
        // 底部导航HTML已默认第一项active，无需额外操作
        // 重新应用筛选（视图从隐藏变可见，需重新计算布局）
        setTimeout(() => {
            applyToolsFilter();
            if (typeof window.scrollBottomNavToActive === 'function') window.scrollBottomNavToActive();
        }, 50);
    });
    // 通知加载动画：工具模块已就绪
    window.dispatchEvent(new CustomEvent('uyea:moduleReady', { detail: { module: 'tools' } }));

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
        url:       { title: 'URL 编解码',      render: renderUrl,       init: initUrl },
        hash:      { title: '哈希生成',         render: renderHash,      init: initHash },
        regex:     { title: '正则表达式测试',   render: renderRegex,     init: initRegex },
        timestamp: { title: '时间戳转换',       render: renderTimestamp, init: initTimestamp },
        color:     { title: '颜色选择器',       render: renderColor,     init: initColor },
        uuid:      { title: 'UUID 生成器',      render: renderUuid,      init: initUuid },
        wordcount: { title: '字数统计',         render: renderWordCount, init: initWordCount },
        password:  { title: '随机密码生成',     render: renderPassword,  init: initPassword }
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
            toolBody.innerHTML = '<div class="tool-error show" style="padding:20px;text-align:center;color:var(--text-muted)">工具加载失败，请刷新页面重试</div>';
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

    // 视图切换离开工具页时关闭工具模态框，清理定时器
    window.addEventListener('viewchange', (e) => {
        if (e.detail && e.detail.view !== 'tools') {
            closeTool();
        }
    });

    // 工具卡片点击 / 键盘交互（事件委托，避免逐个绑定）
    // 委托在持久容器上，动态插入的卡片也自动生效
    const toolsContainer = document.querySelector('#toolsGroupedView') || document.getElementById('toolsView');
    if (toolsContainer) {
        toolsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.card-item');
            if (!card) return;
            // data-coming-soon 卡片：仅阻止默认行为，不打开工具
            if (card.hasAttribute('data-coming-soon')) {
                e.preventDefault();
                return;
            }
            const toolKey = card.dataset.tool;
            if (!toolKey) return;
            e.preventDefault();
            openTool(toolKey);
        });
        toolsContainer.addEventListener('keydown', (e) => {
            const card = e.target.closest('.card-item');
            if (!card) return;
            if (e.key !== 'Enter' && e.key !== ' ') return;
            // data-coming-soon 卡片：仅阻止默认行为
            if (card.hasAttribute('data-coming-soon')) {
                e.preventDefault();
                return;
            }
            const toolKey = card.dataset.tool;
            if (!toolKey) return;
            e.preventDefault();
            openTool(toolKey);
        });
    }

    // 添加工具按钮：显示成就式提示弹窗
    document.querySelectorAll('#toolsView .add-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showAchievement === 'function') {
                const msgs = UYEA_CONFIG.i18n[window.currentLang] || UYEA_CONFIG.i18n[UYEA_CONFIG.defaultLanguage];
                window.showAchievement(msgs['toast.comingSoon'] || '正在完善中', msgs['toast.addTool'] || '添加工具功能正在开发中');
            }
        });
    });

    if (toolCloseBtn) toolCloseBtn.addEventListener('click', closeTool);
    if (toolOverlay) toolOverlay.addEventListener('click', closeTool);

    // ESC关闭 + Tab焦点陷阱
    document.addEventListener('keydown', (e) => {
        if (!toolModal.classList.contains('show')) return;
        if (e.key === 'Escape') {
            closeTool();
        } else if (e.key === 'Tab') {
            // 焦点陷阱：在模态框内循环
            const focusables = toolModal.querySelectorAll('input, textarea, select, button, [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
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
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { ta.setSelectionRange(0, ta.value.length); } catch (e) { /* iOS 兼容 */ }
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        // 仅在真正复制成功时回调，避免虚假"已复制"反馈
        if (ok && cb) cb();
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
            // 输入大小限制：超过 1MB 时 JSON.parse 同步阻塞主线程数秒
            if (raw.length > 1024 * 1024) {
                showError(error, '输入过长（超过 1MB），请缩短后重试');
                return;
            }
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
        // 分块处理避免大数组栈溢出，且比字符串拼接更高效
        const chunks = [];
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
        }
        return btoa(chunks.join(''));
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

        function run() {
            hideError(error);
            const patternStr = patternEl.value;
            const flags = flagsEl.value;
            const text = textEl.value;
            if (!patternStr) { showError(error, '请输入正则表达式'); return; }
            if (!text) { showError(error, '请输入测试文本'); return; }

            // ReDoS防护：限制文本长度
            const MAX_TEXT_LEN = 5000;
            if (text.length > MAX_TEXT_LEN) {
                showError(error, '测试文本过长（超过' + MAX_TEXT_LEN + '字符），请缩短后重试');
                return;
            }

            // ReDoS防护：检测潜在的灾难性回溯模式（嵌套量词）
            if (/\([^)]*[+*?][^)]*\)[+*?{]/.test(patternStr) && text.length > 20) {
                showError(error, '警告：该正则包含嵌套量词，可能存在灾难性回溯风险，请缩短测试文本（不超过20字符）');
                return;
            }

            let re;
            try {
                re = new RegExp(patternStr, flags);
            } catch (e) {
                showError(error, '正则表达式语法错误：' + e.message);
                highlight.innerHTML = '（结果将显示在这里）';
                matchesBox.innerHTML = '—';
                return;
            }

            // 收集所有匹配（限制匹配数量防止过载）
            const matches = [];
            const MAX_MATCHES = 10000;
            if (flags.indexOf('g') !== -1) {
                let m;
                let safety = 0;
                while ((m = re.exec(text)) !== null && safety++ < MAX_MATCHES) {
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

    // ==================== 7. URL 编解码 ====================
    function renderUrl() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label">操作模式</label>' +
                '<div class="tool-row">' +
                    '<label class="tool-checkbox"><input type="radio" name="urlmode" value="encode" checked> 编码（文本 → URL）</label>' +
                    '<label class="tool-checkbox"><input type="radio" name="urlmode" value="decode"> 解码（URL → 文本）</label>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="urlInput">输入</label>' +
                '<textarea class="tool-textarea" id="urlInput" placeholder="输入文本或 URL 编码字符串..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="urlRun">执行</button>' +
                '<button class="post-btn post-btn-ghost" id="urlSwap">↑↓ 结果转输入</button>' +
                '<button class="post-btn post-btn-ghost" id="urlClear">清空</button>' +
            '</div>' +
            '<div class="tool-error" id="urlError"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="urlOutput">输出</label>' +
                '<textarea class="tool-textarea" id="urlOutput" readonly placeholder="编解码结果..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="urlCopy">复制结果</button>' +
            '</div>';
    }
    function initUrl(root) {
        const input = root.querySelector('#urlInput');
        const output = root.querySelector('#urlOutput');
        const error = root.querySelector('#urlError');
        function getMode() {
            const c = root.querySelector('input[name="urlmode"]:checked');
            return c ? c.value : 'encode';
        }
        function run() {
            hideError(error);
            const raw = input.value;
            if (!raw) { showError(error, '请输入内容'); return; }
            try {
                output.value = getMode() === 'encode' ? encodeURIComponent(raw) : decodeURIComponent(raw);
            } catch (e) {
                output.value = '';
                showError(error, '转换失败：' + e.message + '（解码时请确认输入为合法 URL 编码）');
            }
        }
        root.querySelector('#urlRun').addEventListener('click', run);
        root.querySelector('#urlSwap').addEventListener('click', () => {
            if (output.value) { input.value = output.value; output.value = ''; hideError(error); input.focus(); }
        });
        root.querySelector('#urlClear').addEventListener('click', () => {
            input.value = ''; output.value = ''; hideError(error); input.focus();
        });
        root.querySelector('#urlCopy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
    }

    // ==================== 8. 哈希生成（SHA-1/256/384/512） ====================
    function renderHash() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label">算法</label>' +
                '<div class="tool-row">' +
                    '<label class="tool-checkbox"><input type="radio" name="halgo" value="SHA-1"> SHA-1</label>' +
                    '<label class="tool-checkbox"><input type="radio" name="halgo" value="SHA-256" checked> SHA-256</label>' +
                    '<label class="tool-checkbox"><input type="radio" name="halgo" value="SHA-384"> SHA-384</label>' +
                    '<label class="tool-checkbox"><input type="radio" name="halgo" value="SHA-512"> SHA-512</label>' +
                '</div>' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="hashInput">输入文本</label>' +
                '<textarea class="tool-textarea" id="hashInput" placeholder="输入要计算哈希的文本..."></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="hashRun">计算哈希</button>' +
                '<button class="post-btn post-btn-ghost" id="hashClear">清空</button>' +
            '</div>' +
            '<div class="tool-error" id="hashError"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="hashOutput">哈希值（Hex）</label>' +
                '<textarea class="tool-textarea" id="hashOutput" readonly placeholder="哈希结果将显示在这里..." style="min-height:80px"></textarea>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-secondary" id="hashCopy">复制结果</button>' +
            '</div>';
    }
    function initHash(root) {
        const input = root.querySelector('#hashInput');
        const output = root.querySelector('#hashOutput');
        const error = root.querySelector('#hashError');
        function getAlgo() {
            const c = root.querySelector('input[name="halgo"]:checked');
            return c ? c.value : 'SHA-256';
        }
        function buf2hex(buf) {
            const bytes = new Uint8Array(buf);
            let hex = '';
            for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
            return hex;
        }
        // 异步竞态保护：用户快速多次点击时，旧任务结果不会覆盖新任务结果
        let runToken = 0;
        async function run() {
            hideError(error);
            const raw = input.value;
            if (!raw) { showError(error, '请输入文本'); return; }
            // crypto.subtle 仅在 HTTPS/localhost 可用，提前检测给出明确提示
            if (!window.crypto || !window.crypto.subtle) {
                showError(error, '哈希功能需要 HTTPS 安全环境，请通过 HTTPS 访问本站');
                return;
            }
            const token = ++runToken;
            try {
                const enc = new TextEncoder().encode(raw);
                const buf = await crypto.subtle.digest(getAlgo(), enc);
                if (token !== runToken) return; // 已被新请求取代，丢弃旧结果
                output.value = buf2hex(buf);
            } catch (e) {
                if (token !== runToken) return;
                output.value = '';
                showError(error, '计算失败：' + e.message);
            }
        }
        root.querySelector('#hashRun').addEventListener('click', run);
        root.querySelector('#hashClear').addEventListener('click', () => {
            input.value = ''; output.value = ''; hideError(error); input.focus();
        });
        root.querySelector('#hashCopy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
    }

    // ==================== 9. 字数统计 ====================
    function renderWordCount() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="wcInput">输入文本</label>' +
                '<textarea class="tool-textarea" id="wcInput" placeholder="粘贴或输入文本，自动实时统计..." style="min-height:160px"></textarea>' +
            '</div>' +
            '<div class="tool-info-bar" id="wcStats" style="flex-direction:column;align-items:flex-start;gap:8px">' +
                '<div><span class="tool-ts-current" id="wcChars">0</span> 字符（含空格）</div>' +
                '<div><span class="tool-ts-current" id="wcCharsNoSpace">0</span> 字符（不含空格）</div>' +
                '<div><span class="tool-ts-current" id="wcWords">0</span> 单词 / 英文词数</div>' +
                '<div><span class="tool-ts-current" id="wcChinese">0</span> 中文字数</div>' +
                '<div><span class="tool-ts-current" id="wcLines">0</span> 行数</div>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn post-btn-ghost" id="wcClear">清空</button>' +
            '</div>';
    }
    function initWordCount(root) {
        const input = root.querySelector('#wcInput');
        const elChars = root.querySelector('#wcChars');
        const elCharsNoSpace = root.querySelector('#wcCharsNoSpace');
        const elWords = root.querySelector('#wcWords');
        const elChinese = root.querySelector('#wcChinese');
        const elLines = root.querySelector('#wcLines');
        function update() {
            const t = input.value;
            elChars.textContent = t.length;
            elCharsNoSpace.textContent = t.replace(/\s/g, '').length;
            // 英文单词数
            const en = t.match(/[a-zA-Z0-9]+(?:[''-][a-zA-Z0-9]+)*/g);
            elWords.textContent = en ? en.length : 0;
            // 中文字数
            const zh = t.match(/[\u4e00-\u9fa5]/g);
            elChinese.textContent = zh ? zh.length : 0;
            // 行数
            elLines.textContent = t === '' ? 0 : t.split(/\r?\n/).length;
        }
        input.addEventListener('input', UYEA_UTILS.debounce(update, 300));
        root.querySelector('#wcClear').addEventListener('click', () => {
            input.value = ''; update(); input.focus();
        });
        update();
    }

    // ==================== 10. 随机密码生成 ====================
    function renderPassword() {
        return '' +
            '<div class="tool-field">' +
                '<label class="tool-label">密码长度：<span class="tool-ts-current" id="pwLenVal">16</span></label>' +
                '<input type="range" id="pwLen" min="4" max="64" value="16" style="width:100%">' +
            '</div>' +
            '<div class="tool-field">' +
                '<label class="tool-label">字符组成</label>' +
                '<div class="tool-row">' +
                    '<label class="tool-checkbox"><input type="checkbox" id="pwLower" checked> 小写 a-z</label>' +
                    '<label class="tool-checkbox"><input type="checkbox" id="pwUpper" checked> 大写 A-Z</label>' +
                    '<label class="tool-checkbox"><input type="checkbox" id="pwDigit" checked> 数字 0-9</label>' +
                    '<label class="tool-checkbox"><input type="checkbox" id="pwSymbol"> 符号 !@#$…</label>' +
                '</div>' +
            '</div>' +
            '<div class="tool-actions">' +
                '<button class="post-btn" id="pwGen">生成密码</button>' +
                '<button class="post-btn post-btn-secondary" id="pwCopy">复制密码</button>' +
            '</div>' +
            '<div class="tool-error" id="pwError"></div>' +
            '<div class="tool-field">' +
                '<label class="tool-label" for="pwOutput">生成的密码</label>' +
                '<textarea class="tool-textarea" id="pwOutput" readonly style="min-height:60px;font-size:18px;letter-spacing:1px"></textarea>' +
            '</div>';
    }
    function initPassword(root) {
        const lenSlider = root.querySelector('#pwLen');
        const lenLabel = root.querySelector('#pwLenVal');
        const output = root.querySelector('#pwOutput');
        const error = root.querySelector('#pwError');
        const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        function secureRandInt(max) {
            // 快速路径：max<=1 时无需随机，直接返回 0
            if (max <= 1) return 0;
            // 拒绝采样：消除 % 取模偏差，保证密码学均匀性
            if (!window.crypto || !window.crypto.getRandomValues) {
                throw new Error('NO_CRYPTO');
            }
            const arr = new Uint32Array(1);
            const limit = Math.floor(0xFFFFFFFF / max) * max;
            do {
                crypto.getRandomValues(arr);
            } while (arr[0] >= limit);
            return arr[0] % max;
        }
        function buildPool() {
            let pool = '';
            if (root.querySelector('#pwLower').checked) pool += 'abcdefghijklmnopqrstuvwxyz';
            if (root.querySelector('#pwUpper').checked) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (root.querySelector('#pwDigit').checked) pool += '0123456789';
            if (root.querySelector('#pwSymbol').checked) pool += SYMBOLS;
            return pool;
        }
        function generate() {
            hideError(error);
            const pool = buildPool();
            if (!pool) { showError(error, '请至少选择一种字符类型'); output.value = ''; return; }
            // 非安全上下文（HTTP 非 localhost）下 crypto 不可用，给出明确提示
            if (!window.crypto || !window.crypto.getRandomValues) {
                showError(error, '当前为非 HTTPS 环境，加密随机数不可用，无法生成安全密码');
                output.value = '';
                return;
            }
            // 收集每种已选字符类型的字符集，用于保证每种类型至少出现一次
            const typePools = [];
            if (root.querySelector('#pwLower').checked) typePools.push('abcdefghijklmnopqrstuvwxyz');
            if (root.querySelector('#pwUpper').checked) typePools.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            if (root.querySelector('#pwDigit').checked) typePools.push('0123456789');
            if (root.querySelector('#pwSymbol').checked) typePools.push(SYMBOLS);
            const n = parseInt(lenSlider.value, 10);
            try {
                const chars = [];
                // 1. 先从每种已选类型各取一个字符，保证类型覆盖
                const guaranteed = Math.min(typePools.length, n);
                for (let i = 0; i < guaranteed; i++) {
                    chars.push(typePools[i][secureRandInt(typePools[i].length)]);
                }
                // 2. 剩余位从全池随机选取
                for (let i = chars.length; i < n; i++) {
                    chars.push(pool[secureRandInt(pool.length)]);
                }
                // 3. Fisher-Yates 洗牌打乱顺序
                for (let i = chars.length - 1; i > 0; i--) {
                    const j = secureRandInt(i + 1);
                    const tmp = chars[i];
                    chars[i] = chars[j];
                    chars[j] = tmp;
                }
                output.value = chars.join('');
            } catch (e) {
                showError(error, '生成失败：' + e.message);
                output.value = '';
                return;
            }
        }
        lenSlider.addEventListener('input', () => { lenLabel.textContent = lenSlider.value; });
        root.querySelector('#pwGen').addEventListener('click', generate);
        root.querySelector('#pwCopy').addEventListener('click', (e) => {
            if (output.value) copyText(output.value, e.currentTarget);
        });
        generate();
    }
});
