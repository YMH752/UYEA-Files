/**
 * UYEA 液态玻璃效果模块 v0.6.55
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
        var qx = Math.abs(x) - halfW + radius;
        var qy = Math.abs(y) - halfH + radius;
        return Math.min(Math.max(qx, qy), 0) + vecLength(Math.max(qx, 0), Math.max(qy, 0)) - radius;
    }

    /* ========== SVG 滤镜管理 ========== */

    var svgRoot = null;
    var appliedElements = [];
    var elementData = []; // 存储每个元素的配置和尺寸

    /**
     * 确保 SVG 根元素存在（用于承载所有 filter 定义）
     */
    function ensureSvgRoot() {
        if (svgRoot && document.body.contains(svgRoot)) return svgRoot;
        var svgNS = 'http://www.w3.org/2000/svg';
        svgRoot = document.createElementNS(svgNS, 'svg');
        svgRoot.setAttribute('style', 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:-1;opacity:0');
        svgRoot.setAttribute('aria-hidden', 'true');
        var defs = document.createElementNS(svgNS, 'defs');
        svgRoot.appendChild(defs);
        document.body.appendChild(svgRoot);
        return svgRoot;
    }

    /**
     * 生成唯一 ID
     */
    function generateId() {
        return 'lg-' + Math.random().toString(36).substr(2, 9);
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

        var rect = element.getBoundingClientRect();
        var w = Math.max(1, Math.round(rect.width));
        var h = Math.max(1, Math.round(rect.height));

        // 跳过过小或不可见的元素
        if (w < 10 || h < 10) return;
        // 跳过 display:none 的元素（getBoundingClientRect 返回 0x0，但防御性检查）
        if (rect.width === 0 || rect.height === 0) return;

        // 检查是否需要重新生成（尺寸未变则跳过）
        var dataIdx = appliedElements.indexOf(element);
        if (dataIdx !== -1 && elementData[dataIdx]) {
            var prev = elementData[dataIdx];
            if (prev.w === w && prev.h === h && prev.strength === (options.strength || 0.5)) {
                return; // 尺寸和参数未变，无需重新生成
            }
        }

        // ========== SDF 参数（与参考实现完全一致） ==========
        // 在 UV 空间定义玻璃形状，halfW/halfH 控制中心清晰区域大小
        var halfW = 0.3;       // 矩形半宽：中心区域占 60%，边缘过渡区 20%
        var halfH = 0.2;       // 矩形半高：中心区域占 40%，边缘过渡区 30%
        var sdfRadius = 0.6;   // 圆角半径（大于半尺寸 → 椭圆形过渡）
        var edgeSmooth = options.edgeSmooth !== undefined ? options.edgeSmooth : 0.15;

        // 位移强度（0-1）：控制折射明显程度
        var strength = options.strength !== undefined ? options.strength : 0.5;

        // ========== 像素空间位移封顶 ==========
        // 参考实现为 300x200 玻璃球设计，UV 空间位移映射到像素后
        // 宽扁元素（如 1400x64 头部）角落位移可达数百像素。
        // 使用线性封顶限制为短边的 30%，保持边缘折射可见但不扭曲
        var minDim = Math.min(w, h);
        var maxDispPx = minDim * 0.3;

        var id = generateId();

        // 清理旧滤镜
        if (element._lgFilterId) {
            var oldFilter = document.getElementById(element._lgFilterId);
            if (oldFilter) oldFilter.parentNode.removeChild(oldFilter);
        }
        element._lgFilterId = id;

        // ========== 创建 SVG filter ==========
        var svgNS = 'http://www.w3.org/2000/svg';
        var svg = ensureSvgRoot();
        var defs = svg.firstChild;

        var filter = document.createElementNS(svgNS, 'filter');
        filter.setAttribute('id', id);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('color-interpolation-filters', 'sRGB');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', w);
        filter.setAttribute('height', h);

        // feImage: 引用位移贴图
        var feImage = document.createElementNS(svgNS, 'feImage');
        feImage.setAttribute('id', id + '-map');
        feImage.setAttribute('width', w);
        feImage.setAttribute('height', h);
        feImage.setAttribute('result', 'map');

        // feDisplacementMap: 根据贴图位移像素
        var feDisplacement = document.createElementNS(svgNS, 'feDisplacementMap');
        feDisplacement.setAttribute('in', 'SourceGraphic');
        feDisplacement.setAttribute('in2', 'map');
        feDisplacement.setAttribute('xChannelSelector', 'R');
        feDisplacement.setAttribute('yChannelSelector', 'G');

        filter.appendChild(feImage);
        filter.appendChild(feDisplacement);
        defs.appendChild(filter);

        // ========== 生成位移贴图（Canvas 逐像素） ==========
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        var pixelCount = w * h;
        var data = new Uint8ClampedArray(pixelCount * 4);
        var maxScale = 0;
        var rawValues = new Float32Array(pixelCount * 2);

        for (var i = 0; i < pixelCount; i++) {
            var x = i % w;
            var y = Math.floor(i / w);
            var uvx = x / w;
            var uvy = y / h;

            // 转换到中心坐标系（-0.5 到 0.5）
            var ix = uvx - 0.5;
            var iy = uvy - 0.5;

            // 计算到圆角矩形边缘的距离（SDF）
            var distanceToEdge = roundedRectSDF(ix, iy, halfW, halfH, sdfRadius);

            // 边缘位移强度：内部=0，边缘=1
            var displacement = smoothStep(0.8, 0, distanceToEdge - edgeSmooth);
            var scaled = smoothStep(0, 1, displacement);

            // UV 空间位移 → 像素空间，应用 strength 缩放
            var dx = ix * (scaled - 1) * w * strength;
            var dy = iy * (scaled - 1) * h * strength;

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
        for (var j = 0; j < pixelCount; j++) {
            var r = rawValues[j * 2] / maxScale + 0.5;
            var g = rawValues[j * 2 + 1] / maxScale + 0.5;
            data[j * 4] = Math.max(0, Math.min(255, r * 255));
            data[j * 4 + 1] = Math.max(0, Math.min(255, g * 255));
            data[j * 4 + 2] = 0;
            data[j * 4 + 3] = 255;
        }

        ctx.putImageData(new ImageData(data, w, h), 0, 0);

        // 设置 feImage 的 href（位移贴图数据）
        var dataURL = canvas.toDataURL();
        feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataURL);
        feImage.setAttribute('href', dataURL);
        feDisplacement.setAttribute('scale', maxScale.toString());

        // ========== 应用 backdrop-filter ==========
        // 读取 CSS 变量 --glass-blur（会根据亮/暗模式自动切换）
        var rootStyle = window.getComputedStyle(document.documentElement);
        var glassBlur = '';
        if (options.blur) {
            glassBlur = options.blur;
        } else {
            glassBlur = rootStyle.getPropertyValue('--glass-blur').trim();
        }
        if (!glassBlur) {
            glassBlur = 'blur(20px) saturate(180%)';
        }

        // 组合：SVG 位移滤镜 + 模糊 + 色彩增强
        // 参考: url(#filter) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)
        // --glass-blur 已包含 saturate，此处补充 contrast/brightness
        var filterCSS = 'url(#' + id + ') ' + glassBlur + ' contrast(1.15) brightness(1.05)';
        element.style.backdropFilter = filterCSS;
        element.style.webkitBackdropFilter = filterCSS;

        // 记录元素数据和尺寸
        if (dataIdx === -1) {
            appliedElements.push(element);
            elementData.push({ w: w, h: h, strength: strength });
        } else {
            elementData[dataIdx] = { w: w, h: h, strength: strength };
        }
    }

    /* ========== 批量初始化 ========== */

    function getOptions(el) {
        var strength = parseFloat(el.getAttribute('data-lg-strength'));
        var edgeSmooth = parseFloat(el.getAttribute('data-lg-edge'));
        var radius = parseFloat(el.getAttribute('data-lg-radius'));
        var blur = el.getAttribute('data-lg-blur');

        return {
            strength: isNaN(strength) ? undefined : strength,
            edgeSmooth: isNaN(edgeSmooth) ? undefined : edgeSmooth,
            radius: isNaN(radius) ? undefined : radius,
            blur: blur || undefined
        };
    }

    function initAll() {
        var elements = document.querySelectorAll('[data-liquid-glass]');
        for (var i = 0; i < elements.length; i++) {
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

    /* ========== MutationObserver：处理动态显示的元素 ========== */

    var observer = null;

    function setupObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    var el = mutation.target;
                    if (el.hasAttribute('data-liquid-glass') && el.classList.contains('show')) {
                        // 元素变为可见，延迟一帧后应用效果
                        requestAnimationFrame(function () {
                            requestAnimationFrame(function () {
                                applyLiquidGlass(el, getOptions(el));
                            });
                        });
                    }
                }
                // 处理新添加的 DOM 节点
                if (mutation.type === 'childList') {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        var node = mutation.addedNodes[j];
                        if (node.nodeType === 1) {
                            if (node.hasAttribute && node.hasAttribute('data-liquid-glass')) {
                                initElement(node);
                            }
                            if (node.querySelectorAll) {
                                var children = node.querySelectorAll('[data-liquid-glass]');
                                for (var k = 0; k < children.length; k++) {
                                    initElement(children[k]);
                                }
                            }
                        }
                    }
                }
            }
        });

        // 观察所有 data-liquid-glass 元素的 class 变化
        var elements = document.querySelectorAll('[data-liquid-glass]');
        for (var i = 0; i < elements.length; i++) {
            observer.observe(elements[i], {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }

        // 观察 body 的子节点变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /* ========== 响应式更新（防抖） ========== */

    var resizeTimer = null;
    function onResize() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            // 重置尺寸缓存，强制重新生成
            for (var i = 0; i < elementData.length; i++) {
                elementData[i] = { w: 0, h: 0, strength: 0 };
            }
            initAll();
        }, 350);
    }

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

    window.addEventListener('resize', onResize);

    // 页面可见性变化时重新初始化（从后台切换回来）
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            // 重置尺寸缓存
            for (var i = 0; i < elementData.length; i++) {
                elementData[i] = { w: 0, h: 0, strength: 0 };
            }
            requestAnimationFrame(initAll);
        }
    });

    // 主题切换时重新应用（blur 值会变化）
    document.addEventListener('uyea:themeChanged', function () {
        for (var i = 0; i < elementData.length; i++) {
            elementData[i] = { w: 0, h: 0, strength: 0 };
        }
        requestAnimationFrame(function () {
            requestAnimationFrame(initAll);
        });
    });
})();
