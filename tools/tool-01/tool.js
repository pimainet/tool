window.KhoTool.currentInit = function () {
  const btn = document.getElementById('m1-cleanBtn');
  const copyBtn = document.getElementById('m1-copyBtn');
  if (btn) btn.onclick = cleanData;
  if (copyBtn) copyBtn.onclick = copyResult;
};

// Bắt chuỗi: đầu số (+84 / 84 / 0) rồi đúng 9 chữ số, cho phép cách nhau bằng dấu cách, chấm, gạch ngang.
// (?<!\d) và (?!\d) đảm bảo không cắt ra từ giữa một dãy số dài (vd số tài khoản).
const PHONE_CANDIDATE = /(?<![\d])(?:\+?84|0)(?:[\s.\-]?\d){9}(?!\d)/g;
// Số bàn: 0 + mã vùng + số thuê bao, tổng 11 chữ số (vd 024 3825 1234)
const LANDLINE_CANDIDATE = /(?<![\d])(?:\+?84|0)(?:[\s.\-]?\d){10}(?!\d)/g;
const MOBILE_RE = /^0(?:3|5|7|8|9)\d{8}$/;
const LANDLINE_RE = /^02\d{9}$/;

// Trả về số dạng 0xxxxxxxxx hoặc null nếu không hợp lệ
function normalizePhone(raw, allowLandline) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84')) digits = '0' + digits.slice(2);
  if (MOBILE_RE.test(digits)) return digits;
  if (allowLandline && LANDLINE_RE.test(digits)) return digits;
  return null;
}

function cleanData() {
  const text = document.getElementById('m1-inputText').value.trim();
  const keepContext = document.getElementById('m1-keepContext').checked;
  const allowLandline = document.getElementById('m1-landline').checked;
  const intl = document.getElementById('m1-format').value === 'intl';
  const output = document.getElementById('m1-outputResult');
  const countEl = document.getElementById('m1-count');
  const copyBtn = document.getElementById('m1-copyBtn');

  if (!text) {
    KhoTool.utils.showToast('Vui lòng nhập văn bản', 'error');
    return;
  }

  const results = [];
  const seen = new Set();
  let duplicates = 0;

  text.split('\n').forEach(line => {
    const found = [...line.matchAll(PHONE_CANDIDATE)];
    if (allowLandline) found.push(...line.matchAll(LANDLINE_CANDIDATE));
    found.sort((a, b) => a.index - b.index);
    found.forEach(m => {
      const raw = m[0];
      const phone = normalizePhone(raw, allowLandline);
      if (!phone) return;
      if (seen.has(phone)) { duplicates++; return; }
      seen.add(phone);
      const shown = intl ? '+84' + phone.slice(1) : phone;
      results.push(keepContext ? line.trim() + '  →  ' + shown : shown);
    });
  });

  if (results.length === 0) {
    output.value = '';
    countEl.textContent = 'Không tìm thấy số điện thoại hợp lệ.';
    copyBtn.classList.add('hidden');
    return;
  }

  output.value = results.join('\n');
  countEl.textContent = `Tìm thấy ${results.length} số` + (duplicates ? ` (đã loại ${duplicates} số trùng).` : '.');
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
