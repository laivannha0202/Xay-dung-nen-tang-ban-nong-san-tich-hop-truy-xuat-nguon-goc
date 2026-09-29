/**
 * AGRIMARKET-TRACE-UX-V1
 *
 * Ba ngữ cảnh phải tách bạch, không trộn:
 *  1. Đang xem sản phẩm, chưa mua  -> nguồn gốc TỔNG QUAN (không cần mã).
 *  2. Đã mua                    -> nguồn gốc LÔ ĐÃ CẤP (allocation thật).
 *  3. Đã nhận hàng vật lý      -> tra tem (mã trên tem / mã trên đơn hàng).
 *
 * Bất biến nghiệp vụ: Product Detail TUYỆT ĐỐI không suy lô.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function doc(rel) {
  return fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
}

const PDP = 'apps/customer-web/src/components/chi-tiet-san-pham-content.tsx';
const PDP_LIB = 'apps/customer-web/src/lib/api-don-hang.ts';
const TRACE = 'apps/customer-web/src/components/truy-xuat-content.tsx';
const ORDER = 'apps/customer-web/src/components/chi-tiet-don-hang-content.tsx';

const pdp = () => doc(PDP);
const trace = () => doc(TRACE);
const order = () => doc(ORDER);

/** Bỏ comment để assert chỉ nhìn vào CODE, không nhìn chú thích. */
function boComment(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ---------------------------------------------------------------- PHASE 1

test('A1. Product Detail: CTA chính là "Xem nguồn gốc sản phẩm", không phải nhập mã', () => {
  const c = pdp();
  assert.match(c, /Xem nguồn gốc sản phẩm/);
  assert.equal(
    c.includes('Quét / Nhập mã truy xuất'),
    false,
    'CTA nhập mã không được là CTA chính ở Product Detail',
  );
});

test('A2. Product Detail: CTA chính mở tab/khu nguồn gốc, không điều hướng', () => {
  const c = pdp();
  // Nút "Xem nguồn gốc sản phẩm" phải gắn handler bật tab, không phải Link.
  assert.match(c, /onClick=\{xemNguonGocSanPham\}/);
  assert.match(c, /const xemNguonGocSanPham = \(\) => \{/);
  assert.match(c, /setTabDangChon\(TAB_NGUON_GOC\)/);
  assert.match(c, /khuThongTinRef\.current\?\.scrollIntoView/);
  // Dùng đúng API Mantine Tabs (controlled), không tự hack DOM.
  assert.match(c, /<Tabs value=\{tabDangChon\} onChange=\{setTabDangChon\}/);
  assert.equal(c.includes('defaultValue="thong-tin"'), false, 'Tabs phải controlled để mở được từ CTA');
});

// ---------------------------------------------------------------- PHASE 2

test('A3. Product provenance chỉ hiện item mà API thật support', () => {
  const c = pdp();
  assert.match(c, /Nguồn gốc sản phẩm/);
  assert.match(c, /Minh bạch từ trang trại đến thu hoạch/);
  assert.match(c, /Trang trại đối tác/);
  assert.match(c, /item\.trangTrai\.ten/);
  // Harvest: có thì ghép từ field thật, không thì nói rõ chưa có — không bịa.
  assert.match(c, /thuHoachHienThi = thuHoach/);
  assert.match(c, /dinhDangNgayNongSan\(thuHoach\.ngayThuHoach\)/);
  assert.match(c, /\$\{dinhDangNgayNongSan\(thuHoach\.ngayThuHoach\)\} · \$\{thuHoach\.cayTrong\}/);
  assert.match(c, /'Chưa có thông tin thu hoạch'/);
  // Ngày hiển thị theo kiểu Việt Nam, khớp trang truy xuất.
  assert.match(c, /function dinhDangNgayNongSan\(value: string\): string/);
  assert.match(c, /timeZone: 'UTC'/);
  // Chứng nhận: chỉ khi API có, không fallback tên danh mục.
  assert.match(c, /chungNhanSanPham\.length > 0/);
  assert.match(c, /chungNhanSanPham\.map\(\(cn\) => cn\.loai\)\.join/);
  assert.match(c, /'Chưa có chứng nhận công khai'/);
  // Không được bịa kiểm định / mùa vụ / mã lô khi API không có.
  assert.equal(c.includes('Đã kiểm định'), false, 'Không được bịa trạng thái kiểm định');
  assert.equal(c.includes('Mùa vụ đã ghi nhận'), false);
});

test('A4. Product Detail KHÔNG được suy lô / maTruyXuat', () => {
  const c = boComment(pdp());
  assert.equal(
    /latestBatch|latest-batch|latest_batch|batchMoiNhat|loMoiNhat/i.test(c),
    false,
    'Product Detail không được tự suy lô mới nhất',
  );
  assert.equal(
    /maTruyXuat/.test(c),
    false,
    'Product Detail không được mang maTruyXuat của bất kỳ lô nào',
  );
  assert.equal(c.includes('MOCK_LOT'), false);
  assert.equal(c.includes('FAKE_TRACE'), false);
  // Order lib thì ĐƯỢC mang maTruyXuat — nhưng chỉ từ allocation thật.
  const l = doc(PDP_LIB);
  assert.match(l, /phanBo/);
  assert.match(l, /maTruyXuat: string \| null/);
});

// ---------------------------------------------------------------- PHASE 3

test('A5. Vai trò mã truy xuất được giải thích nhỏ, nhẹ, là CTA phụ', () => {
  const c = pdp();
  assert.match(c, /Đã nhận sản phẩm\?/);
  assert.match(c, /Tra cứu mã trên tem/);
  assert.match(c, /href="\/truy-xuat"/);
  // CTA phụ không được nổi bật hơn hành động mua.
  assert.match(c, /variant="default"[\s\S]{0,320}?Tra cứu mã trên tem/);
  // Web không có camera scanner → không hứa quét QR.
  assert.equal(/Quét mã QR/i.test(c), false, 'Web không được hứa quét QR khi chỉ có ô nhập mã');
});

// ---------------------------------------------------------------- PHASE 4

test('C1. Order Detail dùng allocation thật, CTA nói rõ là lô đã mua', () => {
  const c = order();
  assert.match(c, /Nguồn gốc lô hàng/);
  assert.match(c, /item\.phanBo/);
  assert.match(c, /item\.phanBo\.map/);
  assert.match(c, /Lô \{allocation\.maLo\}/);
  assert.match(c, /Số lượng từ lô: \{dinhDangSo\(allocation\.soLuong\)\}/);
  assert.match(c, /Xem nguồn gốc lô đã mua/);
});

test('C2. maTruyXuat truthy -> link thật; null -> không fake link', () => {
  const c = order();
  assert.match(
    c,
    /\/truy-xuat\?ma=\$\{encodeURIComponent\(allocation\.maTruyXuat\)\}/,
    'Link phải giữ nguyên dạng /truy-xuat?ma=<maTruyXuat thật>',
  );
  assert.match(c, /allocation\.maTruyXuat \?/);
  assert.match(c, /Chưa có mã truy xuất công khai/);
  assert.equal(c.includes('maTruyXuat ??'), false, 'Không fallback mã truy xuất');
});

// ---------------------------------------------------------------- PHASE 5-7

test('D1. Trang /truy-xuat là công cụ tra tem, nói rõ người dùng cần mã vật lý', () => {
  const c = trace();
  assert.match(c, /title="Truy xuất nguồn gốc"/);
  assert.match(c, /Tra cứu nguồn gốc theo mã trên tem/);
  assert.match(c, /đã nhận sản phẩm/);
});

test('D2. /truy-xuat?ma= tự lấy mã từ URL và tự fetch, không bắt bấm lại', () => {
  const c = trace();
  assert.match(c, /searchParams\.get\('ma'\)/);
  assert.match(c, /useState\(maTrenUrl\)/, 'Input phải hiển thị mã đang tra');
  assert.match(c, /MA_TRUY_XUAT_PATTERN\.test\(maTrenUrl\) \? \(/);
  assert.match(c, /<KetQuaTruyXuat ma=\{maTrenUrl\} \/>/, 'URL có mã hợp lệ phải tự render kết quả');
  assert.match(c, /Mã khác/);
});

test('D3. Trạng thái rỗng hướng dẫn khách lấy mã ở đâu', () => {
  const c = trace();
  assert.match(c, /Chưa có mã cần tra cứu/);
  assert.match(c, /Bạn có thể tìm mã ở đâu\?/);
  assert.match(c, /Trên tem QR của sản phẩm bạn đã nhận/);
  assert.match(c, /Trong chi tiết đơn hàng đã mua/);
  assert.match(c, /Trên nhãn lô đi cùng sản phẩm/);
});

test('D4. Mã sai phải có thông báo lỗi rõ ràng, không gọi API', () => {
  const c = trace();
  assert.match(c, /Mã cần có dạng AGM- theo sau bởi 32 ký tự 0-9 hoặc A-F/);
  assert.match(c, /Mã trong liên kết không đúng định dạng AgriMarket/);
  assert.match(c, /Mã truy xuất chưa đúng định dạng/);
});

test('D5. Kết quả giữ nguyên bề mặt dữ liệu lô + nhật ký + kiểm định + thu hồi + hết hạn', () => {
  const c = trace();
  for (const token of [
    'LÔ SẢN PHẨM',
    'NƠI SẢN XUẤT',
    'Chứng nhận liên quan',
    'Nhật ký canh tác đã công khai',
    'Kiểm định',
    'Hành trình theo hồ sơ đã lưu',
    'Cảnh báo thu hồi',
    'SẢN PHẨM ĐÃ HẾT HẠN',
  ]) {
    assert.match(c, new RegExp(token), `Thiếu mục: ${token}`);
  }
});

// ---------------------------------------------------------------- PHASE 13

test('E1. Không dùng div/span bắt sự kiện click cho CTA truy xuất', () => {
  for (const c of [pdp(), order(), trace()]) {
    assert.equal(/<div[^>]*onClick/.test(c), false, 'Không dùng div onClick');
    assert.equal(/<span[^>]*onClick/.test(c), false, 'Không dùng span onClick');
  }
  // Nút trace dùng component Link -> semantic <a>.
  assert.match(pdp(), /<Button\s+component=\{Link\}\s+href="\/truy-xuat"/);
  assert.match(order(), /<Button\s+component=\{Link\}\s+href=\{`\/truy-xuat\?ma=/);
});
