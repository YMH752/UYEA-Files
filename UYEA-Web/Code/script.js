document.addEventListener('DOMContentLoaded', () => {
    // 1. 自动为卡片设置动画延迟，产生流式效果
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // 每张卡片比前一张慢 0.05 秒出现
        card.style.animationDelay = `${index * 0.05}s`;
    });

    // 2. 搜索逻辑
    window.handleSearch = () => {
        const engine = document.getElementById('searchEngine').value;
        const query = document.getElementById('searchInput').value;
        if (!query) return;

        const targets = {
            baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        };
        window.open(targets[engine], '_blank');
    };

    // 监听回车键
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // 3. 侧边栏/底栏高亮切换
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.includes('.html')) return; // 跨页面不处理

            e.preventDefault();
            const targetId = href.replace('#', '');
            const targetEl = document.getElementById(targetId);
            
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});
