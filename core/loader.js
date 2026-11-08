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

      // Load tool script, bọc trong IIFE để biến let/const của mỗi tool không đụng nhau
      // và có thể mở lại tool nhiều lần mà không lỗi "already declared"
      window.KhoTool.currentInit = null;
      const jsRes = await fetch(tool.path + 'tool.js?t=' + Date.now());
      if (jsRes.ok) {
        const code = await jsRes.text();
        const script = document.createElement('script');
        script.textContent = '(function(){\n' + code + '\n})();\n//# sourceURL=' + tool.id + '.js';
        document.body.appendChild(script);
        if (typeof window.KhoTool.currentInit === 'function') {
          window.KhoTool.currentInit();
        }
      } else {
        console.warn('Tool không có tool.js');
      }
    } catch (e) {
      container.innerHTML = `<div class="text-center py-16 text-rose-400 text-sm">Lỗi: ${e.message}</div>`;
    }
  },

  unload() {
    document.getElementById('tool-container').innerHTML = '';
    window.KhoTool.currentInit = null;
  }
};