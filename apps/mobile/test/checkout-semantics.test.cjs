'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadTsModule(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: filename,
    reportDiagnostics: true,
  }).outputText;

  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

const domainUi = loadTsModule('packages/api-client/src/domain-ui.ts');

test('checkout component semantics distinguish not-applied, invalid and real zero value', () => {
  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'KHONG_AP_DUNG', giaTri: 0 }), {
    label: 'Chưa áp dụng',
    tone: 'neutral',
    hienThiGiaTri: false,
  });

  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'KHONG_HOP_LE', giaTri: 0 }), {
    label: 'Không hợp lệ',
    tone: 'warning',
    hienThiGiaTri: false,
  });

  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'DA_TINH', giaTri: 0 }), {
    label: 'Đã tính',
    tone: 'success',
    hienThiGiaTri: true,
  });

  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'DA_TINH', giaTri: null }), {
    label: 'Đang cập nhật',
    tone: 'warning',
    hienThiGiaTri: false,
  });
});

test('Mobile and Customer Web consume the same checkout component semantics', () => {
  const mobile = read('apps/mobile/src/app/thanh-toan.tsx');
  const web = read('apps/customer-web/src/components/checkout-content.tsx');
  const backend = read('apps/api/src/modules/gio-hang/checkout-preview.service.ts');

  assert.equal(mobile.includes('metaThanhPhanCheckout'), true);
  assert.equal(web.includes('metaThanhPhanCheckout'), true);
  assert.equal(web.includes('preview.total.coTheXacNhan'), true);
  assert.equal(web.includes('thanhPhan={preview.promotion}'), true);
  assert.equal(web.includes('thanhPhan={preview.points}'), true);
  assert.equal(backend.includes("trangThai: 'KHONG_AP_DUNG'"), true);
  assert.equal(backend.includes("trangThai: 'KHONG_HOP_LE'"), true);
});

test('Mobile, Customer Web and Backend share the Hung Yen delivery scope rule', () => {
  const mobile = read('apps/mobile/src/app/thanh-toan.tsx');
  const web = read('apps/customer-web/src/components/checkout-content.tsx');
  const preview = read('apps/api/src/modules/gio-hang/checkout-preview.service.ts');
  const orderController = read('apps/api/src/modules/don-hang/don-hang.controller.ts');
  const scopeService = read('apps/api/src/modules/giao-hang/pham-vi-giao-hang.service.ts');

  assert.equal(domainUi.PHAM_VI_GIAO_HANG_AGRIMARKET.ten, 'Tỉnh Hưng Yên');
  assert.equal(domainUi.thuocPhamViGiaoHangHungYen('Hưng Yên'), true);
  assert.equal(domainUi.thuocPhamViGiaoHangHungYen('Tỉnh Hưng Yên'), true);
  assert.equal(domainUi.thuocPhamViGiaoHangHungYen('Thái Bình'), true);
  assert.equal(domainUi.thuocPhamViGiaoHangHungYen('Hà Nội'), false);

  assert.equal(mobile.includes('thuocPhamViGiaoHangHungYen'), true);
  assert.equal(web.includes('thuocPhamViGiaoHangHungYen'), true);
  assert.equal(mobile.includes('diaChiGiaoHangId'), true);
  assert.equal(web.includes('diaChiGiaoHangId'), true);
  assert.equal(preview.includes('phamViGiaoHangService.danhGiaDiaChi'), true);
  assert.equal(orderController.includes('phamViGiaoHangService.damBaoDiaChiHopLe'), true);
  assert.equal(scopeService.includes("new Set(['hung yen', 'thai binh'])"), true);
});

test('Admin exposes the same backend shipping fee policy used by checkout', () => {
  const backendPricing = read('apps/api/src/modules/gio-hang/checkout-pricing.service.ts');
  const backendConfig = read('apps/api/src/modules/cau-hinh-he-thong/dto/phan-hoi-cau-hinh-he-thong.dto.ts');
  const adminAdapter = read('apps/admin-web/src/lib/api-cau-hinh-he-thong.ts');
  const adminPage = read('apps/admin-web/src/app/cau-hinh/page.tsx');

  for (const field of ['phiVanChuyenCoBan', 'nguongMienPhiVanChuyen']) {
    assert.equal(backendPricing.includes(field), true);
    assert.equal(backendConfig.includes(field), true);
    assert.equal(adminAdapter.includes(field), true);
    assert.equal(adminPage.includes(`name="${field}"`), true);
  }

  assert.equal(adminPage.includes('Chính sách phí giao hàng'), true);
  assert.equal(adminPage.includes('Không cần hard-code phí ở client.'), true);
});

test('Customer Web payment result is verified through the authenticated backend contract', () => {
  const checkout = read('apps/customer-web/src/components/checkout-content.tsx');
  const resultPage = read('apps/customer-web/src/app/thanh-toan/ket-qua/page.tsx');
  const resultView = read('apps/customer-web/src/components/payment-result-content.tsx');
  const paymentAdapter = read('apps/customer-web/src/lib/api-thanh-toan.ts');

  assert.equal(checkout.includes("router.replace(`/thanh-toan/ket-qua?${params.toString()}`)"), true);
  assert.equal(checkout.includes('donHang.id'), true);
  assert.equal(resultPage.includes('donHangId={layGiaTri(params.donHangId)}'), true);
  assert.equal(paymentAdapter.includes('layThanhToanDonHangCuaToi'), true);
  assert.equal(paymentAdapter.includes('bearerOptionsKhachHang()'), true);
  assert.equal(resultView.includes('layThanhToanDonHangKhach'), true);
  assert.equal(resultView.includes('trangThaiTuBackend(payment.trangThai)'), true);
  assert.equal(resultView.includes('Trạng thái trên liên kết không được dùng thay cho dữ liệu thanh toán'), true);
});

test('Customer Web VNPay uses a whitelisted WEB callback channel and backend verification', () => {
  const checkout = read('apps/customer-web/src/components/checkout-content.tsx');
  const paymentAdapter = read('apps/customer-web/src/lib/api-thanh-toan.ts');
  const paymentDto = read('apps/api/src/modules/thanh-toan/dto/tao-thanh-toan.dto.ts');
  const paymentController = read('apps/api/src/modules/thanh-toan/thanh-toan.controller.ts');
  const webFacade = read('apps/api/src/modules/thanh-toan/thanh-toan-web.service.ts');
  const callbackController = read('apps/api/src/modules/thanh-toan/thanh-toan-callback.controller.ts');

  assert.equal(checkout.includes("'VNPAY_SANDBOX'"), true);
  assert.equal(checkout.includes('taoThanhToanVnPayWebKhach'), true);
  assert.equal(checkout.includes('window.location.assign(thanhToan.paymentUrl)'), true);
  assert.equal(paymentAdapter.includes("kenhTraVe: 'WEB'"), true);
  assert.equal(paymentDto.includes("['MOBILE', 'WEB']"), true);
  assert.equal(paymentDto.includes('returnUrl'), false);
  assert.equal(paymentController.includes("dto.kenhTraVe === 'WEB'"), true);
  assert.equal(webFacade.includes("'/api/v1/thanh-toan/callback/VNPAY_SANDBOX/web'"), true);
  assert.equal(callbackController.includes("@Get(':gateway/web')"), true);
  assert.equal(callbackController.includes('await this.service.xuLy(gateway, query)'), true);
  assert.equal(callbackController.includes("get<string>('CUSTOMER_WEB_URL')"), true);
});

test('Failed VNPay keeps reservation for retry while Web reuses the existing Order', () => {
  const callback = read('apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts');
  const resultView = read('apps/customer-web/src/components/payment-result-content.tsx');
  const paymentAdapter = read('apps/customer-web/src/lib/api-thanh-toan.ts');

  assert.equal(callback.includes("gatewayName === 'VNPAY_SANDBOX'"), true);
  assert.equal(callback.includes('reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU'), true);
  assert.equal(resultView.includes('coTheThuLaiVnPay'), true);
  assert.equal(resultView.includes('Thử lại VNPay'), true);
  assert.equal(resultView.includes('taoThanhToanVnPayWebKhach(donHangId, crypto.randomUUID())'), true);
  assert.equal(paymentAdapter.includes("phuongThuc: 'VNPAY_SANDBOX'"), true);
});

test('Order detail contract exposes persisted promotion, loyalty and shipping pricing snapshots', () => {
  const pricingService = read('apps/api/src/modules/don-hang/don-hang-pricing-snapshot.service.ts');
  const customerController = read('apps/api/src/modules/don-hang/don-hang.controller.ts');
  const adminController = read('apps/api/src/modules/don-hang/don-hang-quan-tri.controller.ts');
  const customerType = read('apps/customer-web/src/lib/api-don-hang.ts');
  const mobileType = read('apps/mobile/src/lib/api-don-hang.ts');

  for (const field of [
    'tamTinhHangHoa',
    'phiVanChuyen',
    'maKhuyenMai',
    'giamKhuyenMai',
    'diemDaDung',
    'giaTriDiemDaDung',
  ]) {
    assert.equal(pricingService.includes(field), true);
    assert.equal(customerType.includes(field), true);
    assert.equal(mobileType.includes(field), true);
  }

  assert.equal(customerController.includes('pricingSnapshotService.lay(id)'), true);
  assert.equal(adminController.includes('pricingSnapshotService.lay(id)'), true);
});
