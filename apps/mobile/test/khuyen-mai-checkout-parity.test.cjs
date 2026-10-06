'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const web = read('apps/customer-web/src/components/checkout-content.tsx');
const mobile = read('apps/mobile/src/app/thanh-toan.tsx');

test('web va mobile dung cung luat eligibility voucher', () => {
  for (const marker of [
    'lyDoVoucherKhongDungDuoc',
    'Đã hết lượt',
    'Đã hết hạn',
    'Chưa bắt đầu',
    'Đơn tối thiểu',
  ]) {
    assert.equal(web.includes(marker), true, `Web thieu: ${marker}`);
    assert.equal(mobile.includes(marker), true, `Mobile thieu: ${marker}`);
  }
});

test('voucher khong du dieu kien bi khoa nut Chon o ca hai nen tang', () => {
  assert.equal(web.includes('Boolean(lyDo && !dangChon)'), true);
  assert.equal(mobile.includes('Boolean(lyDo)'), true);
});

test('backend la source of truth cho gia va uu dai o ca hai nen tang', () => {
  const mobileCheckoutLib = read('apps/mobile/src/lib/api-checkout.ts');
  for (const marker of [
    'layCheckoutPreview',
    'preview.price.tamTinhHangHoa',
    'preview.total.tongThanhToan',
  ]) {
    assert.equal(web.includes(marker), true, `Web thieu: ${marker}`);
    assert.equal(mobile.includes(marker), true, `Mobile thieu: ${marker}`);
  }
  assert.equal(web.includes('donGiaDuKien'), true);
  assert.equal(mobile.includes('taoDuLieuDonHangTuPreview'), true);
  assert.equal(mobileCheckoutLib.includes('donGiaDuKien'), true);
  assert.equal(web.includes('Server sẽ kiểm tra lại'), true);
  assert.equal(mobileCheckoutLib.includes('Backend luôn đánh giá lại'), true);
});

test('khong hard-code ma voucher hay gia khuyen mai o checkout', () => {
  for (const src of [web, mobile]) {
    assert.equal(src.includes('RAU10'), false);
    assert.equal(src.includes('FRESH50'), false);
  }
});
