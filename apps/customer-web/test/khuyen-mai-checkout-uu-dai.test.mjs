/**
 * Promotion + Flash Sale — Customer Web & Mobile parity.
 *
 * Bao phu:
 * - checkout web hien thi voucher khong du dieu kien o dang disabled
 *   kem ly do NGAN, backend preview van la noi quyet dinh;
 * - kho voucher dung API that (khuyen-mai-khach), khong con endpoint legacy
 *   /khuyen-mai/voucher da chet o backend;
 * - mobile ap dung cung luat, cung ket qua (tamTinh truyen vao picker,
 *   nut Chon bi khoa khi khong du dieu kien).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const doc = (p) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf-8');

const checkout = doc('apps/customer-web/src/components/checkout-content.tsx');
const khoVoucher = doc('apps/customer-web/src/components/voucher-cua-toi-content.tsx');
const mobile = doc('apps/mobile/src/app/thanh-toan.tsx');
const promoCenter = doc('apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx');

test('1. checkout web danh dau voucher khong du dieu kien + ly do ngan', () => {
  assert.match(checkout, /lyDoVoucherKhongDungDuoc/);
  assert.match(checkout, /Đã hết lượt/);
  assert.match(checkout, /Đã hết hạn/);
  assert.match(checkout, /Chưa bắt đầu/);
  assert.match(checkout, /Đơn tối thiểu/);
  assert.match(checkout, /disabled=\{khoaLuaChon \|\| Boolean\(lyDo && !dangChon\)\}/);
  assert.match(checkout, /Server sẽ kiểm tra lại điều kiện voucher khi tạo đơn/);
  assert.match(checkout, /layCheckoutPreviewKhach/);
});

test('2. kho voucher dung API that, khong con endpoint legacy', () => {
  assert.match(khoVoucher, /layKhuyenMaiDaLuuKhach/);
  assert.match(khoVoucher, /KHUYEN_MAI_DA_LUU_QUERY_KEY/);
  assert.equal(khoVoucher.includes('api-voucher'), false);
  assert.equal(khoVoucher.includes('layVoucherCuaToi'), false);
  assert.equal(khoVoucher.includes('/khuyen-mai/voucher'), false);
  assert.equal(
    fs.existsSync(path.resolve(process.cwd(), 'apps/customer-web/src/lib/api-voucher.ts')),
    false,
  );
  assert.equal(
    fs.existsSync(
      path.resolve(process.cwd(), 'apps/customer-web/src/components/trung-tam-voucher.tsx'),
    ),
    false,
  );
  assert.equal(
    fs.existsSync(
      path.resolve(process.cwd(), 'apps/customer-web/src/components/voucher-checkout-picker.tsx'),
    ),
    false,
  );
});

test('3. mobile ap dung cung luat, cung ket qua voi web', () => {
  assert.match(mobile, /lyDoVoucherKhongDungDuoc/);
  assert.match(mobile, /Đã hết lượt/);
  assert.match(mobile, /Đã hết hạn/);
  assert.match(mobile, /Đơn tối thiểu/);
  assert.match(mobile, /tamTinh=\{preview\.price\.tamTinhHangHoa\}/);
  assert.match(mobile, /disabled=\{Boolean\(lyDo\)\}/);
  assert.match(mobile, /layCheckoutPreviewMobile/);
  assert.match(mobile, /taoDuLieuDonHangTuPreview/);
});

test('4. trang khuyen mai dung du lieu API that, khong hard-code', () => {
  assert.match(promoCenter, /layKhuyenMaiCongKhaiKhach/);
  assert.match(promoCenter, /useLayFlashSaleCongKhaiActive/);
  assert.equal(promoCenter.includes('RAU10'), false);
  assert.equal(promoCenter.includes('FRESH50'), false);
  assert.match(promoCenter, /Đơn tối thiểu/);
  assert.match(promoCenter, /HSD/);
  assert.match(promoCenter, /Theo trang trại/);
  assert.match(promoCenter, /nhanGiaTri/);
});

test('5. gia hien thi do backend quyet dinh, frontend khong tu suy dien', () => {
  assert.match(checkout, /preview\.price\.tamTinhHangHoa/);
  assert.match(checkout, /preview\.total\.tongThanhToan/);
  assert.match(checkout, /preview\.promotion/);
  assert.match(mobile, /preview\.price\.tamTinhHangHoa/);
  assert.match(mobile, /preview\.total\.tongThanhToan/);
  assert.equal(/giaFlash\s*=\s*giaGoc\s*\*/.test(checkout), false);
  assert.equal(/giaFlash\s*=\s*giaGoc\s*\*/.test(mobile), false);
});
