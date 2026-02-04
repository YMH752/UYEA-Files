document.addEventListener('DOMContentLoaded', () => {
    // 1. 给卡片添加延迟入场效果，产生“流式”加载感
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
    });

    // 2. 搜索逻辑
    window.handleSearch = () => {
        const query = document.getElementById('searchInput').value;
        if (query) {
            // 模拟图二的搜索跳转
            window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
        }
    };

    // 3. 监听回车键搜索
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});
