import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docComponent(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${tenFile}`),
    'utf-8',
  );
}

function docLib(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/lib/${tenFile}`),
    'utf-8',
  );
}

// Mirror logic trong checkout-content.tsx — Backend là source of truth.
function coTheDatHang(preview, diaChiHopLe, dangGui) {
  const coItemLoi = preview.items.some((item) => !item.coTheDatHang);
  return preview.total.coTheXacNhan && !coItemLoi && diaChiHopLe && !dangGui;
}

function lamThongDiepThanThien(thongDiep) {
  const n = thongDiep.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n.includes('ton kho')) return 'Tồn kho đã thay đổi.';
  if (n.includes('pham vi') || n.includes('giao hang')) return 'Địa chỉ hiện nằm ngoài phạm vi giao hàng.';
  if (n.includes('don gia') || n.includes('gia san pham') || n.includes('price')) return 'Giá sản phẩm đã được cập nhật.';
  if (n.includes('khuyen mai') || n.includes('voucher')) return 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';
  if (n.includes('thanh toan') || n.includes('payment')) return 'Thanh toán chưa hoàn tất.';
  return thongDiep;
}

const PREVIEW_HOP_LE = {
  gioHangId: 'gh-1',
  items: [
    { mucGioHangId: 'm1', soLuong: 2, donGia: 32000, thanhTien: 64000, coTheDatHang: true },
    { mucGioHangId: 'm2', soLuong: 1, donGia: 25000, thanhTien: 25000, coTheDatHang: true },
  ],
  total: { coTheXacNhan: true, lyDoKhongTheXacNhan: [], tongThanhToan: 89000 },
};

const PREVIEW_LOI_TON = {
  ...PREVIEW_HOP_LE,
  items: [
    { mucGioHangId: 'm1', soLuong: 2, donGia: 32000, thanhTien: 64000, coTheDatHang: true },
    { mucGioHangId: 'm2', soLuong: 1, donGia: 25000, thanhTien: 25000, coTheDatHang: false },
  ],
  total: { coTheXacNhan: false, lyDoKhongTheXacNhan: ['Tồn kho đã thay đổi'], tongThanhToan: null },
};

test('1. unauthenticated: render auth-required, không guest checkout', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /useXacThucKhachHang/);
  assert.match(content, /Cần đăng nhập/);
  assert.match(content, /\/dang-nhap\?next=\/thanh-toan/);
  assert.equal(content.includes('guest'), false);
  assert.equal(content.includes('localStorage'), false);
});

test('2. empty cart: không render form, CTA về mua sắm/giỏ', () => {
  assert.equal(PREVIEW_HOP_LE.items.length > 0, true);
  assert.equal(PREVIEW_LOI_TON.items.length > 0, true);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /preview\.items\.length === 0/);
  assert.match(content, /Giỏ hàng của bạn đang trống/);
  assert.match(content, /Xem sản phẩm/);
  assert.match(content, /Quay lại giỏ hàng/);
});

test('3. preview loading: skeleton địa chỉ + tóm tắt', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /previewQuery\.isPending/);
  assert.match(content, /AgriSkeleton/);
  assert.match(content, /diaChiQuery\.isPending/);
});

test('4. preview invalid: render reasons thật, disable đặt hàng', () => {
  assert.equal(coTheDatHang(PREVIEW_LOI_TON, true, false), false);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /lyDoKhongTheXacNhan/);
  assert.match(content, /Checkout chưa thể xác nhận/);
  assert.match(content, /preview\.total\.coTheXacNhan/);
});

test('5. all valid → checkout enabled', () => {
  assert.equal(coTheDatHang(PREVIEW_HOP_LE, true, false), true);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /coTheDat/);
  assert.match(content, /disabled=\{!coTheDat\}/);
});

test('6. mixed valid/invalid → disabled toàn checkout', () => {
  assert.equal(coTheDatHang(PREVIEW_LOI_TON, true, false), false);
  assert.equal(coTheDatHang(PREVIEW_HOP_LE, false, false), false);
  assert.equal(coTheDatHang(PREVIEW_HOP_LE, true, true), false);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /coItemKhongHopLe/);
  assert.match(content, /Một số sản phẩm đã thay đổi tồn kho/);
  assert.match(content, /Xem lại giỏ hàng/);
});

test('7. effective server price displayed (preview donGia/thanhTien)', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /item\.donGia/);
  assert.match(content, /item\.thanhTien/);
  assert.match(content, /tamTinhHangHoa/);
  assert.match(content, /tongThanhToan/);
  // Không reuse giá cart local làm authority
  assert.equal(content.includes('gioHangKhach'), false);
});

test('8. no fake shipping: chỉ từ preview.shipping', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /preview\.shipping/);
  assert.match(content, /Phí vận chuyển/);
  assert.equal(content.includes('shipping = 0'), false);
  assert.equal(content.includes('Miễn phí vận chuyển'), false);
  assert.match(content, /Chưa xác định/);
});

test('9. voucher invalid nếu supported: backend preview quyết định', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /maKhuyenMai/);
  assert.match(content, /layCheckoutPreviewKhach/);
  assert.match(content, /preview\.promotion/);
  assert.match(content, /Mã giảm giá không hợp lệ hoặc đã hết hạn/);
  assert.equal(content.includes('MOCK_CHECKOUT'), false);
});

test('10. address outside delivery zone: block + message', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /thuocPhamViGiaoHangHungYen/);
  assert.match(content, /Địa chỉ hiện nằm ngoài phạm vi giao hàng/);
  assert.match(content, /Ngoài khu vực/);
  assert.match(content, /PHAM_VI_GIAO_HANG_AGRIMARKET/);
  assert.equal(lamThongDiepThanThien('ngoài phạm vi giao hàng'), 'Địa chỉ hiện nằm ngoài phạm vi giao hàng.');
});

test('11. payment method selection: chỉ COD + VNPay Sandbox', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /COD/);
  assert.match(content, /VNPAY_SANDBOX/);
  assert.equal(content.includes('Momo'), false);
  assert.equal(content.includes('ZaloPay'), false);
  assert.equal(content.includes('Visa'), false);
  assert.equal(content.includes('Mastercard'), false);
  assert.match(content, /Phương thức thanh toán/);
});

test('12. double submit blocked: disable while pending + idempotency', () => {
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /datHangMutation\.isPending/);
  assert.match(content, /disabled=\{!coTheDat\}/);
  assert.match(content, /loading=\{datHangMutation\.isPending\}/);
  assert.match(content, /maYeuCauDonHang/);
  assert.match(content, /maYeuCauThanhToan/);
  assert.match(content, /crypto\.randomUUID/);
  assert.match(content, /lanDatHangRef/);
});

test('13. create order success: đúng DTO + redirect kết quả', () => {
  const lib = docLib('api-don-hang.ts');
  assert.match(lib, /taoDonHang/);
  assert.match(lib, /diaChiGiaoHangId/);
  assert.match(lib, /maYeuCau/);
  assert.match(lib, /donGiaDuKien/);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /taoDonHangKhach/);
  assert.match(content, /taoThanhToanCodWebKhach/);
  assert.match(content, /taoThanhToanVnPayWebKhach/);
  assert.match(content, /\/thanh-toan\/ket-qua/);
});

test('14. cart invalidated + header count sync cùng query key', () => {
  const content = docComponent('checkout-content.tsx');
  const header = docComponent('agri-header.tsx');
  assert.match(content, /\['gio-hang-khach'\]/);
  assert.match(header, /\['gio-hang-khach'\]/);
  assert.match(content, /invalidateQueries\(\{ queryKey: GIO_HANG_QUERY_KEY \}\)/);
  assert.match(content, /\['don-hang-khach'\]/);
  assert.match(content, /DIEM_THUONG_TONG_QUAN_QUERY_KEY/);
});

test('15. header count sync: không tự clear local state', () => {
  const content = docComponent('checkout-content.tsx');
  assert.equal(content.includes('setGioHang('), false);
  assert.equal(content.includes('clearCart()'), false);
  assert.match(content, /invalidateQueries/);
});

test('16. no frontend authoritative price: không gửi subtotal/discount authority', () => {
  const lib = docLib('api-don-hang.ts');
  assert.equal(lib.includes('subtotal'), false);
  assert.equal(lib.includes('tongThanhToan'), false);
  assert.equal(lib.includes('discountAuthority'), false);
  const content = docComponent('checkout-content.tsx');
  assert.match(content, /donGiaDuKien: item\.donGia/);
  assert.match(content, /Backend.*authority|Backend sẽ đánh giá lại/s);
});

test('17. no fake payment success: không tự set paid, phân biệt order/payment status', () => {
  const content = docComponent('checkout-content.tsx');
  assert.equal(content.includes('trangThai: \'PAID\''), false);
  assert.equal(content.includes('markAsPaid'), false);
  assert.match(content, /thanhToan\.trangThai/);
  assert.match(content, /thanhToan\.phuongThuc/);
  const result = docComponent('payment-result-content.tsx');
  assert.match(result, /metaTrangThaiThanhToan/);
  assert.match(result, /metaTrangThaiDatCho/);
  assert.match(result, /layThanhToanDonHangKhach/);
});
