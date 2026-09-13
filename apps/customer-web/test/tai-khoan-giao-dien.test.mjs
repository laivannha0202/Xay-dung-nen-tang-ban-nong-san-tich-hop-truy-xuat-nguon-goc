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

const shell = () => docComponent('khung-tai-khoan.tsx');
const overview = () => docComponent('tong-quan-tai-khoan-content.tsx');

test('1. sidebar gom profile + nav + brand, khong header rieng tren desktop', () => {
  const s = shell();
  assert.match(s, /Chỉnh sửa hồ sơ/);
  assert.match(s, /Quản lý đơn hàng và thông tin tài khoản/);
  assert.match(s, /Cùng AgriMarket/);
  assert.match(s, /Vì nông sản sạch/);
  assert.match(s, /visibleFrom="md"/);
  assert.match(s, /250/);
});

test('2. banner chao co ten that + quote, khong emoji', () => {
  const o = overview();
  assert.match(o, /XIN CHÀO/);
  assert.match(o, /Nông sản sạch cho cuộc sống xanh hơn mỗi ngày/);
  assert.equal(o.includes('Theo dõi đơn hàng mới nhất'), false);
  assert.equal(o.includes('👋'), false);
});

test('3. dem trang thai dung API that: filter + tong, khong hard-code 0', () => {
  const o = overview();
  assert.match(o, /layDanhSachDonHangKhach\(\{ trang: 1, gioiHan: 1, trangThai:/);
  assert.match(o, /allSettled/);
  assert.match(o, /\.tong/);
  for (const e of ['CHO_THANH_TOAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO']) {
    assert.ok(o.includes(e), `missing real enum ${e}`);
  }
  // Khong co so dem gia: khong render "0" cung, thieu du lieu thi "–"
  assert.match(o, /hienThiDem/);
  assert.equal(/>\{?0\}?</.test(o), false);
  assert.equal(o.includes('MOCK'), false);
});

test('4. the trang thai dan ve don-hang, co chevron', () => {
  const o = overview();
  assert.match(o, /IconChevronRight/);
  assert.match(o, /Xem đơn \$/);
  assert.match(o, /href="\/don-hang"/);
});

test('5. tinh nang nhanh toi da 4 the co mo ta', () => {
  const o = overview();
  assert.match(o, /Tính năng nhanh/);
  for (const t of ['Điểm thưởng', 'Yêu thích', 'Trang trại']) {
    assert.ok(o.includes(t), `missing shortcut ${t}`);
  }
  assert.equal(o.includes('Thông báo'), false);
  assert.equal(o.includes('/truy-xuat'), false);
});

test('6. empty state dung EmptyState + CTA dam di san-pham', () => {
  const o = overview();
  assert.match(o, /EmptyState/);
  assert.match(o, /Bạn chưa có đơn hàng nào/);
  assert.match(o, /Khám phá sản phẩm/);
  assert.match(o, /IconShoppingCart/);
  assert.match(o, /\/san-pham/);
});

test('7. shell khong dua truy-xuat vao nav', () => {
  assert.equal(shell().includes('/truy-xuat'), false);
  assert.equal(overview().includes('Truy xuất'), false);
});

function docCss() {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'apps/customer-web/src/app/commerce-layout.css'),
    'utf-8',
  );
}

test('8. account phang: scope agri-account + khong bo goc lg', () => {
  assert.match(shell(), /agri-account/);
  assert.equal(shell().includes('radius="lg"'), false);
  assert.equal(overview().includes('radius="lg"'), false);
  const css = docCss();
  assert.match(css, /\.agri-account \.agri-surface/);
  assert.match(css, /border-radius: 10px/);
  assert.match(css, /box-shadow: none/);
});
