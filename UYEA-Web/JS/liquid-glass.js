/**
 * UYEA 液态玻璃效果模块 v0.6.60
 * 基于 SVG feDisplacementMap + Canvas 位移贴图实现真实玻璃折射
 * 参考: https://github.com/shuding/liquid-glass
 *       https://github.com/childrentime/liquid-glass
 *
 * 核心原理：
 *   1. SDF（有向距离场）描述玻璃形状
 *   2. smoothStep 实现边缘平滑过渡
 *   3. Canvas 逐像素生成位移贴图，编码为 RGBA
 *   4. SVG feDisplacementMap 根据贴图位移背景像素
 *   5. backdrop-filter 组合 SVG 滤镜 + 模糊 + 色彩增强
 *
 * 关键改进（对比原始参考）：
 *   - 像素空间位移封顶：解决宽扁元素（如 1400x64 头部）角落位移过大问题
 *   - 保留 CSS 模糊：读取 --glass-blur 变量，不覆盖原有 backdrop-filter
 *   - MutationObserver：自动处理 display:none → 显示的元素
 *   - 防抖 + 尺寸缓存：避免重复计算
 */
(function () {
    'use strict';

    /* ========== 数学工具函数 ========== */

    /**
     * Hermite 平滑插值
     * @param {number} a - 起始值
     * @param {number} b - 结束值
     * @param {number} t - 输入值
     * @returns {number} 0-1 之间的平滑值
     */
    function smoothStep(a, b, t) {
        t = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return t * t * (3 - 2 * t);
    }

    /**
     * 向量长度
     */
    function vecLength(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 圆角矩形有向距离场（SDF）
     * 返回值: 负=内部, 0=边缘, 正=外部
     * @param {number} x - 中心坐标 X
     * @param {number} y - 中心坐标 Y
     * @param {number} halfW - 矩形半宽
     * @param {number} halfH - 矩形半高
     * @param {number} radius - 圆角半径
     * @returns {number} SDF 值
     */
    function roundedRectSDF(x, y, halfW, halfH, radius) {
        const qx = Math.abs(x) - halfW + radius;
        const qy = Math.abs(y) - halfH + radius;
        return Math.min(Math.max(qx, qy), 0) + vecLength(Math.max(qx, 0), Math.max(qy, 0)) - radius;
    }

    /* ========== SVG 滤镜管理 ========== */

    let svgRoot = null;
    const appliedElements = [];
    const elementData = []; // 存储每个元素的配置和尺寸
    let cachedGlassBlur = null;
    /**
     * 读取 --glass-blur CSS 变量（带模块级缓存，主题切换时重置）
     * @returns {string} glass-blur 值
     */
    function getGlassBlur() {
        if (cachedGlassBlur !== null) return cachedGlassBlur;
        cachedGlassBlur = window.getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim();
        return cachedGlassBlur;
    }

    /**
     * 确保 SVG 根元素存在（用于承载所有 filter 定义）
     */
    function ensureSvgRoot() {
        if (svgRoot && document.body.contains(svgRoot)) return svgRoot;
        const svgNS = 'http://www.w3.org/2000/svg';
        svgRoot = document.createElementNS(svgNS, 'svg');
        svgRoot.setAttribute('style', 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:-1;opacity:0');
        svgRoot.setAttribute('aria-hidden', 'true');
        const defs = document.createElementNS(svgNS, 'defs');
        svgRoot.appendChild(defs);
        document.body.appendChild(svgRoot);
        return svgRoot;
    }

    /**
     * 生成唯一 ID（自增计数器，避免 Math.random 理论碰撞）
     */
    let lgIdCounter = 0;
    function generateId() {
        return 'lg-' + (++lgIdCounter);
    }

    /* ========== 核心：生成位移贴图并应用滤镜 ========== */

    /**
     * 为元素应用液态玻璃效果
     * @param {HTMLElement} element - 目标元素
     * @param {Object} options - 配置选项
     *   - strength: 位移强度 (0-1)，控制折射明显程度
     *   - edgeSmooth: 边缘过渡平滑度 (UV空间 0-1)
     *   - radius: SDF圆角半径 (UV空间 0-1)
     *   - blur: 自定义模糊值（覆盖CSS变量）
     */
    function applyLiquidGlass(element, options) {
        options = options || {};

        const rect = element.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));

        // 跳过过小或不可见的元素
        if (w < 10 || h < 10) return;
        // 跳过 display:none 的元素（getBoundingClientRect 返回 0x0，但防御性检查）
        if (rect.width === 0 || rect.height === 0) return;

        // 检查是否需要重新生成（尺寸与参数未变则跳过）
        const dataIdx = appliedElements.indexOf(element);
        if (dataIdx !== -1 && elementData[dataIdx]) {
            const prev = elementData[dataIdx];
            const checkStrength = options.strength !== undefined ? options.strength : 0.5;
            const checkEdgeSmooth = options.edgeSmooth !== undefined ? options.edgeSmooth : 0.15;
            if (prev.w === w && prev.h === h
                && prev.strength === checkStrength
                && prev.edgeSmooth === checkEdgeSmooth
                && prev.radius === options.radius
                && prev.blur === options.blur) {
                return; // 尺寸和参数未变，无需重新生成
            }
        }

        // ========== SDF 参数（与参考实现完全一致） ==========
        // 在 UV 空间定义玻璃形状，halfW/halfH 控制中心清晰区域大小
        const halfW = 0.3;       // 矩形半宽：中心区域占 60%，边缘过渡区 20%
        const halfH = 0.2;       // 矩形半高：中心区域占 40%，边缘过渡区 30%
        const sdfRadius = 0.6;   // 圆角半径（大于半尺寸 → 椭圆形过渡）
        const edgeSmooth = options.edgeSmooth !== undefined ? options.edgeSmooth : 0.15;

        // 位移强度（0-1）：控制折射明显程度
        const strength = options.strength !== undefined ? options.strength : 0.5;

        // ========== 像素空间位移封顶 ==========
        // 参考实现为 300x200 玻璃球设计，UV 空间位移映射到像素后
        // 宽扁元素（如 1400x64 头部）角落位移可达数百像素。
        // 使用线性封顶限制为短边的 30%，保持边缘折射可见但不扭曲
        const minDim = Math.min(w, h);
        const maxDispPx = minDim * 0.3;

        const id = generateId();

        // 清理旧滤镜
        if (element._lgFilterId) {
            const oldFilter = document.getElementById(element._lgFilterId);
            if (oldFilter) oldFilter.parentNode.removeChild(oldFilter);
        }
        element._lgFilterId = id;

        // ========== 创建 SVG filter ==========
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = ensureSvgRoot();
        const defs = svg.firstChild;

        const filter = document.createElementNS(svgNS, 'filter');
        filter.setAttribute('id', id);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('color-interpolation-filters', 'sRGB');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', w);
        filter.setAttribute('height', h);

        // feImage: 引用位移贴图
        const feImage = document.createElementNS(svgNS, 'feImage');
        feImage.setAttribute('id', id + '-map');
        feImage.setAttribute('width', w);
        feImage.setAttribute('height', h);
        feImage.setAttribute('result', 'map');

        // feDisplacementMap: 根据贴图位移像素
        const feDisplacement = document.createElementNS(svgNS, 'feDisplacementMap');
        feDisplacement.setAttribute('in', 'SourceGraphic');
        feDisplacement.setAttribute('in2', 'map');
        feDisplacement.setAttribute('xChannelSelector', 'R');
        feDisplacement.setAttribute('yChannelSelector', 'G');

        filter.appendChild(feImage);
        filter.appendChild(feDisplacement);
        defs.appendChild(filter);

        // ========== 生成位移贴图（Canvas 逐像素） ==========
        // 性能优化：大尺寸元素使用降采样画布，位移贴图为平滑渐变可安全缩放
        const MAX_CANVAS_PIXELS = 128; // 单边最大像素数（128x128 足够，位移贴图为平滑渐变可安全降采样）
        let scaleDown = 1;
        let cw = w, ch = h;
        const maxDim = Math.max(w, h);
        if (maxDim > MAX_CANVAS_PIXELS) {
            scaleDown = MAX_CANVAS_PIXELS / maxDim;
            cw = Math.max(1, Math.round(w * scaleDown));
            ch = Math.max(1, Math.round(h * scaleDown));
        }
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');

        const pixelCount = cw * ch;
        const data = new Uint8ClampedArray(pixelCount * 4);
        let maxScale = 0;
        const rawValues = new Float32Array(pixelCount * 2);

        for (let i = 0; i < pixelCount; i++) {
            const x = i % cw;
            const y = Math.floor(i / cw);
            const uvx = x / cw;
            const uvy = y / ch;

            // 转换到中心坐标系（-0.5 到 0.5）
            const ix = uvx - 0.5;
            const iy = uvy - 0.5;

            // 计算到圆角矩形边缘的距离（SDF）
            const distanceToEdge = roundedRectSDF(ix, iy, halfW, halfH, sdfRadius);

            // 边缘位移强度：内部=0，边缘=1
            const displacement = smoothStep(0.8, 0, distanceToEdge - edgeSmooth);
            const scaled = smoothStep(0, 1, displacement);

            // UV 空间位移 → 像素空间，应用 strength 缩放
            let dx = ix * (scaled - 1) * w * strength;
            let dy = iy * (scaled - 1) * h * strength;

            // 像素空间线性封顶：防止宽扁元素角落位移过大
            if (dx > maxDispPx) dx = maxDispPx;
            else if (dx < -maxDispPx) dx = -maxDispPx;
            if (dy > maxDispPx) dy = maxDispPx;
            else if (dy < -maxDispPx) dy = -maxDispPx;

            if (Math.abs(dx) > maxScale) maxScale = Math.abs(dx);
            if (Math.abs(dy) > maxScale) maxScale = Math.abs(dy);

            rawValues[i * 2] = dx;
            rawValues[i * 2 + 1] = dy;
        }

        maxScale *= 0.5;
        if (maxScale < 1) maxScale = 1;

        // 编码为颜色: R=水平位移, G=垂直位移
        for (let j = 0; j < pixelCount; j++) {
            const r = rawValues[j * 2] / maxScale + 0.5;
            const g = rawValues[j * 2 + 1] / maxScale + 0.5;
            data[j * 4] = Math.max(0, Math.min(255, r * 255));
            data[j * 4 + 1] = Math.max(0, Math.min(255, g * 255));
            data[j * 4 + 2] = 0;
            data[j * 4 + 3] = 255;
        }

        ctx.putImageData(new ImageData(data, cw, ch), 0, 0);

        // 性能说明：toDataURL 为同步操作，对 128x128 画布开销可接受（<5ms）。
        // 若改用 toBlob 需将 applyLiquidGlass 异步化，会引入滤镜应用时序问题
        // （贴图未加载即挂载滤镜导致闪烁），故保留 toDataURL。
        // resize 已通过 debounce(350ms) 限制调用频率。
        const dataURL = canvas.toDataURL();
        feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataURL);
        feImage.setAttribute('href', dataURL);
        feDisplacement.setAttribute('scale', maxScale.toString());

        // ========== 应用 backdrop-filter ==========
        // 读取 CSS 变量 --glass-blur（会根据亮/暗模式自动切换，使用模块级缓存）
        let glassBlur = '';
        if (options.blur) {
            glassBlur = options.blur;
        } else {
            glassBlur = getGlassBlur();
        }
        if (!glassBlur) {
            glassBlur = 'blur(20px) saturate(180%)';
        }

        // 组合：SVG 位移滤镜 + 模糊 + 色彩增强
        // 参考: url(#filter) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)
        // --glass-blur 已包含 saturate，此处补充 contrast/brightness
        const filterCSS = 'url(#' + id + ') ' + glassBlur + ' contrast(1.15) brightness(1.05)';
        element.style.backdropFilter = filterCSS;
        element.style.webkitBackdropFilter = filterCSS;

        // 记录元素数据和尺寸（含 edgeSmooth/radius/blur 用于缓存比较）
        if (dataIdx === -1) {
            appliedElements.push(element);
            elementData.push({ w: w, h: h, strength: strength, edgeSmooth: edgeSmooth, radius: options.radius, blur: options.blur });
        } else {
            elementData[dataIdx] = { w: w, h: h, strength: strength, edgeSmooth: edgeSmooth, radius: options.radius, blur: options.blur };
        }
    }

    /* ========== 批量初始化 ========== */

    function getOptions(el) {
        const strength = parseFloat(el.getAttribute('data-lg-strength'));
        const edgeSmooth = parseFloat(el.getAttribute('data-lg-edge'));
        const radius = parseFloat(el.getAttribute('data-lg-radius'));
        const blur = el.getAttribute('data-lg-blur');

        return {
            strength: isNaN(strength) ? undefined : strength,
            edgeSmooth: isNaN(edgeSmooth) ? undefined : edgeSmooth,
            radius: isNaN(radius) ? undefined : radius,
            blur: blur || undefined
        };
    }

    function initAll() {
        const elements = document.querySelectorAll('[data-liquid-glass]');
        for (let i = 0; i < elements.length; i++) {
            applyLiquidGlass(elements[i], getOptions(elements[i]));
        }
    }

    /**
     * 初始化单个元素（用于动态显示的元素）
     */
    function initElement(element) {
        if (!element || !element.hasAttribute('data-liquid-glass')) return;
        applyLiquidGlass(element, getOptions(element));
    }

    /* ========== 元素清理（防止内存泄漏） ========== */

    /**
     * 清理已移除元素的所有引用：SVG 滤镜节点 + 内部数组
     */
    function cleanupElement(element) {
        if (!element) return;
        // 递归清理子元素
        if (element.querySelectorAll) {
            const children = element.querySelectorAll('[data-liquid-glass]');
            for (let i = 0; i < children.length; i++) {
                cleanupElement(children[i]);
            }
        }
        if (!element.hasAttribute || !element.hasAttribute('data-liquid-glass')) return;

        const idx = appliedElements.indexOf(element);
        if (idx !== -1) {
            // 移除对应的 SVG 滤镜
            if (element._lgFilterId) {
                const oldFilter = document.getElementById(element._lgFilterId);
                if (oldFilter && oldFilter.parentNode) oldFilter.parentNode.removeChild(oldFilter);
                element._lgFilterId = null;
            }
            appliedElements.splice(idx, 1);
            elementData.splice(idx, 1);
        }
    }

    /* ========== MutationObserver：处理动态显示的元素 ========== */

    let observer = null;

    function setupObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(function (mutations) {
            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];
                if (mutation.type === 'attributes') {
                    const attr = mutation.attributeName;
                    const el = mutation.target;
                    // data-lg-* 属性变化：参数已改变，重新应用效果
                    if (attr === 'data-lg-edge' || attr === 'data-lg-radius' || attr === 'data-lg-blur' || attr === 'data-lg-strength') {
                        if (el.hasAttribute && el.hasAttribute('data-liquid-glass')) {
                            requestAnimationFrame(function () {
                                applyLiquidGlass(el, getOptions(el));
                            });
                        }
                    }
                    // class/style 变化：仅在元素变为可见时重新应用
                    else if ((attr === 'class' || attr === 'style') && el.hasAttribute && el.hasAttribute('data-liquid-glass') && el.classList.contains('show')) {
                        // 元素变为可见，延迟一帧后应用效果
                        // 使用 const 确保闭包捕获正确的 el 引用（修复多元素同时变更时引用最后一个的 BUG）
                        requestAnimationFrame(function () {
                            requestAnimationFrame(function () {
                                applyLiquidGlass(el, getOptions(el));
                            });
                        });
                    }
                }
                // 处理新添加的 DOM 节点
                if (mutation.type === 'childList') {
                    for (let j = 0; j < mutation.addedNodes.length; j++) {
                        const node = mutation.addedNodes[j];
                        if (node.nodeType === 1) {
                            if (node.hasAttribute && node.hasAttribute('data-liquid-glass')) {
                                initElement(node);
                                // 将动态新增的玻璃元素加入 attribute 观察
                                observer.observe(node, {
                                    attributes: true,
                                    attributeFilter: ['class', 'style', 'data-lg-edge', 'data-lg-radius', 'data-lg-blur', 'data-lg-strength']
                                });
                            }
                            if (node.querySelectorAll) {
                                const children = node.querySelectorAll('[data-liquid-glass]');
                                for (let k = 0; k < children.length; k++) {
                                    initElement(children[k]);
                                    // 将动态新增的玻璃元素加入 attribute 观察
                                    observer.observe(children[k], {
                                        attributes: true,
                                        attributeFilter: ['class', 'style', 'data-lg-edge', 'data-lg-radius', 'data-lg-blur', 'data-lg-strength']
                                    });
                                }
                            }
                        }
                    }
                    // 清理已移除元素的引用，防止内存泄漏
                    for (let r = 0; r < mutation.removedNodes.length; r++) {
                        const removedNode = mutation.removedNodes[r];
                        if (removedNode.nodeType !== 1) continue;
                        cleanupElement(removedNode);
                    }
                }
            }
        });

        // 观察所有 data-liquid-glass 元素的属性变化
        const elements = document.querySelectorAll('[data-liquid-glass]');
        for (let i = 0; i < elements.length; i++) {
            observer.observe(elements[i], {
                attributes: true,
                attributeFilter: ['class', 'style', 'data-lg-edge', 'data-lg-radius', 'data-lg-blur', 'data-lg-strength']
            });
        }

        // 观察 body 的子节点变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /* ========== 响应式更新（防抖） ========== */

    /**
     * 重置尺寸缓存，强制下次 applyLiquidGlass 重新生成贴图
     */
    function resetCache() {
        for (let i = 0; i < elementData.length; i++) {
            elementData[i] = { w: 0, h: 0, strength: 0 };
        }
    }

    // 复用 UYEA_UTILS.debounce（utils.js 在本模块之后加载，首次 resize 事件时已就绪）
    let _onResize = null;
    window.addEventListener('resize', function () {
        if (!_onResize) {
            const core = function () { resetCache(); initAll(); };
            if (window.UYEA_UTILS && window.UYEA_UTILS.debounce) {
                _onResize = window.UYEA_UTILS.debounce(core, 350);
            } else {
                // 兜底防抖（与 UYEA_UTILS.debounce 行为一致）
                let timer = null;
                _onResize = function () {
                    clearTimeout(timer);
                    timer = setTimeout(core, 350);
                };
            }
        }
        _onResize();
    });

    /* ========== 导出 & 自动初始化 ========== */

    window.LiquidGlass = {
        apply: applyLiquidGlass,
        initAll: initAll,
        initElement: initElement
    };

    // DOM 就绪后自动初始化
    function autoInit() {
        // 延迟两帧确保布局完成（字体加载等）
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                initAll();
                setupObserver();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    /* ========== 可见性 / 主题切换优化（仅重应用 backdrop-filter，不重建位移贴图） ========== */

    let reapplyTimer = null;
    /**
     * 仅重新应用 backdrop-filter（不重新生成位移贴图）
     * 适用于 visibilitychange / themeChanged 等无需重建贴图的场景
     */
    function reapplyBackdropFilter() {
        for (let i = 0; i < appliedElements.length; i++) {
            const el = appliedElements[i];
            if (!el._lgFilterId) continue;
            const opts = getOptions(el);
            let glassBlur = '';
            if (opts.blur) {
                glassBlur = opts.blur;
            } else {
                glassBlur = getGlassBlur();
            }
            if (!glassBlur) {
                glassBlur = 'blur(20px) saturate(180%)';
            }
            const filterCSS = 'url(#' + el._lgFilterId + ') ' + glassBlur + ' contrast(1.15) brightness(1.05)';
            el.style.backdropFilter = filterCSS;
            el.style.webkitBackdropFilter = filterCSS;
        }
    }

    // 页面可见性变化时重新应用 backdrop-filter（从后台切换回来，添加 debounce）
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            if (reapplyTimer) clearTimeout(reapplyTimer);
            reapplyTimer = setTimeout(reapplyBackdropFilter, 200);
        }
    });

    // 主题切换时重置 blur 缓存并重新应用 backdrop-filter（blur 值会变化）
    document.addEventListener('uyea:themeChanged', function () {
        cachedGlassBlur = null;
        if (reapplyTimer) clearTimeout(reapplyTimer);
        reapplyTimer = setTimeout(reapplyBackdropFilter, 200);
    });
})();
