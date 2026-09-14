import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docApp(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/admin-web/src/app/${relativePath}`),
    'utf-8',
  );
}

function docLib(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), `apps/admin-web/src/lib/${relativePath}`), 'utf-8');
}

const kiemDinh = () => docApp('kiem-dinh-chat-luong/page.tsx');
const chungNhan = () => docApp('chung-nhan/page.tsx');
const libKiemDinh = () => docLib('api-kiem-dinh-chat-luong.ts');
const libChungNhan = () => docLib('api-chung-nhan.ts');

test('1. inspection list uses exact backend result enum, no invented values', () => {
  const d = kiemDinh();
  for (const e of ['PASSED', 'FAILED', 'HOLD', 'RECALLED']) {
    assert.ok(d.includes(e), `missing inspection result enum ${e}`);
  }
  assert.equal(/APPROVED|REJECTED|QUALITY_SCORE/.test(d), false);
});

test('2. inspection targets ProductBatch via real selector, no raw UUID input', () => {
  const d = kiemDinh();
  assert.match(d, /layLoCoTheKiemDinh/);
  assert.match(d, /name="loSanPhamId"/);
  assert.equal(/ProFormText[^>]*name="loSanPhamId"/.test(d), false);
  assert.match(libKiemDinh(), /layDanhSachLoSanPham/);
});

test('3. inspection candidate statuses delegate to backend state machine', () => {
  const d = kiemDinh();
  assert.match(d, /CHO_KIEM_DINH/);
  assert.match(d, /TAM_GIU/);
  assert.match(d, /CO_THE_BAN/);
  // Frontend must not set batch status directly
  assert.equal(d.includes('trangThai: values'), false);
  assert.match(d, /Trạng thái Lô hiện tại \(backend\)/);
});

test('4. inspection detail shows provenance Batch -> Harvest -> Season -> Farm', () => {
  const d = kiemDinh();
  assert.match(d, /Nguồn gốc: Lô → Thu hoạch → Mùa vụ → Trang trại/);
  assert.match(d, /ngayThuHoach/);
  assert.match(d, /ngayHetHan/);
  assert.match(d, /nguoiKiemDinh/);
  assert.match(d, /phanHang/);
  assert.match(d, /ghiChu/);
});

test('5. inspection attachments use real file endpoint, no base64/object URLs', () => {
  const d = kiemDinh();
  assert.match(d, /taiAnhKiemDinh/);
  assert.match(d, /tepTinIds/);
  assert.match(libKiemDinh(), /tep-tin\/tai-len/);
  assert.equal(d.includes('base64'), false);
  assert.equal(d.includes('URL.createObjectURL'), false);
  assert.match(d, /Chưa có ảnh kiểm định/);
});

test('6. inspection mutations gated by RBAC, read-only gets no create action', () => {
  const d = kiemDinh();
  assert.match(d, /kiem_dinh_chat_luong\.xem/);
  assert.match(d, /kiem_dinh_chat_luong\.tao/);
  assert.match(d, /Bạn không có quyền xem kiểm định chất lượng/);
});

test('7. certification belongs to exact Farm via real selector, no raw UUID', () => {
  const d = chungNhan();
  assert.match(d, /layTrangTraiHoatDong/);
  assert.match(d, /name="trangTraiId"/);
  assert.equal(/ProFormText[^>]*name="trangTraiId"/.test(d), false);
});

test('8. certification verification uses exact backend enum + secured endpoint', () => {
  const d = chungNhan();
  for (const e of ['CHO_XAC_MINH', 'DA_XAC_MINH', 'TU_CHOI']) {
    assert.ok(d.includes(e), `missing verification enum ${e}`);
  }
  assert.match(d, /xacMinh\(row\.id/);
  assert.match(d, /lyDoTuChoi/);
  // Never mutate verification status locally (direct assignment, not === comparison)
  assert.equal(/\.trangThaiXacMinh\s*=(?!=)/.test(d), false);
  assert.match(libChungNhan(), /xacMinhChungNhan/);
});

test('9. certification detail shows verified time + persisted warnings, derived expiry is display-only', () => {
  const d = chungNhan();
  assert.match(d, /xacMinhLuc/);
  assert.match(d, /canhBao30NgayLuc/);
  assert.match(d, /canhBao7NgayLuc/);
  assert.match(d, /canhBaoHetHanLuc/);
  assert.match(d, /Hiệu lực \(hiển thị\)/);
  assert.match(d, /Đã xác minh bởi AgriMarket/);
  assert.equal(d.includes('AgriMarket cấp chứng nhận'), false);
  assert.equal(d.includes('AgriMarket chứng nhận sản phẩm'), false);
});

test('10. no fake quality/certification data on touched pages', () => {
  for (const src of [kiemDinh(), chungNhan()]) {
    assert.equal(src.includes('MOCK'), false);
    assert.equal(src.includes('FAKE'), false);
    assert.equal(/điểm phòng thí nghiệm|laboratory score|safety percentage|quality stars/i.test(src), false);
  }
  assert.match(chungNhan(), /Chưa có chứng nhận|Chứng nhận/);
});
