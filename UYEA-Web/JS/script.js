// 在 loadNavigation 函数中，修改 fetch 路径
async function loadNavigation() {
    try {
        const resp = await fetch('/JSON/navigation.json');
        const nav = await resp.json();
        // ... 其余不变
    } catch (e) {}
}