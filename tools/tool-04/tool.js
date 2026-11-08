let taskItems = [];

window.KhoTool.currentInit = function () {
  document.getElementById('m4-processBtn').onclick = processMeeting;
  document.getElementById('m4-copyBtn').onclick = copyTasks;
  document.getElementById('m4-exportBtn').onclick = exportFile;
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Từ khóa nhận diện dòng là "việc cần làm" (khớp theo từ nguyên, không khớp giữa từ)
const TASK_WORDS = ['cần', 'phải', 'hoàn thành', 'chuẩn bị', 'gửi', 'liên hệ', 'phụ trách', 'chịu trách nhiệm',
  'báo cáo', 'triển khai', 'kiểm tra', 'theo dõi', 'cập nhật', 'soạn', 'thực hiện', 'đảm nhận', 'deadline', 'task'];
const TASK_RE = new RegExp(`(?<![\\p{L}])(?:${TASK_WORDS.join('|')})(?![\\p{L}])`, 'iu');

// Từ viết hoa đầu câu không phải tên người
const NOT_NAME = new Set(['cần', 'phải', 'sẽ', 'đã', 'đang', 'hoàn', 'chuẩn', 'gửi', 'liên', 'báo', 'kiểm', 'theo',
  'cập', 'soạn', 'thực', 'triển', 'họp', 'công', 'tuần', 'tháng', 'ngày', 'thứ', 'các', 'mọi', 'team', 'nhóm', 'bộ', 'sale', 'sales', 'marketing', 'kế', 'bên']);

const NAME = '\\p{Lu}\\p{Ll}+';
const NAME_SEQ = `${NAME}(?:\\s+${NAME}){0,2}`;
const TITLE = '(?:[Aa]nh|[Cc]hị|[Ee]m|[Cc]ô|[Cc]hú|[Bb]ác|[Ôô]ng|[Bb]à|[Bb]ạn)';
const RE_TITLE = new RegExp(`(?<![\\p{L}])${TITLE}\\s+(${NAME_SEQ})(?![\\p{L}])`, 'gu');
const RE_AT = /@([\p{L}][\p{L}\d_]*)/gu;
const RE_LABEL = new RegExp(`^(${NAME_SEQ})\\s*:`, 'u');
const RE_SUBJECT = new RegExp(`^(${NAME_SEQ})\\s+(?:sẽ|phụ trách|chịu trách nhiệm|đảm nhận|cần|phải)(?![\\p{L}])`, 'u');

const RE_DEADLINE = new RegExp(
  '(?:trước|hạn chót|deadline|hạn|vào|đến)\\s*:?\\s*(' +
  'thứ\\s*(?:\\d|hai|ba|tư|năm|sáu|bảy)(?:\\s*(?:này|tuần sau|tuần tới))?' +
  '|chủ nhật|ngày\\s*\\d{1,2}(?:[/\\-]\\d{1,2}(?:[/\\-]\\d{2,4})?)?' +
  '|\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?' +
  '|cuối tuần(?:\\s*(?:này|sau))?|cuối tháng|tuần\\s*(?:sau|này|tới)|hôm nay|ngày mai|ngày kia)', 'iu');

function validName(n) {
  const first = n.split(/\s+/)[0].toLowerCase();
  return n.length >= 2 && !NOT_NAME.has(first);
}

function findPeople(text) {
  const found = [];
  const push = n => {
    n = n.trim().replace(new RegExp(`^${TITLE}\\s+`, 'u'), '');
    if (n && validName(n) && !found.includes(n)) found.push(n);
  };
  for (const m of text.matchAll(RE_TITLE)) push(m[1]);
  for (const m of text.matchAll(RE_AT)) push(m[1]);
  let m = text.match(RE_LABEL); if (m) push(m[1]);
  m = text.match(RE_SUBJECT); if (m) push(m[1]);
  return found;
}

function processMeeting() {
  const text = document.getElementById('m4-input').value.trim();
  if (!text) {
    KhoTool.utils.showToast('Nhập nội dung cuộc họp', 'error');
    return;
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const peopleCount = new Map();
  taskItems = [];

  lines.forEach(line => {
    const isBullet = /^(?:[-•*]|\d+[.)])\s*/.test(line);
    const clean = line.replace(/^(?:[-•*]+|\d+[.)])\s*/, '');
    if (!isBullet && !TASK_RE.test(clean)) return;

    const people = findPeople(clean);
    const dl = clean.match(RE_DEADLINE);
    taskItems.push({ task: clean, person: people[0] || '', people, deadline: dl ? dl[1].trim() : '' });
    people.forEach(p => peopleCount.set(p, (peopleCount.get(p) || 0) + 1));
  });

  const taskBox = document.getElementById('m4-tasks');
  const peopleBox = document.getElementById('m4-people');

  if (!taskItems.length) {
    taskBox.innerHTML = '<div class="text-xs text-slate-500">Không tìm thấy việc cụ thể. Thử viết mỗi việc một dòng, bắt đầu bằng dấu "-", hoặc dùng từ như "cần", "phải", "phụ trách".</div>';
  } else {
    taskBox.innerHTML = taskItems.map((item, i) => `
      <label class="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-700">
        <input type="checkbox" class="m4-check mt-0.5 accent-amber-500" data-index="${i}">
        <span class="flex-1">${esc(item.task)}</span>
        ${item.person ? `<span class="text-amber-400 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded whitespace-nowrap">${esc(item.person)}</span>` : ''}
        ${item.deadline ? `<span class="text-sky-400 text-[10px] bg-sky-500/10 px-2 py-0.5 rounded whitespace-nowrap">hạn: ${esc(item.deadline)}</span>` : ''}
      </label>
    `).join('');
    taskBox.querySelectorAll('.m4-check').forEach(cb => {
      cb.onchange = () => cb.parentElement.querySelector('span').classList.toggle('line-through', cb.checked);
    });
  }

  if (!peopleCount.size) {
    peopleBox.innerHTML = '<span class="text-xs text-slate-500">Không phát hiện tên người. Hãy viết dạng "Anh Minh ...", "Chị Lan ...", "@Minh" hoặc "Minh: ...".</span>';
  } else {
    peopleBox.innerHTML = [...peopleCount].map(([p, n]) => `
      <span class="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">${esc(p)} · ${n} việc</span>
    `).join('');
  }

  document.getElementById('m4-result').classList.remove('hidden');
  KhoTool.utils.showToast(`Tìm thấy ${taskItems.length} việc`);
  if (taskItems.length) KhoTool.utils.incrementCounter();
}

function formatTasks() {
  return taskItems.map((item, i) => {
    let s = `${i + 1}. ${item.task}`;
    const meta = [];
    if (item.person) meta.push(`Phụ trách: ${item.person}`);
    if (item.deadline) meta.push(`Hạn: ${item.deadline}`);
    if (meta.length) s += `  [${meta.join(' | ')}]`;
    return s;
  }).join('\n');
}

function exportFile() {
  if (!taskItems.length) {
    KhoTool.utils.showToast('Chưa có dữ liệu', 'error');
    return;
  }
  const content = 'DANH SÁCH VIỆC\n================\n\n' + formatTasks() + '\n';
  const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'danh_sach_viec.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  KhoTool.utils.showToast('Đã xuất file');
}

function copyTasks() {
  if (!taskItems.length) {
    KhoTool.utils.showToast('Chưa có dữ liệu', 'error');
    return;
  }
  navigator.clipboard.writeText(formatTasks()).then(() => {
    KhoTool.utils.showToast('Đã sao chép danh sách việc');
  }).catch(() => {
    KhoTool.utils.showToast('Không sao chép được', 'error');
  });
}
