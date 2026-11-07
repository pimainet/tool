const FORMULAS = [
  { name: "Tính tổng", formula: "=SUM(A1:A10)", desc: "Cộng tất cả số trong vùng", tag: "sum", explain: "SUM cộng các ô từ A1 đến A10." },
  { name: "Tính tổng có điều kiện", formula: "=SUMIF(B:B,\"Hoàn thành\",A:A)", desc: "Cộng nếu cột B chứa điều kiện", tag: "sum", explain: "Chỉ cộng giá trị cột A khi cột B là \"Hoàn thành\"." },
  { name: "Tính tổng nhiều điều kiện", formula: "=SUMIFS(A:A,B:B,\"Hà Nội\",C:C,\">100\")", desc: "Cộng với nhiều điều kiện", tag: "sum", explain: "Cộng cột A khi cột B là Hà Nội và cột C lớn hơn 100." },
  { name: "Trung bình", formula: "=AVERAGE(A1:A10)", desc: "Tính giá trị trung bình", tag: "sum", explain: "AVERAGE tính trung bình các số trong vùng." },
  { name: "Đếm số ô", formula: "=COUNTA(A1:A10)", desc: "Đếm ô không trống", tag: "count", explain: "COUNTA đếm các ô có nội dung." },
  { name: "Đếm có điều kiện", formula: "=COUNTIF(B:B,\"Hoàn thành\")", desc: "Đếm số lần xuất hiện", tag: "count", explain: "Đếm số ô trong cột B có giá trị \"Hoàn thành\"." },
  { name: "Đếm nhiều điều kiện", formula: "=COUNTIFS(B:B,\"Hà Nội\",C:C,\">100\")", desc: "Đếm với nhiều điều kiện", tag: "count", explain: "Đếm dòng thỏa cả hai điều kiện." },
  { name: "Điều kiện IF", formula: "=IF(A1>100,\"Đạt\",\"Chưa đạt\")", desc: "Trả kết quả theo điều kiện", tag: "if", explain: "Nếu A1 lớn hơn 100 thì hiện \"Đạt\", ngược lại \"Chưa đạt\"." },
  { name: "IF nhiều tầng", formula: "=IF(A1>=90,\"A\",IF(A1>=70,\"B\",\"C\"))", desc: "Nhiều mức điều kiện", tag: "if", explain: "Phân loại điểm: >=90 là A, >=70 là B, còn lại C." },
  { name: "IFS", formula: "=IFS(A1>=90,\"A\",A1>=70,\"B\",TRUE,\"C\")", desc: "Nhiều điều kiện gọn hơn", tag: "if", explain: "IFS kiểm tra lần lượt các điều kiện." },
  { name: "VLOOKUP", formula: "=VLOOKUP(A1,D:E,2,FALSE)", desc: "Tra cứu giá trị theo cột", tag: "lookup", explain: "Tìm A1 trong cột D, trả về giá trị cột E tương ứng." },
  { name: "XLOOKUP", formula: "=XLOOKUP(A1,D:D,E:E)", desc: "Tra cứu linh hoạt hơn", tag: "lookup", explain: "XLOOKUP tìm A1 trong cột D, trả về giá trị cột E." },
  { name: "INDEX MATCH", formula: "=INDEX(E:E,MATCH(A1,D:D,0))", desc: "Tra cứu mạnh", tag: "lookup", explain: "Kết hợp INDEX và MATCH để tra cứu linh hoạt." },
  { name: "Nối chuỗi", formula: "=A1&\" \"&B1", desc: "Ghép nội dung các ô", tag: "text", explain: "Nối nội dung ô A1 và B1, cách nhau bởi dấu cách." },
  { name: "Tách chữ trái", formula: "=LEFT(A1,5)", desc: "Lấy ký tự bên trái", tag: "text", explain: "Lấy 5 ký tự đầu tiên của ô A1." },
  { name: "Tách chữ phải", formula: "=RIGHT(A1,4)", desc: "Lấy ký tự bên phải", tag: "text", explain: "Lấy 4 ký tự cuối của ô A1." },
  { name: "Viết hoa", formula: "=UPPER(A1)", desc: "Chuyển thành chữ hoa", tag: "text", explain: "UPPER chuyển toàn bộ văn bản thành chữ hoa." },
  { name: "Xóa khoảng trắng", formula: "=TRIM(A1)", desc: "Xóa khoảng trắng thừa", tag: "text", explain: "TRIM xóa khoảng trắng đầu, cuối và thừa ở giữa." },
  { name: "Ngày hôm nay", formula: "=TODAY()", desc: "Lấy ngày hiện tại", tag: "date", explain: "TODAY trả về ngày hôm nay, tự cập nhật." },
  { name: "Ngày và giờ", formula: "=NOW()", desc: "Lấy ngày giờ hiện tại", tag: "date", explain: "NOW trả về ngày và giờ hiện tại." },
  { name: "Tính số ngày", formula: "=DATEDIF(A1,B1,\"D\")", desc: "Số ngày giữa hai ngày", tag: "date", explain: "Tính số ngày từ ngày ở A1 đến ngày ở B1." },
  { name: "Thêm ngày", formula: "=A1+7", desc: "Cộng thêm số ngày", tag: "date", explain: "Lấy ngày ở A1 cộng thêm 7 ngày." },
  { name: "Tháng của ngày", formula: "=MONTH(A1)", desc: "Lấy số tháng", tag: "date", explain: "MONTH trả về số tháng (1-12) của ngày." },
  { name: "Năm của ngày", formula: "=YEAR(A1)", desc: "Lấy số năm", tag: "date", explain: "YEAR trả về năm của ngày." },
  { name: "Trung bình có điều kiện", formula: "=AVERAGEIF(B:B,\"Hoàn thành\",A:A)", desc: "Trung bình nếu thỏa điều kiện", tag: "sum", explain: "Tính trung bình cột A khi cột B là \"Hoàn thành\"." },
  { name: "Trung bình nhiều điều kiện", formula: "=AVERAGEIFS(A:A,B:B,\"Hà Nội\",C:C,\">100\")", desc: "Trung bình với nhiều điều kiện", tag: "sum", explain: "Tính trung bình cột A khi thỏa cả hai điều kiện." },
  { name: "Nối họ và tên", formula: "=A1&\" \"&B1", desc: "Ghép họ và tên", tag: "text", explain: "Nối cột Họ (A) và cột Tên (B), cách nhau bởi dấu cách." },
  { name: "Tính lương gross", formula: "=A1*B1", desc: "Lương = đơn giá × số ngày/giờ", tag: "accounting", explain: "Nhân đơn giá lương với số ngày hoặc số giờ làm việc." },
  { name: "Tính lương net", formula: "=A1-B1-C1", desc: "Lương thực nhận sau khấu trừ", tag: "accounting", explain: "Lương gross trừ bảo hiểm và thuế (nếu có)." },
  { name: "Thuế GTGT", formula: "=A1*10%", desc: "Tính thuế GTGT 10%", tag: "accounting", explain: "Nhân giá trị với 10% để ra số thuế GTGT." },
  { name: "Giá sau thuế", formula: "=A1*1.1", desc: "Giá đã bao gồm thuế GTGT", tag: "accounting", explain: "Nhân giá chưa thuế với 1.1 để ra giá đã có thuế 10%." },
  { name: "Chiết khấu", formula: "=A1*(1-B1)", desc: "Giá sau chiết khấu", tag: "accounting", explain: "A1 là giá gốc, B1 là tỷ lệ chiết khấu (ví dụ 0.1 = 10%)." },
  { name: "Chiết khấu theo bậc", formula: "=IF(A1>=10000000,A1*0.9,IF(A1>=5000000,A1*0.95,A1))", desc: "Chiết khấu theo mức mua", tag: "accounting", explain: "Mua từ 10 triệu giảm 10%, từ 5 triệu giảm 5%, còn lại không giảm." },
  { name: "Khấu hao đường thẳng", formula: "=(A1-B1)/C1", desc: "Khấu hao mỗi kỳ", tag: "accounting", explain: "A1 nguyên giá, B1 giá trị thanh lý, C1 số kỳ khấu hao." },
  { name: "Làm tròn tiền", formula: "=ROUND(A1,0)", desc: "Làm tròn đến đồng", tag: "sum", explain: "ROUND làm tròn số tiền đến hàng đơn vị." },
  { name: "Làm tròn lên", formula: "=ROUNDUP(A1,0)", desc: "Làm tròn lên", tag: "sum", explain: "ROUNDUP luôn làm tròn lên." },
  { name: "Phần trăm", formula: "=A1/B1", desc: "Tính tỷ lệ phần trăm", tag: "sum", explain: "Chia A1 cho B1 để ra tỷ lệ. Định dạng ô thành %." }
];

let currentTag = 'all';

window.KhoTool.currentInit = function () {
  document.getElementById('m5-search').oninput = render;
  document.querySelectorAll('.m5-tag').forEach(btn => {
    btn.onclick = function () {
      document.querySelectorAll('.m5-tag').forEach(b => {
        b.classList.remove('bg-orange-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      this.classList.remove('bg-slate-800', 'text-slate-300');
      this.classList.add('bg-orange-600', 'text-white');
      currentTag = this.dataset.tag;
      render();
    };
  });
  render();
};

function render() {
  const q = document.getElementById('m5-search').value.toLowerCase().trim();
  let list = FORMULAS;
  
  if (currentTag !== 'all') {
    list = list.filter(f => f.tag === currentTag);
  }
  if (q) {
    const synonyms = { 'nếu': 'if', 'nối tên': 'nối', 'họ tên': 'nối' };
    const searchQ = synonyms[q] || q;
    list = list.filter(f => 
      f.name.toLowerCase().includes(searchQ) || 
      f.desc.toLowerCase().includes(searchQ) ||
      f.formula.toLowerCase().includes(searchQ) ||
      f.name.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q)
    );
  }

  const box = document.getElementById('m5-results');
  if (!list.length) {
    box.innerHTML = '<div class="text-xs text-slate-500 text-center py-6">Không tìm thấy công thức phù hợp.</div>';
    return;
  }

  box.innerHTML = list.map((f, i) => `
    <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
      <div class="flex justify-between items-start">
        <div>
          <div class="text-sm font-semibold text-white">${f.name}</div>
          <div class="text-xs text-slate-400">${f.desc}</div>
        </div>
        <button onclick="copyFormula(${i}, this)" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg">Sao chép</button>
      </div>
      <div class="font-mono text-xs text-emerald-400 bg-slate-900 rounded-lg p-2">${f.formula}</div>
      <div class="text-[11px] text-slate-500">${f.explain}</div>
    </div>
  `).join('');

  window._m5_list = list;
}

function copyFormula(index, btn) {
  const formula = window._m5_list[index].formula;
  navigator.clipboard.writeText(formula).then(() => {
    btn.textContent = 'Đã chép';
    setTimeout(() => btn.textContent = 'Sao chép', 1500);
    KhoTool.utils.incrementCounter();
  });
}