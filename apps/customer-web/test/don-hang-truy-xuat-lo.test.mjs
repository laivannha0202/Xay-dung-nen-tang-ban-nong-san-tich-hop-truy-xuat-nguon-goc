import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docComponent(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${tenFile}`),
    'utf-8',
  );
}

function docLib(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/lib/${tenFile}`),
    'utf-8',
  );
}

const detail = () => docComponent('chi-tiet-don-hang-content.tsx');
const lib = () => docLib('api-don-hang.ts');

test('1. lib expose exact allocation array, customer-safe fields only', () => {
  const l = lib();
  assert.match(l, /phanBo/);
  assert.match(l, /maLo/);
  assert.match(l, /maTruyXuat/);
  // Không lộ internal kho cho khách
  assert.equal(l.includes('tonKhoLoId'), false);
  assert.equal(l.includes('loSanPhamId'), false);
  assert.equal(l.includes('maKho'), false);
});

test('2. allocation list rendered per OrderItem, all batches shown', () => {
  const d = detail();
  assert.match(d, /NGUỒN GỐC LÔ ĐÃ CẤP/);
  assert.match(d, /item\.phanBo/);
  assert.match(d, /item\.phanBo\.map/);
  assert.match(d, /allocation\.maLo/);
  assert.match(d, /Lô \{allocation\.maLo\}/);
});

test('3. trace link uses allocation.maTruyXuat -> canonical /truy-xuat?ma=', () => {
  const d = detail();
  assert.match(d, /allocation\.maTruyXuat/);
  assert.match(d, /\/truy-xuat\?ma=\$\{encodeURIComponent\(allocation\.maTruyXuat\)\}/);
  assert.match(d, /Truy xuất nguồn gốc/);
  // Không duplicate trace rendering trong Order Detail
  assert.equal(d.includes('AgriTraceTimeline'), false);
  assert.equal(d.includes('traceTimeline'), false);
});

test('4. null trace: no fake link, factual text only', () => {
  const d = detail();
  assert.match(d, /Chưa có mã truy xuất công khai/);
  // Link chỉ render khi maTruyXuat truthy
  assert.match(d, /allocation\.maTruyXuat \?/);
});

test('5. no latest-batch fallback, no inferred provenance', () => {
  const d = detail();
  const l = lib();
  for (const src of [d, l]) {
    assert.equal(/latestBatch|latest-batch|latest_batch|batchMoiNhat|loMoiNhat/i.test(src), false);
    assert.equal(src.includes('MOCK_LOT'), false);
    assert.equal(src.includes('FAKE_TRACE'), false);
    assert.equal(src.includes('maTruyXuat ||'), false);
    assert.equal(src.includes("maTruyXuat ?? '"), false);
  }
  // Không fetch Product/Harvest để suy batch
  assert.equal(/layChiTietSanPham|layLoSanPham|layThuHoach/.test(d), false);
});

test('6. allocation quantity displayed without invented unit', () => {
  const d = detail();
  assert.match(d, /Số lượng cấp:/);
  assert.match(d, /dinhDangSoLuongCap/);
  // Không gắn "kg" suy đoán vào số lượng cấp phát
  assert.equal(d.includes('Số lượng cấp: {dinhDangSoLuongCap(allocation.soLuong)} kg'), false);
  assert.equal(/Số lượng cấp:.*\+ ' kg'|Số lượng cấp:.*\$\{.*\} kg/.test(d), false);
});

test('7. snapshot info preserved alongside allocations', () => {
  const d = detail();
  assert.match(d, /item\.donGia/);
  assert.match(d, /item\.thanhTien/);
  assert.match(d, /item\.tenSanPham/);
  assert.match(d, /item\.tenTrangTrai/);
});
