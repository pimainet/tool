let rawData = [];
let workbook = null;
let barChart = null;
let doughnutChart = null;
let lineChart = null;
let logoDataUrl = '';
let originalLogoUrl = '';
let cropStart = null;
let cropRect = null;
let lastTotals = {};
let lastGrand = 0;

window.KhoTool.currentInit = function () {
  document.getElementById('m6-excelInput').onchange = handleFile;
  document.getElementById('m6-buildBtn').onclick = buildDashboard;
  document.getElementById('m6-resetBtn').onclick = reset;
  document.getElementById('m6-printBtn').onclick = printReport;
  document.getElementById('m6-sheetSelect').onchange = changeSheet;
  document.getElementById('m6-applyFilter').onclick = applyFilter;
  document.getElementById('m6-clearFilter').onclick = clearFilter;
  const logoInput = document.getElementById('m6-logoInput');
  if (logoInput) logoInput.onchange = handleLogo;
  const cropBtn = document.getElementById('m6-cropBtn');
  const resetCropBtn = document.getElementById('m6-resetCropBtn');
  if (cropBtn) cropBtn.onclick = applyCrop;
  if (resetCropBtn) resetCropBtn.onclick = resetCrop;
  loadSavedCompany();
};

function loadSavedCompany() {
  try {
    const v = localStorage.getItem('ktcd_m6_company');
    const el = document.getElementById('m6-companyName');
    if (v && el && !el.value) el.value = v;
  } catch (e) {}
}

function saveCompany() {
  try {
    const el = document.getElementById('m6-companyName');
    if (el) localStorage.setItem('ktcd_m6_company', el.value.trim());
  } catch (e) {}
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    KhoTool.utils.showToast('Thư viện Excel chưa tải. Tải lại trang.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onerror = function () {
    KhoTool.utils.showToast('Không đọc được file', 'error');
  };
  reader.onload = function (ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      workbook = XLSX.read(data, { type: 'array' });
      if (!workbook.SheetNames || !workbook.SheetNames.length) {
        KhoTool.utils.showToast('File không có dữ liệu', 'error');
        return;
      }
      loadSheet(workbook.SheetNames[0]);
      const sheetSelect = document.getElementById('m6-sheetSelect');
      sheetSelect.innerHTML = '';
      workbook.SheetNames.forEach(name => sheetSelect.add(new Option(name, name)));
      document.getElementById('m6-sheetBox').classList.toggle('hidden', workbook.SheetNames.length <= 1);
      KhoTool.utils.showToast('Đã đọc file');
    } catch (err) {
      console.error(err);
      KhoTool.utils.showToast('Lỗi: ' + (err.message || 'không đọc được'), 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function loadSheet(sheetName) {
  rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (!rawData.length) { KhoTool.utils.showToast('Sheet trống', 'error'); return; }
  const headers = Object.keys(rawData[0]);
  fillSelect('m6-catColSelect', headers);
  fillSelect('m6-valColSelect', headers);
  fillSelect('m6-dateColSelect', headers, true);
  headers.forEach(h => {
    const lower = h.toLowerCase();
    if (lower.includes('doanh') || lower.includes('tiền') || lower.includes('gia') || lower.includes('amount')) document.getElementById('m6-valColSelect').value = h;
    if (lower.includes('tên') || lower.includes('name') || lower.includes('mục') || lower.includes('category')) document.getElementById('m6-catColSelect').value = h;
    if (lower.includes('ngày') || lower.includes('date') || lower.includes('thời')) document.getElementById('m6-dateColSelect').value = h;
  });
  document.getElementById('m6-rowCount').textContent = `${rawData.length} dòng`;
  document.getElementById('m6-wizardBox').classList.remove('hidden');
}

function changeSheet() {
  const name = document.getElementById('m6-sheetSelect').value;
  if (name) loadSheet(name);
}

function fillSelect(id, headers, optional = false) {
  const sel = document.getElementById(id);
  sel.innerHTML = optional ? '<option value="">-- Không dùng --</option>' : '';
  headers.forEach(h => sel.add(new Option(h, h)));
}

function parseNumber(val) {
  if (typeof val === 'number') return val;
  return parseFloat(String(val || '').replace(/[^0-9.-]/g, '')) || 0;
}

function buildDashboard() {
  const catCol = document.getElementById('m6-catColSelect').value;
  const valCol = document.getElementById('m6-valColSelect').value;
  const dateCol = document.getElementById('m6-dateColSelect').value;
  const topN = parseInt(document.getElementById('m6-topN').value) || 0;
  const title = document.getElementById('m6-reportTitle').value.trim() || 'Báo cáo tổng quan';

  if (!catCol || !valCol) { KhoTool.utils.showToast('Chọn cột phân loại và giá trị', 'error'); return; }

  const totals = {};
  const timeTotals = {};
  let grandTotal = 0;
  let validRows = 0;

  rawData.forEach(row => {
    const cat = String(row[catCol] || '').trim();
    const val = parseNumber(row[valCol]);
    if (!cat || !val || cat.toLowerCase().includes('total')) return;
    totals[cat] = (totals[cat] || 0) + val;
    grandTotal += val;
    validRows++;
    if (dateCol && row[dateCol]) {
      const dateStr = String(row[dateCol]).slice(0, 10);
      timeTotals[dateStr] = (timeTotals[dateStr] || 0) + val;
    }
  });

  if (!validRows) { KhoTool.utils.showToast('Không có dữ liệu hợp lệ', 'error'); return; }

  lastTotals = totals;
  lastGrand = grandTotal;

  saveCompany();
  renderResult(totals, grandTotal, validRows, topN, title, timeTotals, dateCol);
  document.getElementById('m6-filterBar').classList.remove('hidden');
  document.getElementById('m6-uploadSection').classList.add('hidden');
  document.getElementById('m6-dashboardSection').classList.remove('hidden');
  document.getElementById('m6-dashboardSection').style.animation = 'fadeIn 0.4s ease';
  KhoTool.utils.showToast('Đã tạo báo cáo');
  KhoTool.utils.incrementCounter();
}

function generateInsight(sorted, totals, grandTotal) {
  if (!sorted.length || !grandTotal) return 'Không đủ dữ liệu để nhận xét.';

  const top = sorted[0];
  const topVal = totals[top];
  const topPct = ((topVal / grandTotal) * 100).toFixed(1);
  const fmt = KhoTool.utils.formatVND;
  const lines = [];

  lines.push(`<strong>Tổng quan:</strong> Tổng giá trị đạt ${fmt(grandTotal)} trên ${Object.keys(totals).length} nhóm.`);
  lines.push(`<strong>Dẫn đầu:</strong> ${top} chiếm ${topPct}% (${fmt(topVal)}), là nhóm đóng góp lớn nhất.`);

  if (sorted.length >= 3) {
    const top3Sum = sorted.slice(0, 3).reduce((s, k) => s + totals[k], 0);
    const top3Pct = ((top3Sum / grandTotal) * 100).toFixed(1);
    lines.push(`<strong>Tập trung:</strong> Top 3 nhóm chiếm ${top3Pct}% tổng giá trị.`);
  }

  if (sorted.length >= 5) {
    const bottom = sorted[sorted.length - 1];
    const bottomPct = ((totals[bottom] / grandTotal) * 100).toFixed(1);
    if (parseFloat(bottomPct) < 5) {
      lines.push(`<strong>Lưu ý:</strong> Nhóm nhỏ nhất (${bottom}) chỉ chiếm ${bottomPct}%.`);
    }
  }

  return lines.join('<br>');
}

function renderResult(totals, grandTotal, validRows, topN, title, timeTotals, dateCol) {
  let sorted = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
  if (topN > 0) sorted = sorted.slice(0, topN);
  const values = sorted.map(k => totals[k]);

  document.getElementById('m6-insightBox').classList.remove('hidden');
  document.getElementById('m6-insightText').innerHTML = generateInsight(sorted, totals, grandTotal);
  document.getElementById('m6-kpiTotal').textContent = KhoTool.utils.formatVND(grandTotal);
  document.getElementById('m6-kpiAvg').textContent = KhoTool.utils.formatVND(grandTotal / (validRows || 1));
  document.getElementById('m6-kpiCount').textContent = (validRows || Object.keys(totals).length).toLocaleString('vi-VN');
  document.getElementById('m6-kpiTop').textContent = sorted[0] || '-';

  const tbody = document.getElementById('m6-detailTable');
  tbody.innerHTML = sorted.map(k => {
    const pct = grandTotal ? ((totals[k] / grandTotal) * 100).toFixed(1) : 0;
    return `<tr class="border-t border-slate-800"><td class="px-4 py-2">${k}</td><td class="px-4 py-2 text-right">${KhoTool.utils.formatVND(totals[k])}</td><td class="px-4 py-2 text-right">${pct}%</td></tr>`;
  }).join('');

  if (barChart) barChart.destroy();
  if (doughnutChart) doughnutChart.destroy();
  if (lineChart) lineChart.destroy();

  const colors = ['#f43f5e','#818cf8','#34d399','#fbbf24','#38bdf8','#a78bfa','#fb7185','#4ade80'];

  barChart = new Chart(document.getElementById('m6-barChart'), {
    type: 'bar',
    data: { labels: sorted, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  doughnutChart = new Chart(document.getElementById('m6-doughnutChart'), {
    type: 'doughnut',
    data: { labels: sorted, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const timeBox = document.getElementById('m6-timeChartBox');
  if (dateCol && timeTotals && Object.keys(timeTotals).length > 1) {
    const timeLabels = Object.keys(timeTotals).sort();
    lineChart = new Chart(document.getElementById('m6-lineChart'), {
      type: 'line',
      data: { labels: timeLabels, datasets: [{ data: timeLabels.map(k => timeTotals[k]), borderColor: '#38bdf8', tension: 0.3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    timeBox.classList.remove('hidden');
  } else {
    timeBox.classList.add('hidden');
  }
}

function applyFilter() {
  const q = document.getElementById('m6-filterText').value.trim().toLowerCase();
  const minVal = parseFloat(document.getElementById('m6-filterMin').value) || 0;
  const maxVal = parseFloat(document.getElementById('m6-filterMax').value) || Infinity;

  const filtered = {};
  let sum = 0;
  Object.keys(lastTotals).forEach(k => {
    const val = lastTotals[k];
    const matchText = !q || k.toLowerCase().includes(q);
    const matchVal = val >= minVal && val <= maxVal;
    if (matchText && matchVal) {
      filtered[k] = val;
      sum += val;
    }
  });

  const topN = parseInt(document.getElementById('m6-topN').value) || 0;
  const title = document.getElementById('m6-reportTitle').value.trim() || 'Báo cáo tổng quan';
  renderResult(filtered, sum, Object.keys(filtered).length, topN, title + ' (đã lọc)', null, '');
}

function clearFilter() {
  document.getElementById('m6-filterText').value = '';
  document.getElementById('m6-filterMin').value = '';
  document.getElementById('m6-filterMax').value = '';
  const topN = parseInt(document.getElementById('m6-topN').value) || 0;
  const title = document.getElementById('m6-reportTitle').value.trim() || 'Báo cáo tổng quan';
  renderResult(lastTotals, lastGrand, Object.keys(lastTotals).length, topN, title, null, '');
}

function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) { logoDataUrl = ''; return; }
  const reader = new FileReader();
  reader.onload = function (ev) {
    originalLogoUrl = ev.target.result;
    logoDataUrl = originalLogoUrl;
    const img = document.getElementById('m6-logoPreview');
    img.src = originalLogoUrl;
    document.getElementById('m6-logoPreviewBox').classList.remove('hidden');
    setupCropInteraction(img);
  };
  reader.readAsDataURL(file);
}

function setupCropInteraction(img) {
  const box = document.getElementById('m6-cropBox');
  let isDragging = false;
  let startX, startY;

  img.onmousedown = function (e) {
    isDragging = true;
    const rect = img.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    box.style.display = 'block';
    box.style.left = startX + 'px';
    box.style.top = startY + 'px';
    box.style.width = '0px';
    box.style.height = '0px';
  };

  img.onmousemove = function (e) {
    if (!isDragging) return;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - startX;
    const h = y - startY;
    box.style.left = (w < 0 ? x : startX) + 'px';
    box.style.top = (h < 0 ? y : startY) + 'px';
    box.style.width = Math.abs(w) + 'px';
    box.style.height = Math.abs(h) + 'px';
  };

  img.onmouseup = function () { isDragging = false; };
  img.onmouseleave = function () { isDragging = false; };
}

function applyCrop() {
  const img = document.getElementById('m6-logoPreview');
  const box = document.getElementById('m6-cropBox');
  if (box.style.display === 'none' || !box.style.width) {
    KhoTool.utils.showToast('Kéo để chọn vùng logo trước', 'error');
    return;
  }

  const scaleX = img.naturalWidth / img.offsetWidth;
  const scaleY = img.naturalHeight / img.offsetHeight;
  const x = parseFloat(box.style.left) * scaleX;
  const y = parseFloat(box.style.top) * scaleY;
  const w = parseFloat(box.style.width) * scaleX;
  const h = parseFloat(box.style.height) * scaleY;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tempImg = new Image();
  tempImg.onload = function () {
    ctx.drawImage(tempImg, x, y, w, h, 0, 0, w, h);
    logoDataUrl = canvas.toDataURL('image/png');
    img.src = logoDataUrl;
    box.style.display = 'none';
    KhoTool.utils.showToast('Đã cắt logo');
  };
  tempImg.src = originalLogoUrl;
}

function resetCrop() {
  logoDataUrl = originalLogoUrl;
  document.getElementById('m6-logoPreview').src = originalLogoUrl;
  document.getElementById('m6-cropBox').style.display = 'none';
  KhoTool.utils.showToast('Đã dùng ảnh gốc');
}

function printReport() {
  const title = document.getElementById('m6-reportHeader').textContent;
  const company = document.getElementById('m6-companyName').value.trim();
  const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" style="height:48px;margin-bottom:8px;">` : '';
  const companyHtml = company ? `<div style="font-size:13px;font-weight:600;margin-bottom:4px;">${company}</div>` : '';
  const barImg = document.getElementById('m6-barChart').toDataURL('image/png');
  const doughImg = document.getElementById('m6-doughnutChart').toDataURL('image/png');
  const lineCanvas = document.getElementById('m6-lineChart');
  const lineImg = lineCanvas && lineChart ? lineCanvas.toDataURL('image/png') : '';
  const lineHtml = lineImg ? `<div style="margin-bottom:16px;"><img src="${lineImg}" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;"></div>` : '';
  const tableHtml = document.querySelector('#m6-detailTable').closest('table').outerHTML;

  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 32px; color: #111; max-width: 900px; margin: 0 auto; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .company { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
      .kpi { display: flex; gap: 16px; margin-bottom: 24px; }
      .kpi div { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; flex: 1; }
      .kpi strong { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; }
      .charts { display: flex; gap: 12px; margin-bottom: 16px; justify-content: center; }
      .charts img { width: 47%; border: 1px solid #e2e8f0; border-radius: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px 12px; }
      th { background: #f1f5f9; text-align: left; }
      .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
    </style></head><body>
      ${logoHtml}
      ${companyHtml}
      <h1>${title}</h1>
      <div class="meta">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} • Kho Tool Cộng Đồng</div>
      <div class="kpi">
        <div><strong>Tổng giá trị</strong>${document.getElementById('m6-kpiTotal').textContent}</div>
        <div><strong>Trung bình</strong>${document.getElementById('m6-kpiAvg').textContent}</div>
        <div><strong>Số dòng</strong>${document.getElementById('m6-kpiCount').textContent}</div>
      </div>
      <div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:8px;font-weight:600;">PHÂN BỔ THEO NHÓM</div>
      <div class="charts">
        <img src="${barImg}" style="width:48%;border:1px solid #e2e8f0;border-radius:6px;">
        <img src="${doughImg}" style="width:48%;border:1px solid #e2e8f0;border-radius:6px;">
      </div>
      ${lineHtml}
      ${tableHtml}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-top:20px;font-size:13px;">
        <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px;">NHẬN XÉT</div>
        ${document.getElementById('m6-insightText').innerHTML}
      </div>
      <div class="footer">Báo cáo được tạo tự động • Dữ liệu xử lý trên trình duyệt</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function reset() {
  document.getElementById('m6-excelInput').value = '';
  document.getElementById('m6-wizardBox').classList.add('hidden');
  document.getElementById('m6-dashboardSection').classList.add('hidden');
  document.getElementById('m6-uploadSection').classList.remove('hidden');
  document.getElementById('m6-filterBar').classList.add('hidden');
  rawData = [];
  workbook = null;
  lastTotals = {};
  if (barChart) { barChart.destroy(); barChart = null; }
  if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
  if (lineChart) { lineChart.destroy(); lineChart = null; }
}