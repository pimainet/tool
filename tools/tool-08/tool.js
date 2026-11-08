let imageFiles = [];
let currentIndex = 0;
let originalImage = null;
let logoImage = null;
let logoPos = { x: 0.7, y: 0.7 };
let currentRatio = 'free';
let cropBox = null;
let isDragging = false;

window.KhoTool.currentInit = function () {
  document.getElementById('m8-imageInput').onchange = handleImage;
  document.getElementById('m8-previewBtn').onclick = showPreview;
  document.getElementById('m8-cropBtn').onclick = downloadResult;
  document.getElementById('m8-batchBtn').onclick = processBatch;
  document.getElementById('m8-resetBtn').onclick = reset;
  document.getElementById('m8-logoInput').onchange = handleLogo;
  cropBox = document.getElementById('m8-cropBox');

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

  document.getElementById('m8-logoSize').oninput = function () {
    positionLogoOverlay();
    showPreview();
  };
  document.getElementById('m8-quality').oninput = function () {
    document.getElementById('m8-qualityLabel').textContent = this.value + '%';
  };
};

function handleImage(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  imageFiles = files;
  currentIndex = 0;
  document.getElementById('m8-fileCount').textContent = files.length > 1 ? `Đã chọn ${files.length} ảnh` : '';
  document.getElementById('m8-batchBtn').classList.toggle('hidden', files.length <= 1);
  loadImageAt(0);
}

function loadImageAt(index) {
  if (index >= imageFiles.length) return;
  currentIndex = index;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = document.getElementById('m8-preview');
    img.src = ev.target.result;
    img.onload = function () {
      originalImage = img;
      document.getElementById('m8-workspace').classList.remove('hidden');
      document.getElementById('m8-info').textContent = `Ảnh ${index + 1}/${imageFiles.length}: ${img.naturalWidth} × ${img.naturalHeight}`;
      initCropBox();
    };
  };
  reader.readAsDataURL(imageFiles[index]);
}

function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) { logoImage = null; return; }
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = new Image();
    img.onload = function () {
      logoImage = img;
      document.getElementById('m8-logoOptions').classList.remove('hidden');
      const overlay = document.getElementById('m8-logoOverlay');
      overlay.src = img.src;
      overlay.style.display = 'block';
      positionLogoOverlay();
      setupLogoDrag(overlay);
      showPreview();
      KhoTool.utils.showToast('Kéo logo để đặt vị trí');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function initCropBox() {
  const img = originalImage;
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
  setupDrag();
}

function setupDrag() {
  let startX, startY, startLeft, startTop;
  cropBox.onmousedown = function (e) {
    if (e.target !== cropBox) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(cropBox.style.left);
    startTop = parseFloat(cropBox.style.top);
    e.preventDefault();
  };
  document.onmousemove = function (e) {
    if (!isDragging) return;
    const img = originalImage;
    let newLeft = startLeft + (e.clientX - startX);
    let newTop = startTop + (e.clientY - startY);
    const maxLeft = img.offsetWidth - parseFloat(cropBox.style.width);
    const maxTop = img.offsetHeight - parseFloat(cropBox.style.height);
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    cropBox.style.left = newLeft + 'px';
    cropBox.style.top = newTop + 'px';
  };
  document.onmouseup = function () {
    if (isDragging) showPreview();
    isDragging = false;
  };
}

function positionLogoOverlay() {
  const overlay = document.getElementById('m8-logoOverlay');
  const img = originalImage;
  if (!overlay || !img) return;
  const sizePct = parseInt(document.getElementById('m8-logoSize').value) / 100;
  overlay.style.width = (img.offsetWidth * sizePct) + 'px';
  overlay.style.left = (logoPos.x * img.offsetWidth) + 'px';
  overlay.style.top = (logoPos.y * img.offsetHeight) + 'px';
}

function setupLogoDrag(overlay) {
  let dragging = false, sx, sy, sl, st;
  overlay.onmousedown = function (e) {
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    sl = parseFloat(overlay.style.left) || 0;
    st = parseFloat(overlay.style.top) || 0;
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    const img = originalImage;
    let nl = sl + (e.clientX - sx);
    let nt = st + (e.clientY - sy);
    nl = Math.max(0, Math.min(nl, img.offsetWidth - overlay.offsetWidth));
    nt = Math.max(0, Math.min(nt, img.offsetHeight - overlay.offsetHeight));
    overlay.style.left = nl + 'px';
    overlay.style.top = nt + 'px';
    logoPos.x = nl / img.offsetWidth;
    logoPos.y = nt / img.offsetHeight;
  });
  document.addEventListener('mouseup', function () {
    if (dragging) { dragging = false; showPreview(); }
  });
}

function getCroppedCanvas() {
  if (!originalImage) return null;
  const img = originalImage;
  const scaleX = img.naturalWidth / img.offsetWidth;
  const scaleY = img.naturalHeight / img.offsetHeight;
  const x = parseFloat(cropBox.style.left) * scaleX;
  const y = parseFloat(cropBox.style.top) * scaleY;
  const w = parseFloat(cropBox.style.width) * scaleX;
  const h = parseFloat(cropBox.style.height) * scaleY;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  if (logoImage) {
    const logoSizePct = parseInt(document.getElementById('m8-logoSize').value) / 100;
    const logoW = w * logoSizePct;
    const logoH = logoW * (logoImage.height / logoImage.width);
    const lx = logoPos.x * w;
    const ly = logoPos.y * h;
    ctx.drawImage(logoImage, lx, ly, logoW, logoH);
  }
  return canvas;
}

function showPreview() {
  const canvas = getCroppedCanvas();
  if (!canvas) return;
  document.getElementById('m8-resultPreview').src = canvas.toDataURL('image/jpeg', 0.8);
  document.getElementById('m8-resultBox').classList.remove('hidden');
}

function downloadResult() {
  const canvas = getCroppedCanvas();
  if (!canvas) return;
  const quality = parseInt(document.getElementById('m8-quality').value) / 100;
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image_edited.jpg';
    a.click();
    URL.revokeObjectURL(url);
    const sizeKB = Math.round(blob.size / 1024);
    KhoTool.utils.showToast(`Đã tải (${sizeKB} KB)`);
    KhoTool.utils.incrementCounter();
  }, 'image/jpeg', quality);
}

async function processBatch() {
  if (imageFiles.length <= 1) return;
  KhoTool.utils.showToast(`Đang xử lý ${imageFiles.length} ảnh...`);
  for (let i = 0; i < imageFiles.length; i++) {
    await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          const ratio = currentRatio === 'free' ? img.width / img.height : currentRatio;
          let cw, ch;
          if (ratio >= 1) { cw = img.width; ch = img.width / ratio; }
          else { ch = img.height; cw = img.height * ratio; }
          cw = Math.min(cw, img.width);
          ch = Math.min(ch, img.height);
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d');
          const sx = (img.width - cw) / 2;
          const sy = (img.height - ch) / 2;
          ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
          if (logoImage) {
            const logoSizePct = parseInt(document.getElementById('m8-logoSize').value) / 100;
            const logoW = cw * logoSizePct;
            const logoH = logoW * (logoImage.height / logoImage.width);
            ctx.drawImage(logoImage, logoPos.x * cw, logoPos.y * ch, logoW, logoH);
          }
          const quality = parseInt(document.getElementById('m8-quality').value) / 100;
          canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited_${i + 1}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
          }, 'image/jpeg', quality);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(imageFiles[i]);
    });
  }
  KhoTool.utils.showToast(`Đã xử lý ${imageFiles.length} ảnh`);
  KhoTool.utils.incrementCounter();
}

function reset() {
  document.getElementById('m8-imageInput').value = '';
  document.getElementById('m8-workspace').classList.add('hidden');
  document.getElementById('m8-resultBox').classList.add('hidden');
  originalImage = null;
  imageFiles = [];
  if (cropBox) cropBox.style.display = 'none';
  const overlay = document.getElementById('m8-logoOverlay');
  if (overlay) overlay.style.display = 'none';
}