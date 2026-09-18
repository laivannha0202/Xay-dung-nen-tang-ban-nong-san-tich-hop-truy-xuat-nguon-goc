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

const list = () => docComponent('danh-sach-don-hang-content.tsx');

test('1. header gon trong shell: tieu de + mo ta ngan', () => {
  const l = list();
  assert.match(l, /Đơn hàng của tôi/);
  assert.match(l, /Theo dõi trạng thái, sản phẩm và thanh toán của các đơn đã đặt\./);
});

test('2. chip dem that: query counts + filter nhe + tong backend', () => {
  const l = list();
  assert.match(l, /don-hang-khach.*counts/);
  assert.match(l, /gioiHan: 1/);
  assert.match(l, /trangThai/);
  assert.match(l, /\.tong/);
  assert.match(l, /tieuDeChip/);
  assert.equal(l.includes('MOCK'), false);
});

test('3. the don kieu moi: ma + ngay + badge + san pham dai dien + tong + CTA', () => {
  const l = list();
  assert.match(l, /maDonHangHienThi\(order\.maDonHang\)/);
  assert.match(l, /Sao chép mã đơn hàng/);
  assert.match(l, /Đặt lúc/);
  assert.match(l, /Badge/);
  assert.match(l, /order\.mucDaiDien/);
  assert.match(l, /muc\?\.tenSanPham/);
  assert.match(l, /order\.soMuc/);
  assert.match(l, /order\.soNhaCungCap/);
  assert.match(l, /Tổng thanh toán/);
  assert.match(l, /order\.maDonHang/);
  assert.match(l, /order\.tongTien/);
  assert.match(l, /order\.createdAt/);
  assert.match(l, /Xem chi tiết/);
});

test('4. khong fake chi tiet mat hang: chi dung snapshot mucDaiDien, khong fetch detail/N+1', () => {
  const l = list();
  assert.equal(l.includes('Phí vận chuyển'), false);
  assert.equal(l.includes('Thanh toán lại'), false);
  assert.equal(l.includes('Mua lại'), false);
  assert.equal(l.includes('Theo dõi đơn'), false);

  // Tên sản phẩm đại diện là dữ liệu thật từ order.mucDaiDien của backend,
  // không phải frontend tự dựng hoặc fetch chi tiết sản phẩm.
  assert.match(l, /order\.mucDaiDien/);
  assert.match(l, /muc\?\.tenSanPham/);
  assert.match(l, /muc\.donGia/);
  assert.match(l, /muc\.soLuong/);

  assert.equal(/layChiTietDonHangKhach/.test(l), false);
  assert.equal(/query\.data\.duLieu\.slice\(|duLieu\.slice\(/.test(l), false);
});

test('5. mot cot, khong StatGrid, van Select loc', () => {
  const l = list();
  assert.match(l, /SimpleGrid/);
  assert.match(l, /cols=\{\{ base: 1 \}\}/);
  assert.equal(l.includes('StatGrid'), false);
  assert.match(l, /Select/);
  assert.match(l, /Lọc nhanh theo trạng thái/);
});

test('6. giu hanh vi cu: phan trang backend + empty + Skeleton', () => {
  const l = list();
  assert.match(l, /Pagination/);
  assert.match(l, /query\.data\.tong/);
  assert.match(l, /Bạn chưa có đơn hàng nào/);
  assert.match(l, /AgriSkeleton/);
  assert.match(l, /Paper/);
});
