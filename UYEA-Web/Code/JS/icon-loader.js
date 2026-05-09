/* ============================================================
   UYEA 悠野工作室 · icon-loader.js
   功能：图标加载优化（速度、加载状态、离线支持）
   ============================================================ */

class IconLoader {
    constructor(options = {}) {
        this.iconBase = options.iconBase || 'https://raw.githubusercontent.com/YMH752/UYEA-Files/main/UYEA-Web/Image/ICONS/';
        this.cacheExpiry = options.cacheExpiry || 7 * 24 * 60 * 60 * 1000; // 7 days
        this.storagePrefix = 'uyea-icon-cache-';
        this.emojiFallback = options.emojiFallback || {
            'chatgpt': '🤖',
            'gemini': '✨',
            'claude': '🎯',
            'deepseek': '🧠',
            'yiyan': '📝',
            'qianwen': '💬',
            'kimi': '🌟',
            'doubao': '🫘',
            'yuanbao': '💰',
            'perplexity': '🔍',
            'copilot': '👨‍✈️',
            'grok': '🧬',
            'xiaohongshu': '📕',
            'bilibili': '📺',
            'zhihu': '💡',
            'github': '🐙',
            'tinypng': '🐼',
            'v0': '🌀'
        };
    }

    // 获取缓存的图标（Base64）
    async getCachedIcon(siteName) {
        try {
            const key = `${this.storagePrefix}${siteName}`;
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.cacheExpiry) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    // 缓存图标为 Base64
    async cacheIcon(siteName, blobOrDataUrl) {
        try {
            let base64;
            if (typeof blobOrDataUrl === 'string') {
                base64 = blobOrDataUrl;
            } else {
                base64 = await this.blobToBase64(blobOrDataUrl);
            }
            const key = `${this.storagePrefix}${siteName}`;
            localStorage.setItem(key, JSON.stringify({
                data: base64,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }

    // Blob 转 Base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // 加载单个图标
    async loadIcon(img) {
        const siteName = img.getAttribute('data-site-name');
        if (!siteName) return;

        // 显示加载状态
        img.classList.add('icon-loading');

        // 先尝试获取缓存
        const cachedBase64 = await this.getCachedIcon(siteName);
        if (cachedBase64) {
            img.src = cachedBase64;
            img.classList.remove('icon-loading');
            img.classList.add('icon-loaded');
            return;
        }

        // 从网络加载
        const iconUrl = `${this.iconBase}${siteName}.ico`;
        fetch(iconUrl, { timeout: 5000 })
            .then(res => {
                if (!res.ok) throw new Error('Network response not ok');
                return res.blob();
            })
            .then(blob => {
                this.cacheIcon(siteName, blob);
                const reader = new FileReader();
                reader.onloadend = () => {
                    img.src = reader.result;
                    img.classList.remove('icon-loading');
                    img.classList.add('icon-loaded');
                };
                reader.readAsDataURL(blob);
            })
            .catch(e => {
                img.classList.remove('icon-loading');
                this.fallbackToEmoji(img, siteName);
            });
    }

    // 降级为 Emoji
    fallbackToEmoji(img, siteName) {
        const emoji = this.emojiFallback[siteName] || '🔗';
        const cardIcon = img.parentElement;
        if (!cardIcon) return;
        
        img.remove();
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'icon-emoji';
        emojiSpan.textContent = emoji;
        emojiSpan.title = siteName;
        cardIcon.appendChild(emojiSpan);
    }

    // 批量加载页面上的所有图标
    loadAll() {
        document.querySelectorAll('.card-icon img[data-site-name]').forEach(img => {
            this.loadIcon(img);
        });
    }

    // 清空缓存
    clearCache() {
        try {
            for (let key in localStorage) {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {}
    }

    // 获取缓存统计
    getCacheStats() {
        let count = 0, size = 0;
        try {
            for (let key in localStorage) {
                if (key.startsWith(this.storagePrefix)) {
                    count++;
                    size += localStorage.getItem(key).length;
                }
            }
        } catch (e) {}
        return { count, size: (size / 1024).toFixed(2) + ' KB' };
    }
}

// 导出为全局对象（便于在其他脚本中使用）
window.IconLoader = IconLoader;
