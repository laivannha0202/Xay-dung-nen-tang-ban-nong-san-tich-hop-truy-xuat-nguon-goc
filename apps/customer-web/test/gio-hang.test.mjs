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

// Logic trình bày, mirror implementation trong gio-hang-content.tsx
function tinhTamTinhTrinhBay(muc) {
  return muc.reduce((tong, item) => tong + item.bienThe.giaHienTai * item.soLuong, 0);
}

function laSoLuongHopLe(soLuong, hienTai) {
  if (!Number.isInteger(soLuong)) return false;
  if (soLuong < 1 || soLuong > 999) return false;
  if (soLuong === hienTai) return false;
  return true;
}

function laFlashSale(bienThe) {
  return bienThe.loaiGia === 'FLASH_SALE' && bienThe.giaGoc > bienThe.giaHienTai;
}

function choPhepThanhToan(muc) {
  return muc.filter((item) => item.bienThe.coTheDatHang).length > 0;
}

const MUC_MAU = [
  {
    id: 'muc-a',
    soLuong: 2,
    bienThe: {
      id: 'bt-a',
      khoiLuong: 0.5,
      donVi: 'kg',
      giaHienTai: 32000,
      giaGoc: 40000,
      loaiGia: 'FLASH_SALE',
      soLuongKhaDung: 10,
      coTheDatHang: true,
      sanPham: { id: 'sp-a', ten: 'Rau muống', trangTrai: { ten: 'Trang trại X' } },
    },
  },
  {
    id: 'muc-b',
    soLuong: 1,
    bienThe: {
      id: 'bt-b',
      khoiLuong: 10,
      donVi: 'quả',
      giaHienTai: 25000,
      giaGoc: 25000,
      loaiGia: 'NORMAL',
      soLuongKhaDung: 5,
      coTheDatHang: true,
      sanPham: { id: 'sp-b', ten: 'Trứng gà', trangTrai: { ten: 'Trang trại Y' } },
    },
  },
];

test('1. Cart empty: không render summary/checkout vô nghĩa', () => {
  const muc = [];
  assert.equal(muc.length, 0);
  assert.equal(tinhTamTinhTrinhBay(muc), 0);
  assert.equal(choPhepThanhToan(muc), false);
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /danhSachMuc\.length === 0/);
  assert.match(content, /Giỏ hàng của bạn đang trống/);
  assert.match(content, /Khám phá nông sản sạch/);
});

test('2. Normal cart: tạm tính trình bày từ giá hiệu lực server', () => {
  // 2 × 32.000 + 1 × 25.000 = 89.000
  assert.equal(tinhTamTinhTrinhBay(MUC_MAU), 89000);
  assert.equal(choPhepThanhToan(MUC_MAU), true);
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /giaHienTai \* muc\.soLuong/);
});

test('3. Update quantity: min 1, integer, không 0/âm/NaN', () => {
  assert.equal(laSoLuongHopLe(3, 2), true);
  assert.equal(laSoLuongHopLe(1, 1), false);
  assert.equal(laSoLuongHopLe(0, 1), false);
  assert.equal(laSoLuongHopLe(-1, 1), false);
  assert.equal(laSoLuongHopLe(1.5, 1), false);
  assert.equal(laSoLuongHopLe(Number.NaN, 1), false);
  assert.equal(laSoLuongHopLe(1000, 2), false);
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /Giảm số lượng/);
  assert.match(content, /Tăng số lượng/);
  assert.match(content, /soLuong > 1/);
});

test('4. Effective price: flash sale chỉ khi backend trả loaiGia', () => {
  assert.equal(laFlashSale(MUC_MAU[0].bienThe), true);
  assert.equal(laFlashSale(MUC_MAU[1].bienThe), false);
  assert.equal(
    laFlashSale({ loaiGia: 'NORMAL', giaGoc: 40000, giaHienTai: 32000 }),
    false,
    'Không tự suy luận flash sale từ chênh lệch giá',
  );
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /loaiGia === 'FLASH_SALE'/);
  assert.match(content, /Flash Sale/);
});

test('5. Guarantee: không mock, không fake shipping/discount', () => {
  const content = docComponent('gio-hang-content.tsx');
  assert.equal(content.includes('MOCK_CART'), false);
  assert.equal(content.includes('fake'), false);
  assert.equal(content.includes('Miễn phí vận chuyển'), false);
  assert.equal(content.includes('Miễn phí'), false);
  assert.match(content, /Tính ở bước thanh toán/);
  assert.match(content, /Tạm tính/);
  assert.equal(content.includes('Tổng cộng:'), false, 'Không gắn nhãn Tổng cộng cho tạm tính frontend');
});

test('6. Guarantee: không gọi checkout-preview ở trang Cart', () => {
  const content = docComponent('gio-hang-content.tsx');
  assert.equal(content.includes('checkout-preview'), false);
  assert.equal(content.includes('layCheckoutPreview'), false);
  assert.equal(content.includes('maKhuyenMai'), false, 'Voucher để cho /thanh-toan');
});

test('7. Guarantee: không lộ dữ liệu kỹ thuật ra customer UI', () => {
  const content = docComponent('gio-hang-content.tsx');
  assert.equal(content.includes('SKU '), false);
  assert.equal(content.includes('variant id'), false);
  assert.equal(content.includes('inventoryLotId'), false);
  assert.equal(content.includes('gio-hang API'), false);
});

test('8. Guarantee: stock error thân thiện + refetch', () => {
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /Số lượng sản phẩm hiện không còn đủ/);
  assert.match(content, /invalidateQueries/);
  assert.match(content, /Tạm hết hàng/);
});

test('9. Guarantee: checkout CTA đúng — disable khi không có mục hợp lệ', () => {
  assert.equal(choPhepThanhToan(MUC_MAU), true);
  const mucToanLoi = MUC_MAU.map((m) => ({
    ...m,
    bienThe: { ...m.bienThe, coTheDatHang: false, soLuongKhaDung: 0 },
  }));
  assert.equal(choPhepThanhToan(mucToanLoi), false);
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /mucHopLe\.length > 0/);
  assert.match(content, /\/thanh-toan/);
  assert.equal(content.includes('taoDonHang'), false, 'Không tạo đơn từ trang Cart');
});

test('10. Guarantee: header badge đồng bộ cùng query key', () => {
  const cart = docComponent('gio-hang-content.tsx');
  const header = docComponent('agri-header.tsx');
  const detail = docComponent('chi-tiet-san-pham-content.tsx');
  for (const [ten, content] of [
    ['gio-hang', cart],
    ['header', header],
    ['product-detail', detail],
  ]) {
    assert.match(content, /\['gio-hang-khach'\]/, `${ten}: dùng chung query key giỏ hàng`);
  }
  assert.equal(cart.includes("['cart']"), false);
});

test('11. Guarantee: breadcrumb + a11y + quy cách gói', () => {
  const content = docComponent('gio-hang-content.tsx');
  assert.match(content, /Trang chủ/);
  assert.match(content, /Giỏ hàng/);
  assert.match(content, /aria-label/);
  assert.match(content, /Xóa .* khỏi giỏ hàng/);
  assert.match(content, /hienThiGoiQuyCach/);
  assert.match(content, /hienThiTonKhaDung/);
  assert.equal(content.includes('₫/{'), false);
});

test('12. Guarantee: contract cart có giaGoc/loaiGia server-side', () => {
  const lib = docLib('api-gio-hang.ts');
  assert.match(lib, /giaGoc/);
  assert.match(lib, /loaiGia/);
  assert.match(lib, /FLASH_SALE/);
  assert.match(lib, /capNhatMucGioHang/);
  assert.match(lib, /xoaMucGioHang/);
});
