let imageFiles = [];
let currentIndex = 0;
let originalImage = null;
let logoImage = null;
// Vị trí logo tính theo tỉ lệ của KHUNG CẮT (0..1), nên ảnh xem trước, ảnh tải về và xử lý hàng loạt đều khớp nhau
let logoPos = { x: 0.7, y: 0.7 };
let currentRatio = 'free'; // = rộng / cao
let cropBox = null;
const MIN_CROP = 24;

const $ = id => document.getElementById(id);

window.KhoTool.currentInit = function () {
  $('m8-imageInput').onchange = handleImage;
  $('m8-previewBtn').onclick = showPreview;
  $('m8-cropBtn').onclick = downloadResult;
  $('m8-batchBtn').onclick = processBatch;
  $('m8-resetBtn').onclick = reset;
  $('m8-logoInput').onchange = handleLogo;
  cropBox = $('m8-cropBox');

  // Pointer events chạy cho cả chuột lẫn cảm ứng
  cropBox.style.touchAction = 'none';
  $('m8-logoOverlay').style.touchAction = 'none';
  const handle = document.createElement('div');
  handle.style.cssText = 'position:absolute;right:-1px;bottom:-1px;width:22px;height:22px;background:#f472b6;border-radius:6px 0 0 0;cursor:nwse-resize;touch-action:none;';
  cropBox.appendChild(handle);
  setupCropDrag();
  setupCropResize(handle);
  setupLogoDrag($('m8-logoOverlay'));

  document.querySelectorAll('.m8-ratio-btn').forEach(btn => {
    btn.onclick = function () {
      document.querySelectorAll('.m8-ratio-btn').forEach(b => {
        b.classList.remove('bg-pink-600');
        b.classList.add('bg-slate-800');
      });
      this.classList.remove('bg-slate-800');
      this.classList.add('bg-pink-600');
      currentRatio = this.dataset.ratio === 'free' ? 'free' : parseFloat(this.dataset.ratio);
      if (originalImage) {
        initCropBox();
        showPreview();
      }
    };
  });

  $('m8-logoSize').oninput = function () {
    positionLogoOverlay();
    showPreview();
  };
  $('m8-quality').oninput = function () {
    $('m8-qualityLabel').textContent = this.value + '%';
    showPreview();
  };
};

// Kéo thả dùng pointer capture: không cần listener trên document, nên không bị rò rỉ khi mở lại tool
function makeDraggable(el, { accept, onStart, onMove, onEnd }) {
  let active = false, sx = 0, sy = 0;
  el.addEventListener('pointerdown', e => {
    if (accept && !accept(e)) return;
    active = true;
    sx = e.clientX; sy = e.clientY;
    onStart(e);
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });
  el.addEventListener('pointermove', e => {
    if (active) onMove(e.clientX - sx, e.clientY - sy);
  });
  const end = () => { if (active) { active = false; if (onEnd) onEnd(); } };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function boxRect() {
  return {
    l: parseFloat(cropBox.style.left) || 0,
    t: parseFloat(cropBox.style.top) || 0,
    w: parseFloat(cropBox.style.width) || 0,
    h: parseFloat(cropBox.style.height) || 0
  };
}

function handleImage(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  imageFiles = files;
  currentIndex = 0;
  $('m8-fileCount').textContent = files.length > 1 ? `Đã chọn ${files.length} ảnh` : '';
  $('m8-batchBtn').classList.toggle('hidden', files.length <= 1);
  loadImageAt(0);
}

function loadImageAt(index) {
  if (index >= imageFiles.length) return;
  currentIndex = index;
  const url = URL.createObjectURL(imageFiles[index]);
  const img = $('m8-preview');
  img.onload = function () {
    URL.revokeObjectURL(url);
    originalImage = img;
    $('m8-workspace').classList.remove('hidden');
    $('m8-info').textContent = `Ảnh ${index + 1}/${imageFiles.length}: ${img.naturalWidth} × ${img.naturalHeight}`;
    initCropBox();
    showPreview();
  };
  img.onerror = () => KhoTool.utils.showToast('Không đọc được ảnh', 'error');
  img.src = url;
}

function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) {
    logoImage = null;
    $('m8-logoOverlay').style.display = 'none';
    $('m8-logoOptions').classList.add('hidden');
    showPreview();
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = function () {
    logoImage = img;
    $('m8-logoOptions').classList.remove('hidden');
    const overlay = $('m8-logoOverlay');
    overlay.src = url;
    overlay.style.display = 'block';
    logoPos = { x: 0.7, y: 0.7 };
    positionLogoOverlay();
    showPreview();
    KhoTool.utils.showToast('Kéo logo để đặt vị trí');
  };
  img.src = url;
}

function initCropBox() {
  const img = originalImage;
  if (!img) return;
  cropBox.style.display = 'block';
  const size = Math.min(img.offsetWidth, img.offsetHeight) * 0.6;
  let w = size, h = size;
  if (currentRatio !== 'free') {
    if (currentRatio > 1) { w = size; h = size / currentRatio; }
    else { h = size; w = size * currentRatio; }
  }
  cropBox.style.width = w + 'px';
  cropBox.style.height = h + 'px';
  cropBox.style.left = ((img.offsetWidth - w) / 2) + 'px';
  cropBox.style.top = ((img.offsetHeight - h) / 2) + 'px';
  positionLogoOverlay();
}

function setupCropDrag() {
  let startLeft, startTop;
  makeDraggable(cropBox, {
    accept: e => e.target === cropBox,
    onStart() { const r = boxRect(); startLeft = r.l; startTop = r.t; },
    onMove(dx, dy) {
      const img = originalImage;
      if (!img) return;
      const r = boxRect();
      cropBox.style.left = Math.max(0, Math.min(startLeft + dx, img.offsetWidth - r.w)) + 'px';
      cropBox.style.top = Math.max(0, Math.min(startTop + dy, img.offsetHeight - r.h)) + 'px';
      positionLogoOverlay();
    },
    onEnd: showPreview
  });
}

function setupCropResize(handle) {
  let r0;
  makeDraggable(handle, {
    onStart() { r0 = boxRect(); },
    onMove(dx, dy) {
      const img = originalImage;
      if (!img) return;
      const maxW = img.offsetWidth - r0.l;
      const maxH = img.offsetHeight - r0.t;
      let w, h;
      if (currentRatio === 'free') {
        w = Math.max(MIN_CROP, Math.min(r0.w + dx, maxW));
        h = Math.max(MIN_CROP, Math.min(r0.h + dy, maxH));
      } else {
        w = Math.max(MIN_CROP, Math.min(r0.w + dx, maxW, maxH * currentRatio));
        h = w / currentRatio;
      }
      cropBox.style.width = w + 'px';
      cropBox.style.height = h + 'px';
      positionLogoOverlay();
    },
    onEnd: showPreview
  });
}

function positionLogoOverlay() {
  const overlay = $('m8-logoOverlay');
  if (!overlay || !originalImage || overlay.style.display === 'none' || !logoImage) return;
  const r = boxRect();
  if (!r.w || !r.h) return;
  overlay.style.width = (r.w * parseInt($('m8-logoSize').value) / 100) + 'px';
  const ow = overlay.offsetWidth, oh = overlay.offsetHeight;
  logoPos.x = Math.max(0, Math.min(logoPos.x, Math.max(0, 1 - ow / r.w)));
  logoPos.y = Math.max(0, Math.min(logoPos.y, Math.max(0, 1 - oh / r.h)));
  overlay.style.left = (r.l + logoPos.x * r.w) + 'px';
  overlay.style.top = (r.t + logoPos.y * r.h) + 'px';
}

function setupLogoDrag(overlay) {
  let sl, st;
  makeDraggable(overlay, {
    onStart() { sl = parseFloat(overlay.style.left) || 0; st = parseFloat(overlay.style.top) || 0; },
    onMove(dx, dy) {
      const r = boxRect();
      const nl = Math.max(r.l, Math.min(sl + dx, r.l + r.w - overlay.offsetWidth));
      const nt = Math.max(r.t, Math.min(st + dy, r.t + r.h - overlay.offsetHeight));
      logoPos.x = (nl - r.l) / r.w;
      logoPos.y = (nt - r.t) / r.h;
      overlay.style.left = nl + 'px';
      overlay.style.top = nt + 'px';
    },
    onEnd: showPreview
  });
}

// Vẽ vùng cắt (sx, sy, sw, sh trên ảnh gốc) + logo ra canvas. Dùng chung cho xem trước, tải về và hàng loạt.
function renderCanvas(img, sx, sy, sw, sh) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // JPEG không có nền trong suốt: nền trắng thay vì đen
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  if (logoImage) {
    const pct = parseInt($('m8-logoSize').value) / 100;
    const logoW = canvas.width * pct;
    const logoH = logoW * (logoImage.naturalHeight / logoImage.naturalWidth);
    ctx.drawImage(logoImage, logoPos.x * canvas.width, logoPos.y * canvas.height, logoW, logoH);
  }
  return canvas;
}

function getCroppedCanvas() {
  const img = originalImage;
  if (!img || !img.offsetWidth) return null;
  const scaleX = img.naturalWidth / img.offsetWidth;
  const scaleY = img.naturalHeight / img.offsetHeight;
  const r = boxRect();
  return renderCanvas(img, r.l * scaleX, r.t * scaleY, r.w * scaleX, r.h * scaleY);
}

function quality() {
  return parseInt($('m8-quality').value) / 100;
}

function baseNameOf(file, fallback) {
  return (file && file.name.replace(/\.[^.]+$/, '')) || fallback;
}

function showPreview() {
  const canvas = getCroppedCanvas();
  if (!canvas) return;
  $('m8-resultPreview').src = canvas.toDataURL('image/jpeg', quality());
  $('m8-resultBox').classList.remove('hidden');
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadResult() {
  const canvas = getCroppedCanvas();
  if (!canvas) return;
  canvas.toBlob(blob => {
    saveBlob(blob, baseNameOf(imageFiles[currentIndex], 'image') + '_edited.jpg');
    KhoTool.utils.showToast(`Đã tải (${Math.round(blob.size / 1024)} KB)`);
    KhoTool.utils.incrementCounter();
  }, 'image/jpeg', quality());
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ' + file.name)); };
    img.src = url;
  });
}

// Hàng loạt: cắt chính giữa, vùng lớn nhất đúng tỉ lệ đã chọn (Tự do = giữ nguyên ảnh), áp cùng logo
async function processBatch() {
  if (imageFiles.length <= 1) return;
  KhoTool.utils.showToast(`Đang xử lý ${imageFiles.length} ảnh...`);
  let done = 0;
  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const img = await loadImageFile(imageFiles[i]);
      const W = img.naturalWidth, H = img.naturalHeight;
      let cw = W, ch = H;
      if (currentRatio !== 'free') {
        if (W / H > currentRatio) { ch = H; cw = H * currentRatio; }
        else { cw = W; ch = W / currentRatio; }
      }
      const canvas = renderCanvas(img, (W - cw) / 2, (H - ch) / 2, cw, ch);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality()));
      saveBlob(blob, baseNameOf(imageFiles[i], 'image_' + (i + 1)) + '_edited.jpg');
      done++;
      await new Promise(r => setTimeout(r, 350)); // tránh bị trình duyệt chặn tải nhiều file
    } catch (err) {
      KhoTool.utils.showToast(err.message, 'error');
    }
  }
  if (done) {
    KhoTool.utils.showToast(`Đã xử lý ${done}/${imageFiles.length} ảnh`);
    KhoTool.utils.incrementCounter();
  }
}

function reset() {
  $('m8-imageInput').value = '';
  $('m8-workspace').classList.add('hidden');
  $('m8-resultBox').classList.add('hidden');
  $('m8-fileCount').textContent = '';
  originalImage = null;
  imageFiles = [];
  if (cropBox) cropBox.style.display = 'none';
}
