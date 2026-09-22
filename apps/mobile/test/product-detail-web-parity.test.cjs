'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const CHI_TIET = 'apps/mobile/src/app/san-pham/[id].tsx';
const PRODUCT_CARD = 'apps/mobile/src/components/design-system/product-card.tsx';

test('Detail uses effective giaHieuLuc not raw gia catalog for customer-visible price', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('giaHieuLucCuaBienThe'), true);
  assert.equal(src.includes('bienTheDaChon'), true);
  // No direct gia.tu display in hero/variant/sticky bar when effective exists
  assert.equal(src.includes('giaHieuLucDaChon !== null ? dinhDangGia(giaHieuLucDaChon)'), true);
});

test('Detail Flash Sale is server-authoritative only', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('coGiamGiaBienTheMobile'), true);
  assert.equal(src.includes("bienThe.dangGiam !== true"), true);
  assert.equal(src.includes("bienThe.loaiGia !== 'FLASH_SALE'"), true);
  assert.equal(src.includes("bienThe.phanTramGiam <= 0"), true);
  // No frontend-inferred discount
  assert.equal(src.includes('giaGoc > bienThe.gia'), false);
  assert.equal(/giaGoc\s*>\s*giaHieuLuc/i.test(src), false);
});

test('Detail selects first in-stock variant, never out-of-stock default', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('soLuongKhaDung > 0'), true);
  assert.equal(src.includes('bienThe.find'), true);
  assert.equal(src.includes('item.bienThe[0]'), true);
  // User selection preserved
  assert.equal(src.includes('bienTheDaChonId'), true);
});

test('Detail related products cap at 4, use giaBan tu→den range', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('related.slice(0, 4)'), true);
  // Uses giaBan.tu as lower bound, not giaHieuLucDaiDien
  assert.equal(src.includes('giaTuLienQuan'), true);
  assert.equal(src.includes('product.giaBan?.tu'), true);
  assert.equal(src.includes('product.giaBan?.giaHieuLucDaiDien'), false,
    'Related products price lower bound phải là product.giaBan?.tu, không dùng effective',
  );
  assert.equal(src.includes('giaDenLienQuan > giaTuLienQuan'), true);
  // No local fallback for related
  assert.equal(src.includes('relatedData?.data.duLieu ?? []'), true);
});

test('Detail image URLs normalized via chuanHoaUrlAnhMobile', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('chuanHoaUrlAnhMobile'), true);
  // No raw localhost in image sources
  assert.equal(/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(src), false);
});

test('Detail reviews 5/page with pagination, no fixed 3-item dead end', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('gioiHan: 5'), true);
  assert.equal(src.includes('trangDanhGia'), true);
  assert.equal(src.includes('tongTrangDanhGia'), true);
  assert.equal(src.includes('Chưa có đánh giá'), true);
  // No fixed 3-item limit
  assert.equal(src.includes('slice(0, 3)'), false);
});

test('Detail mua-ngay pending action navigates to /thanh-toan after add cart', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('loai: \'mua-ngay\''), true);
  assert.equal(src.includes('router.push(\'/thanh-toan\')'), true);
  assert.equal(src.includes('themMucGioHangMobile'), true);
  // No direct order creation on PDP
  assert.equal(src.includes('taoDonHang'), false);
  assert.equal(src.includes('createOrder'), false);
});

test('ProductCard effective price range support', () => {
  const src = read(PRODUCT_CARD);
  assert.equal(src.includes('hienThiKhoangGia'), true);
  assert.equal(src.includes('priceTo'), true);
  assert.equal(src.includes('coKhoangGia'), true);
});

test('ProductCard no nested Pressable', () => {
  const src = read(PRODUCT_CARD);
  assert.equal(src.includes('không lồng Pressable'), true);
  const pressableOpens = (src.match(/<Pressable/g) || []).length;
  assert.equal(pressableOpens >= 4, true);
});

test('ProductCard out-of-stock shows Tạm hết hàng and disables add-to-cart', () => {
  const src = read(PRODUCT_CARD);
  assert.equal(src.includes('Tạm hết hàng'), true);
  assert.equal(src.includes('hetHang'), true);
  assert.equal(src.includes('disabled={disabled}'), true);
});

test('ProductCard rating displays accurately without hard-coded 5 stars', () => {
  const src = read(PRODUCT_CARD);
  assert.equal(src.includes('typeof rating === \'number\' && Number.isFinite(rating)'), true);
  assert.equal(src.includes('Chưa có đánh giá'), true);
  // No hard-coded rating value like 4.8
  assert.equal(src.includes('4.8'), false);
  // Rating count shown when reviews exist
  assert.equal(src.includes('reviewCount'), true);
});
