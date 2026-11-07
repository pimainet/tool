window.KhoTool.currentInit = function () {
  document.getElementById('m7-removeAccent').onclick = () => process('accent');
  document.getElementById('m7-cleanLines').onclick = () => process('lines');
  document.getElementById('m7-capitalize').onclick = () => process('capitalize');
  document.getElementById('m7-cleanSpace').onclick = () => process('space');
  document.getElementById('m7-copyBtn').onclick = copyResult;
};

function process(type) {
  let text = document.getElementById('m7-input').value;
  if (!text.trim()) {
    KhoTool.utils.showToast('Nhập văn bản', 'error');
    return;
  }

  if (type === 'accent') {
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  } else if (type === 'lines') {
    text = text.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  } else if (type === 'capitalize') {
    text = text.replace(/(^|[.!?]\s+)([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])/gi, (m, p1, p2) => p1 + p2.toUpperCase());
  } else if (type === 'space') {
    text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  }

  document.getElementById('m7-output').value = text;
  document.getElementById('m7-copyBtn').classList.remove('hidden');
  KhoTool.utils.incrementCounter();
}

function copyResult() {
  const text = document.getElementById('m7-output').value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    KhoTool.utils.showToast('Đã sao chép');
  }).catch(() => {
    KhoTool.utils.showToast('Không sao chép được', 'error');
  });
}