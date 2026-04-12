document.addEventListener('DOMContentLoaded', () => {

    const searchEngine  = document.getElementById('searchEngine');
    const searchInput   = document.getElementById('searchInput');
    const hamburgerBtn  = document.getElementById('hamburgerBtn');
    const sidebar       = document.getElementById('sidebar');
    const overlay       = document.getElementById('sidebarOverlay');
    const engineBtn     = document.getElementById('engineBtn');
    const engineDropdown = document.getElementById('engineDropdown');
    const engineLabel   = document.getElementById('engineLabel');
    const engineOptions = document.querySelectorAll('.engine-option');

    const engineUrls = {
        baidu:  q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
        google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        bing:   q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    };

    window.handleSearch = () => {
        const query = searchInput.value.trim();
        if (!query) {
            searchInput.closest('.search-wrapper').classList.add('shake');
            setTimeout(() => searchInput.closest('.search-wrapper').classList.remove('shake'), 500);
            return;
        }
        const engine = searchEngine.value;
        const url = (engineUrls[engine] || engineUrls.baidu)(query);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') window.handleSearch();
    });

    /* ── 搜索引擎下拉交互修复 ── */
    if (engineBtn && engineDropdown) {
        engineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = engineDropdown.classList.toggle('open');
            engineBtn.classList.toggle('open', isOpen);
        });

        engineOptions.forEach(opt => {
            opt.addEventListener('click', function(e) {
                e.stopPropagation();
                const val = this.dataset.value;
                searchEngine.value = val;
                engineLabel.textContent = this.textContent.trim();
                
                engineOptions.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                
                engineDropdown.classList.remove('open');
                engineBtn.classList.remove('open');
            });
        });

        document.addEventListener('click', () => {
            engineDropdown.classList.remove('open');
            engineBtn.classList.remove('open');
        });
    }

    /* ── 侧边栏逻辑 ── */
    const openSidebar = () => {
        sidebar.classList.add('open');
        hamburgerBtn.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    };

    hamburgerBtn?.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    overlay?.addEventListener('click', closeSidebar);

    // 卡片波纹效果
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('pointerdown', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            ripple.style.cssText = `
                position:absolute; width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size/2}px; top:${e.clientY - rect.top - size/2}px;
                background:rgba(0,120,212,0.12); border-radius:50%;
                transform:scale(0); animation:ripple 0.5s ease-out forwards; pointer-events:none;
            `;
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
});
