let rawData = null;
let imageFiles = [];

window.KhoTool.currentInit = function () {
  document.getElementById('m9-fileInput').onchange = handleFile;
  document.getElementById('m9-toJson').onclick = () => exportData('json');
  document.getElementById('m9-toCsv').onclick = () => exportData('csv');
  document.getElementById('m9-imageInput').onchange = handleImages;
  document.getElementById('m9-convertImages').onclick = convertImages;
};

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      if (file.name.endsWith('.json')) {
        rawData = JSON.parse(ev.target.result);
      } else {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        rawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      }

      const count = Array.isArray(rawData) ? rawData.length : 1;
      document.getElementById('m9-fileInfo').textContent = `Đã đọc ${count} dòng.`;
      document.getElementById('m9-fileActions').classList.remove('hidden');

      // Preview
      const preview = document.getElementById('m9-preview');
      const sample = Array.isArray(rawData) ? rawData.slice(0, 3) : rawData;
      preview.textContent = JSON.stringify(sample, null, 2);
      preview.classList.remove('hidden');

      KhoTool.utils.showToast('Đã đọc file');
    } catch (err) {
      KhoTool.utils.showToast('Không đọc được file', 'error');
    }
  };

  if (file.name.endsWith('.json')) reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function exportData(type) {
  if (!rawData) return;
  if (type === 'json') {
    download(JSON.stringify(rawData, null, 2), 'application/json', 'export.json');
  } else {
    const ws = XLSX.utils.json_to_sheet(Array.isArray(rawData) ? rawData : [rawData]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    download(csv, 'text/csv', 'export.csv');
  }
  KhoTool.utils.incrementCounter();
}

function handleImages(e) {
  imageFiles = Array.from(e.target.files);
  if (imageFiles.length) {
    document.getElementById('m9-imageMeta').textContent = `Đã chọn ${imageFiles.length} ảnh.`;
    document.getElementById('m9-imageActionBox').classList.remove('hidden');
  }
}

function convertImages() {
  const format = document.getElementById('m9-imageFormatSelect').value;
  if (!imageFiles.length) return;

  imageFiles.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ext = format.split('/')[1] === 'jpeg' ? 'jpg' : format.split('/')[1];
          a.download = `converted_${i + 1}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        }, format, 0.9);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  KhoTool.utils.incrementCounter();
  KhoTool.utils.showToast('Đang chuyển đổi ảnh...');
}

function download(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}