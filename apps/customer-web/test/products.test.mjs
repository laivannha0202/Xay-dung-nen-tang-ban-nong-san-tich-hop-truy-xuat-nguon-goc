import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper mô phỏng parse search params thành API Query DTO của /san-pham
function parseUrlToApiParams(queryString) {
  const searchParams = new URLSearchParams(queryString);
  const timKiem = (searchParams.get('timKiem') ?? searchParams.get('q') ?? '').trim();
  const danhMuc = (searchParams.get('danhMuc') ?? searchParams.get('category') ?? '').trim();
  const trangTraiId = (searchParams.get('trangTraiId') ?? searchParams.get('farm') ?? '').trim();
  const tinhThanh = (searchParams.get('tinhThanh') ?? '').trim();
  const chungNhan = (searchParams.get('chungNhan') ?? searchParams.get('certificate') ?? '').trim();
  const giaTuParam = searchParams.get('giaTu');
  const giaDenParam = searchParams.get('giaDen');
  const giaTu = giaTuParam ? Number(giaTuParam) : undefined;
  const giaDen = giaDenParam ? Number(giaDenParam) : undefined;

  const sapXepRaw = (searchParams.get('sapXep') ?? searchParams.get('sort') ?? 'MOI_NHAT').toUpperCase();
  const sapXep = ['PHU_HOP', 'MOI_NHAT', 'TEN_AZ', 'TEN_ZA', 'GIA_TANG', 'GIA_GIAM'].includes(sapXepRaw)
    ? sapXepRaw
    : 'MOI_NHAT';

  const trang = Math.max(1, parseInt(searchParams.get('trang') ?? '1', 10) || 1);
  const gioiHan = 16;

  return {
    trang,
    gioiHan,
    timKiem: timKiem || undefined,
    danhMuc: danhMuc && danhMuc !== 'tat-ca' ? danhMuc : undefined,
    trangTraiId: trangTraiId || undefined,
    tinhThanh: tinhThanh || undefined,
    chungNhan: chungNhan || undefined,
    giaTu: typeof giaTu === 'number' && !Number.isNaN(giaTu) ? giaTu : undefined,
    giaDen: typeof giaDen === 'number' && !Number.isNaN(giaDen) ? giaDen : undefined,
    sapXep,
  };
}

function updateParams(currentQueryString, updates) {
  const params = new URLSearchParams(currentQueryString);
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === '') {
      params.delete(k);
      if (k === 'timKiem') params.delete('q');
      if (k === 'danhMuc') params.delete('category');
      if (k === 'trangTraiId') params.delete('farm');
      if (k === 'chungNhan') params.delete('certificate');
      if (k === 'sapXep') params.delete('sort');
    } else {
      params.set(k, String(v));
      if (k === 'timKiem') params.delete('q');
      if (k === 'danhMuc') params.delete('category');
      if (k === 'trangTraiId') params.delete('farm');
      if (k === 'chungNhan') params.delete('certificate');
      if (k === 'sapXep') params.delete('sort');
    }
  }
  if (!('trang' in updates)) {
    params.delete('trang');
  }
  return params.toString();
}

function dinhDangGia(value) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function formatPriceDisplay(giaTu, giaDen) {
  const coGiaTu = typeof giaTu === 'number' && giaTu > 0;
  const coKhoangGia = coGiaTu && typeof giaDen === 'number' && giaDen > giaTu;
  return coKhoangGia
    ? `${dinhDangGia(giaTu)}đ – ${dinhDangGia(giaDen)}đ`
    : coGiaTu
      ? `${dinhDangGia(giaTu)}đ`
      : 'Liên hệ';
}

function tinhTongTrang(tongSo, gioiHan) {
  return Math.max(1, Math.ceil(tongSo / gioiHan));
}

test('1. Parse URL search params to public product API Query DTO', () => {
  const query = 'timKiem=c%C3%A0+chua&danhMuc=rau-cu&giaTu=20000&giaDen=50000&sapXep=GIA_TANG&trang=2';
  const parsed = parseUrlToApiParams(query);

  assert.equal(parsed.timKiem, 'cà chua');
  assert.equal(parsed.danhMuc, 'rau-cu');
  assert.equal(parsed.giaTu, 20000);
  assert.equal(parsed.giaDen, 50000);
  assert.equal(parsed.sapXep, 'GIA_TANG');
  assert.equal(parsed.trang, 2);
  assert.equal(parsed.gioiHan, 16);
});

test('2. Header form alias compatibility: fallback q -> timKiem, category -> danhMuc', () => {
  const query = 'q=d%C6%B0a+l%C6%B0%E1%BB%9Bi&category=trai-cay&farm=farm-123';
  const parsed = parseUrlToApiParams(query);

  assert.equal(parsed.timKiem, 'dưa lưới');
  assert.equal(parsed.danhMuc, 'trai-cay');
  assert.equal(parsed.trangTraiId, 'farm-123');
  assert.equal(parsed.sapXep, 'MOI_NHAT');
  assert.equal(parsed.trang, 1);
});

test('3. Reset trang=1 when filter or search changes', () => {
  const current = 'danhMuc=rau-cu&trang=3&sapXep=MOI_NHAT';
  const updated = updateParams(current, { chungNhan: 'VietGAP' });

  const params = new URLSearchParams(updated);
  assert.equal(params.get('chungNhan'), 'VietGAP');
  assert.equal(params.get('danhMuc'), 'rau-cu');
  assert.equal(params.has('trang'), false, 'trang should be reset when changing filter');
});

test('4. Preserve filter and update trang when user changes page', () => {
  const current = 'danhMuc=rau-cu&chungNhan=VietGAP&trang=2';
  const updated = updateParams(current, { trang: 3 });

  const params = new URLSearchParams(updated);
  assert.equal(params.get('chungNhan'), 'VietGAP');
  assert.equal(params.get('danhMuc'), 'rau-cu');
  assert.equal(params.get('trang'), '3');
});

test('5. Real pagination calculation', () => {
  assert.equal(tinhTongTrang(0, 16), 1);
  assert.equal(tinhTongTrang(12, 16), 1);
  assert.equal(tinhTongTrang(16, 16), 1);
  assert.equal(tinhTongTrang(17, 16), 2);
  assert.equal(tinhTongTrang(48, 16), 3);
});

test('6. Price formatting matches requirements (single vs range)', () => {
  assert.equal(formatPriceDisplay(28000, 28000), '28.000đ');
  assert.equal(formatPriceDisplay(28000, null), '28.000đ');
  assert.equal(formatPriceDisplay(28000, 45000), '28.000đ – 45.000đ');
  assert.equal(formatPriceDisplay(null, null), 'Liên hệ');
});

test('7. Guarantee: MOCKUP_PRODUCTS is not imported in danh-sach-san-pham-content.tsx', () => {
  const content = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/customer-web/src/components/danh-sach-san-pham-content.tsx'),
    'utf-8'
  );
  assert.equal(content.includes('MOCKUP_PRODUCTS'), false, 'Should not import or reference MOCKUP_PRODUCTS');
  assert.equal(content.includes('locSanPhamMockup'), false, 'Should not import locSanPhamMockup');
  assert.equal(content.includes('MockupProduct'), false, 'Should not reference MockupProduct');
});

test('8. Guarantee: MOCKUP_PRODUCTS is not imported in chi-tiet-san-pham-content.tsx', () => {
  const content = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/customer-web/src/components/chi-tiet-san-pham-content.tsx'),
    'utf-8'
  );
  assert.equal(content.includes('MOCKUP_PRODUCTS'), false, 'Should not import or reference MOCKUP_PRODUCTS');
  assert.equal(content.includes('sanPhamMockup'), false, 'Should not have sanPhamMockup fallback');
});

test('9. Guarantee: ProductCard has no fake rating default or fake VietGAP badge fallback', () => {
  const content = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/customer-web/src/components/product-card.tsx'),
    'utf-8'
  );
  assert.equal(content.includes("danhGia = 4.8"), false, 'Should not default danhGia to 4.8');
  assert.equal(content.includes("soDanhGia = 100"), false, 'Should not default soDanhGia to 100');
  assert.equal(content.includes("xuatXu = 'Đà Lạt'"), false, 'Should not default xuatXu to Đà Lạt');
  assert.equal(content.includes("|| 'VietGAP'"), false, 'Should not fallback to VietGAP');
});

// ============================================================================
// CUSTOMER PRODUCT FINAL POLISH — semantic giá gói / tồn gói (backend contract:
// `gia` = giá 01 gói variant, `soLuongKhaDung` = số gói khả dụng).
// Helpers thật từ packages/api-client/src/domain-ui.ts (không duplicate logic).
// ============================================================================
import {
  dinhDangGiaVND,
  hienThiGiaGoi,
  hienThiGoiQuyCach,
  hienThiKhoangGia,
  hienThiTonKhaDung,
  laHetHang,
} from '../../../packages/api-client/src/domain-ui.ts';

function docComponent(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${tenFile}`),
    'utf-8',
  );
}

test('10. Price semantic: gia=12000 variant 250g renders package price, never per-gram', () => {
  // Ví dụ trong sprint: variant 250 g có gia = 12.000đ (giá 01 gói).
  assert.equal(hienThiGiaGoi(12000, { khoiLuong: 250, donVi: 'g' }), '12.000đ / gói 250 g');
  assert.equal(hienThiGiaGoi(25000, { khoiLuong: 0.3, donVi: 'kg' }), '25.000đ / gói 300 g');
  assert.equal(hienThiGiaGoi(35000, { khoiLuong: 10, donVi: 'quả' }), '35.000đ / 10 quả');
  assert.equal(hienThiGiaGoi(0, { khoiLuong: 250, donVi: 'g' }), 'Liên hệ');

  const hienThi = hienThiGiaGoi(12000, { khoiLuong: 250, donVi: 'g' });
  assert.equal(hienThi.includes('gói 250 g'), true, 'Phải ghi rõ giá theo gói 250 g');
  assert.equal(/đ\s*\/\s*g(\s|$)/.test(hienThi), false, 'Không được có dạng per-gram "đ/g"');
});

test('11. Package spec display: quy cách gói đúng đơn vị, không trần trụi', () => {
  assert.equal(hienThiGoiQuyCach({ khoiLuong: 250, donVi: 'g' }), 'gói 250 g');
  assert.equal(hienThiGoiQuyCach({ khoiLuong: 0.5, donVi: 'kg' }), 'gói 500 g');
  assert.equal(hienThiGoiQuyCach({ khoiLuong: 10, donVi: 'quả' }), '10 quả');
  assert.equal(dinhDangGiaVND(12000), '12.000');
});

test('12. List price range: dữ liệu thật, không gắn /g /kg', () => {
  assert.equal(hienThiKhoangGia(28000, 28000), '28.000đ');
  assert.equal(hienThiKhoangGia(28000, 45000), '28.000đ – 45.000đ');
  assert.equal(hienThiKhoangGia(32000, null), '32.000đ');
  assert.equal(hienThiKhoangGia(null, null), 'Liên hệ');
});

test('13. Availability semantic: số ĐƠN VỊ, không gọi mọi variant là gói', () => {
  assert.equal(hienThiTonKhaDung(10), '10 đơn vị');
  assert.equal(hienThiTonKhaDung(100), '100 đơn vị');
  assert.equal(laHetHang(0), true);
  assert.equal(laHetHang(-1), true);
  assert.equal(laHetHang(null), true);
  assert.equal(laHetHang(3), false);
});

test('14. Guarantee: chi tiết không render "đ/g", "đ/kg" hay "Tồn khả dụng: 0 g"', () => {
  const content = docComponent('chi-tiet-san-pham-content.tsx');
  assert.equal(content.includes('₫/{'), false, 'Không được render ₫/{donVi}');
  assert.equal(content.includes('/{bienTheDaChon.donVi}'), false);
  assert.equal(content.includes('soLuongKhaDung)} ${'), false, 'Không ghép đơn vị sau tồn khả dụng');
  assert.equal(content.includes('hienThiTonKhaDung'), true, 'Tồn phải qua helper số gói');
  assert.equal(content.includes('hienThiGoiQuyCach'), true, 'Giá phải kèm mô tả gói');
  assert.equal(content.includes('Tạm hết hàng'), true);
});

test('15. Guarantee: ProductCard không render "/g" hay "/kg" sau giá', () => {
  const content = docComponent('product-card.tsx');
  assert.equal(content.includes('/{donVi}'), false, 'Không được render /{donVi} sau giá');
  assert.equal(content.includes('đ/g'), false);
  assert.equal(content.includes('đ/kg'), false);
  assert.equal(content.includes('hienThiGiaGoi'), true);
});

test('16. Guarantee: không wording kỹ thuật backend ở 2 màn sản phẩm', () => {
  const chiTiet = docComponent('chi-tiet-san-pham-content.tsx');
  const danhSach = docComponent('danh-sach-san-pham-content.tsx');
  for (const [ten, content] of [['chi-tiet', chiTiet], ['danh-sach', danhSach]]) {
    assert.equal(content.includes('Nông sản công khai'), false, `${ten}: bỏ thuật ngữ công khai`);
    assert.equal(content.includes('loại biến thể'), false, `${ten}: bỏ từ biến thể`);
  }
  assert.equal(chiTiet.includes('Tất cả nông sản') || chiTiet.includes('Sản phẩm'), true);
  assert.equal(danhSach.includes('Tất cả nông sản'), true);
});

test('17. Guarantee: review rỗng không hiện —/5; chứng nhận rỗng đúng wording', () => {
  const danhGia = docComponent('danh-gia-san-pham.tsx');
  assert.equal(danhGia.includes("?? '—'"), false, 'Không render —/5 khi chưa có đánh giá');
  assert.equal(danhGia.includes('Chưa có đánh giá'), true);
  assert.equal(danhGia.includes('0 lượt đánh giá'), true);
  const chiTiet = docComponent('chi-tiet-san-pham-content.tsx');
  assert.equal(chiTiet.includes('Chưa có chứng nhận được công khai'), true);
});

test('18. Guarantee: related chỉ từ backend, không fill mock; trace không QR giả', () => {
  const content = docComponent('chi-tiet-san-pham-content.tsx');
  assert.equal(content.includes('Math.random'), false, 'Không fill related ngẫu nhiên');
  assert.equal(content.includes('MOCKUP'), false);
  assert.equal(content.includes('href="/truy-xuat"'), true, 'CTA trace về /truy-xuat');
  assert.equal(content.includes('toDataURL'), false, 'Không tự sinh QR giả');
  assert.equal(content.includes('mã truy xuất riêng'), true, 'Giữ ngữ nghĩa mã theo lô');
});

test('20. Guarantee: harvest theo lô đang bán, fallback dẫn về truy xuất', () => {
  const content = docComponent('chi-tiet-san-pham-content.tsx');
  assert.equal(content.includes('Thu hoạch gần nhất của lô đang bán'), true, 'Label harvest phải gắn với lô');
  assert.equal(content.includes('Thu hoạch gần nhất tại trang trại'), false, 'Bỏ label farm-fallback gây hiểu nhầm');
  assert.equal(content.includes('nguồn gốc theo lô thực tế'), true, 'Fallback dẫn về quét mã lô');
});

test('19. Guarantee: brand AgriMarket thống nhất, giao hàng theo backend scope', () => {
  const footer = docComponent('agri-footer.tsx');
  const header = docComponent('agri-header.tsx');
  assert.equal(footer.includes('Nông Sạch Việt'), false, 'Footer không dùng brand cũ');
  assert.equal(footer.includes('nongsachviet'), false);
  assert.equal(footer.includes('AgriMarket'), true);
  assert.equal(header.includes('AgriMarket'), true);
  assert.equal(header.includes('PHAM_VI_GIAO_HANG_AGRIMARKET'), true, 'Giao đến theo scope backend');
});
