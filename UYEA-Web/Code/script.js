document.addEventListener('DOMContentLoaded', () => {
    console.log("悠野系统加载成功...");

    // 1. 卡片瀑布流加载动画延迟
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.03}s`;
    });

    // 2. 增强搜索功能：支持百度、谷歌、必应切换
    window.handleSearch = () => {
        const engine = document.getElementById('searchEngine').value;
        const query = document.getElementById('searchInput').value;
        
        if (!query) {
            alert('请输入搜索关键词');
            return;
        }

        const urls = {
            baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        };

        window.open(urls[engine], '_blank');
    };

    // 监听回车键搜索
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // 3. 侧边栏平滑滚动逻辑
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.querySelector('.main');
    const sections = document.querySelectorAll('section');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 如果是多页面跳转（如 forum.html），不执行平滑滚动
            if (href.includes('.html')) return;

            e.preventDefault();
            const targetId = href.replace('#', '');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // 执行滚动
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                // 立即更新 active 状态
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 4. 滚动监听：滚动右侧时，左侧侧边栏跟随高亮
    mainContent.addEventListener('scroll', () => {
        let current = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            // 调整 100 像素的偏移量以获得更好的触发时机
            if (mainContent.scrollTop >= sectionTop - 100) {
                current = section.getAttribute("id");
            }
        });

        navItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("href") === `#${current}`) {
                item.classList.add("active");
            }
        });
    });
});
