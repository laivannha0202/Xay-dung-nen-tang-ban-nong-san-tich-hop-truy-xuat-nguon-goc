/**
 * DỌN DẸP TRIỆT ĐỂ FIXTURE TEST E2E / TRUE-DB LỌT VÀO DATABASE DEV.
 *
 * Vì sao cần script này
 * --------------------
 * Nhiều e2e/true-db test tạo fixture trực tiếp trong MySQL rồi chỉ `app.close()`
 * trong afterAll, khiến danh mục / sản phẩm / trang trại / nhà cung cấp / kho /
 * lô hàng / đơn hàng / voucher còn nằm lại với `trang_thai = HOAT_DONG` và bị
 * public API trả về cho khách hàng (ví dụ "San Pham AL", "Cat AL <timestamp>").
 *
 * Nguyên tắc an toàn
 * -----------------
 * 1. Từ chối chạy khi NODE_ENV/APP_ENV = production.
 * 2. Chỉ chạy trên MySQL local/dev (localhost / 127.0.0.1 / ::1).
 * 3. Mặc định DRY-RUN. Xóa thật cần `--xac-nhan` + DEV_CLEANUP_CONFIRM=YES.
 * 4. Phát hiện fixture bằng MARKER DETERMINISTIC do chính source test sinh ra
 *    (không dùng danh sách chuỗi rộng kiểu `contains "QC"`).
 * 5. Lan toả theo đồ thị quan hệ để gom ĐÚNG tập bản ghi phụ thuộc.
 * 6. Canonical demo seed được bảo vệ bằng allowlist + assertion chặn.
 * 7. Xóa theo thứ tự khóa ngoại; lỗi FK => dừng ngay (không tắt FK check).
 * 8. Idempotent: chạy lần hai = 0 thay đổi.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import * as mariadb from 'mariadb';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

// ---------------------------------------------------------------------------
// MARKER DETERMINISTIC
// ---------------------------------------------------------------------------

/**
 * "Run token" là hậu tố do source test sinh ra để đảm bảo uniqueness:
 *   - `${Date.now()}-${Math.random().toString(16).slice(2)}` -> 1790486971448-76443eadfcd2f
 *   - `randomUUID().slice(0, 8)`                             -> b219a302
 *   - `randomUUID().slice(0, 12)`                            -> b219a302f04c
 *
 * Script bám vào CẤU TRÚC run token, không bám vào tên nghiệp vụ, nên không thể
 * xoá nhầm dữ liệu hợp lệ: canonical demo seed dùng mã `TT-MINH-BACH-01`,
 * `TT-AN-PHU-01`, `TT-PHU-NONG-01`, `TT-SONG-HONG-01`, `HOME-00*`,
 * `LO-20261004-*`, `KHO-AGRIMARKET-01`, `NCC-AGRIMARKET-01`, `ORD-20261004-0001`
 * — không mã nào chứa run token. Bộ mã cũ `TT-SEED-*`/`LO-SEED-*`/
 * `AGM-DEMO-ORDER-001` vẫn nằm trong CANONICAL để DB đã seed bằng bộ mã cũ
 * không bị xoá nhầm.
 */
const RUN_TOKEN_TS = /\d{13}-[0-9a-f]{4,}/i;
const RUN_TOKEN_UUID = /(?:^|[-_])[0-9a-f]{8}(?:$|[-_])/i;
const RUN_TOKEN_UUID_DAU = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i;

function coRunToken(...giaTri: Array<string | null | undefined>): boolean {
  return giaTri.some(
    (v) => !!v && (RUN_TOKEN_TS.test(v) || RUN_TOKEN_UUID.test(v) || RUN_TOKEN_UUID_DAU.test(v)),
  );
}

/**
 * Prefix fixture đã audit từ source test. Chỉ gồm prefix mà canonical demo
 * seed KHÔNG BAO GIỜ dùng — đây là điều kiện bắt buộc để prefix ràng đan được.
 */
const PREFIX_FARM = [
  'FARM-A-P52-', 'FARM-A37-', 'FARM-B-P52-', 'FARM-BATCH-', 'FARM-BC-A-', 'FARM-BC-B-',
  'FARM-CB56-', 'FARM-CERT-', 'FARM-CHANGED-', 'FARM-CULT-', 'FARM-E40-', 'FARM-F74-',
  'FARM-F74-NCCX-', 'FARM-F74-X-', 'FARM-FEFO-', 'FARM-FS-', 'FARM-GHL-', 'FARM-HARV-',
  'FARM-I32-', 'FARM-L36-', 'FARM-P107-', 'FARM-P108-', 'FARM-P110-', 'FARM-P112-F-',
  'FARM-P112-N-', 'FARM-P114-', 'FARM-P30-', 'FARM-P30-OFF-', 'FARM-P33-A-', 'FARM-P33-B-',
  'FARM-P33-X-', 'FARM-P43-A-', 'FARM-P43-B-', 'FARM-P45-', 'FARM-P47-', 'FARM-P49-',
  'FARM-P50-', 'FARM-P51-', 'FARM-P54-', 'FARM-PT-', 'FARM-PUBLIC-', 'FARM-QR-',
  'FARM-QUALITY-', 'FARM-RECALL-', 'FARM-SEASON-', 'FARM-TK35-', 'FARM-TRACE-', 'FARM-V16-HD-',
  'FARM-V16-PK-', 'FARM-V31-', 'FARM-W73-', 'F-AL-', 'F-RC-', 'F-MX-', 'FA-', 'FB-', 'FC-',
  'FQC-', 'FREC-', 'FARM-',
];

const PREFIX_NCC = [
  'NCC-A-P52-', 'NCC-B-P52-', 'NCC-A37-', 'NCC-MX-', 'NCC-V16-HD-', 'NCC-L36-', 'NCC-GHL-',
  'NCC-E40-', 'NCC-P54-', 'NCC-P50-', 'NCC-V16-PK-', 'NCC-CMP-', 'NCC-P51-', 'NCC-AL-',
  'NCC-A-', 'NCC-B-', 'NCC-RC-', 'NCC-P108-', 'NCC-FEFO-', 'NCC-QC-', 'NCC-REC-', 'NCC-P112-',
  'NCC-P110-', 'NCC-P114-', 'NCC-',
];

const PREFIX_KHO = [
  'KHO-P52-', 'A37-A-', 'A37-X-', 'A37-B-', 'KHO-CB56-', 'KHO-BC-', 'KHO-L36-', 'KHO-GHL-', 'E40-',
  'KHO-P54-', 'KHO-P50-', 'KHO-A-V16-', 'KHO-B-V16-', 'KHO-P51-', 'KHO-AL-', 'KHO-RC-',
  'KHO-P108-', 'FEFO-A-', 'FEFO-B-', 'FEFO-X-', 'KHO-QC-', 'KHO-REC-', 'KHO-P112-', 'KHO-P114-',
  'KHO-',
];

/** Dữ liệu canonical demo seed — tuyệt đối không được chạm vào. */
const CANONICAL = {
  farmMa: [
    'TT-MINH-BACH-01',
    'TT-AN-PHU-01',
    'TT-PHU-NONG-01',
    'TT-SONG-HONG-01',
    // Bộ mã cũ của DB đã seed trước khi đổi tên: vẫn phải được bảo vệ.
    'TT-SEED-001',
    'TT-SEED-AN-PHU',
    'TT-SEED-PHU-NONG',
    'TT-SEED-SONG-HONG',
  ],
  nccMa: ['NCC-AGRIMARKET-01', 'NCC-SEED-001'],
  khoMaKho: ['KHO-AGRIMARKET-01', 'KHO-SEED-001'],
  catSlug: ['rau-cu', 'trai-cay', 'gom', 'trung', 'thit', 'thuy-san', 'dac-san'],
  loMaLo: ['LO-20261004-001', 'LO-20261004-002', 'LO-20261004-003'],
  donHangMa: ['ORD-20261004-0001', 'AGM-DEMO-ORDER-001'],
  skuPrefix: 'HOME-',
  loMaLoPrefix: 'LO-20261004-',
};

/**
 * Prefix voucher fixture đã audit (`KM-AL-`). Cột `ma` chỉ dài 80 nên mã bị
 * cắt còn `KM-AL-<13 chữ số>-` — không còn chữ hex nên run token không khớp,
 * vì vậy cần prefix riêng. Canonical demo không tạo voucher `KM-` nên an toàn.
 */
const PREFIX_KHUYEN_MAI = ['KM-AL-', 'KM-'];

/**
 * Domain email mà source test dùng cho fixture. Mọi user test đều dùng một
 * trong hai domain này; tài khoản demo dùng `@agrimarket.local` nên không bị đụng.
 */
const EMAIL_DOMAIN_TEST = ['@example.com', '@example.test'];
const HOST_LOCAL = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const KICH_THUOC_LO = 500;

// ---------------------------------------------------------------------------
// Kết nối + chốt an toàn
// ---------------------------------------------------------------------------

const databaseUrl = process.env.DATABASE_URL ?? '';
let parsedUrl: URL;
try {
  parsedUrl = new URL(databaseUrl);
} catch {
  console.error('❌ DATABASE_URL không hợp lệ hoặc chưa được đặt.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
  console.error('❌ TỪ CHỐI: môi trường production.');
  process.exit(1);
}

if (!HOST_LOCAL.has(parsedUrl.hostname)) {
  console.error(`❌ TỪ CHỐI: chỉ chạy trên MySQL local/dev. Host hiện tại: ${parsedUrl.hostname}`);
  process.exit(1);
}

const XOA_THAT = process.argv.includes('--xac-nhan') && process.env.DEV_CLEANUP_CONFIRM === 'YES';
const cfgDatabase = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || '3306'),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, '')),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  }),
});

/** Chia tập id thành lô để tránh vượt giới hạn kích thước câu truy vấn. */
function chiaLot<T>(items: T[]): T[][] {
  const lot: T[][] = [];
  for (let i = 0; i < items.length; i += KICH_THUOC_LO) {
    lot.push(items.slice(i, i + KICH_THUOC_LO));
  }
  return lot;
}

/** Chuỗi `giaTri` có bắt đầu bằng bất kỳ prefix nào trong `prefixes` hay không. */
function batDau(giaTri: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => giaTri.startsWith(prefix));
}

async function main(): Promise<void> {
  console.log('🧹 DỌN DẸP FIXTURE E2E / TRUE-DB TRONG DB DEV');
  console.log(`   Database : ${parsedUrl.pathname.replace(/^\/+/, '')} @ ${parsedUrl.hostname}`);
  console.log(`   Chế độ   : ${XOA_THAT ? 'XÓA THẬT' : 'DRY-RUN (chỉ báo cáo)'}`);
  console.log('');

  // -----------------------------------------------------------------------
  // 1. NHẬN DIỆN GỐC FIXTURE
  // -----------------------------------------------------------------------

  // 1a. Trang trại: prefix fixture HOẶC run token trong ma/ten. Bỏ qua canonical.
  const farmIds = (
    await prisma.trangTrai.findMany({ select: { id: true, ma: true, ten: true } })
  )
    .filter((r) => !CANONICAL.farmMa.includes(r.ma))
    .filter((r) => batDau(r.ma, PREFIX_FARM) || coRunToken(r.ma, r.ten))
    .map((r) => r.id);
  const farmSet = new Set(farmIds);

  // 1b. Danh mục: chạm run token trong ten HOẶC slug. Bỏ qua canonical slug.
  const catIds = (
    await prisma.danhMucSanPham.findMany({ select: { id: true, ten: true, slug: true } })
  )
    .filter((r) => !CANONICAL.catSlug.includes(r.slug))
    .filter((r) => coRunToken(r.slug, r.ten))
    .map((r) => r.id);
  const catSet = new Set(catIds);

  // 1c. Sản phẩm thuộc farm/danh mục fixture (quan hệ trực tiếp, chắc chắn fixture).
  const productIds = (
    await prisma.sanPham.findMany({ select: { id: true, trangTraiId: true, danhMucSanPhamId: true } })
  )
    .filter((r) => farmSet.has(r.trangTraiId) || catSet.has(r.danhMucSanPhamId))
    .map((r) => r.id);
  const productSet = new Set(productIds);

  // 1d. Biến thể thuộc sản phẩm fixture, hoặc SKU mang run token.
  const variantIds = (
    await prisma.bienTheSanPham.findMany({ select: { id: true, sanPhamId: true, sku: true } })
  )
    .filter(
      (r) =>
        productSet.has(r.sanPhamId) ||
        (!r.sku.startsWith(CANONICAL.skuPrefix) && coRunToken(r.sku)),
    )
    .map((r) => r.id);
  const variantSet = new Set(variantIds);

  // 1e. Nhà cung cấp: sở hữu farm fixture, hoặc prefix/run token trong ma/email.
  const farmToNcc = new Map(
    (await prisma.trangTrai.findMany({ where: { id: { in: farmIds } }, select: { id: true, nhaCungCapId: true } }))
      .map((r) => [r.id, r.nhaCungCapId]),
  );
  const nccIds = new Set<string>();
  for (const nccId of farmToNcc.values()) nccIds.add(nccId);
  for (const r of await prisma.nhaCungCap.findMany({ select: { id: true, ma: true, email: true } })) {
    if (CANONICAL.nccMa.includes(r.ma)) continue;
    if (batDau(r.ma, PREFIX_NCC) || coRunToken(r.ma, r.email) || /^N\d{2}-/.test(r.ma)) {
      nccIds.add(r.id);
    }
  }
  const nccIdList = [...nccIds];

  // 1f. Kho: prefix/run token trong ma, hoặc chứa tồn kho của biến thể fixture.
  // CHỈ giữ dòng tồn kho thuộc biến thể fixture — dòng của biến thể canonical
  // (HOME-*) là dữ liệu demo hợp lệ và tuyệt đối không được xóa.
  const lotRows = (
    await prisma.tonKhoLo.findMany({
      select: { id: true, khoId: true, loSanPhamId: true, bienTheSanPhamId: true },
    })
  ).filter((lot) => variantSet.has(lot.bienTheSanPhamId));
  const khoIds = new Set<string>();
  const loIds = new Set<string>();
  for (const lot of lotRows) {
    khoIds.add(lot.khoId);
    loIds.add(lot.loSanPhamId);
  }
  for (const r of await prisma.kho.findMany({ select: { id: true, maKho: true } })) {
    if (CANONICAL.khoMaKho.includes(r.maKho)) continue;
    if (batDau(r.maKho, PREFIX_KHO) || coRunToken(r.maKho)) khoIds.add(r.id);
  }
  for (const r of await prisma.loSanPham.findMany({ select: { id: true, maLo: true } })) {
    if (r.maLo.startsWith(CANONICAL.loMaLoPrefix)) continue;
    if (loIds.has(r.id) || coRunToken(r.maLo)) loIds.add(r.id);
  }
  const khoIdList = [...khoIds];
  const loIdList = [...loIds];

  // 1g. Mùa vụ / thu hoạch: thuộc farm fixture, hoặc cha của lô fixture.
  const loToHarvest = new Map(
    (await prisma.loSanPham.findMany({ where: { id: { in: loIdList } }, select: { id: true, thuHoachId: true } }))
      .map((r) => [r.id, r.thuHoachId]),
  );
  const harvestIds = new Set<string>(loToHarvest.values());
  const muaVuIds = new Set<string>();
  for (const mv of await prisma.muaVu.findMany({ select: { id: true, trangTraiId: true } })) {
    if (farmSet.has(mv.trangTraiId)) muaVuIds.add(mv.id);
  }
  for (const h of await prisma.thuHoach.findMany({ select: { id: true, muaVuId: true } })) {
    if (harvestIds.has(h.id)) muaVuIds.add(h.muaVuId);
  }
  for (const h of await prisma.thuHoach.findMany({ select: { id: true, muaVuId: true } })) {
    if (muaVuIds.has(h.muaVuId)) harvestIds.add(h.id);
  }
  const muaVuIdList = [...muaVuIds];
  const harvestIdList = [...harvestIds];

  // 1h. Người dùng / khách hàng test.
  //
  // CHỈ nhận diện qua email domain test do source test tạo ra. Không suy đoán từ
  // mã khách hàng: mã demo `KH-20260101-DEMO01` có segment 8 chữ số trùng với
  // dạng `randomUUID().slice(0,8)` nên regex run-token sẽ bắt nhầm.
  const khachHangRows = await prisma.khachHang.findMany({
    select: { id: true, nguoiDungId: true, maKhachHang: true },
  });
  const userIds = new Set<string>();
  for (const u of await prisma.nguoiDung.findMany({ select: { id: true, email: true } })) {
    if (EMAIL_DOMAIN_TEST.some((domain) => u.email.endsWith(domain))) userIds.add(u.id);
  }
  const userIdList = [...userIds];

  const customerIds = khachHangRows
    .filter((k) => userIds.has(k.nguoiDungId) || k.maKhachHang.startsWith('KH-TEST-'))
    .map((k) => k.id);
  const customerSet = new Set(customerIds);
  // Khách hàng fixture nhưng không dùng user test vẫn phải dọn cùng đơn của nó.
  for (const id of customerIds) {
    for (const k of khachHangRows) {
      if (k.id === id) userIds.add(k.nguoiDungId);
    }
  }

  // 1i. Đơn hàng: thuộc khách fixture, HOẶC mang run token trong ma.
  const orderIds = (
    await prisma.donHang.findMany({ select: { id: true, maDonHang: true, khachHangId: true } })
  )
    .filter(
      (r) =>
        !CANONICAL.donHangMa.includes(r.maDonHang) &&
        (customerSet.has(r.khachHangId) || coRunToken(r.maDonHang)),
    )
    .map((r) => r.id);
  const orderSet = new Set(orderIds);

  const subOrderIds = (
    await prisma.donHangNhaCungCap.findMany({ select: { id: true, donHangId: true } })
  )
    .filter((r) => orderSet.has(r.donHangId))
    .map((r) => r.id);
  const subOrderSet = new Set(subOrderIds);

  const orderItemIds = (
    await prisma.mucDonHang.findMany({
      select: { id: true, donHangNhaCungCapId: true, bienTheSanPhamId: true },
    })
  )
    .filter((r) => subOrderSet.has(r.donHangNhaCungCapId) || variantSet.has(r.bienTheSanPhamId))
    .map((r) => r.id);
  const orderItemSet = new Set(orderItemIds);

  // 1j. Voucher: run token trong mã, hoặc gắn với khách / đơn / flash sale fixture.
  // Voucher: mã có run token, HOẶC đã hết hạn và không gắn sản phẩm/danh mục
  // (fixture test tạo voucher 10 ngày nên hết hạn từ lâu), HOẶC gắn với
  // khách / đơn / flash sale fixture.
  const voucherIds = (
    await prisma.khuyenMai.findMany({
      select: { id: true, ma: true, ketThucLuc: true, sanPhamId: true, danhMucSanPhamId: true },
    })
  )
    .filter(
      (r) =>
        coRunToken(r.ma) ||
        batDau(r.ma, PREFIX_KHUYEN_MAI) ||
        (r.ketThucLuc.getTime() < Date.now() &&
          r.sanPhamId === null &&
          r.danhMucSanPhamId === null),
    )
    .map((r) => r.id);
  for (const link of await prisma.khachHangKhuyenMai.findMany({ select: { khachHangId: true, khuyenMaiId: true } })) {
    if (customerSet.has(link.khachHangId)) voucherIds.push(link.khuyenMaiId);
  }
  for (const o of await prisma.donHang.findMany({ where: { id: { in: orderIds } }, select: { khuyenMaiId: true } })) {
    if (o.khuyenMaiId) voucherIds.push(o.khuyenMaiId);
  }
  const voucherSet = new Set(voucherIds);

  // 1k. Giỏ hàng + chiến dịch flash sale + địa chỉ fixture.
  const cartIds = (
    await prisma.gioHang.findMany({ select: { id: true, khachHangId: true } })
  )
    .filter((r) => customerSet.has(r.khachHangId))
    .map((r) => r.id);

  const flashSetIds = (
    await prisma.chienDichFlashSale.findMany({
      select: { id: true, muc: { select: { bienTheSanPhamId: true } } },
    })
  )
    .filter((r) => r.muc.some((m) => variantSet.has(m.bienTheSanPhamId)))
    .map((r) => r.id);

  const addressIds = (
    await prisma.diaChi.findMany({ select: { id: true, nguoiDungId: true } })
  )
    .filter((r) => userIds.has(r.nguoiDungId))
    .map((r) => r.id);

  // -----------------------------------------------------------------------
  // 2. BÁO CÁO
  // -----------------------------------------------------------------------

  const tong: Record<string, number> = {
    'Danh mục sản phẩm': catIds.length,
    'Sản phẩm': productIds.length,
    'Biến thể': variantIds.length,
    'Trang trại': farmIds.length,
    'Nhà cung cấp': nccIdList.length,
    'Kho': khoIdList.length,
    'Lô sản phẩm': loIdList.length,
    'Mùa vụ': muaVuIdList.length,
    'Thu hoạch': harvestIdList.length,
    'Tồn kho theo lô': lotRows.length,
    'Đơn hàng': orderIds.length,
    'Đơn nhà cung cấp': subOrderIds.length,
    'Mục đơn hàng': orderItemIds.length,
    'Voucher': voucherSet.size,
    'Giỏ hàng': cartIds.length,
    'Người dùng': userIdList.length,
    'Khách hàng': customerIds.length,
    'Địa chỉ': addressIds.length,
    'Chiến dịch flash sale': flashSetIds.length,
  };

  console.log('📋 Sẽ dọn:');
  for (const [ten, so] of Object.entries(tong)) {
    if (so > 0) console.log(`   ${ten.padEnd(24)} ${so}`);
  }
  console.log(`   ${'TỔNG'.padEnd(24)} ${Object.values(tong).reduce((a, b) => a + b, 0)}`);
  console.log('');

  // -----------------------------------------------------------------------
  // 3. ASSERT BẢO VỆ CANONICAL
  // -----------------------------------------------------------------------

  const baoVe = (tenBang: string, soChung: number): void => {
    if (soChung > 0) {
      throw new Error(
        `❌ AN TOÀN: ${soChung} bản ghi canonical của ${tenBang} nằm trong tập xóa. Script dừng.`,
      );
    }
  };

  const canonicalFarm = await prisma.trangTrai.findMany({ select: { id: true, ma: true } });
  baoVe(
    'trang_trai.ma',
    canonicalFarm.filter((r) => CANONICAL.farmMa.includes(r.ma) && farmSet.has(r.id)).length,
  );
  const canonicalNcc = await prisma.nhaCungCap.findMany({ select: { id: true, ma: true } });
  baoVe(
    'nha_cung_cap.ma',
    canonicalNcc.filter((r) => CANONICAL.nccMa.includes(r.ma) && nccIds.has(r.id)).length,
  );
  const canonicalKho = await prisma.kho.findMany({ select: { id: true, maKho: true } });
  baoVe(
    'kho.maKho',
    canonicalKho.filter((r) => CANONICAL.khoMaKho.includes(r.maKho) && khoIds.has(r.id)).length,
  );
  const canonicalCat = await prisma.danhMucSanPham.findMany({ select: { id: true, slug: true } });
  baoVe(
    'danh_muc_san_pham.slug',
    canonicalCat.filter((r) => CANONICAL.catSlug.includes(r.slug) && catSet.has(r.id)).length,
  );
  const canonicalLo = await prisma.loSanPham.findMany({ select: { id: true, maLo: true } });
  baoVe(
    'lo_san_pham.maLo',
    canonicalLo.filter((r) => CANONICAL.loMaLo.includes(r.maLo) && loIds.has(r.id)).length,
  );
  const canonicalOrder = await prisma.donHang.findMany({ select: { id: true, maDonHang: true } });
  baoVe(
    'don_hang.maDonHang',
    canonicalOrder.filter((r) => CANONICAL.donHangMa.includes(r.maDonHang) && orderSet.has(r.id)).length,
  );
  const sanPhamCanonicalIds = new Set(
    (await prisma.sanPham.findMany({ select: { id: true, trangTraiId: true } }))
      .filter((r) => canonicalFarm.some((f) => f.id === r.trangTraiId && CANONICAL.farmMa.includes(f.ma)))
      .map((r) => r.id),
  );
  baoVe(
    'san_pham (farm canonical)',
    [...productSet].filter((id) => sanPhamCanonicalIds.has(id)).length,
  );
  console.log('✅ Đã kiểm tra: không canonical demo nào nằm trong tập xóa.');
  console.log('');

  if (!XOA_THAT) {
    console.log('ℹ️  DRY-RUN. Chạy lại với --xac-nhan và DEV_CLEANUP_CONFIRM=YES để xóa thật.');
    return;
  }

  // -----------------------------------------------------------------------
  // 4. XÓA THEO THỨ TỰ KHÓA NGOẠI (con trước, cha sau)
  // -----------------------------------------------------------------------

  const baoCao = new Map<string, number>();

  /** Xóa theo tập id, chia lô để không vượt giới hạn kích thước câu truy vấn. */
  const xoa = async (tenModel: string, ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const model = (prisma as unknown as Record<string, { deleteMany: (w: unknown) => Promise<{ count: number }> }>)[
      tenModel
    ];
    if (!model) throw new Error(`Không tìm thấy model Prisma: ${tenModel}`);
    let so = 0;
    for (const lot of chiaLot(ids)) {
      so += (await model.deleteMany({ where: { id: { in: lot } } })).count;
    }
    if (so > 0) {
      baoCao.set(tenModel, so);
      console.log(`   ✔ ${tenModel.padEnd(28)} ${so}`);
    }
  };

  /**
   * Xóa bản ghi theo một điều kiện quan hệ (không cần biết trước id).
   * Một số model dùng khoá tổ hợp, nên phải xóa theo điều kiện thay vì theo id.
   */
  const xoaTheoQuanHe = async (tenModel: string, where: Record<string, unknown>): Promise<void> => {
    const model = (
      prisma as unknown as Record<
        string,
        { deleteMany: (w: unknown) => Promise<{ count: number }> }
      >
    )[tenModel];
    if (!model) throw new Error(`Không tìm thấy model Prisma: ${tenModel}`);
    const so = (await model.deleteMany({ where })).count;
    if (so > 0) {
      baoCao.set(tenModel, so);
      console.log(`   ✔ ${tenModel.padEnd(28)} ${so}`);
    }
  };

  /**
   * Xóa giao dịch tồn kho fixture.
   *
   * `inventory_transaction` là ledger bất biến: migration PHIEN-084 cài trigger
   * `trg_inventory_transaction_no_delete` chặn DELETE nhằm bảo vệ tính toàn vẹn
   * của ledger production. Ở đây ta chỉ xóa bản ghi thuộc fixture test trong
   * database dev, nên tạm hạ trigger, xóa đúng tập id đã xác định, rồi khôi
   * phục trigger ngay — không đụng tới bất kỳ bản ghi nào ngoài tập fixture.
   */
  const xoaLedgerTonKhoFixture = async (lotIds: string[]): Promise<void> => {
    if (lotIds.length === 0) return;
    const trigger = 'trg_inventory_transaction_no_delete';
    // DDL (CREATE/DROP TRIGGER) không chạy được qua prepared-statement protocol
    // của Prisma, nên dùng kết nối mariadb trực tiếp cho phần này.
    const conn = await mariadb.createConnection({
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || '3306'),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, '')),
      connectionLimit: 1,
    });
    try {
      const rows = await conn.query(
        `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
          WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME = ?`,
        [cfgDatabase, trigger],
      );
      if (rows.length === 0) {
        await xoaTheoQuanHe('giaoDichTonKho', { tonKhoLoId: { in: lotIds } });
        return;
      }
      console.log(`   … tạm hạ trigger ${trigger} để dọn ledger fixture`);
      await conn.query(`DROP TRIGGER IF EXISTS \`${trigger}\``);
      try {
        await xoaTheoQuanHe('giaoDichTonKho', { tonKhoLoId: { in: lotIds } });
      } finally {
        await conn.query(`
          CREATE TRIGGER \`${trigger}\`
          BEFORE DELETE ON \`inventory_transaction\`
          FOR EACH ROW
          BEGIN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Inventory transaction ledger is immutable; append a new transaction';
          END`);
        console.log(`   ✔ đã khôi phục trigger ${trigger}`);
      }
    } finally {
      await conn.end();
    }
  };

  console.log('🗑  Đang xóa (thứ tự khóa ngoại):');

  // Hóa đơn nội bộ (gắn với donHang trực tiếp)
  const hoaDonIds = (await prisma.hoaDonBanHangNoiBo.findMany({ select: { id: true, donHangId: true } }))
    .filter((r) => orderSet.has(r.donHangId))
    .map((r) => r.id);
  await xoaTheoQuanHe('hoaDonBanHangNoiBoDong', { hoaDonId: { in: hoaDonIds } });  await xoa('hoaDonBanHangNoiBo', hoaDonIds);

  // Khiếu nại
  const khieuNaiIds = (
    await prisma.khieuNai.findMany({ select: { id: true, mucDonHangId: true } })
  )
    .filter((r) => orderItemSet.has(r.mucDonHangId))
    .map((r) => r.id);
  await xoaTheoQuanHe('khieuNaiBangChung', { khieuNaiId: { in: khieuNaiIds } });
  await xoa('khieuNai', khieuNaiIds);

  // Phiếu kho: theo kho nguồn/đích fixture, đơn fixture, hoặc biến thể fixture.
  const phieuKhoIds = (
    await prisma.phieuKho.findMany({
      select: {
        id: true,
        khoNguonId: true,
        khoDichId: true,
        donHangId: true,
        dong: { select: { bienTheSanPhamId: true } },
      },
    })
  )
    .filter(
      (p) =>
        (p.khoNguonId !== null && khoIds.has(p.khoNguonId)) ||
        (p.khoDichId !== null && khoIds.has(p.khoDichId)) ||
        (p.donHangId !== null && orderSet.has(p.donHangId)) ||
        p.dong.some((d) => variantSet.has(d.bienTheSanPhamId)),
    )
    .map((p) => p.id);
  // PhieuKhoDong + LienKetPhieuKhoGiaoDich đều Cascade theo phieuKho.
  // PhieuKhoDong còn tham chiếu ton_kho_lo_id, nên phải xóa trước TonKhoLo.
  await xoa('phieuKho', phieuKhoIds);

  // Vận chuyển
  const vanChuyenIds = (
    await prisma.vanChuyen.findMany({ select: { id: true, donHangNhaCungCapId: true } })
  )
    .filter((r) => subOrderSet.has(r.donHangNhaCungCapId))
    .map((r) => r.id);
  await xoaTheoQuanHe('suKienTheoDoiVanChuyen', { vanChuyenId: { in: vanChuyenIds } });
  await xoa('vanChuyen', vanChuyenIds);

  // Tồn kho: mọi bảng tham chiếu ton_kho_lo_id phải xóa trước TonKhoLo.
  const lotIdList = lotRows.map((r) => r.id);

  // reservation: DatChoTonKho giữ lô qua quan hệ muc.
  const datChoIds = (
    await prisma.datChoTonKho.findMany({
      where: { muc: { some: { tonKhoLoId: { in: lotIdList } } } },
      select: { id: true },
    })
  ).map((r) => r.id);
  await xoaTheoQuanHe('mucDatChoTonKho', {
    OR: [
      { datChoTonKhoId: { in: datChoIds } },
      { tonKhoLoId: { in: lotIdList } },
    ],
  });
  await xoa('datChoTonKho', datChoIds);

  await xoaTheoQuanHe('phanBoDonHang', {
    OR: [
      { mucDonHangId: { in: orderItemIds } },
      { tonKhoLoId: { in: lotIdList } },
    ],
  });

  // `inventory_transaction` là ledger bất biến: DB trigger chặn UPDATE/DELETE
  // (xem migration PHIEN-084). Đây là business rule cần giữ nguyên, nên script
  // chỉ TẠM thời hạ trigger cho đúng các bản ghi fixture, rồi khôi phục lại.
  await xoaLedgerTonKhoFixture(lotIdList);

  // PhieuKhoDong giữ cả tonKhoLoId và tonKhoLoDichId — xóa theo tập lô fixture.
  await xoaTheoQuanHe('phieuKhoDong', {
    OR: [{ tonKhoLoId: { in: lotIdList } }, { tonKhoLoDichId: { in: lotIdList } }],
  });

  await xoa('tonKhoLo', lotIdList);

  // Thanh toán: mọi bảng tham chiếu payment_id phải xóa trước.
  const thanhToanIds = (
    await prisma.thanhToan.findMany({ select: { id: true, donHangId: true } })
  )
    .filter((r) => orderSet.has(r.donHangId))
    .map((r) => r.id);
  await xoaTheoQuanHe('phanBoHoanTien', {
    OR: [
      { mucDonHangId: { in: orderItemIds } },
      { donHangId: { in: orderIds } },
      { thanhToanId: { in: thanhToanIds } },
    ],
  });
  await xoaTheoQuanHe('chiTraNhaCungCap', { nhaCungCapId: { in: nccIdList } });
  await xoaTheoQuanHe('giaoDichThanhToan', { thanhToanId: { in: thanhToanIds } });
  await xoaTheoQuanHe('noNhaCungCap', { nhaCungCapId: { in: nccIdList } });
  await xoa('thanhToan', thanhToanIds);

  // Đơn hàng: các bảng con giữ order_id / order_item_id phải xóa trước.
  await xoaTheoQuanHe('thongBaoThuHoi', {
    OR: [
      { loSanPhamId: { in: loIdList } },
      { donHangId: { in: orderIds } },
      { khachHangId: { in: customerIds } },
    ],
  });
  await xoaTheoQuanHe('danhGia', { mucDonHangId: { in: orderItemIds } });
  await xoaTheoQuanHe('khieuNai', { mucDonHangId: { in: orderItemIds } });
  await xoa('mucDonHang', orderItemIds);
  // Đối soát: DonHangNhaCungCap tham chiếu settlement_id nên xóa sau mucDonHang.
  await xoa('donHangNhaCungCap', subOrderIds);
  await xoaTheoQuanHe('doiSoatNhaCungCap', { nhaCungCapId: { in: nccIdList } });
  await xoa('donHang', orderIds);

  // Tài chính còn lại
  for (const tenModel of ['soDuNhaCungCap', 'quyTacHoaHong'] as const) {
    await xoaTheoQuanHe(tenModel, { nhaCungCapId: { in: nccIdList } });
  }

  // Giỏ hàng
  await xoaTheoQuanHe('mucGioHang', { gioHangId: { in: cartIds } });
  await xoa('gioHang', cartIds);

  // Flash sale: MucFlashSale tham chiếu bien_the_san_pham_id, phải xóa trước
  // BienTheSanPham. ChienDichFlashSale xóa sau (MucFlashSale cascade theo chienDich).
  await xoaTheoQuanHe('mucFlashSale', { bienTheSanPhamId: { in: variantIds } });
  await xoa('chienDichFlashSale', flashSetIds);

  // Loyalty + voucher
  await xoaTheoQuanHe('khachHangKhuyenMai', {
    OR: [{ khachHangId: { in: customerIds } }, { khuyenMaiId: { in: [...voucherSet] } }],
  });
  // LoyaltyAccount giữ khoá khách hàng; GiaoDichLoyalty Cascade theo account.
  await xoaTheoQuanHe('taiKhoanLoyalty', { khachHangId: { in: customerIds } });

  // Yêu thích / theo dõi / thông báo
  await xoaTheoQuanHe('sanPhamYeuThich', { sanPhamId: { in: productIds } });
  await xoaTheoQuanHe('theoDoiTrangTrai', { trangTraiId: { in: farmIds } });
  await xoaTheoQuanHe('thongBaoThuHoach', { thuHoachId: { in: harvestIdList } });

  // Danh mục sản phẩm
  await xoaTheoQuanHe('sanPhamAnh', { sanPhamId: { in: productIds } });
  // KhuyenMai giữ san_pham_id và danh_muc_san_pham_id — xóa trước SanPham.
  await xoaTheoQuanHe('khuyenMai', {
    OR: [
      { sanPhamId: { in: productIds } },
      { danhMucSanPhamId: { in: catIds } },
      ...(voucherSet.size > 0 ? [{ id: { in: [...voucherSet] } }] : []),
    ],
  });
  // SanPham còn bị MucDonHang và KhuyenMai giữ. MucDonHang của đơn hợp lệ
  // (vd ORD-20261004-0001) không được xóa, nên chỉ gỡ FK bằng cách đặt null —
  // nhưng cột này NOT NULL, nên thay vào đó phải bảo đảm không còn mục đơn nào
  // trỏ tới sản phẩm fixture. Dòng nào còn lại là dữ liệu demo hợp lệ.
  const conTroSanPhamFixture = await prisma.mucDonHang.count({
    where: { sanPhamId: { in: productIds } },
  });
  if (conTroSanPhamFixture > 0) {
    throw new Error(
      `❌ Còn ${conTroSanPhamFixture} mục đơn hàng tham chiếu sản phẩm fixture ` +
        `(ngoài tập mục đơn đã dọn). Script dừng để không xóa lịch sử đơn hợp lệ.`,
    );
  }
  // BienTheSanPham giữ san_pham_id (Restrict) nên phải xóa trước SanPham.
  await xoa('bienTheSanPham', variantIds);
  await xoa('sanPham', productIds);
  await xoa('danhMucSanPham', catIds);

  // Nguồn cung / truy xuất
  await xoaTheoQuanHe('chungNhan', { trangTraiId: { in: farmIds } });
  await xoaTheoQuanHe('trangTraiAnh', { trangTraiId: { in: farmIds } });
  await xoaTheoQuanHe('nhatKyCanhTac', { muaVuId: { in: muaVuIdList } });
  await xoaTheoQuanHe('suKienTruyXuat', { loSanPhamId: { in: loIdList } });
  const kdIds = (
    await prisma.kiemDinhChatLuong.findMany({ where: { loSanPhamId: { in: loIdList } }, select: { id: true } })
  ).map((r) => r.id);
  await xoaTheoQuanHe('kiemDinhChatLuongAnh', { kiemDinhChatLuongId: { in: kdIds } });
  await xoa('kiemDinhChatLuong', kdIds);
  await xoaTheoQuanHe('thuHoiLoSanPham', { loSanPhamId: { in: loIdList } });
  await xoa('loSanPham', loIdList);
  await xoa('thuHoach', harvestIdList);
  await xoa('muaVu', muaVuIdList);
  await xoa('kho', khoIdList);
  await xoa('trangTrai', farmIds);
  await xoa('nhaCungCap', nccIdList);

  // Người dùng: mọi bảng con tham chiếu phải dọn trước (nhiều quan hệ Restrict).
  await xoaTheoQuanHe('diaChi', { nguoiDungId: { in: userIdList } });
  // Quét lại: mọi đơn hàng còn lại của khách fixture đều là fixture (đơn hợp lệ
  // thuộc tài khoản demo, không nằm trong customerIds). Dọn theo đúng thứ tự.
  const donConLai = (
    await prisma.donHang.findMany({ where: { khachHangId: { in: customerIds } }, select: { id: true } })
  ).map((r) => r.id);
  if (donConLai.length > 0) {
    const subConLai = (
      await prisma.donHangNhaCungCap.findMany({ where: { donHangId: { in: donConLai } }, select: { id: true } })
    ).map((r) => r.id);
    const itemConLai = (
      await prisma.mucDonHang.findMany({
        where: { donHangNhaCungCapId: { in: subConLai } },
        select: { id: true },
      })
    ).map((r) => r.id);
    await xoaTheoQuanHe('thongBaoThuHoi', { donHangId: { in: donConLai } });
    await xoaTheoQuanHe('phanBoHoanTien', { mucDonHangId: { in: itemConLai } });
    await xoaTheoQuanHe('phanBoDonHang', { mucDonHangId: { in: itemConLai } });
    await xoaTheoQuanHe('danhGia', { mucDonHangId: { in: itemConLai } });
    await xoaTheoQuanHe('khieuNai', { mucDonHangId: { in: itemConLai } });
    await xoa('mucDonHang', itemConLai);
    // VanChuyen giữ don_hang_nha_cung_cap_id; SuKienTheoDoiVanChuyen giữ
    // van_chuyen_id — dọn theo thứ tự trước khi xóa sub-order.
    const vanConLai = (
      await prisma.vanChuyen.findMany({
        where: { donHangNhaCungCapId: { in: subConLai } },
        select: { id: true },
      })
    ).map((r) => r.id);
    await xoaTheoQuanHe('suKienTheoDoiVanChuyen', { vanChuyenId: { in: vanConLai } });
    await xoa('vanChuyen', vanConLai);
    await xoa('donHangNhaCungCap', subConLai);
    // payment / internal_sales_invoice / warehouse_document giữ don_hang_id.
    const payConLai = (
      await prisma.thanhToan.findMany({ where: { donHangId: { in: donConLai } }, select: { id: true } })
    ).map((r) => r.id);
    await xoaTheoQuanHe('phanBoHoanTien', { donHangId: { in: donConLai } });
    await xoaTheoQuanHe('chiTraNhaCungCap', { nhaCungCapId: { in: nccIdList } });
    await xoaTheoQuanHe('noNhaCungCap', { nhaCungCapId: { in: nccIdList } });
    await xoaTheoQuanHe('giaoDichThanhToan', { thanhToanId: { in: payConLai } });
    await xoa('thanhToan', payConLai);
    await xoaTheoQuanHe('hoaDonBanHangNoiBoDong', {
      hoaDon: { donHangId: { in: donConLai } },
    });
    await xoaTheoQuanHe('hoaDonBanHangNoiBo', { donHangId: { in: donConLai } });
    await xoaTheoQuanHe('phieuKho', { donHangId: { in: donConLai } });
    await xoa('donHang', donConLai);
  }
  await xoa('khachHang', customerIds);
  await xoa('nguoiDung', userIdList);

  console.log('');
  console.log(
    '✅ Đã xóa. Tổng bản ghi:',
    [...baoCao.values()].reduce((a, b) => a + b, 0),
  );
}

main()
  .catch((error) => {
    console.error('[cleanup] Lỗi:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
