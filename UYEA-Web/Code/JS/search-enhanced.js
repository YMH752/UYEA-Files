/* ============================================================
   UYEA 悠野工作室 · search-enhanced.js
   功能：搜索增强（修复bug、搜索历史、实时建议）
   ============================================================ */

class SearchEnhanced {
    constructor(options = {}) {
        this.searchInput = document.getElementById('searchInput');
        this.engineTriggerLabel = document.getElementById('engineTriggerLabel');
        this.storageKey = 'uyea-search-history';
        this.maxHistory = 10;
        this.currentEngine = localStorage.getItem('uyea-search-engine') || 'baidu';
        this.navigationData = null;
        
        this.engineUrls = {
            site: null,
            baidu: "https://www.baidu.com/s?wd=",
            google: "https://www.google.com/search?q=",
            bing: "https://cn.bing.com/search?q="
        };

        this.init();
    }

    init() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('keypress', (e) => this.handleKeypress(e));
        this.loadNavigationData();
    }

    // 加载导航数据（用于站内搜索）
    async loadNavigationData() {
        try {
            const resp = await fetch('/Data/JSON/navigation.json');
            this.navigationData = await resp.json();
        } catch (e) {}
    }

    // 处理输入事件
    handleInput(e) {
        const keyword = e.target.value.toLowerCase().trim();
        
        if (this.currentEngine === 'site') {
            this.siteSearch(keyword);
        }
    }

    // 处理回车键
    handleKeypress(e) {
        if (e.key === 'Enter') {
            const keyword = this.searchInput.value.trim();
            if (!keyword) return;

            // 添加到历史
            this.addToHistory(keyword);

            if (this.currentEngine !== 'site' && this.engineUrls[this.currentEngine]) {
                window.open(this.engineUrls[this.currentEngine] + encodeURIComponent(keyword), '_blank');
            }
        }
    }

    // 站内搜索
    siteSearch(keyword) {
        // 搜索导航卡片
        const cardItems = document.querySelectorAll('.card-item');
        const sections = document.querySelectorAll('.section-group');
        
        cardItems.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const isMatch = title.includes(keyword);
            card.style.display = isMatch ? 'flex' : 'none';
            card.classList.toggle('search-highlight', isMatch && keyword);
        });

        // 隐藏空的分类
        sections.forEach(section => {
            const hasVisible = Array.from(section.querySelectorAll('.card-item'))
                .some(c => c.style.display !== 'none');
            section.style.display = hasVisible ? 'block' : 'none';
        });

        // 搜索工具页的工具项
        const toolGroups = document.querySelectorAll('.tool-group');
        toolGroups.forEach(group => {
            const cards = group.querySelectorAll('.card-item');
            const hasVisible = Array.from(cards).some(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                return title.includes(keyword);
            });
            group.style.display = hasVisible ? 'block' : 'none';
            
            cards.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                card.style.display = title.includes(keyword) ? 'flex' : 'none';
            });
        });

        // 搜索论坛帖子
        const postItems = document.querySelectorAll('.post-item');
        postItems.forEach(post => {
            const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
            const excerpt = post.querySelector('.post-excerpt')?.textContent.toLowerCase() || '';
            const isMatch = title.includes(keyword) || excerpt.includes(keyword);
            post.style.display = isMatch ? 'block' : 'none';
            post.classList.toggle('search-highlight', isMatch && keyword);
        });

        // 显示/隐藏"无结果"提示
        const noResults = document.getElementById('noResults');
        if (noResults) {
            const hasAnyResults = Array.from(document.querySelectorAll('.card-item, .post-item'))
                .some(el => el.style.display !== 'none');
            noResults.classList.toggle('show', !hasAnyResults && keyword);
        }
    }

    // 添加到历史记录
    addToHistory(keyword) {
        try {
            let history = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            history = history.filter(item => item !== keyword);
            history.unshift(keyword);
            history = history.slice(0, this.maxHistory);
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {}
    }

    // 获取历史记录
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    // 清空历史记录
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {}
    }

    // 设置当前引擎
    setEngine(engine) {
        if (this.engineUrls.hasOwnProperty(engine)) {
            this.currentEngine = engine;
            localStorage.setItem('uyea-search-engine', engine);
            if (this.engineTriggerLabel) {
                const engineName = { site: '站内', baidu: '百度', google: '谷歌', bing: '必应' }[engine];
                this.engineTriggerLabel.textContent = engineName;
            }
        }
    }
}

// 导出为全局对象
window.SearchEnhanced = SearchEnhanced;
