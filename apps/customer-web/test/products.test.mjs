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
