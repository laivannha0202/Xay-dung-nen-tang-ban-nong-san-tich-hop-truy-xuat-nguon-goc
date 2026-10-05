'use strict';

/**
 * Rà soát lẗi Mobile (vòng audit) Ẕ QR scanner, trùng entry point, lẗi CTA
 * hết hàng, mã ẑơn hàng, reservation COD/VNPay, text kỹ thuật l" ra khách,
 * mã public không mang SEED/DEMO, GPS và state enum thô.
 *
 * Targeted source-contract tests (node:test, không cần native runtime).
 * File này ch0 BẔ SUNG, không sửa/xoá assertion của các file test cũ.
 */

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

const HOME = 'apps/mobile/src/app/(tabs)/index.tsx';
const TABS = 'apps/mobile/src/app/(tabs)/_layout.tsx';
const QUET_QR = 'apps/mobile/src/app/(tabs)/quet-qr.tsx';
const TRUY_XUAT = 'apps/mobile/src/app/truy-xuat/[ma].tsx';
const CHI_TIET_SAN_PHAM = 'apps/mobile/src/app/san-pham/[id].tsx';
const CHI_TIET_DON_HANG = 'apps/mobile/src/app/don-hang/[id].tsx';
const DANH_SACH_DON_HANG = 'apps/mobile/src/app/(tabs)/don-hang.tsx';
const KET_QUA_THANH_TOAN = 'apps/mobile/src/app/thanh-toan/ket-qua.tsx';
const TRANG_TRAI = 'apps/mobile/src/app/trang-trai/[id].tsx';
const API_ERROR = 'apps/mobile/src/lib/api-error.ts';
const DOMAIN_UI = 'packages/api-client/src/domain-ui.ts';
const DON_HANG_SERVICE = 'apps/api/src/modules/don-hang/don-hang.service.ts';
const SEED = 'apps/api/scripts/seed-data.ts';

/**
 * Bỏ comment (block + line) ẑể ch0 assert phần CODE THẀT render/trả ra API.
 */
function boComment(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/)/.test(l))
    .join('\n');
}

// ---------- A. QR scanner ----------

test('QR scanner mặc ẑ9nh camera SAU, không dùng selfie ẑể quét tem', () => {
  const qr = read(QUET_QR);
  assert.equal(/facing="back"/.test(qr), true, 'CameraView phải dùng facing="back"');
  assert.equal(
    /facing="front"/.test(qr),
    false,
    'Không ẑược dùng camera trư:c ẑể quét tem sản phẩm',
  );
});

test('QR scanner xin quyền ẑúng flow, từ chẑi quyền thì không crash và vẫn nhập tay ẑược', () => {
  const qr = read(QUET_QR);
  assert.equal(qr.includes('useCameraPermissions'), true);
  assert.equal(qr.includes('Đang kiểm tra quyền camera'), true, 'Có trạng thái loading quyền');
  assert.equal(qr.includes('Cần quyền camera'), true, 'Có trạng thái chưa ẑược cấp quyền');
  assert.equal(qr.includes('requestPermission()'), true, 'Có nút xin lại quyền');
  // Từ chẑi vĩnh vi&n -> có lẑi ra: mx cài ẑặt + nhập mã thủ công.
  assert.equal(qr.includes('Linking.openSettings'), true, 'Có lẑi mx Settings khi không xin lại ẑược');
  assert.equal(qr.includes('Nhập mã truy xuất'), true, 'Vẫn nhập mã ẑược khi thiếu camera');
  assert.equal(qr.includes('Kiểm tra mã'), true);
});

test('QR scanner KHẔNG tự mx URL ẑọc ẑược từ QR, không hardcode kết quả quét', () => {
  const qr = read(QUET_QR);
  // Link duy nhất ẑược mx ra ngoài là Settings của h! ẑẑi tác.
  const openURLs = [...qr.matchAll(/Linking\.openURL\(([^)]*)\)/g)].map((m) => m[1]);
  assert.deepEqual(
    openURLs,
    [],
    `QR không ẑược mx URL ngoài; ch0 dùng Linking.openSettings() (thấy: ${openURLs.join(', ')})`,
  );
  assert.equal(qr.includes('Linking.openSettings()'), true);
  // Kết quả quét luôn ẑi qua màn trace gọi API, không có dữ li!u quét giả.
  assert.equal(qr.includes('/truy-xuat/[ma]'), true);
});

test('QR scanner ch0 hi!n/bật ẑược flash khi camera thực sự chạy', () => {
  const qr = read(QUET_QR);
  assert.equal(qr.includes('coTheDungDen'), true, 'Flash phải gated theo camera');
  assert.equal(/const coTheDungDen = cameraHoatDong/.test(qr), true);
  assert.equal(
    /disabled=\{!coTheDungDen\}/.test(qr),
    true,
    'Nút flash phải disable khi camera chưa chạy',
  );
});

test('QR scanner có nhập tay + chọn ảnh QR từ thư vi!n (ẑọc bằng chính expo-camera)', () => {
  const qr = read(QUET_QR);
  assert.equal(qr.includes('launchImageLibraryAsync'), true, 'Có chọn ảnh từ thư vi!n');
  assert.equal(qr.includes('scanFromURLAsync'), true, 'Đọc QR bằng expo-camera, không thêm thư vi!n QR');
  assert.equal(qr.includes('requestMediaLibraryPermissionsAsync'), true, 'Xin quyền thư vi!n ảnh');
  assert.equal(qr.includes('loiAnhThuVien'), true, 'Có báo lẗi rõ ràng khi ẑọc ảnh hỏng');
});

test('QR scanner KHÔNG fake lịch sử quét', () => {
  const qr = read(QUET_QR);
  assert.equal(
    /Lịch sử quét/i.test(qr),
    true,
    'Phải nói rõ vắng lịch sử quét vì Backend chưa có API (không bịa dữ liệu)',
  );
});

// ---------- B. Không trùng entry point QR ----------

test('Trang chủ KHẔNG còn nút QR cạnh ô tìm kiếm (bottom tab giữ entry point)', () => {
  const home = read(HOME);
  assert.equal(
    /accessibilityLabel="Quét QR truy xuất"/.test(home),
    false,
    'Không ẑược ẑể nút QR trùng v:i bottom tab "Quét QR"',
  );
  assert.equal(home.includes("router.push('/quet-qr')"), false);
  // Ẕ search vẫn còn và chiếm toàn b" bề ngang (không còn flex-1 cạnh nút).
  assert.equal(home.includes('Tìm nông sản, trang trại...'), true);
});

test('Bottom tab giữ nguyên 5 entry point, Quét QR x giữa', () => {
  const tabs = read(TABS);
  for (const [ten, label] of [
    ['index', 'Trang chủ'],
    ['kham-pha', 'Sản phẩm'],
    ['quet-qr', 'Quét QR'],
    ['don-hang', 'Đơn hàng'],
    ['tai-khoan', 'Tài khoản'],
  ]) {
    assert.equal(tabs.includes(`name="${ten}"`), true, `Thiếu tab ${ten}`);
    assert.equal(tabs.includes(`title: '${label}'`), true, `Thiếu label ${label}`);
  }
});

// ---------- D/E. Kết quả truy xuất + text kỹ thuật ----------

test('Màn truy xuất map enum lô/kiểm ẑ9nh/sự ki!n sang tiếng Vi!t', () => {
  const trace = read(TRUY_XUAT);
  for (const helper of [
    'metaTrangThaiLoSanPham',
    'metaKetQuaKiemDinh',
    'metaLoaiSuKienCanhTac',
    'metaLoaiSuKienTruyXuat',
  ]) {
    assert.equal(trace.includes(helper), true, `Thiếu ${helper}`);
  }
  // Không render enum thô của lô nữa.
  assert.equal(
    /\{item\.lo\.trangThai\}/.test(trace),
    false,
    'Không ẑược in raw enum trạng thái lô cho khách',
  );
  assert.equal(/\{event\.ketQua\}/.test(trace), false, 'Không in raw kết quả kiểm ẑ9nh');
  assert.equal(/tieuDe: event\.loaiSuKien,/.test(trace), false, 'Không in raw loại sự ki!n canh tác');
  assert.equal(/tieuDe: event\.loai,/.test(trace), false, 'Không in raw loại sự ki!n truy xuất');
});

test('Màn truy xuất cảnh báo lô chưa sẵn sàng theo trạng thái thật từ API', () => {
  const trace = read(TRUY_XUAT);
  assert.equal(trace.includes('CHU_GIAI_TRANG_THAI_LO'), true);
  for (const state of ['MOI_TAO', 'CHO_KIEM_DINH', 'KHONG_DAT', 'HET_HAN']) {
    assert.equal(
      new RegExp(`${state}:`).test(trace),
      true,
      `Thiếu di&n giải cho trạng thái lô ${state}`,
    );
  }
  // Không b9a trường Backend không có (sẑ lượt quét, quét bất thường).
  assert.equal(/soLuotQuet/i.test(trace), false, 'Backend chưa có sẑ lượt quét Ẕ không ẑược b9a');
});

test('Lẗi hủy ẑơn không còn l" enum/từ ngữ n"i b" ra khách', () => {
  const svc = read(DON_HANG_SERVICE);
  // Bỏ comment Ẕ ch0 assert phần code thật ẑược trả ra API.
  const code = boComment(svc);
  assert.equal(
    /phải được xử lý theo payment\/refund lifecycle/.test(code),
    false,
    'Không được trả "payment/refund lifecycle" cho UI khách',
  );
  assert.equal(
    /không thể release trong cancel action PHIEN-060/.test(code),
    false,
    'Không được trả câu có "PHIEN-060" cho UI khách',
  );
  assert.equal(
    /thiếu inventory reservation/i.test(code),
    false,
    'Không được dùng jargon "inventory reservation" cho khách',
  );
  assert.equal(
    svc.includes('Đơn hàng đang có giao dịch thanh toán chưa hoàn tất.'),
    true,
    'Phải có thông điệp tiếng Việt thay thế',
  );
});

test('Mobile có lư:i an toàn chặn text kỹ thuật từ backend', () => {
  const err = read(API_ERROR);
  assert.equal(err.includes('coDauVetKyThuat'), true, 'Phải có b" dò dấu vết kỹ thuật');
  assert.equal(err.includes('lifecycle'), true);
  assert.equal(err.includes('thongBaoLyDoKhongTheHuy'), true, 'Phải map lý do hủy ẑơn');
  // Không nuẑt lẗi: vẫn trả thông ẑi!p, ch0 ẑ"i l:p vỏ.
  assert.equal(err.includes('export function chuanHoaLoiApi'), true);
});

// ---------- [runtime] Chạy THẀT chuanHoaLoiApi (.ts ẑược transpile rẓi require) ----------

function loadTsModule(relativePath) {
  const filename = path.resolve(repoRoot, relativePath);
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
  const loaded = new Module(filename, module, undefined);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

const { chuanHoaLoiApi, thongBaoLyDoKhongTheHuy } = loadTsModule(
  'apps/mobile/src/lib/api-error.ts',
);

test('[runtime] message kỹ thuật của backend KHẔNG lọt lên UI khách', () => {
  const loi = chuanHoaLoiApi({
    status: 409,
    data: {
      message: 'Payment PENDING phải ẑược xử lý theo payment/refund lifecycle trư:c khi hủy ẑơn.',
    },
  });
  assert.equal(loi.loai, 'conflict', 'Vẫn giữ domain error (HTTP 409)');
  assert.equal(loi.status, 409);
  assert.equal(/lifecycle/i.test(loi.thongDiep), false, 'Không l" "lifecycle"');
  assert.equal(/\bPENDING\b/.test(loi.thongDiep), false, 'Không l" enum PENDING');
  assert.ok(loi.thongDiep.length > 0, 'Vẫn phải có thông ẑi!p cho khách (không nuẑt lẗi)');
  // Không nuẑt lẗi: message gẑc vẫn còn ẑể log/debug.
  assert.equal(loi.thongDiepBackend.length > 0, true);
});

test('[runtime] message nghi!p vụ tiếng Vi!t ẑược giữ nguyên', () => {
  const loi = chuanHoaLoiApi({
    status: 409,
    data: { message: 'Giỏ hàng ẑã thay ẑ"i so v:i dữ li!u tạo ẑơn.' },
  });
  assert.equal(loi.thongDiep, 'Giỏ hàng ẑã thay ẑ"i so v:i dữ li!u tạo ẑơn.');
});

test('[runtime] lẗi mạng / 5xx không dùng message kỹ thuật', () => {
  const loiMang = chuanHoaLoiApi(new TypeError('Network request failed'));
  assert.equal(loiMang.loai, 'network');

  const loiServer = chuanHoaLoiApi({
    status: 500,
    data: { message: 'DAT_CHO_TON_KHO invariant violated' },
  });
  assert.equal(loiServer.thongDiep, 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
});

test('[runtime] lyDoKhongTheHuy: giữ câu tiếng Vi!t, chặn câu kỹ thuật', () => {
  assert.equal(
    thongBaoLyDoKhongTheHuy('Đơn hàng ẑã bắt ẑầu chuẩn b9 hoặc giao nên không thể hủy x bư:c này.'),
    'Đơn hàng ẑã bắt ẑầu chuẩn b9 hoặc giao nên không thể hủy x bư:c này.',
  );
  const kyThuat = thongBaoLyDoKhongTheHuy(
    'Inventory reservation DA_XAC_NHAN không thể release trong cancel action PHIEN-060.',
  );
  assert.equal(/DA_XAC_NHAN|PHIEN-060|reservation/.test(kyThuat), false);
  assert.ok(kyThuat.includes('hỗ trợ'));
});

// ---------- F. COD + reservation countdown ----------

test('Countdown "giữ tẓn ẑến ..." ch0 hi!n khi reservation còn hạn giữ thật', () => {
  const src = read(CHI_TIET_DON_HANG);
  assert.equal(src.includes('reservationConHanGia'), true, 'Phải gate theo trạng thái reservation');
  assert.equal(
    /reservationConHanGia\(paymentQuery\.data\.datCho\.trangThai\)\s*\n?\s*\?\s*`Đến /.test(src),
    true,
    'Mẑc "Đến ..." ch0 ẑược render khi reservationConHanGia() = true',
  );
  // Đơn COD/VNPay ẑã commit (DA_XAC_NHAN) không ẑược hi!n mẑc hết hạn.
  assert.equal(src.includes('Tình trạng hàng trong đơn'), true);
});

test('Domain UI ẑủ nhãn cho reservation ẑã commit (tránh l" DA_XAC_NHAN)', () => {
  const dom = read(DOMAIN_UI);
  for (const state of ['DANG_GIU', 'DA_XAC_NHAN', 'DA_BAN', 'DA_GIAI_PHONG', 'HET_HAN']) {
    assert.equal(
      new RegExp(`${state}: \\{ label:`).test(dom),
      true,
      `Thiếu nhãn tiếng Vi!t cho ${state}`,
    );
  }
  assert.equal(/export function reservationConHanGia/.test(dom), true);
});

test('Order detail hi!n phương thức thanh toán bằng nhãn tiếng Vi!t', () => {
  const src = read(CHI_TIET_DON_HANG);
  assert.equal(src.includes('nhanPhuongThucThanhToan'), true);
  assert.equal(
    /\{paymentQuery\.data\.phuongThuc\}/.test(src),
    false,
    'Không in raw phuongThuc (VDNPAY_SANDBOX) cho khách',
  );
});

// ---------- H. Mã ẑơn hàng quá dài ----------

test('Mã ẑơn hiển th9 rút gọn, mã ẑầy ẑủ vẫn giữ cho copy/tra cứu', () => {
  for (const file of [CHI_TIET_DON_HANG, DANH_SACH_DON_HANG, KET_QUA_THANH_TOAN]) {
    const src = read(file);
    assert.equal(src.includes('maDonHangHienThi'), true, `${file} phải dùng helper rút gọn`);
  }
  const detail = read(CHI_TIET_DON_HANG);
  assert.equal(
    detail.includes('Mã đầy đủ: {order.maDonHang}'),
    true,
    'Phải còn mã đầy đủ (selectable/copy) bên cạnh mã rút gọn',
  );
  // Không tự sinh mã thay thế (tránh trùng) và không cắt cụt kiểu mù.
  const dom = read(DOMAIN_UI);
  assert.equal(/export function maDonHangHienThi/.test(dom), true);
  assert.equal(dom.includes('THAY THE MA'), false);
});

test('Helper rút gọn mã ẑơn giữ nguyên mã ngắn và không sinh mã m:i', () => {
  const dom = read(DOMAIN_UI);
  const than = dom.slice(dom.indexOf('export function maDonHangHienThi'));
  const body = than.slice(0, than.indexOf('\n}'));
  // Trả về chính chuẗi gẑc (upper-case) khi ngắn Ẕ không sinh ID m:i.
  assert.equal(/if \(ma\.length <= 24\) return ma;/.test(body), true);
  // Rút gọn chỉ để hiển thị: có dấu "…" để khách biết đã bị cắt.
  assert.equal(body.includes('…'), true);
});

// ---------- I. CTA hết hàng trùng nhau ----------

test('Hết hàng ch0 hi!n MT trạng thái, không có 2 nút "Tạm hết hàng"', () => {
  const src = read(CHI_TIET_SAN_PHAM);
  // Bỏ comment Ẕ ch0 assert n"i dung render thật.
  const code = boComment(src);
  assert.equal(
    (code.match(/Tạm hết hàng/g) || []).length,
    1,
    'Chuẗi "Tạm hết hàng" ch0 ẑược render ẑúng 1 lần trong CTA',
  );
  assert.equal(src.includes('coTheDatHang ? ('), true, 'CTA phải rẽ nhánh có hàng / hết hàng');
  // Có hàng thì vẫn giữ 2 CTA khác nhau.
  assert.equal(code.includes('Thêm vào giỏ'), true);
  assert.equal(code.includes('Mua ngay'), true);
  // Không ẑ"i trạng thái tẓn kho x client.
  assert.equal(
    /setSoLuongKhaDung|soLuongKhaDung:\s*\d/.test(src),
    false,
    'Không ẑược ghi ẑè tẓn kho x client',
  );
});

// ---------- J. GPS / trang trại ----------

test('Trang trại ưu tiên "Xem trên bản ẑẓ", toạ ẑ" thô ch0 là chi tiết phụ', () => {
  const src = read(TRANG_TRAI);
  assert.equal(src.includes('Xem trên bản đồ'), true);
  assert.equal(src.includes('duongDanBanDo'), true);
  // Link bản ẑẓ dựng từ toạ ẑ" THẀT của API, không hardcode tọa ẑ".
  assert.equal(
    /duongDanBanDo\(viDo: number, kinhDo: number\)/.test(src),
    true,
    'Link bản ẑẓ phải nhận toạ ẑ" từ dữ li!u, không hardcode',
  );
  assert.equal(
    /duongDanBanDo\(\s*['"]\d/.test(src),
    false,
    'Không ẑược hardcode tọa ẑ" trong link bản ẑẓ',
  );
  assert.equal(
    /label="Vĩ độ"/.test(src),
    false,
    'Không còn hai dòng "Vĩ độ"/"Kinh độ" như nội dung chính',
  );
  // Không hi!n nút bản ẑẓ khi thiếu toạ ẑ" (không dựng link giả).
  assert.equal(src.includes('Trang trại chưa cập nhật GPS'), true);
});

test('Trang trại hi!n mùa vụ bằng nhãn tiếng Vi!t, không l" enum', () => {
  const src = read(TRANG_TRAI);
  assert.equal(src.includes('metaTrangThaiMuaVu'), true);
  assert.equal(
    /\{item\.trangThai\}/.test(src),
    false,
    'Không in raw trạng thái mùa vụ (KE_HOACH/DANG_CANH_TAC...) cho khách',
  );
});

test('Tab trang trại cu"n ngang, touch target và cỡ chữ ẑủ', () => {
  const src = read(TRANG_TRAI);
  const block = src.slice(src.indexOf('FARM_TABS.map'));
  assert.equal(block.includes('min-h-[44px]'), true, 'Touch target tab tẑi thiểu 44px');
  assert.equal(block.includes('text-[14px]'), true, 'Cỡ chữ tab không ẑược quá nhỏ');
});

// ---------- K. Delivery time slot ----------

test('Không tạo dropdown khung giờ giao giả khi Backend chưa hẗ trợ', () => {
  const checkout = read('apps/mobile/src/app/thanh-toan.tsx');
  const fake = /(khungGioGiao|deliverySlot|timeSlot|slotGiaoHang|khung giờ giao)/i.test(checkout);
  assert.equal(fake, false, 'Backend chưa có API khung giờ giao Ẕ không ẑược tạo UI giả');
});

// ---------- G. Mã public không SEED/DEMO ----------

test('Seed không còn SEED/DEMO trong mã công khai tạo m:i', () => {
  const seed = read(SEED);
  for (const ma of [
    'NCC-AGRIMARKET-01',
    'TT-MINH-BACH-01',
    'TT-AN-PHU-01',
    'TT-PHU-NONG-01',
    'TT-SONG-HONG-01',
    'VGP-MINHBACH-2026-01',
    'HC-ANPHU-2026-01',
    'VGP-PHUNONG-2026-01',
    'ATSH-SONGHONG-2026-01',
  ]) {
    assert.equal(seed.includes(`'${ma}'`), true, `Thiếu mã nghi!p vụ ${ma}`);
  }
  // Mã cũ ch0 còn trong khai báo *Cu/*_CU + hàm maLoCu() ẑể ẑ"i tên cho DB
  // ẑã seed bằng b" cũ.
  const dong = seed
    .split('\n')
    .filter((line) => /SEED|DEMO/.test(line))
    .filter((line) => !/^\s*(\/\*|\*|\/\/)/.test(line))
    .filter((line) => !/(maCu:|CodeCu:|MA_CU\b|_CU\b|function maLoCu|KHO-SEED-|LO-SEED-\$\{)/.test(line))
    .filter((line) => !/(DEMO_[A-Z_]+|_DEMO\b)/.test(line))
    .filter((line) => !/console\.(log|error|warn)\(/.test(line));
  assert.deepEqual(dong, [], `Còn SEED/DEMO ngoài mã cũ:\n${dong.join('\n')}`);
});

test('Seed ẑ"i tên mã cũ tại chẗ, không ẑụng khoá chính id', () => {
  const seed = read(SEED);
  assert.equal(seed.includes('chuyenMaCongKhaiCu'), true);
  const fn = seed.slice(seed.indexOf('async function chuyenMaCongKhaiCu'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  for (const model of [
    'nhaCungCap',
    'trangTrai',
    'chungNhan',
    'loSanPham',
    'donHang',
    'donHangNhaCungCap',
    'giaoDichThanhToan',
    'vanChuyen',
    'giaoDichLoyalty',
    'datChoTonKho',
  ]) {
    assert.equal(body.includes(`prisma.${model}.updateMany`), true, `Thiếu ẑ"i mã cho ${model}`);
  }
  // Ch0 update c"t mã, tuy!t ẑẑi không sửa id.
  assert.equal(body.includes('id:'), false, 'Không ẑược ẑụng khoá chính id khi ẑ"i mã hiển th9');
});

test('Seed ẑ"i mã an toàn khi DB half-migrated (mã ẑích ẑã có thì bỏ qua, không crash)', () => {
  const seed = read(SEED);

  // Mọi c"t mã ẑ"i tên ẑều là @unique trong schema.prisma. DB half-migrated
  // (ẑã có cả bản ghi mã cũ và mã m:i) sẽ làm updateMany vi phạm unique và
  // seed chết vô nghĩa Ẕ nên mọi lần ẑ"i tên phải qua c"ng kiểm tra trư:c.
  assert.match(seed, /async function doiMaKhiChuaCoMaDich\(/);
  assert.match(seed, /\(await soBanGhiCoMaMoi\) > 0/);
  assert.match(seed, /half-migrated/);

  const fn = seed.slice(seed.indexOf('async function chuyenMaCongKhaiCu'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  const soLanDoiMa = (body.match(/\.updateMany\(\{/g) ?? []).length;
  const soLanQuaCong = (body.match(/await doiMaKhiChuaCoMaDich\(/g) ?? []).length;

  assert.ok(soLanDoiMa >= 11, `phải còn ẑủ l!nh ẑ"i mã (thấy ${soLanDoiMa}, cần >= 11)`);
  assert.equal(
    soLanDoiMa,
    soLanQuaCong,
    'mẗi lần ẑ"i mã phải ẑi qua doiMaKhiChuaCoMaDich Ẕ không ẑược updateMany trần',
  );
});

// ---------- III. Giữ nguyên phần ẑang ẑúng ----------

test('VNPay deep link vẫn hỏi lại Backend, không tin query client', () => {
  const src = read(KET_QUA_THANH_TOAN);
  assert.equal(src.includes('refetchOnMount'), true);
  assert.equal(src.includes('staleTime: 0'), true, 'Phải hỏi lại server mẗi lần vào màn kết quả');
  assert.equal(
    /layThanhToanDonHangMobile\(donHangId\)/.test(src),
    true,
    'Trạng thái phải lấy từ API, không ẑọc từ query/deep-link',
  );
});

test('Chưa có vận đơn vẫn hiện "Chưa có vận đơn", không bịa tracking', () => {
  const src = read(CHI_TIET_DON_HANG);
  assert.equal(src.includes('Chưa có vận đơn'), true);
  assert.equal(
    /maVanDon:\s*['"][A-Z0-9-]{3,}['"]/.test(src),
    false,
    'Không ẑược hardcode mã vận ẑơn giả',
  );
});
