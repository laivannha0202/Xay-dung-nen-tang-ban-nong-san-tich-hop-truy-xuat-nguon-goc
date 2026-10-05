'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Customer Web, Admin Web and Mobile share the canonical AgriMarket brand', () => {
  const domainUi = read('packages/api-client/src/domain-ui.ts');
  const customerLayout = read('apps/customer-web/src/app/layout.tsx');
  const customerBrand = read('apps/customer-web/src/app/brand-sync.css');
  const adminLayout = read('apps/admin-web/src/app/layout.tsx');
  const adminBrand = read('apps/admin-web/src/app/admin-sync.css');
  const mobileTheme = read('apps/mobile/src/global.css');

  const customerBrandLower = customerBrand.toLowerCase();
  const adminBrandLower = adminBrand.toLowerCase();

  for (const marker of ['#087A4B', '#F7FAF8', '#FFFFFF', '#17251C', '#DCE7DF']) {
    assert.equal(domainUi.includes(marker), true, `Shared brand missing ${marker}`);
    assert.equal(
      customerBrandLower.includes(marker.toLowerCase()),
      true,
      `Customer Web brand missing ${marker}`,
    );
    assert.equal(
      adminBrandLower.includes(marker.toLowerCase()),
      true,
      `Admin Web brand missing ${marker}`,
    );
  }

  assert.equal(customerLayout.includes("import './brand-sync.css';"), true);
  assert.equal(
    customerLayout.indexOf("import './globals.css';") <
      customerLayout.indexOf("import './brand-sync.css';"),
    true,
    'Customer canonical layer must load after legacy globals',
  );
  assert.equal(adminLayout.includes("import './admin-sync.css';"), true);
  // Mobile dung CSS var `--primary` trong global.css lam nguon mau canonical.
  assert.equal(mobileTheme.includes('--primary: 8 122 75;'), true);
});

test('Shared shipment labels cover every canonical Backend state', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const domainUi = read('packages/api-client/src/domain-ui.ts');
  const states = [
    'CREATED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED',
  ];

  assert.equal(schema.includes('enum TrangThaiVanChuyen'), true);
  for (const state of states) {
    assert.equal(schema.includes(`  ${state}`), true, `Backend shipment state missing ${state}`);
    assert.equal(
      domainUi.includes(`${state}: { label:`),
      true,
      `Shared UI shipment label missing ${state}`,
    );
  }
});

test('Shared delivery failure reasons cover every Backend LyDoGiaoThatBai value', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const domainUi = read('packages/api-client/src/domain-ui.ts');
  const reasons = [
    'KHONG_LIEN_LAC_DUOC',
    'KHACH_HEN_LAI',
    'KHACH_TU_CHOI_NHAN',
    'SAI_DIA_CHI',
    'LY_DO_KHAC',
  ];

  assert.equal(schema.includes('enum LyDoGiaoThatBai'), true);
  for (const reason of reasons) {
    assert.equal(schema.includes(`  ${reason}`), true, `Backend failure reason missing ${reason}`);
    assert.equal(
      domainUi.includes(`${reason}: {`),
      true,
      `Shared UI failure reason missing ${reason}`,
    );
  }

  // "Không liên lạc được" chỉ ghi nhận sự kiện, KHÔNG suy diễn động cơ của khách.
  assert.equal(/cố tình/i.test(domainUi), false, 'Must not infer customer motive');
  assert.equal(domainUi.includes('metaLyDoGiaoThatBai'), true);
});

test('Customer Web and Mobile never render the raw failure-reason enum', () => {
  const customerWeb = read('apps/customer-web/src/components/chi-tiet-don-hang-content.tsx');
  const mobile = read('apps/mobile/src/app/don-hang/[id].tsx');

  for (const [ten, source] of [
    ['Customer Web', customerWeb],
    ['Mobile', mobile],
  ]) {
    assert.equal(
      source.includes('metaLyDoGiaoThatBai(suKien.lyDoGiaoThatBai).label') ||
        source.includes('metaLyDoGiaoThatBai(event.lyDoGiaoThatBai).label'),
      true,
      `${ten} must map the reason through the shared friendly label`,
    );
    assert.equal(
      /\{suKien\.lyDoGiaoThatBai\}/.test(source) || /\{event\.lyDoGiaoThatBai\}/.test(source),
      false,
      `${ten} must not print the raw enum value`,
    );
  }
});

test('Mobile image normalization maps local hosts to the configured device-reachable host', () => {
  const imageUrl = read('apps/mobile/src/lib/url-anh.ts');
  const productCard = read('apps/mobile/src/components/design-system/product-card.tsx');
  const farmCard = read('apps/mobile/src/components/design-system/farm-card.tsx');

  assert.equal(imageUrl.includes("new Set(['localhost', '127.0.0.1', '0.0.0.0'])"), true);
  assert.equal(imageUrl.includes('parsed.hostname = apiUrl.hostname'), true);
  assert.equal(
    imageUrl.includes('parsed.port ='),
    false,
    'Image normalizer must preserve MinIO/service port',
  );
  assert.equal(imageUrl.includes("replace(/\\/api\\/v1\\/?$/i, '')"), true);
  assert.equal(productCard.includes('chuanHoaUrlAnhMobile'), true);
  assert.equal(farmCard.includes('chuanHoaUrlAnhMobile'), true);
});

/**
 * P1 FINAL-AUDIT: Mobile từng tự khai 4 bảng nhãn trạng thái riêng trên màn
 * chi tiết đơn. Bảng vận chuyển chỉ phủ 4/7 trạng thái enum Backend
 * (`TrangThaiVanChuyen`) nên 6 trạng thái thật rơi vào fallback raw:
 * khách Mobile thấy "PICKED_UP"/"OUT_FOR_DELIVERY"/"DELIVERED"... trong khi
 * khách Web thấy "Đã lấy hàng"/"Đang giao hàng"/"Đã giao" cho CÙNG dữ liệu.
 *
 * Test này khoá luật: mọi nhãn + màu trạng thái nghiệp vụ phải đi qua map
 * `META_*` dùng chung của `@agrimarket/api-client`, không tự định nghĩa lại.
 */
test('Mobile order surfaces render status through the SHARED domain-ui maps, never a local table', () => {
  const donHangId = read('apps/mobile/src/app/don-hang/[id].tsx');
  const ketQua = read('apps/mobile/src/app/thanh-toan/ket-qua.tsx');

  for (const helper of [
    'variantTrangThai',
    'variantThanhToan',
    'variantDatCho',
    'nhanDatCho',
    'variantGiaoHang',
    'nhanGiaoHang',
  ]) {
    const khai = donHangId.includes(`function ${helper}(trangThai: string): BadgeVariant {`) ||
      donHangId.includes(`function ${helper}(trangThai: string): string {`);
    assert.equal(khai, true, `Thiếu helper ${helper} — cần giữ API cũ cho call-site`);
  }

  // KHÔNG được tự tạo bảng nhãn cục bộ nữa.
  assert.equal(
    /const labels:\s*Record<string, string>\s*=/.test(donHangId),
    false,
    'don-hang/[id].tsx không được tự khai bảng nhãn trạng thái cục bộ',
  );
  assert.equal(
    /const labels:\s*Record<string, string>\s*=/.test(ketQua),
    false,
    'thanh-toan/ket-qua.tsx không được tự khai bảng nhãn trạng thái cục bộ',
  );

  // Mỗi nhãn phải ỦY QUYỀN cho map dùng chung.
  for (const [ten, nhan] of [
    ['nhanGiaoHang', 'metaTrangThaiVanChuyen'],
    ['nhanDatCho', 'metaTrangThaiDatCho'],
  ]) {
    const body = donHangId.slice(donHangId.indexOf(`function ${ten}(`));
    assert.match(
      body.slice(0, body.indexOf('\n}')),
      new RegExp(`${nhan}\\(trangThai\\)\\.label`),
      `${ten} phải lấy label từ ${nhan} (nguồn sự thật chung với Web)`,
    );
  }

  assert.match(
    donHangId,
    /nhanTrangThaiThanhToanTheoPhuongThuc\(/,
    'Nhãn thanh toán phải theo phương thức (COD pending = "COD · Chưa thu tiền")',
  );
  assert.match(
    ketQua.slice(ketQua.indexOf('function nhanTrangThaiGiaoDich(')),
    /return metaTrangThaiThanhToan\(value\)\.label;/,
    'Giao dịch thanh toán dùng chung enum TrangThaiThanhToan với payment',
  );

  // Enum Backend không được lộ raw cho khách ở Mobile.
  for (const state of ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']) {
    assert.equal(
      new RegExp(`${state}:\\s*'[^']*'\\s*,`).test(donHangId),
      false,
      `Mobile tự định nghĩa nhãn cho trạng thái Backend ${state} — phải dùng map chung`,
    );
  }
  assert.equal(
    donHangId.includes("'HOAN_HANG'"),
    false,
    'HOAN_HANG không phải trạng thái Backend (enum dùng RETURNED)',
  );
});

/**
 * P2 FINAL-AUDIT: Backend `CapNhatMucGioHangDto` có `@Max(999)`. Customer Web kẹp
 * `min(999, soLuongKhaDung)` ngay ở UI; Mobile trước đây chỉ kẹp theo tồn kho
 * nên kho > 999 là Mobile gửi số vượt ngưỡng và bị Backend trả 400 — cùng dữ
 * liệu, hai bên cho hai kết quả khác nhau.
 */
test('Mobile cart quantity cap matches Web and the Backend @Max(999)', () => {
  const gioHang = read('apps/mobile/src/app/gio-hang.tsx');
  const gioHangWeb = read('apps/customer-web/src/components/gio-hang-content.tsx');
  const dto = read('apps/api/src/modules/gio-hang/dto/cap-nhat-muc-gio-hang.dto.ts');

  assert.match(dto, /@Max\(999\)/, 'Backend contract @Max(999) phải còn');
  assert.match(gioHangWeb, /Math\.min\(\s*999,/);
  assert.equal(
    (gioHang.match(/Math\.min\(999, Math\.floor\(/g) || []).length,
    2,
    'Cả capNhatSoLuong và nút "+" phải kẹp 999 như Web',
  );
  assert.equal(
    /Math\.max\(1, Math\.floor\(muc\.bienThe\.soLuongKhaDung\)\)/.test(gioHang),
    false,
    'Không được bỏ trần 999 ở Mobile',
  );
});
