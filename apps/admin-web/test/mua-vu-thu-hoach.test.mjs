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

const muaVu = () => docApp('mua-vu/page.tsx');
const nhatKy = () => docApp('nhat-ky-canh-tac/page.tsx');
const thuHoach = () => docApp('thu-hoach/page.tsx');

test('1. season detail: farm/crop/dates/yield/status, no decorative timeline', () => {
  const d = muaVu();
  assert.match(d, /Trang trại/);
  assert.match(d, /Cây trồng/);
  assert.match(d, /Sản lượng dự kiến/);
  assert.match(d, /Trạng thái/);
  assert.match(d, /tenTrangThai\(chiTiet\.trangThai\)/);
  // Không dựng timeline trang trí từ ngày dự kiến
  assert.equal(d.includes('Timeline'), false);
  assert.equal(d.includes('tiến độ'), false);
  assert.equal(d.includes('tiến độ %'), false);
});

test('2. season detail: related cultivation logs from real API by muaVuId', () => {
  const d = muaVu();
  assert.match(d, /Nhật ký canh tác đã ghi nhận/);
  assert.match(d, /layDanhSachNhatKy/);
  assert.match(d, /muaVuId: detail\.id/);
  assert.match(d, /Chưa có nhật ký canh tác cho mùa vụ này/);
  assert.match(d, /hienThiCongKhai/);
});

test('3. season detail: actual harvest records by muaVuId', () => {
  const d = muaVu();
  assert.match(d, /Thu hoạch thực tế/);
  assert.match(d, /layDanhSachThuHoach/);
  assert.match(d, /muaVuId: detail\.id/);
  assert.match(d, /Chưa có thu hoạch cho mùa vụ này/);
});

test('4. season mutations gated by RBAC, farm via real selector', () => {
  const d = muaVu();
  assert.match(d, /mua_vu\.xem/);
  assert.match(d, /mua_vu\.tao/);
  assert.match(d, /mua_vu\.sua/);
  assert.match(d, /layTrangTraiHoatDong/);
  assert.match(d, /name="trangTraiId"/);
  // Không nhập farm UUID thô
  assert.equal(/ProFormText[^>]*name="trangTraiId"/.test(d), false);
});

test('5. cultivation log: exact event enums, no invented agronomy', () => {
  const d = nhatKy();
  for (const e of ['TUOI', 'BON_PHAN', 'SAU_BENH', 'KIEM_TRA', 'THOI_TIET', 'KHAC']) {
    assert.ok(d.includes(e), `missing event enum ${e}`);
  }
  assert.match(d, /nhat_ky_canh_tac\.xem/);
  assert.match(d, /nhat_ky_canh_tac\.tao/);
  assert.match(d, /nhat_ky_canh_tac\.sua/);
  assert.match(d, /Hiển thị công khai/);
  assert.match(d, /name="muaVuId"/);
});

test('6. harvest detail: farm through season, real unit, related batches', () => {
  const d = thuHoach();
  assert.match(d, /chiTiet\.muaVu\.trangTrai\.ma/);
  assert.match(d, /chiTiet\.donVi/);
  assert.match(d, /Lô sản phẩm từ thu hoạch này/);
  assert.match(d, /layDanhSachLo/);
  assert.match(d, /thuHoachId: detail\.id/);
  assert.match(d, /Chưa có lô nào được tạo từ thu hoạch này/);
  assert.match(d, /maTruyXuat/);
  assert.match(d, /thu_hoach\.xem/);
  assert.match(d, /thu_hoach\.tao/);
  assert.match(d, /thu_hoach\.sua/);
  assert.match(d, /lo_san_pham\.tao/);
});

test('7. no fake fallback: no mock, weather, health score, progress', () => {
  for (const src of [muaVu(), nhatKy(), thuHoach()]) {
    assert.equal(src.includes('MOCK'), false);
    assert.equal(/dự báo thời tiết|weather forecast|weather widget|WeatherChart/i.test(src), false);
    assert.equal(src.includes('health score'), false);
    assert.equal(src.includes('sức khỏe cây trồng'), false);
    assert.equal(src.includes('FAKE'), false);
  }
});
