document.addEventListener('DOMContentLoaded', () => {
    console.log("悠野系统已就绪...");

    // 搜索按钮模拟
    const searchBtn = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput.value) {
                alert('正在悠野数据库中检索: ' + searchInput.value);
            } else {
                alert('请输入搜索内容');
            }
        });
    }

    // 简单点亮当前页面对应的侧边栏 (多页面方案的补充逻辑)
    const currentPath = window.location.pathname.split("/").pop();
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
});
