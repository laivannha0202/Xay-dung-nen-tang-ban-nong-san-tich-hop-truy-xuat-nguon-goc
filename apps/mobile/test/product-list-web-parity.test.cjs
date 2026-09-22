'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const KHAM_PHA = 'apps/mobile/src/app/(tabs)/kham-pha.tsx';
const FILTER = 'apps/mobile/src/components/search-filter/filter-bottom-sheet.tsx';
const CARD = 'apps/mobile/src/components/design-system/product-card.tsx';

test('Mobile Product List dùng giá bán hiệu lực như Customer Web', () => {
  const src = read(KHAM_PHA);
  assert.equal(src.includes('item.giaBan?.tu'), true);
  assert.equal(src.includes("item.giaBan.loaiGia === 'FLASH_SALE'"), true);
  assert.equal(src.includes('item.giaBan.giaGocDaiDien'), true);
  assert.equal(src.includes('item.giaBan.phanTramGiam'), true);
  assert.equal(src.includes('price={item.gia.tu}'), false);
  assert.equal(src.includes('price={item.giaBan?.giaHieuLucDaiDien'), false,
    'Giá lower bound phải dùng giaBan.tu (catalog sale min), không dùng giaHieuLucDaiDien (effective variant)',
  );
});

test('Mobile Product List parity bộ lọc/sắp xếp với web hiện tại', () => {
  const list = read(KHAM_PHA);
  const filter = read(FILTER);

  assert.equal(list.includes('const GIOI_HAN = 16;'), true);
  assert.equal(list.includes("sapXep: 'MOI_NHAT'"), true);
  assert.equal(list.includes('const regions = facetOptions(facets?.tinhThanh);'), true);
  assert.equal(list.includes('regions={regions}'), true);
  assert.equal(list.includes('thuHoachTu'), false);
  assert.equal(list.includes('thuHoachDen'), false);

  for (const label of [
    'Tất cả mức giá',
    'Dưới 50.000đ',
    '50.000đ – 100.000đ',
    '100.000đ – 200.000đ',
    'Trên 200.000đ',
    'Tình trạng hàng',
    'Khu vực trang trại',
    'Phù hợp nhất',
    'Mới nhất',
    'Giá thấp → cao',
    'Giá cao → thấp',
  ]) {
    assert.equal(filter.includes(label), true, `Thiếu label parity: ${label}`);
  }

  assert.equal(filter.includes('Thu hoạch từ'), false);
  assert.equal(filter.includes('Thu hoạch đến'), false);
});

test('ProductCard mobile không hiển thị giá như đơn giá trên quy cách', () => {
  const src = read(CARD);
  assert.equal(src.includes('`${formatVnd(price)}/${unit}`'), false);
  assert.equal(src.includes('Quy cách: {unit}'), true);
  assert.equal(src.includes('line-through'), true);
  assert.equal(src.includes('Math.round(discountPercent)'), true);
});

test('Product List ProductCard price range dùng giaBan.tu→den (không dùng effective)', () => {
  const src = read(KHAM_PHA);
  const renderMatch = src.match(/renderItem=\{\({ item }\) =>/);
  assert.equal(renderMatch !== null, true, 'Must have renderItem with item destructuring');
  // Price lower bound = giaBan.tu (catalog sale minimum), not giaHieuLucDaiDien
  assert.equal(
    /price=\{item\.giaBan\?\.tu/.test(src),
    true,
    'Price lower bound phải là item.giaBan?.tu (catalog sale min) theo spec section B',
  );
  assert.equal(
    /price=\{item\.giaBan\?\.giaHieuLucDaiDien/.test(src),
    false,
    'Price lower bound KHÔNG được dùng item.giaBan?.giaHieuLucDaiDien (effective variant price)',
  );
  // Price upper bound = giaBan.den
  assert.equal(
    /priceTo=\{.*item\.giaBan\?\.den/.test(src),
    true,
    'Price upper bound phải là item.giaBan?.den (catalog sale max)',
  );
});

test('Mobile Product List giữ semantics tồn kho giống web', () => {
  const src = read(KHAM_PHA);
  assert.equal(src.includes('hienThiTonKhaDung'), true);
  assert.equal(src.includes('item.khaDung.soLuongKhaDung <= 10'), true);
  assert.equal(src.includes('Chỉ còn ${hienThiTonKhaDung'), true);
});
