'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');
function read(relativePath) { return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'); }

test('Mobile Home follows current customer-web section context', () => {
  const home = read('apps/mobile/src/app/(tabs)/index.tsx');
  assert.equal(home.includes('HERO_BANNERS.map'), true);
  assert.equal(home.includes('pagingEnabled'), true);
  assert.equal(home.includes('PROMO_CARDS.slice(0, 2)'), true);

  assert.equal(home.includes('QUICK_CATEGORIES'), false);
  assert.equal(home.includes('shortcutIcon('), false);
  assert.equal(home.includes('SERVICE_COMMITMENTS'), false);
  assert.equal(home.includes('Danh mục nông sản'), false);

  assert.equal(home.includes('{hero.title}'), false);
  assert.equal(home.includes('{hero.subtitle}'), false);

  for (const section of ['Flash Sale', 'Sản phẩm nổi bật', 'Trang trại tiêu biểu', 'Kiến thức nông sản', 'Tin tức']) {
    assert.equal(home.includes(section), true, `Missing homepage section: ${section}`);
  }
});

test('Mobile Home preserves current customer-web commerce semantics', () => {
  const home = read('apps/mobile/src/app/(tabs)/index.tsx');
  assert.equal(home.includes('useLayFlashSaleCongKhaiActive'), true);
  assert.equal(home.includes('muc.giaFlash'), true);
  assert.equal(home.includes('muc.giaGoc'), true);
  assert.equal(home.includes('muc.phanTramGiam'), true);
  assert.equal(home.includes('muc.soLuongKhaDung'), true);
  // Server đã lọc sản phẩm công khai hợp lệ. Mobile KHÔNG được tự filter
  // theo tên sản phẩm ở frontend — filter tên chỉ che lỗi dữ liệu gốc.
  assert.equal(home.includes('laSanPhamTestHomepage'), false);
  assert.equal(home.includes('flashSaleIds'), true);
  assert.equal(home.includes('item.giaBan?.tu'), true);
  assert.equal(home.includes('item.gia.tu'), true);
  assert.equal(home.includes('item.giaBan?.giaGocDaiDien'), true);

  assert.equal(home.includes('FLASH_SALE_ITEMS'), false);
  assert.equal(home.includes('FEATURED_PRODUCTS_FALLBACK'), false);
  assert.equal(home.includes('FEATURED_FARMS'), false);
});

test('Knowledge and News mobile screens use same public content API boundary as web', () => {
  const listing = read('apps/mobile/src/components/content/content-listing.tsx');
  const news = read('apps/mobile/src/app/tin-tuc.tsx');
  const knowledge = read('apps/mobile/src/app/kien-thuc.tsx');

  assert.equal(listing.includes('useLayNoiDungTrangChuCongKhai'), true);
  assert.equal(listing.includes('gopBaiVietKienThucMobile'), true);
  assert.equal(listing.includes('gopBaiVietTinTucMobile'), true);
  assert.equal(listing.includes('locBaiVietTheoTabMobile'), true);
  assert.equal(news.includes('ContentListingMobile mode="tin-tuc"'), true);
  assert.equal(knowledge.includes('ContentListingMobile mode="kien-thuc"'), true);
  assert.equal(news.includes('FARM_STORIES'), false);
  assert.equal(knowledge.includes('KNOWLEDGE_ARTICLES'), false);
});

test('Customer Web cũng không filter sản phẩm theo tên ở frontend', () => {
  const web = read('apps/customer-web/src/components/trang-chu-content.tsx');
  const webImages = read('apps/customer-web/src/lib/demo-images.ts');
  // Dữ liệu test lọt ra catalog phải được xử lý ở data layer, không phải
  // bằng cách giấu tên sản phẩm trên UI.
  assert.equal(web.includes('laSanPhamTestHomepage'), false);
  assert.equal(webImages.includes('laSanPhamTestHomepage'), false);
});

test('Mobile orders render representative item from server, not a hard-coded summary', () => {
  const donHang = read('apps/mobile/src/app/(tabs)/don-hang.tsx');
  // Card đơn hàng phải dùng mucDaiDien (contract chung với Customer Web).
  assert.equal(donHang.includes('order.mucDaiDien'), true);
  assert.equal(donHang.includes('order.maDonHang'), true);
  assert.equal(donHang.includes('order.tongTien'), true);
  assert.equal(donHang.includes('dinhDangNgay(order.createdAt)'), true);
  // Không còn lớp card-trong-card / mint background trang trí.
  assert.equal(donHang.includes('rounded-2xl'), false);
  assert.equal(donHang.includes('leaf-outline'), false);
  assert.equal(donHang.includes('shield-checkmark-outline'), false);
  assert.equal(donHang.includes('EAF7EF'), false);
});
