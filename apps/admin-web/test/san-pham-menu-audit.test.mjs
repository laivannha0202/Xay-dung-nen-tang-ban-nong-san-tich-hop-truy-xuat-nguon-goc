/**
 * AGRIMARKET PRODUCT ADMIN AUDIT
 * Menu "Sản phẩm" phải là nhóm ảo, route thật là "Danh sách sản phẩm" (/san-pham).
 * Không tạo page/route duplicate, không hard-code, không tồn kho thủ công.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(root, p), 'utf8');

const quyen = read('apps/admin-web/src/lib/quyen-admin.ts');
const shell = read('apps/admin-web/src/components/khung-quan-tri.tsx');
const page = read('apps/admin-web/src/app/san-pham/page.tsx');
const api = read('apps/admin-web/src/lib/api-san-pham.ts');

test('1. /san-pham tồn tại và là trang danh sách (không page duplicate)', () => {
  assert.equal(fs.existsSync(path.resolve(root, 'apps/admin-web/src/app/san-pham/page.tsx')), true);
  assert.match(page, /ProTable/);
  assert.match(page, /layDanhSach/);
  assert.match(page, /Thêm sản phẩm/);
  assert.equal(page.includes('@ts-ignore'), false);
  assert.equal(page.includes('@ts-expect-error'), false);
});

test('2. menu có "Danh sách sản phẩm" -> /san-pham', () => {
  assert.ok(quyen.includes("'Danh sách sản phẩm'") || quyen.includes('"Danh sách sản phẩm"'));
  assert.ok(quyen.includes("'/san-pham'"));
  assert.ok(quyen.includes('NHOM_MENU_SAN_PHAM'));
});

test('3. parent "Sản phẩm" chỉ là nhóm ảo, không clickable', () => {
  assert.match(quyen, /muc\(NHOM_MENU_SAN_PHAM,\s*'Sản phẩm'[^)]*chiMenu:\s*true/);
  // Route thật phải gắn dưới nhóm ảo, không tự làm cha.
  assert.match(quyen, /muc\('\/san-pham',\s*'Danh sách sản phẩm'[^)]*menuCha:\s*NHOM_MENU_SAN_PHAM/);
  assert.match(quyen, /muc\('\/danh-muc-san-pham',\s*'Danh mục'[^)]*menuCha:\s*NHOM_MENU_SAN_PHAM/);
  assert.match(quyen, /muc\('\/danh-gia',\s*'Đánh giá'[^)]*menuCha:\s*NHOM_MENU_SAN_PHAM/);
  // Shell render nhóm ảo dạng label (không Link), route dạng Link.
  assert.match(shell, /isRoute \? \(\s*<Link href=\{node\.muc\.path\}>/);
  // Không còn parent vừa là route vừa là toggle: /san-pham không có con trực tiếp.
  assert.equal(/menuCha:\s*'\/san-pham'/.test(quyen), false);
  // openKeys phải mở theo cha của route hiện tại (không invert).
  assert.match(shell, /DIEU_HUONG_ADMIN\.find\(\(item\) => item\.path === pathname\)\?\.menuCha/);
});

test('4. permission đồng bộ, icon đầy đủ', () => {
  assert.match(quyen, /muc\('\/san-pham',\s*'Danh sách sản phẩm',\s*\['san_pham\.xem'\]/);
  assert.ok(shell.includes('NHOM_MENU_SAN_PHAM'));
  assert.ok(shell.includes('[NHOM_MENU_SAN_PHAM]'));
  assert.equal(/opacity.*0\.|disabled.*gia|thieu icon/i.test(page), false);
});

test('5. danh sách có tìm kiếm / danh mục / trạng thái / quy cách / giá / tồn / thao tác', () => {
  for (const col of ['Tìm kiếm', 'Danh mục', 'Trạng thái', 'Tên sản phẩm', 'Quy cách', 'Giá bán', 'Tồn kho', 'Thao tác']) {
    assert.ok(page.includes(col), `thiếu cột: ${col}`);
  }
  assert.ok(page.includes('Nguồn cung'));
  assert.ok(page.includes('+ Thêm sản phẩm') || page.includes('Thêm sản phẩm'));
  // Tồn khả dụng ngắn gọn từ API thật, không biến bảng thành màn kho.
  assert.match(page, /layDanhSachCongKhaiChoAdmin/);
  assert.match(page, /soLuongKhaDung/);
  assert.equal(page.includes('nhapKhoThuCong') || page.includes('tonKhoNhapTay'), false);
});

test('6. tạo/sửa dùng nghiệp vụ hiện có, có danh mục + trang trại', () => {
  assert.match(page, /taoMoi/);
  assert.match(page, /capNhat/);
  assert.match(page, /danhMucSanPhamId/);
  assert.match(page, /trangTraiId/);
  assert.match(page, /layDanhMucHoatDong/);
  assert.match(page, /layTrangTraiHoatDong/);
});

test('7. biến thể/giá hoạt động qua API thật, không pricing ở frontend', () => {
  assert.match(api, /taoBienTheSanPham/);
  assert.match(api, /capNhatBienTheSanPham/);
  assert.match(page, /taoBienThe/);
  assert.match(page, /capNhatBienThe/);
  assert.match(page, /SKU/);
  assert.match(page, /Giá bán/);
  assert.match(page, /khoiLuong/);
  assert.match(page, /donVi/);
  // Không tự tính giá ở frontend ngoài format hiển thị.
  assert.equal(/gia\s*=\s*giaGoc\s*\*\s*\(1\s*-/.test(page), false);
});

test('8. ảnh sản phẩm hoạt động qua upload + gắn ảnh', () => {
  assert.match(api, /tai-len/);
  assert.match(api, /ganNhieuAnhSanPham/);
  assert.match(api, /datAnhBiaSanPham/);
  assert.match(api, /xoaAnhSanPham/);
  assert.match(page, /ganAnhSanPham/);
  assert.match(page, /taiAnhSanPham/);
  assert.match(page, /Ảnh sản phẩm/);
  assert.match(page, /Đặt bìa/);
});

test('9. không tồn kho thủ công trong form sản phẩm', () => {
  assert.equal(/tonKho|nhapKho|onHand.*ProForm|tonDauKy/i.test(page.match(/ModalForm[\s\S]*?Thêm sản phẩm[\s\S]*?<\/ModalForm>/)?.[0] ?? ''), false);
  // Luồng catalog tách bạch luồng kho: nhắc trong UI thay vì nhập số.
  assert.ok(page.includes('Tồn kho do') || page.includes('nhập kho'));
});

test('10. customer web + mobile dùng backend source of truth', () => {
  const web = read('apps/customer-web/src/components/danh-sach-san-pham-content.tsx');
  assert.match(web, /useLayDanhSachSanPhamCongKhai/);
  assert.match(web, /khaDung\.coTheDatHang/);
  const mobile = read('apps/mobile/src/app/(tabs)/kham-pha.tsx');
  assert.match(mobile, /khaDung\.coTheDatHang/);
  // Không hard-code sản phẩm ở admin.
  assert.equal(/const SAN_PHAM_MAU|MOCK_SAN_PHAM|hard-?code/i.test(page), false);
});
