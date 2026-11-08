window.KhoTool = window.KhoTool || {};

window.KhoTool.utils = {
  formatVND(n) {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + ' đ';
  },
  showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50 shadow-lg ${
      type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
    } text-white`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  },
  incrementCounter() {
    let count = parseInt(localStorage.getItem('ktcd_global_counter') || '0') + 1;
    localStorage.setItem('ktcd_global_counter', String(count));
    const el = document.getElementById('realTaskCounter');
    if (el) el.textContent = count.toLocaleString('vi-VN');
  }
};