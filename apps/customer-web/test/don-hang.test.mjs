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

function docApp(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/app/${relativePath}`),
    'utf-8',
  );
}

const list = () => docComponent('danh-sach-don-hang-content.tsx');
const detail = () => docComponent('chi-tiet-don-hang-content.tsx');
const libDonHang = () => docLib('api-don-hang.ts');
const libThanhToan = () => docLib('api-thanh-toan.ts');
const libGiaoHang = () => docLib('api-giao-hang.ts');

test('1. unauthenticated state: auth-required, redirect dang-nhap, no guest history', () => {
  const l = list();
  const d = detail();
  assert.match(l, /layPhienKhachHang/);
  assert.match(l, /Cần đăng nhập/);
  assert.match(l, /\/dang-nhap\?next=\/don-hang/);
  assert.match(d, /layPhienKhachHang/);
  assert.match(d, /Cần đăng nhập/);
  assert.match(d, /\/dang-nhap\?next=\/don-hang\//);
  assert.equal(l.includes('guest'), false);
  assert.equal(d.includes('guest'), false);
  assert.equal(l.includes('localStorage'), false);
  assert.equal(d.includes('localStorage'), false);
});

test('2. empty orders: exact copy + CTA ve san-pham', () => {
  const l = list();
  assert.match(l, /Bạn chưa có đơn hàng nào/);
  assert.match(l, /Khám phá sản phẩm/);
  assert.match(l, /\/san-pham/);
  assert.match(l, /EmptyState/);
});

test('3. loading: skeleton cards', () => {
  const l = list();
  const d = detail();
  assert.match(l, /query\.isPending/);
  assert.match(l, /AgriSkeleton/);
  assert.match(d, /query\.isPending/);
  assert.match(d, /AgriSkeleton/);
});

test('4. API error: friendly message + retry, no raw stack', () => {
  const l = list();
  const d = detail();
  assert.match(l, /Không thể tải danh sách đơn hàng\./);
  assert.match(l, /Thử lại|onThuLai/);
  assert.match(l, /ErrorState/);
  assert.equal(l.includes('stackTrace'), false);
  assert.equal(l.includes('error.stack'), false);
  assert.match(d, /Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này\./);
  assert.match(d, /onThuLai/);
});

test('5. order list uses backend customer endpoint + pagination params', () => {
  const l = list();
  const lib = libDonHang();
  assert.match(lib, /layDanhSachDonHangCuaToi/);
  assert.match(lib, /bearerOptionsKhachHang/);
  assert.match(l, /layDanhSachDonHangKhach/);
  assert.match(l, /trang/);
  assert.match(l, /gioiHan/);
  assert.match(l, /queryKey.*don-hang-khach.*list/);
});

test('6. status filter: real enums only, chips + select, reset page 1', () => {
  const l = list();
  const lib = libDonHang();
  for (const s of ['CHO_THANH_TOAN', 'DA_XAC_NHAN', 'DANG_CHUAN_BI', 'DA_DONG_GOI', 'DANG_GIAO', 'DA_GIAO', 'HOAN_THANH', 'DA_HUY']) {
    assert.ok(lib.includes(s), `missing real status ${s}`);
  }
  assert.match(l, /Tất cả/);
  assert.match(l, /LUA_CHON_TRANG_THAI_DON_HANG/);
  assert.match(l, /Select/);
  assert.match(l, /setTrang\(1\)/);
  // Không hard-code enum không tồn tại
  assert.equal(lib.includes('CHO_XAC_NHAN'), false);
});

test('7. pagination: backend tong/trang/gioiHan, preserve filter', () => {
  const l = list();
  assert.match(l, /Pagination/);
  assert.match(l, /query\.data\.tong/);
  assert.match(l, /query\.data\.gioiHan/);
  assert.match(l, /queryKey.*trang.*trangThai|trangThai.*trang/);
  assert.equal(l.includes('slice('), false);
});

test('8. order card uses persisted total snapshot', () => {
  const l = list();
  assert.match(l, /order\.maDonHang/);
  assert.match(l, /order\.tongTien/);
  assert.match(l, /order\.createdAt/);
  assert.match(l, /Xem chi tiết/);
  assert.match(l, /\/don-hang\/\$\{order\.id\}/);
});

test('9. no current Product price recompute, no N+1 product fetch', () => {
  const l = list();
  const d = detail();
  assert.equal(l.includes('MOCK_ORDERS'), false);
  assert.equal(d.includes('MOCK_ORDERS'), false);
  // List không fetch product detail theo từng đơn
  assert.equal(/layChiTietSanPham|laySanPhamCongKhai/.test(l), false);
  // Detail dùng snapshot donGia/thanhTien, không tính lại
  assert.match(d, /item\.donGia/);
  assert.match(d, /item\.thanhTien/);
  assert.equal(d.includes('fetchProduct'), false);
});

test('10. order detail: breadcrumb + header maDonHang + sections', () => {
  const d = detail();
  assert.match(d, /Trang chủ/);
  assert.match(d, /Đơn hàng của tôi/);
  assert.match(d, /Breadcrumbs/);
  assert.match(d, /Đơn hàng \$\{order\.maDonHang\}/);
  assert.match(d, /Tóm tắt thanh toán/);
  assert.match(d, /Tiến trình đơn hàng/);
  assert.match(d, /Thanh toán/);
  assert.match(d, /Giao hàng/);
  const page = docApp('don-hang/[id]/page.tsx');
  assert.match(page, /ChiTietDonHangContent/);
  const listPage = docApp('don-hang/page.tsx');
  assert.match(listPage, /DanhSachDonHangContent/);
});

test('11. address snapshot: diaChiGiaoHang tu DTO, khong dung Address Book hien tai', () => {
  const d = detail();
  assert.match(d, /order\.diaChiGiaoHang/);
  assert.match(d, /tenNguoiNhan/);
  assert.match(d, /soDienThoai/);
  assert.match(d, /ĐỊA CHỈ GIAO HÀNG/);
  assert.equal(d.includes('layDanhSachDiaChi'), false);
  assert.equal(d.includes('soDiaChi'), false);
});

test('12. payment status separate from order status', () => {
  const d = detail();
  assert.match(d, /layThanhToanDonHangKhach/);
  assert.match(d, /metaTrangThaiThanhToan/);
  assert.match(d, /nhanPhuongThucThanhToan/);
  assert.match(d, /payment\.trangThai/);
  assert.match(d, /payment\.phuongThuc/);
  // Không tự suy paid từ order
  assert.equal(d.includes("trangThai: 'PAID'"), false);
  assert.equal(d.includes('markAsPaid'), false);
  // COD wording qua helper thật
  assert.match(d, /thanhToanDonHangKhachQueryKey/);
});

test('13. shipment separate: giao-hang endpoint + vanChuyen + suKien', () => {
  const d = detail();
  const g = libGiaoHang();
  assert.match(g, /layGiaoHangDonHangCuaToi/);
  assert.match(g, /bearerOptionsKhachHang/);
  assert.match(d, /layGiaoHangDonHangKhach/);
  assert.match(d, /giaoHangDonHangKhachQueryKey/);
  assert.match(d, /metaTrangThaiVanChuyen/);
  assert.match(d, /maVanDon/);
  assert.match(d, /suKien/);
  assert.match(d, /Đơn hàng chưa được bàn giao cho đơn vị vận chuyển\./);
  assert.equal(d.includes('navigator.geolocation'), false);
  assert.equal(d.includes('watchPosition'), false);
});

test('14. timeline no fake timestamp: dung tienTrinh daDat/hienTai', () => {
  const d = detail();
  assert.match(d, /order\.tienTrinh/);
  assert.match(d, /daDat/);
  assert.match(d, /hienTai/);
  assert.match(d, /Hiện tại/);
  assert.match(d, /Đã đạt/);
  assert.match(d, /Chưa tới/);
  // Không gắn thời gian giả
  assert.equal(d.includes('fake timestamp'), false);
  assert.equal(/new Date\(\).*tienTrinh|tienTrinh.*new Date/.test(d), false);
});

test('15. cancelled state: DA_HUY reflected', () => {
  const d = detail();
  const l = list();
  assert.match(d, /DA_HUY/);
  assert.match(l, /DA_HUY/);
  assert.match(d, /mauTrangThai/);
});

test('16. cancel CTA only when supported/state-valid + confirm dialog', () => {
  const d = detail();
  assert.match(d, /order\.coTheHuy/);
  assert.match(d, /Hủy đơn hàng/);
  assert.match(d, /Bạn có chắc muốn hủy đơn này\?/);
  assert.match(d, /lyDoKhongTheHuy/);
  assert.match(d, /huyDonHangKhach/);
  assert.match(d, /Giữ đơn/);
  assert.match(d, /Xác nhận hủy/);
});

test('17. cancel mutation invalidates/refetches list + detail', () => {
  const d = detail();
  assert.match(d, /huyMutation/);
  assert.match(d, /invalidateQueries\(\{ queryKey: \['don-hang-khach', 'list'\] \}\)/);
  assert.match(d, /setQueryData\(queryKey, data\)/);
  assert.equal(d.includes("setQueryData(queryKey, { ...order, trangThai: 'DA_HUY'"), false);
});

test('18. VNPay retry only if backend support: reuse order + idempotency', () => {
  const d = detail();
  const lib = libThanhToan();
  assert.match(lib, /taoThanhToanVnPayWebKhach/);
  assert.match(lib, /VNPAY_SANDBOX/);
  assert.match(d, /taoThanhToanVnPayWebKhach/);
  assert.match(d, /Thanh toán lại/);
  assert.match(d, /VNPAY_SANDBOX/);
  assert.match(d, /DANG_GIU/);
  assert.match(d, /crypto\.randomUUID/);
  assert.match(d, /donHangId !== donHangId|next\.donHangId/);
  assert.match(d, /không tạo đơn mới/);
});

test('19. complaint route integration: /khieu-nai/tao?mucDonHangId', () => {
  const d = detail();
  assert.match(d, /\/khieu-nai\/tao\?mucDonHangId=/);
  assert.match(d, /Yêu cầu hỗ trợ/);
  assert.match(d, /DanhGiaMucDonHang/);
});

test('20. no MOCK_ORDERS, no localStorage history', () => {
  const l = list();
  const d = detail();
  const lib = libDonHang();
  for (const src of [l, d, lib]) {
    assert.equal(src.includes('MOCK_ORDERS'), false);
    assert.equal(src.includes('MOCK_ORDER'), false);
    assert.equal(src.includes('localStorage'), false);
    assert.equal(src.includes('FAKE_ORDER'), false);
  }
});

test('21. no internal UUID display: chi hien maDonHang/maDon, id chi trong href/key', () => {
  const l = list();
  const d = detail();
  assert.match(l, /order\.maDonHang/);
  assert.match(d, /order\.maDonHang/);
  assert.match(d, /suborder\.maDon/);
  // id không được render thành text hiển thị
  assert.equal(/>\{order\.id\}</.test(l), false);
  assert.equal(/>\{item\.id\}</.test(d), false);
  assert.equal(/>\{suborder\.id\}</.test(d), false);
});

test('22. responsive structural guarantee: 1-col mobile, 2-col desktop', () => {
  const l = list();
  const d = detail();
  assert.match(l, /SimpleGrid/);
  assert.match(l, /cols=\{\{ base: 1/);
  assert.match(d, /SimpleGrid/);
  assert.match(d, /cols=\{\{ base: 1, lg: 2 \}\}/);
  assert.match(d, /wrap=\{?"?wrap"?\}?|wrap="wrap"/);
});
