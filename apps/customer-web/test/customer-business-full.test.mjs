import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function doc(rel) {
  return fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
}

test('login nói đúng contract email-only + có forgot password route', () => {
  const login = doc('apps/customer-web/src/app/dang-nhap/page.tsx');
  assert.match(login, /label="Email"/);
  assert.match(login, /type="email"/);
  assert.match(login, /href="\/quen-mat-khau"/);
  assert.equal(login.includes('Email hoặc số điện thoại'), false);
});

test('register password khớp backend 10 ký tự', () => {
  const page = doc('apps/customer-web/src/app/dang-ky/page.tsx');
  const dto = doc('apps/api/src/modules/xac-thuc/dto/dang-ky.dto.ts');
  assert.match(page, /matKhau\.length >= 10/);
  assert.match(dto, /@Length\(10, 128\)/);
});

test('legal pages + password reset/change tồn tại', () => {
  for (const rel of [
    'apps/customer-web/src/app/quen-mat-khau/page.tsx',
    'apps/customer-web/src/app/dat-lai-mat-khau/page.tsx',
    'apps/customer-web/src/app/tai-khoan/doi-mat-khau/page.tsx',
    'apps/customer-web/src/app/dieu-khoan/page.tsx',
    'apps/customer-web/src/app/chinh-sach-bao-mat/page.tsx',
  ]) {
    assert.equal(fs.existsSync(path.resolve(process.cwd(), rel)), true, rel);
  }
});

test('auth interactions dùng provider thay vì sessionStorage helper', () => {
  for (const rel of [
    'apps/customer-web/src/components/wishlist-button.tsx',
    'apps/customer-web/src/components/follow-farm-button.tsx',
    'apps/customer-web/src/components/product-card.tsx',
    'apps/customer-web/src/components/chi-tiet-san-pham-content.tsx',
  ]) {
    const text = doc(rel);
    assert.equal(text.includes('coPhienKhachHang()'), false, rel);
  }
});

test('flash sale quota được enforce khi tạo order', () => {
  const order = doc('apps/api/src/modules/don-hang/don-hang.service.ts');
  const quota = doc('apps/api/src/modules/flash-sale/flash-sale-quota.service.ts');
  const schema = doc('apps/api/prisma/schema.prisma');
  assert.match(order, /giuTrongTransaction/);
  assert.match(order, /mucFlashSaleIdSnapshot/);
  assert.match(order, /hoanTrongTransaction/);
  assert.match(quota, /gioiHanTong/);
  assert.match(quota, /gioiHanMoiKhach/);
  assert.match(quota, /FOR UPDATE/);
  assert.match(schema, /mucFlashSaleIdSnapshot/);
});

test('voucher per customer có counter và customer id khi create order', () => {
  const promo = doc('apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts');
  const order = doc('apps/api/src/modules/don-hang/don-hang.service.ts');
  const schema = doc('apps/api/prisma/schema.prisma');
  assert.match(schema, /soLanDaSuDung\s+Int.*so_lan_da_su_dung/);
  assert.match(promo, /Voucher này đã được sử dụng cho tài khoản/);
  assert.match(promo, /khach_hang_khuyen_mai[\s\S]*FOR UPDATE/);
  assert.match(order, /khachHangId: khachHang\.id/);
});

test('complaint có lifecycle + refund endpoint', () => {
  const schema = doc('apps/api/prisma/schema.prisma');
  const controller = doc('apps/api/src/modules/khieu-nai/khieu-nai-quan-tri.controller.ts');
  const service = doc('apps/api/src/modules/khieu-nai/khieu-nai.service.ts');
  assert.match(schema, /enum TrangThaiKhieuNai/);
  assert.match(controller, /:id\/xu-ly/);
  assert.match(controller, /:id\/hoan-tien/);
  assert.match(service, /capNhatXuLyQuanTri/);
  assert.match(service, /hoanTienQuanTri/);
});

test('public review không trả nguyên họ tên', () => {
  const service = doc('apps/api/src/modules/danh-gia/danh-gia.service.ts');
  assert.match(service, /cheTenNguoiDanhGia/);
});

test('social login không bị script giả triển khai', () => {
  const login = doc('apps/customer-web/src/app/dang-nhap/page.tsx');
  // Nút có thể còn để làm sau, nhưng script này không tự tạo OAuth giả.
  assert.equal(login.includes('oauth/callback/fake'), false);
});

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
