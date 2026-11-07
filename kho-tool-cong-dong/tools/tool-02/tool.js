const STORAGE_KEY = 'ktcd_saved_accounts';

window.KhoTool.currentInit = function () {
  document.getElementById('m2-generateBtn').onclick = generateQR;
  document.getElementById('m2-saveBtn').onclick = saveAccount;
  document.getElementById('m2-savedSelect').onchange = loadSavedAccount;
  renderSavedAccounts();
};

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function renderSavedAccounts() {
  const list = getSaved();
  const select = document.getElementById('m2-savedSelect');
  const box = document.getElementById('m2-savedBox');

  select.innerHTML = '<option value="">-- Chọn tài khoản đã lưu --</option>';
  list.forEach((acc, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${acc.bank} - ${acc.account} (${acc.name || 'Không tên'})`;
    select.appendChild(opt);
  });

  box.classList.toggle('hidden', list.length === 0);
}

function saveAccount() {
  const bank = document.getElementById('m2-bankSelect').value;
  const account = document.getElementById('m2-accountNo').value.trim();
  const name = document.getElementById('m2-accountName').value.trim();

  if (!account) {
    KhoTool.utils.showToast('Nhập số tài khoản trước khi lưu', 'error');
    return;
  }

  const list = getSaved();
  const exists = list.some(a => a.bank === bank && a.account === account);
  if (exists) {
    KhoTool.utils.showToast('Tài khoản này đã được lưu');
    return;
  }

  list.unshift({ bank, account, name });
  if (list.length > 10) list.pop(); // giữ tối đa 10
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  renderSavedAccounts();
  KhoTool.utils.showToast('Đã lưu tài khoản');
}

function loadSavedAccount() {
  const idx = document.getElementById('m2-savedSelect').value;
  if (idx === '') return;
  const acc = getSaved()[idx];
  if (!acc) return;

  document.getElementById('m2-bankSelect').value = acc.bank;
  document.getElementById('m2-accountNo').value = acc.account;
  document.getElementById('m2-accountName').value = acc.name || '';
}

function generateQR() {
  const bank = document.getElementById('m2-bankSelect').value;
  const account = document.getElementById('m2-accountNo').value.trim();
  const name = document.getElementById('m2-accountName').value.trim();
  const amount = document.getElementById('m2-amount').value || '0';
  const memo = document.getElementById('m2-memo').value.trim();

  if (!account) {
    KhoTool.utils.showToast('Nhập số tài khoản', 'error');
    return;
  }

  const url = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(name)}`;
  document.getElementById('m2-qrImg').src = url;
  document.getElementById('m2-qrResult').classList.remove('hidden');
  KhoTool.utils.incrementCounter();
}