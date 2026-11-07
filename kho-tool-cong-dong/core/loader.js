window.KhoTool = window.KhoTool || {};

window.KhoTool.loader = {
  async load(tool) {
    const container = document.getElementById('tool-container');
    container.innerHTML = '<div class="text-center py-16 text-slate-400 text-sm">Đang tải tool...</div>';

    try {
      const htmlRes = await fetch(tool.path + 'tool.html');
      if (!htmlRes.ok) throw new Error('Không tìm thấy giao diện tool');
      const html = await htmlRes.text();
      container.innerHTML = html;

      // Load tool script
      const script = document.createElement('script');
      script.src = tool.path + 'tool.js?t=' + Date.now();
      script.onload = () => {
        if (typeof window.KhoTool.currentInit === 'function') {
          window.KhoTool.currentInit();
        }
      };
      script.onerror = () => {
        console.warn('Tool không có tool.js hoặc lỗi load');
      };
      document.body.appendChild(script);
    } catch (e) {
      container.innerHTML = `<div class="text-center py-16 text-rose-400 text-sm">Lỗi: ${e.message}</div>`;
    }
  },

  unload() {
    document.getElementById('tool-container').innerHTML = '';
    window.KhoTool.currentInit = null;
  }
};