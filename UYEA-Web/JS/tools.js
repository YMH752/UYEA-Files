/**
 * UYEA Tools Page - tools.js
 * 工具分类标签切换与开发中提示
 */

document.addEventListener('DOMContentLoaded', () => {
    // 工具分类标签切换
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-item').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');

            const category = this.dataset.category;
            document.querySelectorAll('.tool-group').forEach(group => {
                const shouldShow = (category === 'all' || group.dataset.category === category);
                group.style.display = shouldShow ? 'block' : 'none';
            });
        });
    });

    window.addEventListener('load', function() {
        document.querySelectorAll('.tool-group').forEach(group => {
            group.style.display = 'block';
        });
    });
});
