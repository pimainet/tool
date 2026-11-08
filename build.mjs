#!/usr/bin/env node
// Sinh trang tĩnh cho Kho Tool: mỗi tool một URL riêng (/<slug>/), trang chủ, /lead-loop/, sitemap.xml, robots.txt.
// Chạy:  node build.mjs      (không cần cài thêm gói nào)
// Nguồn của từng tool vẫn nằm ở tools/<id>/tool.html và tools/<id>/tool.js
// Nội dung SEO, phân nhóm, thư viện cần nạp nằm ở manifest.json. Cấu hình site ở site.config.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s);
};

const config = JSON.parse(read('site.config.json'));
const tools = JSON.parse(read('manifest.json'));
const SITE_URL = (config.siteUrl || '').replace(/\/+$/, '');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlOf = slug => `/${slug}/`;
const abs = p => (SITE_URL ? SITE_URL + p : '');

// ---- kiểm tra manifest để lỗi nội dung không lọt lên production ----
const slugs = new Set();
for (const t of tools) {
  for (const k of ['id', 'slug', 'section', 'name', 'short', 'h1', 'seoTitle', 'description', 'intro', 'howto', 'faq', 'icon', 'status']) {
    if (t[k] === undefined || t[k] === '') throw new Error(`manifest: ${t.id || '?'} thiếu "${k}"`);
  }
  if (slugs.has(t.slug)) throw new Error(`manifest: trùng slug ${t.slug}`);
  slugs.add(t.slug);
  if (!fs.existsSync(path.join(ROOT, 'tools', t.id, 'tool.html')) || !fs.existsSync(path.join(ROOT, 'tools', t.id, 'tool.js'))) {
    throw new Error(`manifest: thiếu tools/${t.id}/tool.html hoặc tool.js`);
  }
  if (t.description.length > 175) console.warn(`! ${t.id}: description dài ${t.description.length} ký tự (nên ≤ 160)`);
}

const LIBS = {
  xlsx: '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>',
  chart: '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>'
};

const BADGE = {
  live: '<span class="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>',
  beta: '<span class="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Beta</span>'
};

// ---------- phần khung dùng chung ----------
function head({ title, description, path: p, jsonld, libs = [] }) {
  const canonical = abs(p);
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="${esc(config.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
<meta name="twitter:card" content="summary">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script src="https://cdn.tailwindcss.com"></script>
${libs.map(l => LIBS[l]).join('\n')}
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #070b14; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  input[type=file]::file-selector-button { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 10px; padding: 7px 14px; margin-right: 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
  input[type=file]::file-selector-button:hover { background: #334155; }
</style>`;
}

function header(showAll) {
  return `<header class="bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800/80 py-4 px-6 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto flex justify-between items-center gap-3">
    <a href="/" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-lg">⚡</div>
      <div>
        <p class="text-sm font-extrabold tracking-tight text-white whitespace-nowrap">KHO TOOL <span class="text-cyan-400 font-normal">CỘNG ĐỒNG</span></p>
        <p class="text-[10px] text-slate-400 hidden sm:block">Công cụ miễn phí cho doanh nghiệp nhỏ</p>
      </div>
    </a>
    <div class="flex items-center gap-3">
      ${showAll ? '<a href="/" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl border border-slate-700 whitespace-nowrap">← Tất cả<span class="hidden sm:inline">&nbsp;công cụ</span></a>' : ''}
      <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold hidden sm:inline">Xử lý trên trình duyệt</span>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="text-center py-6 px-4 text-xs text-slate-500 border-t border-slate-800/80">
  ${esc(config.siteName)} • Hầu hết công cụ xử lý ngay trong trình duyệt, không lưu file lên máy chủ • Công cụ có gọi dịch vụ ngoài được ghi rõ trên trang
</footer>`;
}

function page({ headHtml, body, scripts = '' }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
${headHtml}
</head>
<body class="bg-[#070b14] text-slate-100 min-h-screen flex flex-col antialiased">
${body}
${scripts}
</body>
</html>
`;
}

function toolCard(t) {
  const search = [t.name, t.short, t.h1, t.description].join(' ').toLowerCase();
  return `<a href="${urlOf(t.slug)}" data-search="${esc(search)}" class="tool-card group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all duration-300 space-y-4 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between">
  <div class="space-y-3">
    <div class="flex justify-between items-center">
      <span class="text-2xl" aria-hidden="true">${t.icon}</span>
      ${BADGE[t.status] || ''}
    </div>
    <h3 class="text-base font-bold text-white group-hover:text-cyan-400 transition">${esc(t.short)}</h3>
    <p class="text-xs text-slate-400 leading-relaxed">${esc(t.description)}</p>
    ${t.external ? `<p class="text-[10px] text-sky-400/90 bg-sky-500/10 border border-sky-500/20 rounded-lg px-2 py-1">Có gọi dịch vụ ngoài: ${esc(t.external)}</p>` : ''}
  </div>
  <div class="pt-4 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-semibold text-cyan-400">
    <span>Mở công cụ</span><span class="group-hover:translate-x-1 transition" aria-hidden="true">→</span>
  </div>
</a>`;
}

// ---------- trang chủ ----------
function buildHub() {
  const main = tools.filter(t => t.section === 'main');
  const extra = tools.filter(t => t.section === 'extra');
  const title = `${config.siteName}: công cụ miễn phí lọc số điện thoại, báo cáo Excel, xử lý ảnh`;
  const description = 'Bộ công cụ miễn phí cho doanh nghiệp nhỏ Việt Nam: lọc số điện thoại, tạo báo cáo từ Excel, cắt ảnh chèn logo hàng loạt, chuẩn hóa tiếng Việt. Xử lý ngay trên trình duyệt.';
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.siteName,
    itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.h1, ...(SITE_URL ? { url: abs(urlOf(t.slug)) } : {}) }))
  };

  const body = `${header(false)}
<main class="max-w-7xl mx-auto px-4 py-8 flex-grow w-full space-y-12">
  <section class="relative bg-gradient-to-b from-slate-900/80 to-slate-950/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 overflow-hidden">
    <div class="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold px-4 py-1.5 rounded-full">Xử lý ngay trên trình duyệt của bạn</div>
    <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
      Công cụ thực chiến cho <span class="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">doanh nghiệp nhỏ</span>
    </h1>
    <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
      Lọc số điện thoại, tạo báo cáo từ Excel, xử lý ảnh sản phẩm, chuẩn hóa tiếng Việt. Miễn phí, không cần đăng ký.
    </p>
    <div class="max-w-md mx-auto pt-2">
      <label for="searchInput" class="sr-only">Tìm công cụ</label>
      <input id="searchInput" type="search" placeholder="Tìm công cụ (số điện thoại, Excel, ảnh, tiếng Việt...)" class="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500">
    </div>
  </section>

  <section class="space-y-4" data-group>
    <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Công cụ chính</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
${main.map(toolCard).join('\n')}
    </div>
  </section>

  <section class="space-y-4" data-group>
    <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Tiện ích phụ</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
${extra.map(toolCard).join('\n')}
    </div>
  </section>

  <p id="noResult" class="hidden text-slate-500 text-center py-6 text-sm">Không tìm thấy công cụ nào.</p>

  <section>
    <a href="/lead-loop/" class="block bg-gradient-to-r from-indigo-950/70 to-slate-900/60 border border-indigo-500/30 hover:border-indigo-400/60 rounded-3xl p-6 sm:p-8 transition space-y-2">
      <div class="flex items-center gap-3"><span class="text-2xl" aria-hidden="true">🔁</span><span class="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">Đang xây dựng</span></div>
      <h2 class="text-lg font-bold text-white">Lead Loop: không bỏ sót khách hàng tiềm năng</h2>
      <p class="text-xs text-slate-400 leading-relaxed max-w-2xl">Gom lead từ tin nhắn và bình luận, báo ngay qua Telegram, nhắc lại khi chưa ai phản hồi, và báo cáo tốc độ phản hồi mỗi tuần.</p>
      <span class="inline-block text-xs font-semibold text-indigo-300 pt-1">Xem chi tiết →</span>
    </a>
  </section>
</main>
${footer()}`;

  const scripts = `<script>
  (function () {
    var input = document.getElementById('searchInput');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.tool-card'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-group]'));
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var ok = !q || c.getAttribute('data-search').indexOf(q) !== -1;
        c.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      groups.forEach(function (g) {
        g.classList.toggle('hidden', !g.querySelector('.tool-card:not(.hidden)'));
      });
      document.getElementById('noResult').classList.toggle('hidden', shown > 0);
    });
  })();
</script>`;

  write('index.html', page({ headHtml: head({ title, description, path: '/', jsonld }), body, scripts }));
}

// ---------- trang từng tool ----------
function ctaBlock() {
  return `<section class="bg-gradient-to-r from-indigo-950/70 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-2">
  <h2 class="text-base font-bold text-white">Muốn không bỏ sót khách hàng tiềm năng?</h2>
  <p class="text-xs text-slate-400 leading-relaxed max-w-2xl">Lead Loop (đang xây dựng) gom lead từ tin nhắn và bình luận, báo ngay qua Telegram và nhắc lại khi chưa ai phản hồi.</p>
  <a href="/lead-loop/" class="inline-block text-xs font-semibold text-indigo-300 hover:text-indigo-200 pt-1">Xem Lead Loop →</a>
</section>`;
}

function buildToolPage(t) {
  const toolHtml = read(`tools/${t.id}/tool.html`);
  const related = tools.filter(x => x.id !== t.id && (x.section === 'main' || t.section === 'extra')).slice(0, 3);
  const title = `${t.seoTitle} | ${config.siteName}`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t.h1,
    description: t.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Trình duyệt web',
    inLanguage: 'vi',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
    ...(SITE_URL ? { url: abs(urlOf(t.slug)) } : {})
  };
  const container = t.wide ? 'max-w-7xl' : 'max-w-4xl';

  const body = `${header(true)}
<main class="${container} mx-auto px-4 py-8 flex-grow w-full space-y-8">
  <nav aria-label="Breadcrumb" class="text-xs text-slate-500"><a href="/" class="hover:text-cyan-400">Kho Tool</a> <span aria-hidden="true">›</span> <span class="text-slate-300">${esc(t.short)}</span></nav>

  <section class="space-y-3">
    <div class="flex items-center gap-3">${BADGE[t.status] || ''}</div>
    <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">${esc(t.h1)}</h1>
    <p class="text-sm text-slate-400 leading-relaxed max-w-3xl">${esc(t.intro)}</p>
    ${t.external ? `<p class="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2 max-w-3xl">Lưu ý quyền riêng tư: công cụ này có gọi dịch vụ ngoài: ${esc(t.external)}.</p>` : ''}
  </section>

  <noscript><p class="text-rose-400 text-sm">Công cụ cần bật JavaScript để hoạt động.</p></noscript>
  <section id="tool-root" aria-label="${esc(t.short)}">
${toolHtml}
  </section>

  <section class="grid md:grid-cols-2 gap-6">
    <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
      <h2 class="text-sm font-bold text-white">Cách dùng</h2>
      <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
${t.howto.map(s => `        <li>${esc(s)}</li>`).join('\n')}
      </ol>
    </div>
    <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 class="text-sm font-bold text-white">Câu hỏi thường gặp</h2>
${t.faq.map(f => `      <div><h3 class="text-xs font-semibold text-slate-200">${esc(f.q)}</h3><p class="text-xs text-slate-400 leading-relaxed mt-1">${esc(f.a)}</p></div>`).join('\n')}
    </div>
  </section>

  ${ctaBlock()}

  <section class="space-y-3">
    <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Công cụ khác</h2>
    <div class="grid sm:grid-cols-3 gap-4">
${related.map(r => `      <a href="${urlOf(r.slug)}" class="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 space-y-1 transition"><span class="text-lg" aria-hidden="true">${r.icon}</span><p class="text-sm font-semibold text-white">${esc(r.short)}</p></a>`).join('\n')}
    </div>
  </section>
</main>
${footer()}`;

  const scripts = `<script src="/core/shared.js"></script>
<script src="/tools/${t.id}/tool.js"></script>
<script>
  if (window.KhoTool && typeof window.KhoTool.currentInit === 'function') window.KhoTool.currentInit();
</script>`;

  write(`${t.slug}/index.html`, page({ headHtml: head({ title, description: t.description, path: urlOf(t.slug), jsonld, libs: t.libs || [] }), body, scripts }));
}

// ---------- trang Lead Loop ----------
function buildLeadLoop() {
  const title = `Lead Loop: không bỏ sót khách hàng tiềm năng | ${config.siteName}`;
  const description = 'Lead Loop (đang xây dựng): gom lead từ tin nhắn và bình luận, báo ngay qua Telegram, nhắc khi chưa phản hồi và báo cáo tốc độ phản hồi mỗi tuần.';
  const steps = [
    ['Gom lead', 'Dán bình luận, tin nhắn hoặc nhận lead từ form trên website. Số điện thoại, tên và nhu cầu được tách thành danh sách.'],
    ['Báo ngay qua Telegram', 'Lead mới đến là có tin nhắn, kèm nút "Đã phản hồi" để cả nhóm biết ai đang xử lý.'],
    ['Nhắc khi chưa ai phản hồi', 'Sau vài phút chưa có người bấm "Đã phản hồi", hệ thống nhắc lại.'],
    ['Báo cáo tuần', 'Mỗi tuần có bao nhiêu lead, phản hồi nhanh hay chậm, so với tuần trước ra sao.']
  ];
  const cta = config.contactUrl
    ? `<a href="${esc(config.contactUrl)}" rel="noopener" class="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-3 rounded-xl">${esc(config.contactLabel)}</a>`
    : '<p class="text-xs text-slate-500">Đăng ký nhận thông báo sẽ được mở sau khi bản thử nghiệm sẵn sàng.</p>';

  const body = `${header(true)}
<main class="max-w-3xl mx-auto px-4 py-10 flex-grow w-full space-y-8">
  <section class="space-y-3">
    <span class="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">Đang xây dựng</span>
    <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Lead Loop: không bỏ sót khách hàng tiềm năng</h1>
    <p class="text-sm text-slate-400 leading-relaxed">Với showroom và doanh nghiệp nhỏ, thứ làm mất khách thường không phải là thiếu lead mà là phản hồi chậm. Lead Loop biến việc theo dõi lead thành một vòng khép kín: gom, báo, nhắc và đo.</p>
  </section>

  <section class="space-y-3">
    <h2 class="text-sm font-bold text-white">Cách hoạt động</h2>
    <ol class="space-y-3">
${steps.map((s, i) => `      <li class="flex gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4"><span class="w-7 h-7 shrink-0 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center">${i + 1}</span><div><h3 class="text-sm font-semibold text-white">${s[0]}</h3><p class="text-xs text-slate-400 leading-relaxed mt-1">${s[1]}</p></div></li>`).join('\n')}
    </ol>
  </section>

  <section class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
    <h2 class="text-sm font-bold text-white">Trạng thái</h2>
    <p class="text-xs text-slate-400 leading-relaxed">Lead Loop đang được xây dựng và chưa mở cho người dùng bên ngoài. Trong lúc chờ, bạn có thể dùng các công cụ miễn phí: <a class="text-cyan-400 hover:underline" href="${urlOf('loc-so-dien-thoai')}">lọc số điện thoại</a> và <a class="text-cyan-400 hover:underline" href="${urlOf('bao-cao-dashboard-tu-excel')}">báo cáo dashboard từ Excel</a>.</p>
    ${cta}
  </section>
</main>
${footer()}`;

  write('lead-loop/index.html', page({ headHtml: head({ title, description, path: '/lead-loop/' }), body }));
}

// ---------- sitemap, robots ----------
function buildSeoFiles() {
  const urls = ['/', ...tools.map(t => urlOf(t.slug)), '/lead-loop/'];
  if (SITE_URL) {
    const today = new Date().toISOString().slice(0, 10);
    write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(SITE_URL + u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  } else if (fs.existsSync(path.join(ROOT, 'sitemap.xml'))) {
    fs.unlinkSync(path.join(ROOT, 'sitemap.xml'));
    console.warn('! siteUrl trống: đã xóa sitemap.xml cũ (sitemap cần địa chỉ tuyệt đối).');
  }
  write('robots.txt', `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
}

buildHub();
tools.forEach(buildToolPage);
buildLeadLoop();
buildSeoFiles();

console.log(`Đã sinh: index.html, ${tools.length} trang tool, lead-loop/, robots.txt${SITE_URL ? ', sitemap.xml' : ' (chưa có sitemap vì siteUrl trống)'}.`);
if (!SITE_URL) console.warn('! site.config.json: siteUrl đang trống nên chưa có canonical và sitemap.');
if (!config.contactUrl) console.warn('! site.config.json: contactUrl đang trống nên trang Lead Loop chưa có nút đăng ký.');
