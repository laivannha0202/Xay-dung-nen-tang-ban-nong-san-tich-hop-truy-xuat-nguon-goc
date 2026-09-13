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

function docGeneratedModel(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `packages/api-client/generated/model/${tenFile}`),
    'utf-8',
  );
}

function docApiService() {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'apps/api/src/modules/don-hang/don-hang.service.ts'),
    'utf-8',
  );
}

const danhSach = () => docComponent('danh-sach-trang-trai-content.tsx');
const chiTiet = () => docComponent('chi-tiet-trang-trai-content.tsx');
const truyXuat = () => docComponent('truy-xuat-content.tsx');
const follow = () => docComponent('follow-farm-button.tsx');
const theoDoi = () => docComponent('theo-doi-trang-trai-content.tsx');
const farmCard = () => docComponent('farm-card.tsx');
const chiTietDonHang = () => docComponent('chi-tiet-don-hang-content.tsx');

test('1. farm list: real cong-khai API, breadcrumb, title, count, pagination', () => {
  const c = danhSach();
  assert.match(c, /useLayDanhSachTrangTraiCongKhai/);
  assert.equal(c.includes('useLayFacetsSanPhamCongKhai'), false, 'Không dùng facets thay farm API');
  assert.match(c, /Trang chủ/);
  assert.match(c, /title="Trang trại"|title=\{"Trang trại"\}|>Trang trại</);
  assert.match(c, /data\.tong|data\?\.data\.tong/);
  assert.match(c, /Trang trước/);
  assert.match(c, /Trang sau/);
  assert.match(c, /Xem trang trại/);
});

test('2. farm list: only real fields, no fake rating/follower/cert/image', () => {
  const c = danhSach();
  assert.equal(c.includes('anhDuPhongTrangTrai'), false);
  assert.equal(c.includes('diemTrungBinh'), false);
  assert.equal(c.includes('soLuotTheoDoi'), false);
  assert.equal(c.includes('soSanPham'), false, 'List API không có product count');
  assert.match(c, /anhBiaUrl/);
  assert.match(c, /diaChi/);
  assert.match(c, /chungNhan/);
});

test('3. farm detail: real detail + products hooks, breadcrumb, factual tabs', () => {
  const c = chiTiet();
  assert.match(c, /useLayChiTietTrangTraiCongKhai/);
  assert.match(c, /useLaySanPhamTheoTrangTraiCongKhai/);
  assert.match(c, /\/trang-trai/);
  assert.match(c, /Giới thiệu/);
  assert.match(c, /Sản phẩm/);
  assert.match(c, /Chứng nhận/);
  assert.match(c, /Mùa vụ/);
  assert.equal(c.includes('danh-gia'), false, 'Không có tab đánh giá giả');
  assert.equal(c.includes('anhDuPhongTrangTrai'), false);
});

test('4. farm detail: certification factual display with verification + dates', () => {
  const c = chiTiet();
  assert.match(c, /Đã xác minh/);
  assert.match(c, /ngayCap/);
  assert.match(c, /ngayHetHan/);
  assert.match(c, /donViCap/);
  assert.match(c, /tongSanPham|data\.tong/, 'Product count dùng tong thật, không dùng products.length');
});

test('5. follow/unfollow: real API, anonymous redirect, consistent state', () => {
  const c = follow();
  assert.match(c, /theoDoiTrangTraiWeb/);
  assert.match(c, /boTheoDoiTrangTraiWeb/);
  assert.match(c, /layTrangThaiTheoDoiWeb/);
  assert.match(c, /\/dang-nhap\?next=/);
  assert.match(c, /data\.dangTheoDoi/);
  assert.equal(c.includes('localStorage'), false);
  assert.match(danhSach(), /FollowFarmButton/);
  assert.match(chiTiet(), /FollowFarmButton/);
});

test('6. trace lookup: form, states, invalid/not-found handling', () => {
  const c = truyXuat();
  assert.match(c, /AGM-\[A-F0-9\]\{32\}/);
  assert.match(c, /Tra cứu/);
  assert.match(c, /Mã khác/);
  assert.match(c, /Không tìm thấy thông tin truy xuất/);
  assert.match(c, /Chưa có mã cần tra cứu/);
  assert.match(c, /useLayTruyXuatCongKhai/);
  assert.match(c, /Truy xuất nguồn gốc/);
  assert.match(c, /Trang chủ/);
});

test('7. trace result: exact batch provenance from persisted relations only', () => {
  const c = truyXuat();
  assert.match(c, /maLo/);
  assert.match(c, /maTruyXuat/);
  assert.match(c, /nhatKyCanhTac/);
  assert.match(c, /kiemDinh/);
  assert.match(c, /chungNhan/);
  assert.match(c, /thuHoi/);
  assert.match(c, /ngayHetHan/);
  assert.match(c, /phanHangChatLuong/);
  assert.equal(c.includes('Đã gieo trồng'), false);
  assert.equal(c.includes('Đã kiểm định'), false);
  assert.equal(c.includes('Đã đóng gói'), false);
});

test('8. trace: no decorative hero, no fake illustration, no QR invention', () => {
  const c = truyXuat();
  assert.equal(c.includes('ANH_TRUY_XUAT_AGRIMARKET'), false);
  assert.equal(c.includes('farm-trace-hero'), false);
  assert.equal(c.includes('toDataURL'), false);
});

test('9. exact order trace: NOT SUPPORTED via customer API (no allocation exposure)', () => {
  const muc = docGeneratedModel('mucDonHangKhachDto.ts');
  assert.equal(muc.includes('phanBo'), false, 'MucDonHangKhachDto không có allocation');
  assert.equal(muc.includes('maTruyXuat'), false, 'MucDonHangKhachDto không có trace code');
  const svc = docApiService();
  const layChiTiet = svc.slice(svc.indexOf('async layChiTietCuaToi'));
  const ketThuc = layChiTiet.indexOf('async layDanhSachQuanTri');
  const body = ketThuc === -1 ? layChiTiet : layChiTiet.slice(0, ketThuc);
  assert.equal(body.includes('phanBo'), false, 'layChiTietCuaToi không expose allocation');
  assert.equal(body.includes('maTruyXuat'), false, 'layChiTietCuaToi không expose trace code');
  assert.equal(
    chiTietDonHang().includes('/truy-xuat?ma='),
    false,
    'Order detail không đoán batch từ Product/Farm',
  );
});

test('10. no fake business values across farm + trace surfaces', () => {
  const banned = [
    'anhDuPhongTrangTrai',
    'Chuyên cung cấp nông sản sạch',
    'Cung cấp nông sản sạch, an toàn với',
    'Đã gieo trồng',
    'Đã kiểm định',
    'Đã đóng gói',
  ];
  for (const [ten, content] of [
    ['danh-sach', danhSach()],
    ['chi-tiet', chiTiet()],
    ['truy-xuat', truyXuat()],
    ['theo-doi', theoDoi()],
    ['farm-card', farmCard()],
  ]) {
    for (const bad of banned) {
      assert.equal(content.includes(bad), false, `${ten}: chứa giá trị giả "${bad}"`);
    }
  }
  assert.equal(theoDoi().includes('anhDuPhongTrangTrai'), false);
});
