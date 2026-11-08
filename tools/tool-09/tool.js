let rawData = null;
let workbook = null;
let sourceIsCsv = false;
let baseName = 'export';
let imageFiles = [];

window.KhoTool.currentInit = function () {
  document.getElementById('m9-fileInput').onchange = handleFile;
  document.getElementById('m9-sheetSelect').onchange = changeSheet;
  document.getElementById('m9-toJson').onclick = () => exportData('json');
  document.getElementById('m9-toCsv').onclick = () => exportData('csv');
  document.getElementById('m9-toXlsx').onclick = () => exportData('xlsx');
  document.getElementById('m9-imageInput').onchange = handleImages;
  document.getElementById('m9-convertImages').onclick = convertImages;
};

// Làm phẳng object lồng nhau: {a:{b:1}} -> {"a.b":1}; mảng được chuyển thành chuỗi JSON
function flattenRow(obj, prefix = '', out = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix || 'value'] = Array.isArray(obj) ? JSON.stringify(obj) : obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flattenRow(v, key, out);
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
}

function toRows() {
  let data = rawData;
  // JSON dạng {"data":[...]}: lấy mảng duy nhất bên trong
  if (data && !Array.isArray(data) && typeof data === 'object') {
    const arrays = Object.values(data).filter(v => Array.isArray(v) && v.length && typeof v[0] === 'object');
    if (arrays.length === 1 && Object.keys(data).length === 1) data = arrays[0];
  }
  const arr = Array.isArray(data) ? data : [data];
  return arr.map(r => (r && typeof r === 'object') ? flattenRow(r) : { value: r });
}

function showData(label) {
  const count = Array.isArray(rawData) ? rawData.length : 1;
  document.getElementById('m9-fileInfo').textContent = `${label}Đã đọc ${count} dòng.`;
  document.getElementById('m9-fileActions').classList.remove('hidden');
  const preview = document.getElementById('m9-preview');
  const sample = Array.isArray(rawData) ? rawData.slice(0, 3) : rawData;
  preview.textContent = JSON.stringify(sample, null, 2);
  preview.classList.remove('hidden');
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();
  baseName = file.name.replace(/\.[^.]+$/, '') || 'export';
  const isJson = name.endsWith('.json');
  const isCsv = name.endsWith('.csv');

  if (!isJson && typeof XLSX === 'undefined') {
    KhoTool.utils.showToast('Thư viện Excel chưa tải. Tải lại trang.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => KhoTool.utils.showToast('Không đọc được file', 'error');
  reader.onload = function (ev) {
    try {
      workbook = null;
      sourceIsCsv = isCsv;
      document.getElementById('m9-sheetBox').classList.add('hidden');
      if (isJson) {
        rawData = JSON.parse(ev.target.result);
        showData('');
      } else {
        // CSV phải đọc dạng văn bản UTF-8, nếu không tiếng Việt sẽ bị lỗi font
        workbook = isCsv
          ? XLSX.read(ev.target.result, { type: 'string', raw: true })
          : XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
        const sel = document.getElementById('m9-sheetSelect');
        sel.innerHTML = '';
        workbook.SheetNames.forEach(n => sel.add(new Option(n, n)));
        document.getElementById('m9-sheetBox').classList.toggle('hidden', workbook.SheetNames.length <= 1);
        loadSheet(workbook.SheetNames[0]);
      }
      KhoTool.utils.showToast('Đã đọc file');
    } catch (err) {
      console.error(err);
      KhoTool.utils.showToast('Không đọc được file', 'error');
    }
  };

  if (isJson || isCsv) reader.readAsText(file, 'UTF-8');
  else reader.readAsArrayBuffer(file);
}

// CSV đọc ở dạng chuỗi nguyên bản. Chuyển các chuỗi số thuần (1500, -2.5) thành số để xuất JSON/Excel đúng kiểu.
// Giữ nguyên dạng chữ với số có 0 đầu (SĐT 0912345678) và dãy quá dài (mã, số tài khoản).
function coerceRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = (typeof v === 'string' && /^-?(?:0|[1-9]\d{0,14})(?:\.\d+)?$/.test(v)) ? Number(v) : v;
  }
  return out;
}

function loadSheet(sheetName) {
  rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (sourceIsCsv) rawData = rawData.map(coerceRow);
  showData(workbook.SheetNames.length > 1 ? `Sheet "${sheetName}": ` : '');
}

function changeSheet() {
  const name = document.getElementById('m9-sheetSelect').value;
  if (workbook && name) loadSheet(name);
}

function exportData(type) {
  if (!rawData) return;
  if (type === 'json') {
    download(JSON.stringify(rawData, null, 2), 'application/json', baseName + '.json');
  } else if (type === 'csv') {
    const ws = XLSX.utils.json_to_sheet(toRows());
    // BOM giúp Excel mở CSV UTF-8 đúng tiếng Việt
    download('﻿' + XLSX.utils.sheet_to_csv(ws), 'text/csv;charset=utf-8', baseName + '.csv');
  } else {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows()), 'Sheet1');
    XLSX.writeFile(wb, baseName + '.xlsx');
  }
  KhoTool.utils.incrementCounter();
}

function handleImages(e) {
  imageFiles = Array.from(e.target.files);
  const box = document.getElementById('m9-imageActionBox');
  if (imageFiles.length) {
    document.getElementById('m9-imageMeta').textContent = `Đã chọn ${imageFiles.length} ảnh.`;
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh ' + file.name)); };
    img.src = url;
  });
}

function canvasToBlob(canvas, format, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, format, quality));
}

async function convertImages() {
  const format = document.getElementById('m9-imageFormatSelect').value;
  if (!imageFiles.length) return;
  const ext = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];

  KhoTool.utils.showToast('Đang chuyển đổi ảnh...');
  let done = 0;
  for (const file of imageFiles) {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (format === 'image/jpeg') { // JPEG không có nền trong suốt: tô nền trắng thay vì để đen
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, format, 0.9);
      if (!blob) throw new Error('Trình duyệt không hỗ trợ định dạng này');
      const base = file.name.replace(/\.[^.]+$/, '') || 'image';
      download(blob, format, `${base}.${ext}`);
      done++;
      // Chờ giữa các lần tải để trình duyệt không chặn tải nhiều file
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      KhoTool.utils.showToast(err.message, 'error');
    }
  }
  if (done) {
    KhoTool.utils.incrementCounter();
    KhoTool.utils.showToast(`Đã chuyển ${done}/${imageFiles.length} ảnh`);
  }
}

function download(content, mime, filename) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
