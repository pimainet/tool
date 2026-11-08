let fixedFileText = null;
let fixedFileName = 'file';

window.KhoTool.currentInit = function () {
  document.getElementById('m7-run').onclick = runChain;
  document.getElementById('m7-clear').onclick = clearAll;
  document.getElementById('m7-copyBtn').onclick = copyResult;
  document.getElementById('m7-fileInput').onchange = handleFile;
  document.getElementById('m7-encoding').onchange = handleFile;
  document.getElementById('m7-fileDownload').onclick = downloadFixed;
};

// ---------- các bước xử lý (hàm thuần, chạy được cả ngoài trình duyệt) ----------

// Bảng đảo ngược của windows-1252: ký tự -> byte. Dùng để sửa chữ UTF-8 bị đọc nhầm thành Windows-1252.
let CP1252_REVERSE = null;
function cp1252Reverse() {
  if (CP1252_REVERSE) return CP1252_REVERSE;
  const dec = new TextDecoder('windows-1252');
  CP1252_REVERSE = new Map();
  for (let b = 0; b < 256; b++) CP1252_REVERSE.set(dec.decode(new Uint8Array([b])), b);
  return CP1252_REVERSE;
}

// Sửa một dòng bị lỗi kiểu "Ä‘Æ°á»ng". Trả về null nếu dòng không phải dạng lỗi này (giữ nguyên dòng gốc).
function fixMojibakeLine(line) {
  if (!/[^\x00-\x7f]/.test(line)) return null;
  const map = cp1252Reverse();
  const bytes = [];
  for (const ch of line) {
    const code = ch.codePointAt(0);
    if (code < 128) { bytes.push(code); continue; }
    const b = map.get(ch);
    if (b === undefined) return null; // có ký tự ngoài Windows-1252 nên đây là chữ bình thường
    bytes.push(b);
  }
  try {
    const fixed = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    return fixed !== line ? fixed : null;
  } catch (e) {
    return null;
  }
}

function fixMojibake(text) {
  let changed = 0;
  const out = text.split('\n').map(line => {
    const fixed = fixMojibakeLine(line);
    if (fixed !== null) { changed++; return fixed; }
    return line;
  }).join('\n');
  return { text: out, changed };
}

function removeAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function toSlug(text) {
  return removeAccents(text.normalize('NFC')).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanSpace(text) {
  return text.split('\n').map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean).join('\n');
}

function titleCase(text) {
  return text.toLocaleLowerCase('vi').replace(/(^|[\s\-(["'])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase('vi'));
}

function sentenceCase(text) {
  return text.replace(/(^|[.!?]\s+|\n)(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase('vi'));
}

function applyChain(text, o) {
  const notes = [];
  if (o.mojibake) {
    const r = fixMojibake(text);
    text = r.text;
    notes.push(r.changed ? `sửa ${r.changed} dòng lỗi mã hóa` : 'không có dòng nào lỗi mã hóa');
  }
  if (o.nfc) text = text.normalize('NFC');
  if (o.space) text = cleanSpace(text);
  if (o.slug) {
    // Slug thay thế cả kiểu chữ và bỏ dấu; mỗi dòng thành một slug
    text = text.split('\n').map(toSlug).filter(Boolean).join('\n');
  } else {
    if (o.caseMode === 'sentence') text = sentenceCase(text);
    else if (o.caseMode === 'title') text = titleCase(text);
    else if (o.caseMode === 'upper') text = text.toLocaleUpperCase('vi');
    else if (o.caseMode === 'lower') text = text.toLocaleLowerCase('vi');
    if (o.accent) text = removeAccents(text);
  }
  return { text, notes };
}

// ---------- giao diện ----------

function readOptions() {
  const v = id => document.getElementById(id);
  return {
    mojibake: v('m7-optMojibake').checked,
    nfc: v('m7-optNfc').checked,
    space: v('m7-optSpace').checked,
    caseMode: v('m7-optCase').value,
    accent: v('m7-optAccent').checked,
    slug: v('m7-optSlug').checked
  };
}

function runChain() {
  const input = document.getElementById('m7-input').value;
  if (!input.trim()) {
    KhoTool.utils.showToast('Nhập văn bản', 'error');
    return;
  }
  const { text, notes } = applyChain(input, readOptions());
  document.getElementById('m7-output').value = text;
  document.getElementById('m7-status').textContent = 'Kết quả' + (notes.length ? ' • ' + notes.join(', ') : '');
  document.getElementById('m7-copyBtn').classList.remove('hidden');
  KhoTool.utils.incrementCounter();
}

function clearAll() {
  document.getElementById('m7-input').value = '';
  document.getElementById('m7-output').value = '';
  document.getElementById('m7-status').textContent = 'Kết quả';
  document.getElementById('m7-copyBtn').classList.add('hidden');
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

// ---------- sửa file ----------

function decodeBytes(bytes, encoding) {
  if (encoding === 'auto') {
    try {
      return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), used: 'UTF-8' };
    } catch (e) {
      return { text: new TextDecoder('windows-1258').decode(bytes), used: 'Windows-1258 (file không phải UTF-8 hợp lệ)' };
    }
  }
  return { text: new TextDecoder(encoding).decode(bytes), used: encoding.toUpperCase() };
}

function handleFile() {
  const file = document.getElementById('m7-fileInput').files[0];
  if (!file) return;
  fixedFileName = file.name.replace(/\.[^.]+$/, '') || 'file';
  const ext = (file.name.match(/\.[^.]+$/) || ['.csv'])[0].toLowerCase();
  fixedFileName += '_utf8' + ext;

  const reader = new FileReader();
  reader.onerror = () => KhoTool.utils.showToast('Không đọc được file', 'error');
  reader.onload = ev => {
    let bytes = new Uint8Array(ev.target.result);
    const hadBom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    if (hadBom) bytes = bytes.subarray(3);

    const { text, used } = decodeBytes(bytes, document.getElementById('m7-encoding').value);
    const fixed = fixMojibake(text);
    fixedFileText = fixed.text.normalize('NFC');

    const info = [`Đọc bằng ${used}`];
    if (hadBom) info.push('file đã có BOM');
    if (fixed.changed) info.push(`sửa ${fixed.changed} dòng lỗi mã hóa`);
    document.getElementById('m7-fileInfo').textContent = info.join(' • ');
    document.getElementById('m7-filePreview').textContent = fixedFileText.split('\n').slice(0, 8).join('\n');
    document.getElementById('m7-fileBox').classList.remove('hidden');
  };
  reader.readAsArrayBuffer(file);
}

function downloadFixed() {
  if (fixedFileText === null) return;
  const blob = new Blob(['﻿' + fixedFileText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fixedFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  KhoTool.utils.showToast('Đã tải file UTF-8');
  KhoTool.utils.incrementCounter();
}
