document.addEventListener('DOMContentLoaded', () => {
    // 搜索逻辑
    window.handleSearch = () => {
        const engine = document.getElementById('searchEngine').value;
        const query = document.getElementById('searchInput').value;
        if (!query) return;
        const url = engine === 'baidu' ? `https://www.baidu.com/s?wd=${query}` : `https://www.google.com/search?q=${query}`;
        window.open(url, '_blank');
    };

    // 卡片入场间隔
    document.querySelectorAll('.card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
    });

    // 移动端点击高亮切换
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
