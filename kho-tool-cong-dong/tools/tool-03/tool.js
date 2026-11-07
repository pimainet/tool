const TEMPLATES = {
  lead: `🔔 Lead mới
Tên: [Tên khách]
SĐT: [Số điện thoại]
Nhu cầu: [Nhu cầu]
Nguồn: Form website`,
  order: `🛒 Đơn hàng mới
Khách: [Tên khách]
SĐT: [Số điện thoại]
Sản phẩm: [Tên sản phẩm]
Giá trị: [Số tiền]`,
  contact: `📩 Khách liên hệ
Tên: [Tên khách]
SĐT: [Số điện thoại]
Nội dung: [Nội dung liên hệ]`
};

window.KhoTool.currentInit = function () {
  document.getElementById('m3-sendBtn').onclick = sendTelegram;
  document.getElementById('m3-templateSelect').onchange = applyTemplate;
};

function applyTemplate() {
  const key = document.getElementById('m3-templateSelect').value;
  if (!key || !TEMPLATES[key]) return;
  document.getElementById('m3-message').value = TEMPLATES[key];
}

async function sendTelegram() {
  const token = document.getElementById('m3-botToken').value.trim();
  const chatId = document.getElementById('m3-chatId').value.trim();
  const message = document.getElementById('m3-message').value.trim();
  const status = document.getElementById('m3-status');

  if (!token || !chatId || !message) {
    KhoTool.utils.showToast('Điền đủ Token, Chat ID và nội dung', 'error');
    return;
  }

  status.textContent = 'Đang gửi...';
  status.className = 'text-xs text-center text-slate-400';

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const data = await res.json();
    if (data.ok) {
      status.textContent = 'Đã gửi thành công.';
      status.className = 'text-xs text-center text-emerald-400';
      KhoTool.utils.incrementCounter();
    } else {
      status.textContent = 'Lỗi: ' + (data.description || 'Không gửi được');
      status.className = 'text-xs text-center text-rose-400';
    }
  } catch (e) {
    status.textContent = 'Lỗi kết nối.';
    status.className = 'text-xs text-center text-rose-400';
  }
}