'use strict';

/**
 * Sprint: Mobile Customer Commerce — Product List / Detail / Cart / Trace.
 * Targeted source-contract tests (node:test, no native runtime needed).
 * Không xóa test cũ; file này chỉ assert các rule mới của sprint.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const KHAM_PHA = 'apps/mobile/src/app/(tabs)/kham-pha.tsx';
const HOME = 'apps/mobile/src/app/(tabs)/index.tsx';
const CHI_TIET = 'apps/mobile/src/app/san-pham/[id].tsx';
const GIO_HANG = 'apps/mobile/src/app/gio-hang.tsx';
const TRACE = 'apps/mobile/src/app/truy-xuat/[ma].tsx';
const QUET_QR = 'apps/mobile/src/app/(tabs)/quet-qr.tsx';
const PRODUCT_CARD = 'apps/mobile/src/components/design-system/product-card.tsx';

// ---------- Product List ----------

test('Product List dùng endpoint Product Public thật với đúng contract query', () => {
  const src = read(KHAM_PHA);
  assert.equal(src.includes('useLayDanhSachSanPhamCongKhai'), true);
  assert.equal(src.includes('useLayFacetsSanPhamCongKhai'), true);
  for (const param of [
    'timKiem',
    'danhMuc',
    'trangTraiId',
    'tinhThanh',
    'chungNhan',
    'giaTu',
    'giaDen',
    'khaDung',
    'sapXep',
  ]) {
    assert.equal(src.includes(param), true, `Thiếu query param: ${param}`);
  }
  // Search submit reset page về 1, không filter local toàn dataset.
  assert.equal(src.includes('setTrang(1)'), true);
});

test('Product List không gắn badge chứng nhận giả', () => {
  const src = read(KHAM_PHA);
  assert.equal(
    src.includes('item.chungNhan[0]?.loai ?? item.danhMuc.ten'),
    false,
    'Không được fallback badge = tên danh mục khi thiếu chứng nhận',
  );
  assert.equal(src.includes("|| 'VietGAP'"), false);
  assert.equal(src.includes("'VietGAP'"), false);
  // Chỉ render badge khi API có chứng nhận thật: map trực tiếp mảng chungNhan
  // từ API (mảng rỗng => không badge), không fallback danh mục/VietGAP.
  // (T1-product-list: thay guard cũ `item.chungNhan.length > 0` bằng map full
  // list để card hiện tối đa 2 badge + `+N` như web.)
  assert.equal(src.includes('item.chungNhan'), true);
  assert.equal(src.includes('.map((c)'), true);
});

test('Product List có skeleton, empty và error state thật', () => {
  const src = read(KHAM_PHA);
  assert.equal(src.includes('ProductCardSkeleton'), true);
  assert.equal(src.includes('Không tìm thấy nông sản'), true);
  assert.equal(src.includes('Không tải được danh sách sản phẩm'), true);
  assert.equal(src.includes('Thử lại'), true);
  // Không render mock fallback khi API lỗi.
  assert.equal(/mock|fallback/i.test(src), false);
});

test('Homepage không default VietGAP cho sản phẩm API thật', () => {
  const src = read(HOME);
  assert.equal(src.includes("|| 'VietGAP'"), false);
  assert.equal(src.includes("'VietGAP'"), false);
  assert.equal(src.includes('FEATURED_PRODUCTS_FALLBACK'), false);
  // Badge nổi bật chỉ từ chungNhan API thật.
  assert.equal(src.includes('item.chungNhan[0]?.loai ?? null'), true);
});

test('Homepage Flash Sale dùng API server-authoritative', () => {
  const src = read(HOME);
  assert.equal(src.includes('useLayFlashSaleCongKhaiActive'), true);
  assert.equal(src.includes('flash-sale-cong-khai/active') || src.includes('flashSaleMuc'), true);
  // Giá/discount/tồn đều từ server fields.
  assert.equal(src.includes('muc.giaFlash'), true);
  assert.equal(src.includes('muc.giaGoc'), true);
  assert.equal(src.includes('muc.phanTramGiam'), true);
  assert.equal(src.includes('muc.soLuongKhaDung'), true);
  assert.equal(src.includes('muc.bienTheSanPhamId'), true);
  assert.equal(src.includes('muc.sanPhamId'), true);
  // Tuyệt đối không tự tính discount.
  assert.equal(src.includes('discountVal'), false);
  assert.equal(src.includes('giaCu'), false);
  assert.equal(src.includes('FLASH_SALE_ITEMS'), false);
  // Không chiến dịch → ẩn section; lỗi → retry, không fake.
  assert.equal(src.includes('flashSaleMuc.length === 0 ? null'), true);
  assert.equal(src.includes('flashSaleQuery.isError'), true);
  assert.equal(src.includes('flashSaleQuery.isPending'), true);
});

test('Homepage không dùng fixture tĩnh làm catalog khi API thiếu data', () => {
  const src = read(HOME);
  assert.equal(src.includes('FEATURED_PRODUCTS_FALLBACK'), false);
  assert.equal(src.includes('FLASH_SALE_ITEMS'), false);
  assert.equal(src.includes('FEATURED_FARMS'), false);
  // Nổi bật: loading → skeleton, lỗi → retry, rỗng → empty.
  assert.equal(src.includes('Không tải được sản phẩm nổi bật'), true);
  assert.equal(src.includes('Chưa có sản phẩm nổi bật'), true);
  // Trang trại tiêu biểu từ API thật; rỗng/lỗi → ẩn section.
  assert.equal(src.includes('useLayDanhSachTrangTraiCongKhai'), true);
  assert.equal(src.includes('noiBat: true'), true);
});

test('Sort map đúng backend enum, không show enum thô', () => {
  const filter = read('apps/mobile/src/components/search-filter/filter-bottom-sheet.tsx');
  for (const e of ['PHU_HOP', 'MOI_NHAT', 'GIA_TANG', 'GIA_GIAM', 'TEN_AZ', 'TEN_ZA']) {
    assert.equal(filter.includes(e), true, `Thiếu enum sort: ${e}`);
  }
  for (const label of [
    'Phù hợp nhất',
    'Mới nhất',
    'Tên A → Z',
    'Tên Z → A',
    'Giá thấp → cao',
    'Giá cao → thấp',
  ]) {
    assert.equal(filter.includes(label), true, `Thiếu label customer-friendly: ${label}`);
  }
});

// ---------- Product Detail ----------

test('Product Detail dùng API thật: chi tiết + liên quan + đánh giá', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('useLayChiTietSanPhamCongKhai'), true);
  assert.equal(src.includes('useLaySanPhamLienQuanCongKhai'), true);
  assert.equal(src.includes('useLayDanhSachDanhGiaSanPham'), true);
  // Không fill related local.
  assert.equal(src.includes('relatedData?.data.duLieu ?? []'), true);
});

test('Product Detail hiển thị rating thật hoặc "Chưa có đánh giá"', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('Chưa có đánh giá'), true);
  assert.equal(src.includes('danhGia.diemTrungBinh'), true);
  assert.equal(src.includes('danhGia.tongLuot'), true);
  assert.equal(src.includes('4.8'), false, 'Không hard-code rating giả');
});

test('Product Detail có quantity selector min 1, gửi variantId + quantity', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('Giảm số lượng'), true);
  assert.equal(src.includes('Tăng số lượng'), true);
  assert.equal(src.includes('Math.max(1'), true);
  assert.equal(src.includes('themMucGioHangMobile'), true);
  assert.equal(src.includes('bienTheSanPhamId'), true);
  // Không gửi price authoritative.
  assert.equal(src.includes('bienTheDaChon.gia,'), false);
  assert.equal(src.includes('price:'), false);
});

test('Product Detail harvest null không fabricate, dẫn về trace', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('thuHoachGanNhatTaiTrangTrai'), true);
  assert.equal(
    src.includes('chưa gắn với lô thu hoạch cụ thể'),
    true,
    'Harvest null phải dẫn về quét mã trace theo ngôn ngữ Web',
  );
  assert.equal(src.includes('/quet-qr'), true);
});

test('Product Detail certificate chỉ từ API, không tự thêm xác minh', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('item.chungNhan.map'), true);
  assert.equal(src.includes('Đã xác minh'), false);
});

test('Product Detail trace CTA đi màn quét, không tạo QR giả', () => {
  const src = read(CHI_TIET);
  assert.equal(src.includes('Truy xuất nguồn gốc'), true);
  assert.equal(src.includes("router.push('/quet-qr')"), true);
  assert.equal(/AGM-\$\{|fake.*qr|qr.*fake/i.test(src), false);
});

// ---------- Cart ----------

test('Cart dùng Cart backend thật với effective price server', () => {
  const src = read(GIO_HANG);
  assert.equal(src.includes('layGioHangMobile'), true);
  assert.equal(src.includes('capNhatMucGioHangMobile'), true);
  assert.equal(src.includes('xoaMucGioHangMobile'), true);
  assert.equal(src.includes('giaHienTai'), true);
  // Không tự tính flash sale.
  assert.equal(src.includes('phanTramGiam'), false);
  assert.equal(src.includes('* %'), false);
});

test('Cart mixed invalid item blocks checkout (all-orderable rule)', () => {
  const src = read(GIO_HANG);
  assert.equal(src.includes('mucLoi.length === 0'), true);
  assert.equal(src.includes('choPhepThanhToan'), true);
  assert.equal(src.includes('disabled={!choPhepThanhToan}'), true);
  assert.equal(src.includes('coTheDatHang'), true);
});

test('Cart empty state đúng ngôn ngữ Web, không fake shipping', () => {
  const src = read(GIO_HANG);
  assert.equal(src.includes('Giỏ hàng của bạn đang trống'), true);
  assert.equal(src.includes('Xem sản phẩm'), true);
  assert.equal(src.includes('Tính ở bước thanh toán'), true);
  assert.equal(src.includes('Miễn phí'), false);
  assert.equal(/0đ.*ship|ship.*0đ/i.test(src), false);
});

test('Cart render giá gốc server-side khi Flash Sale hiệu lực', () => {
  const src = read(GIO_HANG);
  const type = read('apps/mobile/src/lib/api-gio-hang.ts');
  assert.equal(type.includes('giaGoc'), true);
  assert.equal(type.includes('loaiGia'), true);
  assert.equal(src.includes("loaiGia === 'FLASH_SALE'"), true);
  assert.equal(src.includes('giaGoc > muc.bienThe.giaHienTai'), true);
  assert.equal(src.includes('Flash Sale'), true);
  // Không tự tính phần trăm giảm.
  assert.equal(src.includes('phanTramGiam'), false);
});

test('Cart quantity PATCH theo API, min 1, disable khi pending', () => {
  const src = read(GIO_HANG);
  assert.equal(src.includes('capNhatSoLuong'), true);
  assert.equal(src.includes('soLuongMoi < 1'), true);
  assert.equal(src.includes('dangCapNhat'), true);
});

// ---------- Interaction / RN Web ----------

test('ProductCard không nested Pressable (RN Web sạch)', () => {
  const src = read(PRODUCT_CARD);
  assert.equal(src.includes('không lồng Pressable'), true);
  // Cấu trúc sibling: các nút là Pressable độc lập, không chứa nhau.
  const pressableOpens = (src.match(/<Pressable/g) || []).length;
  assert.equal(pressableOpens >= 4, true, 'Card phải có các action Pressable sibling');
  assert.equal(src.includes('onFavorite'), true);
  assert.equal(src.includes('onQuetQR'), true);
  assert.equal(src.includes('onAddToCart'), true);
});

test('QR entry có fallback nhập mã, trace dùng API thật', () => {
  const qr = read(QUET_QR);
  const trace = read(TRACE);
  assert.equal(qr.includes('Nhập mã truy xuất'), true);
  assert.equal(qr.includes('/truy-xuat/[ma]'), true);
  assert.equal(trace.includes('useLayTruyXuatCongKhai'), true);
  assert.equal(trace.includes('AGM-'), true);
});

test('Cart badge lấy từ Cart query thật', () => {
  const bar = read('apps/mobile/src/components/navigation/mobile-brand-bar.tsx');
  assert.equal(bar.includes('GIO_HANG_MOBILE_QUERY_KEY'), true);
  assert.equal(bar.includes('layGioHangMobile'), true);
});
