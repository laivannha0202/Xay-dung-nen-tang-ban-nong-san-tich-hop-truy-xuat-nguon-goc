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

test('7. categories from real facets API', () => {
  const d = home();
  assert.equal(d.includes('FALLBACK_CATEGORIES'), false);
  assert.equal(d.includes('FALLBACK_QUICK_CATEGORIES'), false);
  assert.match(d, /danhMucFacets/);
  assert.match(d, /facetsQuery\.data\?\.data\?\.danhMuc/);
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
  assert.match(d, /Lô đạt chuẩn mới mở bán/);
});
