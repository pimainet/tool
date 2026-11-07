window.KhoTool.currentInit = function () {
  document.getElementById('m4-processBtn').onclick = processMeeting;
  document.getElementById('m4-copyBtn').onclick = copyTasks;
  document.getElementById('m4-exportBtn').onclick = exportFile;
};

function processMeeting() {
  const text = document.getElementById('m4-input').value.trim();
  if (!text) {
    KhoTool.utils.showToast('Nhập nội dung cuộc họp', 'error');
    return;
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const tasks = [];
  const people = new Set();
  const taskPeople = [];

  const taskKeywords = ['cần', 'phải', 'việc', 'task', 'hoàn thành', 'làm', 'chuẩn bị', 'gửi', 'liên hệ', 'báo cáo', 'phụ trách', 'chịu trách nhiệm'];
  const namePattern = /(?:anh|chị)\s+([A-ZÀ-Ỹ][a-zà-ỹ]{1,10})(?:\s|$|,|\.)/gi;
  const excludeWords = ['cần', 'phải', 'sẽ', 'đã', 'đang', 'này', 'kia', 'đó', 'thu', 'chi', 'báo', 'cáo'];

  lines.forEach(line => {
    const lower = line.toLowerCase();
    const isTask = taskKeywords.some(k => lower.includes(k)) || /^[-•*\d]/.test(line);
    
    if (isTask) {
      tasks.push(line.replace(/^[-•*\d.)\s]+/, ''));
    }

    let match;
    namePattern.lastIndex = 0;
    while ((match = namePattern.exec(line)) !== null) {
      const name = match[1];
      if (!excludeWords.includes(name.toLowerCase()) && name.length >= 2) {
        people.add(name);
      }
    }
  });

  const taskBox = document.getElementById('m4-tasks');
  const peopleBox = document.getElementById('m4-people');

  if (tasks.length === 0) {
    taskBox.innerHTML = '<div class="text-xs text-slate-500">Không tìm thấy việc cụ thể. Thử thêm từ như "cần", "phải", "phụ trách".</div>';
  } else {
    taskBox.innerHTML = taskPeople.map((item, i) => `
      <label class="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-700">
        <input type="checkbox" class="mt-0.5 accent-amber-500" data-index="${i}">
        <span class="flex-1">${item.task}</span>
        ${item.person ? `<span class="text-amber-400 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">${item.person}</span>` : ''}
      </label>
    `).join('');
    window._m4_taskPeople = taskPeople;
  }

  if (people.size === 0) {
    peopleBox.innerHTML = '<span class="text-xs text-slate-500">Không phát hiện tên người.</span>';
  } else {
    peopleBox.innerHTML = [...people].map(p => `
      <span class="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">${p}</span>
    `).join('');
  }

  document.getElementById('m4-result').classList.remove('hidden');
  KhoTool.utils.showToast(`Tìm thấy ${tasks.length} việc`);
  KhoTool.utils.incrementCounter();
}

function exportFile() {
  const data = window._m4_taskPeople || [];
  if (!data.length) {
    KhoTool.utils.showToast('Chưa có dữ liệu', 'error');
    return;
  }
  let content = 'DANH SÁCH VIỆC\n================\n\n';
  data.forEach((item, i) => {
    content += `${i + 1}. ${item.task}`;
    if (item.person) content += ` [${item.person}]`;
    content += '\n';
  });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'danh_sach_viec.txt';
  a.click();
  URL.revokeObjectURL(url);
  KhoTool.utils.showToast('Đã xuất file');
}

function copyTasks() {
  const items = document.querySelectorAll('#m4-tasks label span');
  if (!items.length) return;
  const text = [...items].map((el, i) => `${i + 1}. ${el.textContent}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    KhoTool.utils.showToast('Đã sao chép danh sách việc');
  });
}