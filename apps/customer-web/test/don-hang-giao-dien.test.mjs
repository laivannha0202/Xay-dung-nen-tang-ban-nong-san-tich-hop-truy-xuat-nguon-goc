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
  assert.match(l, /Theo dõi và quản lý tất cả đơn hàng của bạn tại AgriMarket\./);
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

test('3. the don kieu moi: ma + ngay + badge + quy mo + tong + CTA', () => {
  const l = list();
  assert.match(l, /Mã đơn hàng/);
  assert.match(l, /Đặt ngày/);
  assert.match(l, /Badge/);
  assert.match(l, /Quy mô đơn/);
  assert.match(l, /Tổng thanh toán/);
  assert.match(l, /order\.maDonHang/);
  assert.match(l, /order\.tongTien/);
  assert.match(l, /order\.createdAt/);
  assert.match(l, /Xem chi tiết/);
});

test('4. khong fake chi tiet mat hang: khong phi van chuyen, thanh toan lai, mua lai', () => {
  const l = list();
  assert.equal(l.includes('Phí vận chuyển'), false);
  assert.equal(l.includes('Thanh toán lại'), false);
  assert.equal(l.includes('Mua lại'), false);
  assert.equal(l.includes('Theo dõi đơn'), false);
  assert.equal(l.includes('tenSanPham'), false);
  assert.equal(/layChiTietDonHangKhach/.test(l), false);
  assert.equal(l.includes('slice('), false);
});

test('5. mot cot, khong StatGrid, van Select loc', () => {
  const l = list();
  assert.match(l, /SimpleGrid/);
  assert.match(l, /cols=\{\{ base: 1 \}\}/);
  assert.equal(l.includes('StatGrid'), false);
  assert.match(l, /Select/);
  assert.match(l, /Lọc trạng thái/);
});

test('6. giu hanh vi cu: phan trang backend + empty + Skeleton', () => {
  const l = list();
  assert.match(l, /Pagination/);
  assert.match(l, /query\.data\.tong/);
  assert.match(l, /Bạn chưa có đơn hàng nào/);
  assert.match(l, /AgriSkeleton/);
  assert.match(l, /Paper/);
});
