import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function doc(rel) {
  return fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8');
}

test('1. Prisma có ví voucher theo tài khoản, unique customer + promotion', () => {
  const schema = doc('apps/api/prisma/schema.prisma');
  assert.match(schema, /model KhachHangKhuyenMai/);
  assert.match(schema, /@@unique\(\[khachHangId, khuyenMaiId\]/);
  assert.match(schema, /khuyenMaiDaLuu/);
});

test('2. API có public voucher + lưu/bỏ lưu protected', () => {
  const controller = doc('apps/api/src/modules/khuyen-mai/khuyen-mai-khach-hang.controller.ts');
  assert.match(controller, /Controller\('khuyen-mai'\)/);
  assert.match(controller, /Get\('cong-khai'\)/);
  assert.match(controller, /Controller\('khach-hang\/khuyen-mai'\)/);
  assert.match(controller, /Post\(':id\/luu'\)/);
  assert.match(controller, /Delete\(':id\/luu'\)/);
  assert.match(controller, /JwtAccessGuard/);
});

test('3. Backend checkout chỉ chấp nhận voucher đã lưu', () => {
  const service = doc('apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts');
  const preview = doc('apps/api/src/modules/gio-hang/checkout-preview.service.ts');
  const order = doc('apps/api/src/modules/don-hang/don-hang.service.ts');
  assert.match(service, /Voucher chưa được lưu vào tài khoản/);
  assert.match(service, /khachHangId_khuyenMaiId/);
  assert.match(preview, /khachHangId: gioHang\.khachHangId/);
  assert.match(order, /khachHangId: khachHang\.id/);
});

test('4. Trang khuyến mãi là nơi khách lưu voucher', () => {
  const content = doc('apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx');
  assert.match(content, /Mã giảm giá/);
  assert.match(content, /Lưu mã/);
  assert.match(content, /Đã lưu/);
  assert.match(content, /layKhuyenMaiCongKhaiKhach/);
  assert.match(content, /luuKhuyenMaiKhach/);
});

test('5. Checkout không còn bắt nhập mã/điểm bằng TextInput', () => {
  const content = doc('apps/customer-web/src/components/checkout-content.tsx');
  assert.equal(content.includes('label="Mã khuyến mãi"'), false);
  assert.equal(content.includes('label="Điểm muốn sử dụng"'), false);
  assert.match(content, /Chọn voucher/);
  assert.match(content, /voucherDaLuuQuery/);
  assert.match(content, /<Switch/);
  assert.match(content, /diemToiDaCoTheSuDung/);
});

test('6. Checkout preview expose mức điểm tối đa server-side', () => {
  const dto = doc('apps/api/src/modules/gio-hang/dto/checkout-preview.dto.ts');
  const service = doc('apps/api/src/modules/gio-hang/checkout-preview.service.ts');
  assert.match(dto, /LoyaltyCheckoutPreviewDto/);
  assert.match(dto, /diemToiDaCoTheSuDung/);
  assert.match(service, /giaTriQuyDoiMoiDiem/);
  assert.match(service, /giaTriGiamToiDa/);
});

test('7. Admin có mô tả voucher hiển thị cho khách', () => {
  const dto = doc('apps/api/src/modules/khuyen-mai/dto/quan-tri-khuyen-mai.dto.ts');
  const admin = doc('apps/admin-web/src/app/khuyen-mai/page.tsx');
  assert.match(dto, /moTa/);
  assert.match(admin, /Mô tả hiển thị cho khách/);
});
