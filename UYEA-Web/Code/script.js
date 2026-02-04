document.addEventListener('DOMContentLoaded', () => {
    // 1. 搜索引擎逻辑
    window.handleSearch = () => {
        const engine = document.getElementById('searchEngine').value;
        const query = document.getElementById('searchInput').value;
        if (!query) return;

        const engines = {
            baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        };
        window.open(engines[engine], '_blank');
    };

    // 监听回车
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // 2. 侧边栏/底栏点击处理
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.includes('.html')) return; // 多页面跳转

            e.preventDefault();
            const targetId = href.replace('#', '');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 3. 自动高亮 (滚动监听)
    const sections = document.querySelectorAll('section');
    const mainArea = document.querySelector('.main');
    
    mainArea.addEventListener('scroll', () => {
        let current = "";
        sections.forEach(section => {
            if (mainArea.scrollTop >= section.offsetTop - 120) {
                current = section.getAttribute('id');
            }
        });
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
});
