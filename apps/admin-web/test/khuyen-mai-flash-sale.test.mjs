/**
 * Promotion + Flash Sale — Admin regression.
 *
 * Bao phu:
 * - route /khuyen-mai + /flash-sale ton tai, duoc guard boi khuyen_mai.xem;
 * - menu khong disabled/CSS mo: parent render Link, CSS tuong phan submenu,
 *   icon rieng cho /khuyen-mai;
 * - form khuyen mai validate start < end, hien thi trang thai theo thoi gian;
 * - flash sale: phan quyen UI, sua chien dich, chon san pham bang picker
 *   (khong nhap UUID tay), bang muc co quota/con lai/moi khach.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const doc = (p) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf-8');

const quyen = doc('apps/admin-web/src/lib/quyen-admin.ts');
const shell = doc('apps/admin-web/src/components/khung-quan-tri.tsx');
const css = doc('apps/admin-web/src/app/admin-sync.css');
const khuyenMai = doc('apps/admin-web/src/app/khuyen-mai/page.tsx');
const flashSale = doc('apps/admin-web/src/app/flash-sale/page.tsx');
const apiFlashSale = doc('apps/admin-web/src/lib/api-flash-sale.ts');

test('1. route /khuyen-mai va /flash-sale ton tai, cung nhom, cung quyen xem', () => {
  assert.equal(
    fs.existsSync(path.resolve(process.cwd(), 'apps/admin-web/src/app/khuyen-mai/page.tsx')),
    true,
  );
  assert.equal(
    fs.existsSync(path.resolve(process.cwd(), 'apps/admin-web/src/app/flash-sale/page.tsx')),
    true,
  );
  assert.match(quyen, /muc\('\/khuyen-mai', 'Khuyến mãi', \['khuyen_mai\.xem'\], 'khuyen-mai'\)/);
  assert.match(quyen, /muc\('\/flash-sale', 'Flash Sale', \['khuyen_mai\.xem'\], 'khuyen-mai'/);
});

test('2. menu muc cha la Link clickable, khong disabled, co CSS tuong phan', () => {
  assert.match(shell, /isRoute \? \(\s*<Link href=\{node\.muc\.path\}>/);
  const nodeMenuBlock = shell.slice(shell.indexOf('const nodeMenu'), shell.indexOf('const result'));
  assert.equal(nodeMenuBlock.includes('disabled'), false);
  assert.match(css, /\.ant-menu-submenu-title/);
  assert.match(css, /rgba\(255, 255, 255, 0\.88\)/);
  assert.match(shell, /'\/khuyen-mai': <TagsOutlined \/>/);
});

test('3. khuyen mai validate start < end ca client lan hien thi dung trang thai', () => {
  assert.match(khuyenMai, /Thời gian kết thúc phải sau thời gian bắt đầu/);
  assert.match(khuyenMai, /Sắp diễn ra/);
  assert.match(khuyenMai, /Đã kết thúc/);
  assert.match(khuyenMai, /Hết lượt/);
  assert.match(khuyenMai, /khuyen_mai\.xem/);
  assert.match(khuyenMai, /khuyen_mai\.tao/);
  assert.match(khuyenMai, /TRANG_TRAI/);
  assert.match(khuyenMai, /Theo trang trại/);
  assert.match(khuyenMai, /loaiGiam/);
  assert.match(khuyenMai, /PHAN_TRAM/);
  assert.match(khuyenMai, /Giảm tối đa/);
  assert.match(khuyenMai, /Giới hạn mỗi khách/);
  assert.match(khuyenMai, /Phần trăm giảm phải lớn hơn 0 và không vượt quá 100/);
  assert.match(khuyenMai, /Giới hạn mỗi khách không được vượt tổng lượt sử dụng/);
  assert.equal(khuyenMai.includes('RAU10'), false);
  assert.equal(khuyenMai.includes('FRESH50'), false);
});

test('4. flash sale co phan quyen UI + sua chien dich + validate thoi gian', () => {
  assert.match(flashSale, /usePhienAdmin/);
  assert.match(flashSale, /Bạn không có quyền xem Flash Sale/);
  assert.match(flashSale, /coTao/);
  assert.match(flashSale, /coKhoa/);
  assert.match(flashSale, /Sửa chiến dịch/);
  assert.match(flashSale, /capNhatChienDich/);
  assert.match(flashSale, /Thời gian kết thúc phải sau thời gian bắt đầu/);
  assert.match(flashSale, /Sắp diễn ra/);
  assert.match(flashSale, /Đã kết thúc/);
  assert.match(apiFlashSale, /capNhatChienDich/);
  assert.match(apiFlashSale, /capNhatFlashSale/);
});

test('5. them san pham flash sale bang picker, sua truc tiep, khong nhap UUID tay', () => {
  assert.match(flashSale, /Thêm sản phẩm/);
  assert.match(flashSale, /name="sanPhamId"/);
  assert.match(flashSale, /name="bienTheSanPhamId"/);
  assert.match(flashSale, /layBienThe/);
  assert.equal(flashSale.includes('ID biến thể / SKU'), false);
  assert.match(flashSale, /Giá Flash Sale/);
  assert.match(flashSale, /Số lượng Flash Sale/);
  assert.match(flashSale, /Giới hạn mỗi khách/);
  assert.match(flashSale, /Còn lại/);
  assert.match(flashSale, /Đã bán/);
  assert.match(flashSale, /Sửa sản phẩm Flash Sale/);
  assert.match(flashSale, /capNhatMucChienDich/);
  assert.match(apiFlashSale, /capNhatMucChienDich/);
});

test('6. backend la source of truth: admin khong tu tinh gia', () => {
  for (const src of [khuyenMai, flashSale]) {
    assert.equal(/giaTriGiam\s*\*/.test(src), false);
    assert.equal(/donGiaDuKien/.test(src), false);
  }
  assert.match(flashSale, /chiTietFlashSale/);
  assert.match(flashSale, /themMucChienDich/);
  assert.match(flashSale, /xoaMucChienDich/);
});
