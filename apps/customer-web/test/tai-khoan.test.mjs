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

function docApp(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/app/${relativePath}`),
    'utf-8',
  );
}

function docPkg() {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'apps/customer-web/package.json'),
    'utf-8',
  );
}

const shell = () => docComponent('khung-tai-khoan.tsx');
const overview = () => docComponent('tong-quan-tai-khoan-content.tsx');
const hoSo = () => docComponent('ho-so-khach-hang-content.tsx');
const diaChi = () => docComponent('so-dia-chi-content.tsx');
const taiKhoanPage = () => docApp('tai-khoan/page.tsx');

test('1. account page authenticated: session check + profile/order real APIs', () => {
  const o = overview();
  const s = shell();
  assert.match(o, /layPhienKhachHang/);
  assert.match(o, /layHoSoKhachHangWeb/);
  assert.match(o, /layDanhSachDonHangKhach/);
  assert.match(s, /layPhienKhachHang/);
});

test('2. unauthenticated behavior: redirect dang-nhap, no guest data', () => {
  const o = overview();
  assert.match(o, /\/dang-nhap\?next=\/tai-khoan/);
  assert.match(o, /router\.replace/);
  assert.equal(o.includes('guest'), false);
  assert.equal(o.includes('localStorage'), false);
});

test('3. account shell exists: KhungTaiKhoan + shared nav', () => {
  const s = shell();
  assert.match(s, /export function KhungTaiKhoan/);
  assert.match(s, /ACCOUNT_NAV/);
  assert.match(s, /children/);
  const p = taiKhoanPage();
  assert.match(p, /KhungTaiKhoan/);
});

test('4. desktop sidebar navigation: NavLink, 240px, active route, logout', () => {
  const s = shell();
  assert.match(s, /NavLink/);
  assert.match(s, /visibleFrom="md"/);
  assert.match(s, /240/);
  assert.match(s, /aria-current/);
  assert.match(s, /Đăng xuất/);
  assert.match(s, /xoaPhienKhachHang/);
  for (const href of ['/tai-khoan', '/don-hang', '/tai-khoan/ho-so', '/tai-khoan/dia-chi', '/diem-thuong', '/yeu-thich', '/theo-doi', '/khieu-nai']) {
    assert.ok(s.includes(href), `missing nav ${href}`);
  }
});

test('5. no giant account hero: no Trung tam tai khoan marketing header', () => {
  const p = taiKhoanPage();
  const o = overview();
  assert.equal(p.includes('Trung tâm tài khoản'), false);
  assert.equal(o.includes('Trung tâm tài khoản'), false);
  assert.equal(p.includes('PageHeader'), false);
  // Compact header copy must exist in shell
  assert.match(shell(), /Quản lý đơn hàng và thông tin tài khoản/);
  assert.match(shell(), /Chỉnh sửa hồ sơ/);
});

test('6. profile form NOT embedded in overview', () => {
  const p = taiKhoanPage();
  const o = overview();
  assert.equal(p.includes('HoSoKhachHangContent'), false);
  assert.equal(o.includes('HoSoKhachHangContent'), false);
  assert.equal(o.includes('Lưu hồ sơ'), false);
  assert.equal(o.includes('Ngày sinh'), false);
});

test('7. address manager NOT embedded in overview', () => {
  const p = taiKhoanPage();
  const o = overview();
  assert.equal(p.includes('SoDiaChiContent'), false);
  assert.equal(o.includes('SoDiaChiContent'), false);
  assert.equal(o.includes('Sổ địa chỉ'), false);
  assert.equal(o.includes('Thêm địa chỉ'), false);
});

test('8. overview has order-focused section', () => {
  const o = overview();
  assert.match(o, /Đơn hàng của tôi/);
  assert.match(o, /Đơn gần đây/);
  assert.match(o, /Xem tất cả đơn hàng/);
  assert.match(o, /\/don-hang/);
});

test('9. recent order uses API snapshot: maDonHang/date/status/total + detail CTA', () => {
  const o = overview();
  assert.match(o, /layDanhSachDonHangKhach/);
  assert.match(o, /maDonHang/);
  assert.match(o, /trangThai/);
  assert.match(o, /tongTien/);
  assert.match(o, /createdAt/);
  assert.match(o, /Xem chi tiết/);
  assert.match(o, /\/don-hang\/\$\{order\.id\}/);
  assert.match(o, /nhanTrangThaiDonHang/);
});

test('10. no fake counts: only real tong, real enums, no invented numbers', () => {
  const o = overview();
  assert.equal(o.includes('MOCK'), false);
  assert.equal(o.includes('FAKE'), false);
  assert.equal(o.includes('mock'), false);
  // Quick statuses use real backend enums only
  for (const e of ['CHO_THANH_TOAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO']) {
    assert.ok(o.includes(e), `missing real enum ${e}`);
  }
  assert.equal(o.includes('CHO_XAC_NHAN'), false);
  assert.equal(/VIP|Gold|Platinum|hạng vàng|hạng bạc/i.test(o), false);
});

test('11. profile route separate: /tai-khoan/ho-so with shell + real form', () => {
  const page = docApp('tai-khoan/ho-so/page.tsx');
  assert.match(page, /KhungTaiKhoan/);
  assert.match(page, /HoSoKhachHangContent/);
  const h = hoSo();
  assert.match(h, /layHoSoKhachHangWeb/);
  assert.match(h, /capNhatHoSoKhachHangWeb/);
  assert.match(h, /Họ và tên/);
  assert.match(h, /Số điện thoại/);
  assert.match(h, /Lưu hồ sơ/);
});

test('12. address route separate: /tai-khoan/dia-chi with shell + real list', () => {
  const page = docApp('tai-khoan/dia-chi/page.tsx');
  assert.match(page, /KhungTaiKhoan/);
  assert.match(page, /SoDiaChiContent/);
  const d = diaChi();
  assert.match(d, /laySoDiaChiWeb/);
  assert.match(d, /taoDiaChiWeb/);
});

test('13. add/edit address uses Modal desktop + Drawer mobile', () => {
  const d = diaChi();
  assert.match(d, /Modal/);
  assert.match(d, /Drawer/);
  assert.match(d, /Thêm địa chỉ/);
  assert.match(d, /Sửa địa chỉ/);
});

test('14. default address semantics: badge + set-default + delete', () => {
  const d = diaChi();
  assert.match(d, /macDinh/);
  assert.match(d, /Mặc định/);
  assert.match(d, /datDiaChiMacDinhWeb/);
  assert.match(d, /Đặt mặc định/);
  assert.match(d, /Xóa/);
  assert.match(d, /xoaDiaChiWeb/);
});

test('15. no mock account data in shell/overview/profile/address', () => {
  for (const src of [shell(), overview(), hoSo(), diaChi(), taiKhoanPage()]) {
    assert.equal(src.includes('MOCK'), false);
    assert.equal(src.includes('FAKE_ORDER'), false);
    assert.equal(src.includes('localStorage'), false);
  }
});

test('16. Mantine components used, no extra UI framework', () => {
  const s = shell();
  const o = overview();
  assert.match(s, /from '@mantine\/core'/);
  assert.match(o, /from '@mantine\/core'/);
  assert.match(s, /NavLink/);
  assert.match(s, /Paper/);
  assert.match(s, /Avatar/);
  assert.match(s, /ScrollArea/);
  assert.match(o, /Badge/);
  assert.match(o, /Button/);
  const pkg = docPkg();
  assert.equal(pkg.includes('antd'), false);
  assert.equal(pkg.includes('@mui'), false);
  assert.equal(pkg.includes('chakra'), false);
  assert.equal(pkg.includes('shadcn'), false);
  assert.equal(pkg.includes('lucide'), false);
});

test('17. Tabler icons used, no emoji/custom SVG for nav', () => {
  const s = shell();
  const o = overview();
  assert.match(s, /@tabler\/icons-react/);
  assert.match(o, /@tabler\/icons-react/);
  assert.match(s, /IconShoppingBag/);
  assert.match(s, /IconMapPin/);
  assert.match(s, /IconLogout/);
  assert.equal(s.includes('lucide-react'), false);
});

test('18. orders integration keeps business: shell wraps don-hang without rewrite', () => {
  const listPage = docApp('don-hang/page.tsx');
  const detailPage = docApp('don-hang/[id]/page.tsx');
  assert.match(listPage, /KhungTaiKhoan/);
  assert.match(listPage, /DanhSachDonHangContent/);
  assert.match(detailPage, /KhungTaiKhoan/);
  assert.match(detailPage, /ChiTietDonHangContent/);
  const list = docComponent('danh-sach-don-hang-content.tsx');
  assert.match(list, /layDanhSachDonHangKhach/);
});

test('19. responsive structure: mobile chips + desktop sidebar + grids', () => {
  const s = shell();
  const o = overview();
  assert.match(s, /ScrollArea/);
  assert.match(s, /hiddenFrom="md"/);
  assert.match(s, /visibleFrom="md"/);
  assert.match(o, /SimpleGrid/);
  assert.match(o, /cols=\{\{ base: 2/);
  assert.match(s, /size="80rem"/);
});

test('20. trace not treated as main account setting', () => {
  const s = shell();
  const o = overview();
  const p = taiKhoanPage();
  assert.equal(s.includes('/truy-xuat'), false);
  assert.equal(o.includes('/truy-xuat'), false);
  assert.equal(p.includes('/truy-xuat'), false);
  assert.equal(o.includes('Truy xuất'), false);
});

test('21. loading/error/empty states use real components', () => {
  const o = overview();
  assert.match(o, /Skeleton|AgriSkeleton/);
  assert.match(o, /ErrorState/);
  assert.match(o, /EmptyState/);
  assert.match(o, /Bạn chưa có đơn hàng nào/);
  const d = diaChi();
  assert.match(d, /Bạn chưa có địa chỉ/);
  assert.match(d, /Alert/);
});
