import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docComponent(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${relativePath}`),
    'utf-8',
  );
}

function docLib(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), `apps/customer-web/src/lib/${relativePath}`), 'utf-8');
}

function tonTai(relativePath) {
  return fs.existsSync(path.resolve(process.cwd(), relativePath));
}

const home = () => docComponent('trang-chu-content.tsx');

test('1. Home uses real public Flash Sale API', () => {
  const d = home();
  assert.match(d, /useLayFlashSaleCongKhaiActive/);
  assert.match(d, /flash-sale-cong-khai\/active|FlashSaleCongKhaiActive/);
});

test('2. sale price and discount come directly from API', () => {
  const d = home();
  assert.match(d, /muc\.giaFlash/);
  assert.match(d, /muc\.giaGoc/);
  assert.match(d, /muc\.phanTramGiam/);
  assert.match(d, /muc\.bienTheSanPhamId/);
  assert.match(d, /muc\.soLuongKhaDung/);
});

test('3. no derived fake giaCu or discount', () => {
  const d = home();
  assert.equal(d.includes('giaCu'), false);
  assert.equal(/discountVal|oldGia/.test(d), false);
  assert.equal(/1 \+ discount|1 \+ .*\/ 100/.test(d), false);
});

test('4. no fake Flash Sale fallback on empty or error', () => {
  const d = home();
  assert.equal(d.includes('FALLBACK_FLASH_SALE'), false);
  // Empty hides the section; error shows retry — never fake products.
  assert.match(d, /flashSaleMuc\.length === 0 \? null/);
  assert.match(d, /Không tải được Flash Sale/);
});

test('5. featured products factual, no hardcoded fallback', () => {
  const d = home();
  assert.equal(d.includes('FALLBACK_FEATURED_PRODUCTS'), false);
  assert.equal(d.includes("|| 'Trang trại minh bạch'"), false);
  assert.equal(d.includes("|| 'Trang trại chuẩn'"), false);
  assert.match(d, /Chưa có sản phẩm nổi bật/);
  assert.match(d, /laSanPhamTestHomepage/);
});

test('6. farm section factual, internal links only', () => {
  const d = home();
  assert.equal(d.includes('FALLBACK_FARMS'), false);
  assert.match(d, /useLayDanhSachTrangTraiCongKhai/);
  assert.match(d, /noiBat: true/);
  assert.match(d, /\/trang-trai\/\$\{farm\.id\}/);
  assert.match(d, /href="\/trang-trai"/);
  assert.equal(d.includes('farm.href'), false);
  assert.equal(d.includes('FALLBACK_FARM_STORIES'), false);
});

test('7. homepage has no sidebar categories; facets live on product listing page', () => {
  const d = home();
  // Sidebar/quick-categories đã gỡ khỏi trang chủ theo yêu cầu —
  // trang chủ không fetch facets, không dùng danh mục fallback.
  assert.equal(d.includes('FALLBACK_CATEGORIES'), false);
  assert.equal(d.includes('FALLBACK_QUICK_CATEGORIES'), false);
  assert.equal(d.includes('useLayFacetsSanPhamCongKhai'), false);
  assert.equal(d.includes('danhMucFacets'), false);
  // Facets API thật vẫn được dùng ở trang danh sách sản phẩm.
  const listing = docComponent('danh-sach-san-pham-content.tsx');
  assert.match(listing, /useLayFacetsSanPhamCongKhai/);
  assert.match(listing, /facetsQuery\.data\?\.data/);
});

test('8. no business-fake imports or mock modules', () => {
  const d = home();
  assert.equal(d.includes('mockup-products-data'), false);
  assert.equal(d.includes('MOCKUP_PRODUCTS'), false);
  assert.equal(d.includes('Math.random'), false);
  assert.equal(tonTai('apps/customer-web/src/lib/mockup-products-data.ts'), false);
  const fallback = docLib('homepage-fallback.ts');
  for (const name of ['FALLBACK_FLASH_SALE', 'FALLBACK_FEATURED_PRODUCTS', 'FALLBACK_FARMS', 'FALLBACK_FARM_STORIES', 'FALLBACK_COMBOS', 'FALLBACK_CATEGORIES', 'FALLBACK_QUICK_CATEGORIES']) {
    assert.equal(fallback.includes(name), false, `${name} must be removed`);
  }
});

test('9. static editorial remains allowed', () => {
  const d = home();
  assert.match(d, /FALLBACK_KNOWLEDGE_ARTICLES/);
  assert.match(d, /Kiến thức nông sản/);
});

test('10. no fake universal certification or discount promises', () => {
  const d = home();
  assert.equal(d.includes('Đạt tiêu chuẩn VietGAP'), false);
  assert.equal(d.includes('Giảm đến 30%'), false);
  // Trust strip đã gỡ theo yêu cầu — kiểm tra tiêu đề trung thực còn lại.
  assert.match(d, /Sản phẩm nổi bật/);
});

test('11. featured uses backend effective price (giaBan), never gia.tu as selling price', () => {
  const d = home();
  assert.match(d, /giaBan/);
  assert.match(d, /coGiamGia/);
  // Featured card lấy giá hiệu lực + giá gốc đại diện + badge thật.
  assert.match(d, /giaHienTai/);
  assert.match(d, /giaGocDaiDien/);
  assert.match(d, /phanTramGiam/);
  assert.equal(/gia:\s*p\.gia\.tu/.test(d), false, 'Featured must not map selling price from p.gia.tu');
});

test('12. featured discount badge comes from server data, never hardcoded', () => {
  const d = home();
  // Badge chỉ render khi backend khẳng định dangGiam; không hardcode số %.
  assert.equal(/['"]-20%['"]/.test(d), false, 'No hardcoded -20% badge');
  assert.equal(/Giảm 20%/.test(d), false, 'No hardcoded discount label');
  assert.match(d, /BadgeGiamGia/);
});

test('13. flash sale section stays server-authoritative', () => {
  const d = home();
  assert.match(d, /muc\.giaFlash/);
  assert.match(d, /muc\.giaGoc/);
  assert.match(d, /muc\.phanTramGiam/);
  assert.match(d, /muc\.bienTheSanPhamId/);
  assert.match(d, /muc\.soLuongKhaDung/);
  // Không tự tính phần trăm flash sale ở frontend.
  assert.equal(/\(giaGoc.*-.*giaFlash.*\)\s*\/\s*giaGoc/.test(d), false);
});

function docShared(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf-8');
}

test('14. shared price component is the single display path (no per-card math)', () => {
  assert.equal(tonTai('apps/customer-web/src/components/gia-san-pham.tsx'), true);
  const shared = docShared('apps/customer-web/src/components/gia-san-pham.tsx');
  assert.match(shared, /GiaSanPham/);
  assert.match(shared, /GiaBienThe/);
  assert.match(shared, /BadgeGiamGia/);
  // Shared helper không tự tính giá sale từ phần trăm.
  assert.equal(/giaGoc\s*\*\s*\(100\s*-/.test(shared), false);
  const card = docComponent('product-card.tsx');
  assert.match(card, /GiaSanPham/);
  assert.match(card, /giaBan/);
});

test('15. listing/detail/farm/suggestion render effective price', () => {
  const listing = docComponent('danh-sach-san-pham-content.tsx');
  assert.match(listing, /giaBan=\{sp\.giaBan/);
  const detail = docComponent('chi-tiet-san-pham-content.tsx');
  assert.match(detail, /GiaBienThe/);
  assert.match(detail, /bienTheDaChon/);
  assert.match(detail, /giaBan=\{sp\.giaBan/);
  assert.equal(/bienTheDaChon\.gia\)/.test(detail), false, 'Detail must use giaHieuLuc, not catalog gia');
  const farm = docComponent('chi-tiet-trang-trai-content.tsx');
  assert.match(farm, /giaBan=\{item\.giaBan/);
  const goiY = docComponent('goi-y-home.tsx');
  assert.match(goiY, /giaBan=\{item\.giaBan/);
});
