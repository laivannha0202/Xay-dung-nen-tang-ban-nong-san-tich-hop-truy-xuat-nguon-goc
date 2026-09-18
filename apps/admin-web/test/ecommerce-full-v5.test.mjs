import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(root, p), 'utf8');

test('1. complaint admin bật workflow xử lý/refund thật', () => {
  const api = read('apps/admin-web/src/lib/api-khieu-nai.ts');
  const detail = read('apps/admin-web/src/components/chi-tiet-khieu-nai.tsx');
  const page = read('apps/admin-web/src/app/khieu-nai/page.tsx');
  assert.match(api, /capNhatXuLyKhieuNaiQuanTri/);
  assert.match(api, /hoanTienTheoKhieuNaiQuanTri/);
  assert.match(api, /layThongKeKhieuNaiQuanTri/);
  assert.match(detail, /Hoàn tiền/);
  assert.match(detail, /Phản hồi khách/);
  assert.equal(detail.includes('chưa được bật'), false);
  assert.equal(page.includes('while (true)'), false);
});

test('2. complaint search/sort là server-side', () => {
  const dto = read('apps/api/src/modules/khieu-nai/dto/truy-van-khieu-nai.dto.ts');
  const service = read('apps/api/src/modules/khieu-nai/khieu-nai.service.ts');
  const customer = read('apps/customer-web/src/components/danh-sach-khieu-nai-content.tsx');
  assert.match(dto, /tuKhoa/);
  assert.match(dto, /sapXep/);
  assert.match(service, /contains: tuKhoa/);
  assert.match(service, /query\.sapXep === 'CU_NHAT'/);
  assert.match(customer, /layThongKeKhieuNaiKhach/);
  assert.match(customer, /sapXep: moiNhatTruoc/);
});

test('3. public farm OpenAPI không còn cast never', () => {
  const dto = read('apps/api/src/modules/trang-trai/dto/truy-van-trang-trai-cong-khai.dto.ts');
  const web = read('apps/customer-web/src/components/trang-chu-content.tsx');
  const mobile = read('apps/mobile/src/app/(tabs)/index.tsx');
  assert.match(dto, /type: Number/);
  assert.match(dto, /trang: number = 1/);
  assert.match(dto, /gioiHan: number = 12/);
  assert.equal(web.includes('as unknown as never'), false);
  assert.equal(mobile.includes('as unknown as never'), false);
});

test('4. Admin navigation commerce-first', () => {
  const nav = read('apps/admin-web/src/lib/quyen-admin.ts');
  const shell = read('apps/admin-web/src/components/khung-quan-tri.tsx');
  assert.match(nav, /'thuong-mai'/);
  assert.match(shell, /Thương mại điện tử/);
  for (const route of ['/san-pham', '/khuyen-mai', '/don-hang', '/khieu-nai', '/khach-hang']) assert.ok(nav.includes(route));
});

test('5. dashboard không lộ raw enum trong mô tả', () => {
  const dash = read('apps/admin-web/src/app/page.tsx');
  for (const text of ['Đơn ở trạng thái CHO_THANH_TOAN','Đơn ở trạng thái DANG_CHUAN_BI','Đơn ở trạng thái KHIEU_NAI','Lô ở trạng thái CHO_KIEM_DINH','Lô ở trạng thái TAM_GIU','Chứng nhận ở trạng thái CHO_XAC_MINH','Kiểm định HOLD','Kiểm định FAILED']) assert.equal(dash.includes(text), false, text);
});

test('6. source sạch backup component và có app icon', () => {
  assert.equal(fs.existsSync(path.resolve(root, 'apps/customer-web/src/components/trang-chu-content.before-4-knowledge-4-news-20260915_192804.tsx')), false);
  assert.equal(fs.existsSync(path.resolve(root, 'apps/admin-web/src/app/icon.svg')), true);
});

test('7. release gate khóa complaint operations', () => {
  const gate = read('tools/release-gate.mjs');
  for (const op of ['layThongKeKhieuNaiCuaToi','layThongKeKhieuNaiQuanTri','capNhatXuLyKhieuNaiQuanTri','hoanTienTheoKhieuNaiQuanTri']) assert.ok(gate.includes(op));
});
