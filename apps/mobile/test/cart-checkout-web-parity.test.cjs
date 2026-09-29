'use strict';

/**
 * SPRINT: Mobile Cart + Checkout đồng bộ nghiệp vụ với Customer Web.
 *
 * Customer Web là source of truth cho UX nghiệp vụ (hierarchy, terminology,
 * interaction, voucher, loyalty, payment, price/stock semantics, summary).
 * Mobile chỉ adapt layout 1 cột + touch-native.
 *
 * Đây là source-contract test (node:test) — không cần runtime native.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const CART = 'apps/mobile/src/app/gio-hang.tsx';
const CHECKOUT = 'apps/mobile/src/app/thanh-toan.tsx';
const WEB_CART = 'apps/customer-web/src/components/gio-hang-content.tsx';
const WEB_CHECKOUT = 'apps/customer-web/src/components/checkout-content.tsx';

const cart = () => read(CART);
const checkout = () => read(CHECKOUT);

/** Bỏ comment để assert chỉ nhìn vào CODE/copy hiển thị, không nhìn chú thích. */
function boComment(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ============================================================ PROBLEM 1 — CART

test('1.1 Cart Mobile không còn summary đầu trang trùng lặp tổng tiền', () => {
  const c = cart();
  assert.equal(
    c.includes('Tạm tính theo giá hiện tại'),
    false,
    'Không được lặp tổng tiền ở đầu trang khi đã có summary cuối trang',
  );
  // Không còn khối thống kê "Sản phẩm / Tạm tính" kiểu stat ở đầu danh sách.
  assert.equal(/text-\[22px\] font-extrabold text-\[#075E3B\]\}>{tongSoLuong}</.test(c), false);
});

test('1.2 Cart Mobile đưa số lượng sản phẩm vào header, không lặp tổng tiền', () => {
  const c = cart();
  assert.equal(c.includes('{tongSoLuong} sản phẩm'), true, 'Header hiện số sản phẩm');
  assert.equal(c.includes('>Giỏ hàng</Text>'), true);
  // tongSoLuong vẫn phải được dùng (không để biến chết).
  assert.equal((c.match(/tongSoLuong/g) || []).length >= 2, true);
});

test('1.3 Cart Mobile giữ group theo nhà cung cấp', () => {
  const c = cart();
  assert.equal(c.includes('NhomNhaCungCap'), true);
  assert.equal(c.includes('values.set(supplier.id, { id: supplier.id, ten: supplier.ten, muc: [muc] })'), true);
  assert.equal(c.includes('{supplier.ten}'), true);
  assert.equal(c.includes('{supplier.muc.length} mục'), true);
});

test('1.4 Cart Mobile CTA dùng đúng wording Web', () => {
  const c = cart();
  const web = read(WEB_CART);
  assert.equal(c.includes('Tiến hành thanh toán'), true, 'CTA theo wording Web');
  assert.equal(c.includes('Tiếp tục thanh toán'), false, 'Bỏ wording cũ');
  assert.equal(web.includes('Tiến hành thanh toán'), true, 'Web vẫn là nguồn chuẩn');
  assert.equal(c.includes('accessibilityLabel="Tiến hành thanh toán"'), true);
});

test('1.5 Cart summary Mobile cùng terminology với Web', () => {
  const c = cart();
  for (const nhan of ['Tóm tắt đơn hàng', 'Số lượng', 'Tạm tính', 'Phí giao hàng', 'Tổng dự kiến']) {
    assert.equal(c.includes(nhan), true, `Thiếu dòng summary: ${nhan}`);
  }
  assert.equal(c.includes('Tính ở bước thanh toán'), true, 'Phí giao hàng chưa tính ở giỏ');
  assert.equal(c.includes('Giá và tồn kho được kiểm tra lại khi thanh toán.'), true);
  // Không fake phí vận chuyển.
  assert.equal(c.includes('Miễn phí'), false);
  assert.equal(c.includes('giao hàng miễn phí'), false);
});

test('1.6 Cart product row gọn: ảnh nhỏ, touch target 44px, xoá vẫn bấm được', () => {
  const c = cart();
  assert.equal(c.includes('h-[72px] w-[72px]'), true, 'Ảnh 72px');
  assert.equal(c.includes('rounded-xl'), true, 'Bo góc vừa phải');
  assert.equal(c.includes('h-11 w-11'), true, 'Nút +/- và xoá ≥44px');
  assert.equal(/accessibilityLabel=\{`Xóa \$\{muc\.bienThe\.sanPham\.ten\}`\}/.test(c), true);
  assert.equal(/accessibilityLabel=\{`Tăng số lượng \$\{muc\.bienThe\.sanPham\.ten\}`\}/.test(c), true);
  assert.equal(/accessibilityLabel=\{`Giảm số lượng \$\{muc\.bienThe\.sanPham\.ten\}`\}/.test(c), true);
  // Không còn font 25-27px cho mọi khối.
  assert.equal(c.includes('text-[26px]'), false);
  assert.equal(c.includes('text-[27px]'), false);
});

test('1.7 Cart vẫn dùng giá hiệu tại + tồn kho từ backend, không tự tính', () => {
  const c = cart();
  assert.equal(c.includes('giaHienTai'), true);
  assert.equal(c.includes('soLuongKhaDung'), true);
  assert.equal(c.includes('muc.bienThe.coTheDatHang'), true);
  assert.equal(c.includes('choPhepThanhToan'), true);
  assert.equal(c.includes('disabled={!choPhepThanhToan}'), true);
  // Không tính flash sale client-side.
  assert.equal(c.includes('phanTramGiam'), false);
});

// ============================================================ PROBLEM 2 — HEADER

test('2.1 Checkout Mobile không lộ copy kỹ thuật cho khách', () => {
  const c = checkout();
  for (const bad of [
    'Backend xác nhận',
    'được Backend',
    'server-authoritative',
    'preview contract',
  ]) {
    assert.equal(c.includes(bad), false, `Khách không được thấy: "${bad}"`);
  }
  assert.equal(c.includes('Kiểm tra thông tin trước khi đặt hàng'), true);
});

test('2.2 Checkout Mobile không còn copy kỹ thuật trong thông báo lỗi', () => {
  const c = checkout();
  for (const bad of ['idempotency', 'payment URL', 'trạng thái COD không đúng kỳ vọng', 'Payment VNPay']) {
    assert.equal(c.includes(bad), false, `Không được lộ: "${bad}"`);
  }
  assert.equal(c.includes('Thử lại thanh toán'), true, 'Wording thử lại thân thiện');
});

test('2.3 Checkout Mobile giữ đúng thứ tự section như Web', () => {
  const c = checkout();
  const thuTu = [
    'title="Địa chỉ nhận hàng"',
    'title={`Sản phẩm (${preview.items.length})`}',
    'title="Voucher và điểm thưởng"',
    'title="Phương thức thanh toán"',
    'title="Tóm tắt đơn hàng"',
  ];
  let viTriTruoc = -1;
  for (const moc of thuTu) {
    const i = c.indexOf(moc);
    assert.equal(i > -1, true, `Thiếu section: ${moc}`);
    assert.equal(i > viTriTruoc, true, `Sai thứ tự tại: ${moc}`);
    viTriTruoc = i;
  }
});

test('2.4 Checkout Mobile dùng đúng terminology section của Web', () => {
  const c = checkout();
  const web = read(WEB_CHECKOUT);
  for (const nhan of [
    'Địa chỉ nhận hàng',
    'Voucher và điểm thưởng',
    'Phương thức thanh toán',
  ]) {
    assert.equal(c.includes(nhan), true, `Thiếu: ${nhan}`);
    assert.equal(web.includes(nhan), true, `Web phải có: ${nhan}`);
  }
  // Web là "Đơn hàng của bạn" cho panel tóm tắt; Mobile giữ "Tóm tắt đơn hàng" theo chỉ định.
  assert.equal(c.includes('Tóm tắt đơn hàng'), true);
  assert.equal(c.includes('Tổng thanh toán'), true, 'Nhãn tổng khớp Web');
  assert.equal(c.includes('Tổng cộng'), false, 'Bỏ nhãn lệch Web');
  assert.equal(c.includes('Phí vận chuyển'), true);
});

// ============================================================ PROBLEM 3 — VOUCHER

test('3.1 Checkout Mobile dùng API voucher đã lưu, không hard-code', () => {
  const c = checkout();
  assert.equal(c.includes('KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY'), true);
  assert.equal(c.includes('layKhuyenMaiDaLuuMobile'), true);
  assert.equal(c.includes('queryKey: KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY'), true);
  const lib = read('apps/mobile/src/lib/api-khuyen-mai-mobile.ts');
  assert.equal(lib.includes('export const KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY'), true);
  assert.equal(lib.includes('export async function layKhuyenMaiDaLuuMobile'), true);
});

test('3.2 Không còn ô nhập mã khuyến mãi thủ công', () => {
  const c = checkout();
  assert.equal(c.includes('Nhập mã khuyến mãi'), false, 'Bỏ ô nhập mã voucher');
  assert.equal(c.includes('maKhuyenMaiNhap'), false, 'Bỏ state nhập mã');
  assert.equal(c.includes('Voucher AgriMarket'), true);
  assert.equal(c.includes('Chỉ sử dụng voucher đã lưu trong tài khoản.'), true);
  assert.equal(c.includes('Chọn voucher'), true);
});

test('3.3 Voucher picker là selector full-screen, dùng FlatList', () => {
  const c = checkout();
  assert.equal(c.includes('function BoChonVoucher'), true);
  assert.equal(c.includes('<FlatList'), true, 'Danh sách phải virtualize');
  assert.equal(c.includes('presentationStyle="fullScreen"'), true, 'Full-screen, không bottom sheet');
  // KHÔNG nested Modal (chỉ đúng 1 Modal trong file).
  assert.equal((c.match(/<Modal/g) || []).length, 1, 'Chỉ một Modal duy nhất');
  assert.equal(c.includes('onRequestClose'), true, 'Nút Back Android phải đóng được');
});

test('3.4 Voucher picker có empty state + nút xem khuyến mãi', () => {
  const c = checkout();
  assert.equal(c.includes('Ví voucher đang trống'), true);
  assert.equal(c.includes('Hãy lưu voucher ở trang Khuyến mãi trước khi thanh toán.'), true);
  assert.equal(c.includes('Xem khuyến mãi'), true);
  assert.equal(c.includes('onXemKhuyenMai'), true);
});

// ------------------------------------------- BUG 2 — lỗi API voucher ≠ ví rỗng

test('3.6 Picker nhận trạng thái lỗi API riêng, không suy từ data rỗng', () => {
  const c = checkout();
  assert.equal(c.includes('loi={voucherDaLuuQuery.isError}'), true, 'Truyền isError vào picker');
  assert.equal(c.includes('loi: boolean;'), true, 'Picker khai báo prop loi');
  assert.equal(c.includes('onThuLai: () => void;'), true, 'Picker nhận callback thử lại');
  assert.equal(
    c.includes('onThuLai={() => void voucherDaLuuQuery.refetch()}'),
    true,
    'Thử lại = refetch',
  );
  // Danh sách vẫn lấy từ data, nhưng KHÔNG dùng nó để quyết định empty state.
  assert.match(c, /const danhSachVoucher = voucherDaLuuQuery\.data \?\? \[\];/);
});

test('3.7 Lỗi API hiện "Không tải được ví voucher" + Thử lại, KHÔNG hiện ví rỗng', () => {
  const c = checkout();
  assert.equal(c.includes('Không tải được ví voucher'), true);
  assert.equal(c.includes('Hãy kiểm tra kết nối và thử lại.'), true);
  assert.equal(c.includes('actionLabel="Thử lại"'), true);

  // Thứ tự nhánh: đang tải → lỗi → rỗng. Lỗi phải ĐỨNG TRƯỚC nhánh rỗng,
  // nếu không lỗi sẽ rơi vào empty state và nói dối khách.
  const iLoading = c.indexOf('{dangTai ? (');
  const iError = c.indexOf(') : loi ? (');
  const iEmpty = c.indexOf(') : danhSach.length === 0 ? (');
  assert.equal(iLoading > -1, true, 'Thiếu nhánh đang tải');
  assert.equal(iError > -1, true, 'Thiếu nhánh lỗi');
  assert.equal(iEmpty > -1, true, 'Thiếu nhánh ví rỗng');
  assert.equal(
    iLoading < iError && iError < iEmpty,
    true,
    'Sai thứ tự nhánh: lỗi phải đứng trước nhánh rỗng',
  );

  // Kiểm tra trên CODE đã bỏ comment — nhánh lỗi và nhánh rỗng không lẫn copy.
  const code = boComment(c);
  const nhanhLoi = code.slice(code.indexOf(') : loi ? ('), code.indexOf(') : danhSach.length === 0 ? ('));
  assert.equal(nhanhLoi.includes('Ví voucher đang trống'), false, 'Nhánh lỗi không chứa copy ví rỗng');
  assert.equal(nhanhLoi.includes('ErrorState'), true, 'Nhánh lỗi phải dùng ErrorState');
  const nhanhRong = code.slice(
    code.indexOf(') : danhSach.length === 0 ? ('),
    code.indexOf(') : (', code.indexOf(') : danhSach.length === 0 ? (')),
  );
  assert.equal(nhanhRong.includes('Ví voucher đang trống'), true, 'Nhánh rỗng mới được chứa copy ví rỗng');
  assert.equal(nhanhRong.includes('Không tải được ví voucher'), false, 'Nhánh rỗng không chứa copy lỗi');

  // Ô tìm kiếm không hiện khi đang lỗi.
  assert.equal(c.includes('danhSach.length > 1 && !loi'), true);
  // Thông báo ngoài picker nói rõ tác động, không nói ví rỗng.
  assert.match(
    code,
    /Không tải được ví voucher\. Bạn vẫn có thể thanh toán không voucher\./,
  );
});

test('3.5 Voucher đã chọn hiện mã, mức giảm, điều kiện và nút Đổi / Bỏ', () => {
  const c = checkout();
  assert.equal(c.includes('voucherDangChon'), true);
  assert.equal(c.includes('Giảm {dinhDangGia(voucherDangChon.giaTriGiam)}'), true);
  assert.equal(c.includes('Đơn tối thiểu'), true, 'Hiện điều kiện đơn tối thiểu');
  assert.equal(c.includes('Đổi'), true);
  assert.equal(c.includes('Bỏ'), true);
});

test('3.6 Đổi voucher reset điểm tạm thời rồi preview lại (cùng luật Web)', () => {
  const c = checkout();
  const web = read(WEB_CHECKOUT);
  assert.equal(/function chonVoucher\(maKhuyenMai: string\)/.test(c), true);
  assert.match(c, /setUuDaiApDung\(\{ maKhuyenMai, diemSuDung: undefined \}\)/);
  // Web cũng phải reset điểm khi đổi voucher.
  assert.match(web, /diemSuDung: undefined/);
  assert.equal(c.includes('apDungUuDai'), false, 'Bỏ luồng áp dụng thủ công');
  // Preview refetch theo query key chứa voucher + điểm.
  assert.equal(c.includes("uuDaiApDung.maKhuyenMai ?? ''"), true);
  assert.equal(c.includes("uuDaiApDung.diemSuDung ?? 0"), true);
});

// ============================================================ PROBLEM 4 — POINTS

test('4.1 Không còn ô nhập số điểm thủ công', () => {
  const c = checkout();
  assert.equal(c.includes('Số điểm muốn dùng'), false);
  assert.equal(c.includes('diemNhap'), false);
  assert.equal(c.includes('keyboardType="number-pad"'), false, 'Không còn bàn phím số ở checkout');
});

test('4.2 Điểm thưởng đọc từ preview.loyalty, có công tắc dùng tối đa', () => {
  const c = checkout();
  assert.equal(c.includes('preview.loyalty.soDuDiem'), true);
  assert.equal(c.includes('preview.loyalty.diemToiDaCoTheSuDung'), true);
  assert.match(c, /Bạn có \$\{dinhDangSo\(soDuDiem\)\} điểm\./);
  assert.match(c, /Có thể dùng tối đa \$\{dinhDangSo\(diemToiDaCoTheSuDung\)\} điểm cho đơn này\./);
  assert.equal(c.includes('Bạn chưa có điểm thưởng để dùng cho đơn này.'), true, '0 điểm phải nói rõ');
});

// ------------------------------------------------------------ BUG 1 — điểm không được gắn "đ"

test('4.5 Điểm thưởng KHÔNG được format bằng formatter tiền', () => {
  const c = checkout();
  // dinhDangGia() gắn hậu tố "đ" → dùng cho điểm sẽ sinh "100đ điểm".
  for (const bien of ['soDuDiem', 'diemToiDaCoTheSuDung', 'diemDangDung']) {
    assert.equal(
      c.includes(`dinhDangGia(${bien})`),
      false,
      `Không được dùng dinhDangGia cho ${bien} (sẽ ra "<số>đ điểm")`,
    );
  }
  // Phải có formatter số/điểm riêng, không gắn ký hiệu tiền.
  assert.match(c, /function dinhDangSo\(value: number\): string \{\s*return Math\.round\(value\)\.toLocaleString\('vi-VN'\);\s*\}/);
  assert.equal(
    /function dinhDangSo[\s\S]{0,200}đ/.test(c),
    false,
    'dinhDangSo không được gắn ký hiệu "đ"',
  );
  // Cả 3 vị trí hiển thị + accessibilityLabel đều qua formatter điểm.
  assert.match(c, /Bạn có \$\{dinhDangSo\(soDuDiem\)\} điểm\./);
  assert.match(c, /tối đa \$\{dinhDangSo\(diemToiDaCoTheSuDung\)\} điểm/);
  assert.equal(
    (c.match(/Đang dùng \$\{dinhDangSo\(diemDangDung\)\} điểm/g) || []).length,
    2,
    'Cả label hiển thị lẫn accessibilityLabel đều phải dùng formatter điểm',
  );
  // Không được nối formatter tiền (gắn "đ") ngay trước chữ "điểm".
  assert.equal(
    /dinhDangGia\([^)]*\)\}\s*điểm/.test(c),
    false,
    'Không được render "<số>đ điểm"',
  );
  // Không có chuỗi dính "đ" thừa trong copy điểm.
  assert.equal(
    /đ\s*điểm/.test(boComment(c)),
    false,
    'Không được có "đ điểm" trong copy hiển thị',
  );
});

test('4.6 Tiền vẫn dùng dinhDangGia (không đổi formatter tiền)', () => {
  const c = checkout();
  for (const mau of [
    'dinhDangGia(preview.price.tamTinhHangHoa)',
    'dinhDangGia(preview.total.tongThanhToan)',
    'dinhDangGia(item.donGia)',
    'dinhDangGia(item.thanhTien)',
    'dinhDangGia(item.giaTriGiam)',
  ]) {
    assert.equal(c.includes(mau), true, `Tiền phải qua dinhDangGia: ${mau}`);
  }
  assert.match(c, /function dinhDangGia\(value: number\): string \{\s*return `\$\{Math\.round\(value\)\.toLocaleString\('vi-VN'\)\}đ`;\s*\}/);
});

test('4.3 Công tắc điểm: bật = tối đa, tắt = undefined, không tự tính tiền', () => {
  const c = checkout();
  assert.match(c, /diemSuDung: dung && diemToiDaCoTheSuDung > 0 \? diemToiDaCoTheSuDung : undefined/);
  assert.equal(c.includes('function doiDungDiem(dung: boolean)'), true);
  // Không tự nhân điểm × giá trị điểm để quyết định tổng.
  assert.equal(/giaTriMoiDiem\s*\*|\*\s*giaTriMoiDiem/.test(c), false);
  assert.equal(c.includes('giaTriMoiDiem'), false, 'Không tự quy đổi giá trị điểm ở client');
  assert.equal(c.includes('giaTriGiamToiDa'), false, 'Không tự quy đổi giảm giá điểm ở client');
  // Tổng tiền lấy từ server.
  assert.equal(c.includes('preview.total.tongThanhToan'), true);
  assert.equal(c.includes('preview.total.coTheXacNhan'), true);
});

test('4.4 Công tắc điểm có accessibilityRole="switch" và khoá khi không dùng được', () => {
  const c = checkout();
  assert.equal(c.includes('accessibilityRole="switch"'), true);
  assert.equal(c.includes('accessibilityState={{ checked: dangDung, disabled: khongDungDuoc }}'), true);
  assert.equal(c.includes('const khongDungDuoc = khoa || diemToiDaCoTheSuDung <= 0'), true);
  assert.equal(c.includes('Dùng điểm tối đa'), true);
});

// ============================================================ PROBLEM 8 — PAYMENT

test('8.1 COD / VNPay Sandbox giữ nguyên và wording khớp Web', () => {
  const c = checkout();
  const web = read(WEB_CHECKOUT);
  assert.equal(c.includes('taoThanhToanCodMobile'), true);
  assert.equal(c.includes('taoThanhToanVnPaySandboxMobile'), true);
  assert.equal(c.includes("value='VNPAY_SANDBOX'") || c.includes('value="VNPAY_SANDBOX"'), true);
  for (const nhan of [
    'VNPay Sandbox',
    'Thanh toán khi nhận hàng',
    'Chuyển sang cổng thanh toán thử nghiệm để hoàn tất giao dịch.',
    'Thanh toán cho đơn hàng khi bạn nhận hàng.',
  ]) {
    assert.equal(c.includes(nhan), true, `Thiếu wording payment: ${nhan}`);
    assert.equal(web.includes(nhan), true, `Web phải có: ${nhan}`);
  }
});

test('8.2 VNPay Sandbox luôn ghi rõ môi trường thử nghiệm', () => {
  const c = checkout();
  assert.equal(c.includes('MÔI TRƯỜNG THỬ NGHIỆM'), true);
  assert.equal(/accessibilityRole="radio"/.test(c), true, 'Payment option là radio');
  assert.equal(c.includes('accessibilityRole="radiogroup"'), true);
});

test('8.3 Payment 2 cột khi đủ rộng, 1 cột khi máy hẹp', () => {
  const c = checkout();
  assert.equal(c.includes('const haiCotThanhToan = width >= 400'), true);
  assert.equal(c.includes('useWindowDimensions()'), true);
  assert.equal(c.includes("haiCotThanhToan ? 'flex-row gap-3' : 'gap-2.5'"), true);
});

// ============================================================ PROBLEM 6 — ADDRESS

test('6.1 Giữ rule Hưng Yên-only và cho chọn địa chỉ hợp lệ', () => {
  const c = checkout();
  assert.equal(c.includes('thuocPhamViGiaoHangHungYen'), true);
  assert.equal(c.includes('PHAM_VI_GIAO_HANG_AGRIMARKET.moTa'), true);
  assert.equal(c.includes('Ngoài khu vực'), true);
  assert.equal(c.includes('Có thể giao'), true);
  assert.equal(c.includes('Quản lý'), true, 'Có lối quản lý địa chỉ như Web');
  // Không hard-code một địa chỉ cụ thể.
  assert.equal(/c xv|0928596026/i.test(c), false, 'Không hard-code địa chỉ mẫu');
});

// ============================================================ PROBLEM 7 — PRODUCTS

test('7.1 Checkout chỉ review sản phẩm, không có điều khiển số lượng', () => {
  const c = checkout();
  assert.equal(c.includes('item.nhaCungCap.ten'), true, 'Hiện nhà cung cấp');
  assert.equal(c.includes('dinhDangGia(item.donGia)} × {item.soLuong}'), true, 'đơn giá × số lượng');
  assert.equal(c.includes('dinhDangGia(item.thanhTien)'), true, 'thành tiền');
  assert.equal(c.includes('Không đủ tồn kho'), true, 'Cảnh báo tồn kho từ server');
  // Không có nút +/- trong checkout.
  assert.equal(/capNhatSoLuong|themVaoGioHangMobile/.test(c), false);
});

// ============================================================ PROBLEM 9 — SUMMARY

test('9.1 Tóm tắt đơn hàng phản ánh đúng backend preview', () => {
  const c = checkout();
  assert.equal(c.includes('preview.price.tamTinhHangHoa'), true);
  assert.equal(c.includes('thanhPhan={preview.shipping}') || c.includes('thanhPhan={preview.shipping}'), true);
  assert.equal(c.includes('ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam'), true);
  assert.equal(c.includes('ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam'), true);
  assert.equal(c.includes('metaThanhPhanCheckout'), true, 'Dùng chung meta với Web');
  assert.equal(c.includes("'KHONG_AP_DUNG'") || c.includes('metaThanhPhanCheckout'), true);
});

// ============================================================ PROBLEM 10 — BUSINESS

test('10.1 Giữ nguyên luồng nghiệp vụ: preview → tạo đơn → tạo thanh toán', () => {
  const c = checkout();
  assert.equal(c.includes('layCheckoutPreviewMobile'), true);
  assert.equal(c.includes('taoDuLieuDonHangTuPreview'), true);
  assert.equal(c.includes('taoDonHangMobile'), true);
  // Idempotency: giữ nguyên lanDatHangRef qua các lần thử.
  assert.equal(c.includes('lanDatHangRef'), true);
  assert.equal(c.includes('maYeuCauDonHang: Crypto.randomUUID()'), true);
  assert.equal(c.includes('maYeuCauThanhToan: Crypto.randomUUID()'), true);
  assert.equal(c.includes('Checkout đã thay đổi sau khi bắt đầu đặt hàng'), true);
  // Payment mismatch vẫn bị chặn.
  assert.equal(c.includes('Giao dịch thanh toán không khớp với đơn hàng vừa tạo.'), true);
});

test('10.2 Backend vẫn là authority cho giá, tồn kho và tổng tiền', () => {
  const c = checkout();
  for (const mau of ['item.donGia', 'item.soLuong', 'preview.total.tongThanhToan']) {
    assert.equal(c.includes(mau), true, `Phải đọc ${mau} từ server`);
  }
  assert.equal(/Math\.round\(.*donGia\s*\*\s*item\.soLuong/.test(c), false, 'Không tự nhân giá × số lượng');
});

// ============================================================ PROBLEM 5 — UI

test('5.1 Checkout Mobile bỏ pattern ô vuông xanh 40x40 cho từng section', () => {
  const c = checkout();
  assert.equal(c.includes('h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7ED]'), false);
  assert.equal(c.includes('h-10 w-10'), false, 'Không còn icon container cỡ lớn');
  assert.equal(c.includes('size={18}'), true, 'Icon nhỏ cạnh title');
});

test('5.2 Checkout Mobile dùng border radius gọn, không card trong card quá nhiều', () => {
  const c = checkout();
  // Không còn radius 16-22px cho container chính.
  assert.equal(/rounded-\[(1[6-9]|2[0-9])px\]/.test(c), false, 'Radius phải gọn 10-14px');
  assert.equal(c.includes('rounded-[14px]'), true);
  assert.equal(c.includes('rounded-[12px]'), true);
});

test('5.3 Checkout Mobile nền mint chỉ dùng cho selected/success/highlight', () => {
  const c = checkout();
  const mint = (c.match(/bg-\[#F1FAF5\]/g) || []).length;
  // Nền mint chỉ ở: banner phạm vi giao, địa chỉ selected, payment selected, voucher đang dùng, switch.
  assert.equal(mint <= 6, true, `Không được phủ mint diện rộng (${mint} chỗ)`);
  assert.equal(c.includes('bg-[#F1FAF5] p-4'), false, 'Không cả khối lớn nền mint');
});

test('5.4 Typography section 16-18px, chỉ page title lớn', () => {
  const c = checkout();
  assert.equal(c.includes('text-[17px] font-extrabold text-[#202A24]">{title}'), true);
  assert.equal(c.includes('text-[25px]'), false, 'Title 25px là quá nặng');
  assert.equal(c.includes('text-[27px]'), false);
  assert.equal(c.includes('text-[19px] font-extrabold text-[#202A24]'), false);
});

// ============================================================ WEB KHÔNG ĐỔI

test('12.1 Customer Web không bị redesign theo Mobile', () => {
  const web = checkout === undefined ? '' : read(WEB_CHECKOUT);
  // Web vẫn giữ hierarchy + modal voucher như thiết kế gốc.
  assert.equal(web.includes('Voucher và điểm thưởng'), true);
  assert.equal(web.includes('title="Chọn voucher đã lưu"'), true);
  assert.equal(web.includes('Dùng điểm tối đa'), true);
  assert.equal(web.includes('Địa chỉ nhận hàng'), true);
  assert.equal(web.includes('Đơn hàng của bạn'), true);
});
