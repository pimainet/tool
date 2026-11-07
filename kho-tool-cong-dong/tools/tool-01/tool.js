window.KhoTool.currentInit = function () {
  const btn = document.getElementById('m1-cleanBtn');
  const copyBtn = document.getElementById('m1-copyBtn');
  if (btn) btn.onclick = cleanData;
  if (copyBtn) copyBtn.onclick = copyResult;
};

function cleanData() {
  const text = document.getElementById('m1-inputText').value.trim();
  const keepContext = document.getElementById('m1-keepContext').checked;
  const output = document.getElementById('m1-outputResult');
  const countEl = document.getElementById('m1-count');
  const copyBtn = document.getElementById('m1-copyBtn');

  if (!text) {
    KhoTool.utils.showToast('Vui lòng nhập văn bản', 'error');
    return;
  }

  const lines = text.split('\n');
  const results = [];
  const seen = new Set();

  lines.forEach(line => {
    const matches = line.match(/(84|0[3|5|7|8|9])([0-9]{8})/g) || [];
    matches.forEach(phone => {
      if (seen.has(phone)) return;
      seen.add(phone);
      if (keepContext) {
        results.push(line.trim() + '  →  ' + phone);
      } else {
        results.push(phone);
      }
    });
  });

  if (results.length === 0) {
    output.value = '';
    countEl.textContent = 'Không tìm thấy số điện thoại hợp lệ.';
    copyBtn.classList.add('hidden');
    return;
  }

  output.value = results.join('\n');
  countEl.textContent = `Tìm thấy ${results.length} số (đã loại trùng).`;
  copyBtn.classList.remove('hidden');
  KhoTool.utils.incrementCounter();
}

function copyResult() {
  const text = document.getElementById('m1-outputResult').value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    KhoTool.utils.showToast('Đã sao chép');
  }).catch(() => {
    KhoTool.utils.showToast('Không sao chép được', 'error');
  });
}