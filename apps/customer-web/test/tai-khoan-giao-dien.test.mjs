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

test('1. sidebar gom profile + nav, commerce-first, khong card marketing thua', () => {
  const s = shell();
  assert.match(s, /Chỉnh sửa hồ sơ/);
  assert.match(s, /Quản lý đơn hàng và thông tin tài khoản/);
  assert.equal(s.includes('Cùng AgriMarket'), false);
  assert.equal(s.includes('Vì nông sản sạch'), false);
  assert.match(s, /visibleFrom="md"/);
  assert.match(s, /width: 260/);
});

test('2. header tong quan phang, co ten that, khong banner marketing/emoji', () => {
  const o = overview();
  assert.match(o, /Tổng quan tài khoản/);
  assert.match(o, /Xin chào/);
  assert.match(o, /tenHienThi/);
  assert.equal(o.includes('Nông sản sạch cho cuộc sống xanh hơn mỗi ngày'), false);
  assert.equal(o.includes('Theo dõi đơn hàng mới nhất'), false);
  assert.equal(o.includes('👋'), false);
});

test('3. dem trang thai dung API that: filter + tong, khong hard-code 0', () => {
  const o = overview();
  assert.match(o, /layDanhSachDonHangKhach\(\{\s*trang:\s*1,\s*gioiHan:\s*1,\s*trangThai:/);
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

test('5. loi tat nhanh dung du lieu that, khong them muc ngoai scope', () => {
  const o = overview();
  assert.match(o, /LOI_TAT_NHANH/);
  for (const t of ['Điểm thưởng', 'Sản phẩm yêu thích', 'Trang trại theo dõi']) {
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

test('8. account commerce surface: scope agri-account + radius nhat quan', () => {
  assert.match(shell(), /agri-account/);
  assert.match(shell(), /radius="lg"/);
  const css = docCss();
  assert.match(css, /\.agri-account \.agri-surface/);
  assert.match(css, /border-radius: 10px/);
  assert.match(css, /box-shadow: none/);
});
