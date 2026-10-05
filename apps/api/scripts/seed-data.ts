/**
 * Seed demo AgriMarket (idempotent).
 *
 * NGUYÊN TẮC NGHIỆP VỤ (product domain final):
 * - Product != Batch. Mỗi sản phẩm có LÔ RIÊNG (MuaVu/ThuHoach/Lo/TonKho
 *   riêng theo đúng loại cây trồng/vật nuôi của nó) để tab Nguồn gốc &
 *   Thu hoạch và API `thuHoachGanNhatTaiTrangTrai` không bao giờ gắn nhầm
 *   harvest của farm cho product khác loại.
 * - KHÔNG dùng "Organic" làm danh mục (Hữu cơ là chứng nhận của farm).
 * - KHÔNG seed cá/thịt vào demo cây trồng (schema chưa có
 *   livestock/aquaculture): Cá hồi Na Uy, Thịt heo hữu cơ bị ẨN khỏi catalog
 *   công khai (giữ schema, giữ lịch sử nếu đã phát sinh đơn).
 * - Chứng nhận mẫu do các cơ quan kiểm định với mã NGHIỆP VỤ (tiền tố VGP-, HC-,
 *   ATSH-); AgriMarket chỉ XÁC MINH, không tự cấp VietGAP/Hữu cơ.
 * - Mã CÔNG KHAI (mã trang trại, mã lô, mã chứng nhận, tên chiến dịch, mã
 *   đơn/vận đơn fixture) KHÔNG mang chữ SEED/DEMO vì chúng lộ ra khách.
 *   Khoá chính `id` không đổi; `chuyenMaCongKhaiCu()` đổi tên mã cũ ngay trong DB.
 * - Mỗi lô demo có mã truy xuất AGM-* thật + sự kiện công khai + nhật ký
 *   canh tác công khai để /truy-xuat demo được end-to-end.
 *
 * Chạy từ root bằng canonical command:
 * pnpm db:seed:demo
 *
 * PHẦN DEMO (tài khoản + đơn hàng mẫu + smoke fixture):
 * - Chỉ dùng LOCAL/DEMO. Từ chối chạy khi NODE_ENV=production.
 * - Idempotent: dùng mã ổn định (upsert/find-first), chạy lại không trùng lặp,
 *   không trôi tồn kho.
 * - Đơn mẫu ORD-20261004-0001 thể hiện exact trace:
 *   DonHang → DonHangNhaCungCap → MucDonHang → PhanBoDonHang → TonKhoLo
 *   → LoSanPham (maTruyXuat non-null) → ThuHoach → MuaVu → TrangTrai.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as argon2 from 'argon2';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LyDoKhieuNai,
  PrismaClient,
  TrangThaiBanGhi,
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiNguoiDung,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
  TrangThaiXacMinhChungNhan,
} from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

function tachDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  return {
    host: url.hostname,
    port: Number(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 10,
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname),
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Thiếu DATABASE_URL');
  process.exit(1);
}

const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
const prisma = new PrismaClient({ adapter });

const NHA_CUNG_CAP_MA_CU = 'NCC-SEED-001';

// ponytail: kho demo chỉ một bản ghi; khi có nhiều kho thật thì tách seed kho riêng.
const KHO_MA = 'KHO-AGRIMARKET-01';
const KHO_MA_CU = 'KHO-SEED-001';

const NHA_CUNG_CAP = {
  ma: 'NCC-AGRIMARKET-01',
  ten: 'AgriMarket Farm Network',
  nguoiDaiDien: 'Nguyễn Văn Minh',
  soDienThoai: '0909123456',
  email: 'farm@agrimarket.local',
  diaChi: 'Việt Nam',
};

/**
 * Mã công khai (display code) của trang trại/lô/chứng nhận KHÔNG được mang chữ
 * "SEED"/"DEMO": các mã này hiện ra khách ở trang trại, chi tiết sản phẩm,
 * truy xuất nguồn gốc và chứng nhận. Khóa chính `id` (UUID) giữ nguyên — chỉ
 * mã hiển thị đổi, quan hệ DB/FK không đổi.
 *
 * Vì seed là idempotent theo `ma`, nếu chỉ đổi hằng số thì database đã seed
 * bằng bộ mã cũ sẽ sinh THÊM bản ghi mới. Vì vậy `chuyenMaCongKhaiCu()`
 * bên dưới đổi tên mã cũ → mã mới NGAY TRONG DB trước khi upsert, giữ nguyên
 * `id` và mọi FK (đơn hàng, phân bổ lô, đánh giá…).
 */
const FARMS = [
  {
    ma: 'TT-MINH-BACH-01',
    maCu: 'TT-SEED-001',
    ten: 'Trang trại Minh Bạch',
    diaChi: 'Sóc Sơn - Hà Nội',
    viDo: '21.2570',
    kinhDo: '105.8490',
    dienTichHa: '5.5',
    image: 'farm-minh-bach.jpg',
    certificate: 'VietGAP',
    certificateCode: 'VGP-MINHBACH-2026-01',
    certificateCodeCu: 'DEMO-VG-MB-01',
    certificateIssuer: 'Trung tâm Kiểm định Nông sản Hưng Yên',
  },
  {
    ma: 'TT-AN-PHU-01',
    maCu: 'TT-SEED-AN-PHU',
    ten: 'Nông trại An Phú',
    diaChi: 'Lâm Hà - Lâm Đồng',
    viDo: '11.7350',
    kinhDo: '108.2680',
    dienTichHa: '8.2',
    image: 'farm-an-phu.jpg',
    certificate: 'Hữu cơ',
    certificateCode: 'HC-ANPHU-2026-01',
    certificateCodeCu: 'DEMO-HC-AP-01',
    certificateIssuer: 'Ban Chứng nhận Hữu cơ',
  },
  {
    ma: 'TT-PHU-NONG-01',
    maCu: 'TT-SEED-PHU-NONG',
    ten: 'HTX Phú Nông',
    diaChi: 'Đồng Nai',
    viDo: '10.9570',
    kinhDo: '106.8420',
    dienTichHa: '12.4',
    image: 'farm-phu-nong.jpg',
    certificate: 'VietGAP',
    certificateCode: 'VGP-PHUNONG-2026-01',
    certificateCodeCu: 'DEMO-VG-PN-01',
    certificateIssuer: 'Trung tâm Kiểm định Nông sản Hưng Yên',
  },
  {
    ma: 'TT-SONG-HONG-01',
    maCu: 'TT-SEED-SONG-HONG',
    ten: 'Trang trại Sông Hồng',
    diaChi: 'Hà Nội',
    viDo: '21.0820',
    kinhDo: '105.8210',
    dienTichHa: '6.8',
    image: 'farm-song-hong.jpg',
    certificate: 'An toàn sinh học',
    certificateCode: 'ATSH-SONGHONG-2026-01',
    certificateCodeCu: 'DEMO-ATSH-SH-01',
    certificateIssuer: 'Trung tâm Kiểm định Nông sản Hưng Yên',
  },
] as const;

/**
 * Đổi mã công khai cũ (có chữ SEED/DEMO) sang mã nghiệp vụ NGAY TRONG DB.
 *
 * Chỉ UPDATE cột mã hiển thị — không đụng `id` (UUID) nên mọi quan hệ đã có
 * (đơn hàng, mục đơn, phân bổ lô, đánh giá, khiếu nại) giữ nguyên. Chạy trước
 * các `upsert` để seed vẫn idempotent trên cả DB cũ lẫn DB mới.
 *
 * AN TOÀN: mọi cột mã dưới đây đều là `@unique` trong `schema.prisma`. Nếu DB
 * ở trạng thái half-migrated (đã có CẢ bản ghi mã cũ và bản ghi mã mới — ví dụ
 * do từng chạy seed ở phiên bản chưa có hàm này) thì `update` mã sẽ đụng ràng
 * buộc unique và làm seed CRASH vô nghĩa, hoặc tệ hơn là ghi đè bản ghi thật.
 * Vì vậy mỗi lần đổi tên đều đi qua `doiMaKhiChuaCoMaDich()`: mã đích đã tồn
 * tại thì BỎ QUA (giữ nguyên dữ liệu đang có, in cảnh báo). Các `upsert` phía
 * sau vẫn chạy trên mã mới nên seed vẫn hoàn tất.
 */
async function doiMaKhiChuaCoMaDich(
  nhan: string,
  maCu: string,
  maMoi: string,
  soBanGhiCoMaCu: Promise<number>,
  soBanGhiCoMaMoi: Promise<number>,
  doiMa: () => Promise<unknown>,
): Promise<void> {
  // DB đã ở mã mới (hoặc chưa từng seed bằng mã cũ) → không có gì để đổi tên.
  // Đây là trạng thái BÌNH THƯỜNG khi chạy seed lần hai, không cần cảnh báo.
  if ((await soBanGhiCoMaCu) === 0) return;
  // Còn mã cũ và đã có mã mới → DB half-migrated: giữ nguyên dữ liệu, không đụng unique.
  if ((await soBanGhiCoMaMoi) > 0) {
    console.warn(
      `⚠️  Bỏ qua đổi mã ${nhan}: DB đang có CẢ "${maCu}" và "${maMoi}" (half-migrated) — giữ nguyên bản ghi hiện có, không ghi đè.`,
    );
    return;
  }
  await doiMa();
}

/**
 * Chiến dịch demo cũ mang tên DEMO lộ ra khách: cho nghỉ hoạt động để public
 * API chỉ còn chiến dịch tên nghiệp vụ. Giữ bản ghi (lịch sử), không xóa.
 * Tách riêng khỏi `chuyenMaCongKhaiCu()` vì đây là đổi trạng thái, không phải
 * đổi mã qua cổng `doiMaKhiChuaCoMaDich()`.
 */
async function ngungHoatDongChienDichFlashSaleCu() {
  await prisma.chienDichFlashSale.updateMany({
    where: { ten: TEN_CHIEN_DICH_FLASH_SALE_CU, trangThai: TrangThaiBanGhi.HOAT_DONG },
    data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
  });
}

async function chuyenMaCongKhaiCu() {
  await doiMaKhiChuaCoMaDich(
    'nhà cung cấp',
    NHA_CUNG_CAP_MA_CU,
    NHA_CUNG_CAP.ma,
    prisma.nhaCungCap.count({ where: { ma: NHA_CUNG_CAP_MA_CU } }),
    prisma.nhaCungCap.count({ where: { ma: NHA_CUNG_CAP.ma } }),
    () =>
      prisma.nhaCungCap.updateMany({
        where: { ma: NHA_CUNG_CAP_MA_CU },
        data: { ma: NHA_CUNG_CAP.ma },
      }),
  );

  for (const farm of FARMS) {
    await doiMaKhiChuaCoMaDich(
      `trang trại ${farm.ten}`,
      farm.maCu,
      farm.ma,
      prisma.trangTrai.count({ where: { ma: farm.maCu } }),
      prisma.trangTrai.count({ where: { ma: farm.ma } }),
      () =>
        prisma.trangTrai.updateMany({
          where: { ma: farm.maCu },
          data: { ma: farm.ma },
        }),
    );
    await doiMaKhiChuaCoMaDich(
      `chứng nhận ${farm.certificate}`,
      farm.certificateCodeCu,
      farm.certificateCode,
      prisma.chungNhan.count({ where: { ma: farm.certificateCodeCu } }),
      prisma.chungNhan.count({ where: { ma: farm.certificateCode } }),
      () =>
        prisma.chungNhan.updateMany({
          where: { ma: farm.certificateCodeCu },
          data: { ma: farm.certificateCode },
        }),
    );
  }

  // Lô: đổi theo bảng ánh xạ chỉ số -> mã (thứ tự SAN_PHAM là ổn định).
  const maLoCuList: string[] = SAN_PHAM.map((_, index) => maLoCu(index));
  for (const [index, maCu] of maLoCuList.entries()) {
    const maMoi = maLo(index);
    await doiMaKhiChuaCoMaDich(
      `lô ${maCu}`,
      maCu,
      maMoi,
      prisma.loSanPham.count({ where: { maLo: maCu } }),
      prisma.loSanPham.count({ where: { maLo: maMoi } }),
      () =>
        prisma.loSanPham.updateMany({
          where: { maLo: maCu },
          data: { maLo: maMoi },
        }),
    );
  }
  await doiMaKhiChuaCoMaDich(
    `lô phụ ${MA_LO_THU_HAI_CU}`,
    MA_LO_THU_HAI_CU,
    MA_LO_THU_HAI,
    prisma.loSanPham.count({ where: { maLo: MA_LO_THU_HAI_CU } }),
    prisma.loSanPham.count({ where: { maLo: MA_LO_THU_HAI } }),
    () =>
      prisma.loSanPham.updateMany({
        where: { maLo: MA_LO_THU_HAI_CU },
        data: { maLo: MA_LO_THU_HAI },
      }),
  );

  // Fixture demo (chỉ do demo customer nhìn thấy).
  await doiMaKhiChuaCoMaDich(
    'đơn hàng mẫu',
    DEMO_MA_DON_HANG_CU,
    DEMO_MA_DON_HANG,
    prisma.donHang.count({ where: { maDonHang: DEMO_MA_DON_HANG_CU } }),
    prisma.donHang.count({ where: { maDonHang: DEMO_MA_DON_HANG } }),
    () =>
      prisma.donHang.updateMany({
        where: { maDonHang: DEMO_MA_DON_HANG_CU },
        data: { maDonHang: DEMO_MA_DON_HANG },
      }),
  );
  await doiMaKhiChuaCoMaDich(
    'đơn nhà cung cấp mẫu',
    DEMO_MA_DON_NCC_CU,
    DEMO_MA_DON_NCC,
    prisma.donHangNhaCungCap.count({ where: { maDon: DEMO_MA_DON_NCC_CU } }),
    prisma.donHangNhaCungCap.count({ where: { maDon: DEMO_MA_DON_NCC } }),
    () =>
      prisma.donHangNhaCungCap.updateMany({
        where: { maDon: DEMO_MA_DON_NCC_CU },
        data: { maDon: DEMO_MA_DON_NCC },
      }),
  );
  await doiMaKhiChuaCoMaDich(
    'giao dịch thanh toán mẫu',
    DEMO_MA_GIAO_DICH_CU,
    DEMO_MA_GIAO_DICH,
    prisma.giaoDichThanhToan.count({ where: { maGiaoDich: DEMO_MA_GIAO_DICH_CU } }),
    prisma.giaoDichThanhToan.count({ where: { maGiaoDich: DEMO_MA_GIAO_DICH } }),
    () =>
      prisma.giaoDichThanhToan.updateMany({
        where: { maGiaoDich: DEMO_MA_GIAO_DICH_CU },
        data: { maGiaoDich: DEMO_MA_GIAO_DICH },
      }),
  );
  await doiMaKhiChuaCoMaDich(
    'vận đơn mẫu',
    DEMO_MA_VAN_DON_CU,
    DEMO_MA_VAN_DON,
    prisma.vanChuyen.count({ where: { maVanDon: DEMO_MA_VAN_DON_CU } }),
    prisma.vanChuyen.count({ where: { maVanDon: DEMO_MA_VAN_DON } }),
    () =>
      prisma.vanChuyen.updateMany({
        where: { maVanDon: DEMO_MA_VAN_DON_CU },
        data: { maVanDon: DEMO_MA_VAN_DON },
      }),
  );
  await doiMaKhiChuaCoMaDich(
    'giao dịch điểm thưởng mẫu',
    MA_THAM_CHIEU_LOYALTY_CU,
    MA_THAM_CHIEU_LOYALTY,
    prisma.giaoDichLoyalty.count({ where: { maThamChieu: MA_THAM_CHIEU_LOYALTY_CU } }),
    prisma.giaoDichLoyalty.count({ where: { maThamChieu: MA_THAM_CHIEU_LOYALTY } }),
    () =>
      prisma.giaoDichLoyalty.updateMany({
        where: { maThamChieu: MA_THAM_CHIEU_LOYALTY_CU },
        data: { maThamChieu: MA_THAM_CHIEU_LOYALTY },
      }),
  );

  await doiMaKhiChuaCoMaDich(
    'kho demo',
    KHO_MA_CU,
    KHO_MA,
    prisma.kho.count({ where: { maKho: KHO_MA_CU } }),
    prisma.kho.count({ where: { maKho: KHO_MA } }),
    () =>
      prisma.kho.updateMany({
        where: { maKho: KHO_MA_CU },
        data: { maKho: KHO_MA },
      }),
  );

  // Reservation tham chiếu theo mã đơn nên đổi tên cho khởi.
  await doiMaKhiChuaCoMaDich(
    'giữ tồn kho của đơn mẫu',
    `ORDER:${DEMO_MA_DON_HANG_CU}`,
    `ORDER:${DEMO_MA_DON_HANG}`,
    prisma.datChoTonKho.count({ where: { maThamChieu: `ORDER:${DEMO_MA_DON_HANG_CU}` } }),
    prisma.datChoTonKho.count({ where: { maThamChieu: `ORDER:${DEMO_MA_DON_HANG}` } }),
    () =>
      prisma.datChoTonKho.updateMany({
        where: { maThamChieu: `ORDER:${DEMO_MA_DON_HANG_CU}` },
        data: { maThamChieu: `ORDER:${DEMO_MA_DON_HANG}` },
      }),
  );
}

/** Mã chứng nhận cũ gây hiểu nhầm (marketplace tự cấp) — seed mới xóa. */
const MA_CHUNG_NHAN_CU = ['VGP-MB-2026', 'ORG-AP-2026', 'VGP-PN-2026', 'ATSH-SH-2026'];

const DANH_MUC = [
  { ten: 'Rau củ', slug: 'rau-cu' },
  { ten: 'Trái cây', slug: 'trai-cay' },
  { ten: 'Gạo', slug: 'gom' },
  { ten: 'Trứng', slug: 'trung' },
  { ten: 'Thịt', slug: 'thit' },
  { ten: 'Thủy sản', slug: 'thuy-san' },
  { ten: 'Đặc sản', slug: 'dac-san' },
] as const;

type SeedProduct = {
  ten: string;
  danhMuc: (typeof DANH_MUC)[number]['ten'];
  farmMa: (typeof FARMS)[number]['ma'];
  image: string;
  moTa: string;
  gia: number;
  khoiLuong: string;
  donVi: string;
  /** Cây trồng / vật nuôi thật của sản phẩm — dùng cho MuaVu/ThuHoach riêng. */
  cayTrong: string;
  giong: string;
};

const SAN_PHAM: SeedProduct[] = [
  { ten: 'Rau xà lách thủy canh', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'rau-xa-lach-thuy-canh.jpg', moTa: 'Xà lách thủy canh giòn ngọt, thu hoạch trong ngày.', gia: 25_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Xà lách', giong: 'Xà lách mỡ' },
  { ten: 'Cà chua bi đỏ', danhMuc: 'Rau củ', farmMa: 'TT-AN-PHU-01', image: 'ca-chua-bi-do.jpg', moTa: 'Cà chua bi đỏ mọng nước, canh tác minh bạch.', gia: 32_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Cà chua', giong: 'Cà chua bi đỏ' },
  { ten: 'Rau cải xanh', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'rau-cai-xanh.jpg', moTa: 'Rau cải xanh tươi, phù hợp món luộc và xào.', gia: 20_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Rau cải', giong: 'Cải xanh' },
  { ten: 'Cà rốt', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'ca-ro-t.jpg', moTa: 'Cà rốt tươi giòn, vị ngọt tự nhiên.', gia: 22_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Cà rốt', giong: 'Cà rốt Đà Lạt' },
  { ten: 'Bí đỏ', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'bi-do.jpg', moTa: 'Bí đỏ ruột vàng, dẻo bùi.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Bí đỏ', giong: 'Bí đỏ hồ lô' },
  { ten: 'Dưa leo', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'dua-leo.jpg', moTa: 'Dưa leo tươi xanh, giòn mát.', gia: 24_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Dưa leo', giong: 'Dưa leo xanh' },
  { ten: 'Bông cải xanh', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'bong-cai-xanh.jpg', moTa: 'Bông cải xanh giàu dinh dưỡng, canh tác sạch.', gia: 28_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Bông cải', giong: 'Bông cải xanh' },
  { ten: 'Rau mồng tơi', danhMuc: 'Rau củ', farmMa: 'TT-MINH-BACH-01', image: 'rau-mong-toi.jpg', moTa: 'Rau mồng tơi non, thu hoạch mỗi sáng.', gia: 18_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Rau mồng tơi', giong: 'Mồng tơi lá to' },
  { ten: 'Táo đỏ', danhMuc: 'Trái cây', farmMa: 'TT-AN-PHU-01', image: 'tao-do.jpg', moTa: 'Táo đỏ giòn ngọt, chọn lọc kỹ.', gia: 45_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Táo', giong: 'Táo đỏ' },
  { ten: 'Chuối xanh', danhMuc: 'Trái cây', farmMa: 'TT-PHU-NONG-01', image: 'chuoi-xanh.jpg', moTa: 'Chuối Việt Nam tươi, chín tự nhiên.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Chuối', giong: 'Chuối tiêu' },
  { ten: 'Cam vỏ vàng', danhMuc: 'Trái cây', farmMa: 'TT-PHU-NONG-01', image: 'cam-vo-vang.jpg', moTa: 'Cam mọng nước, vị ngọt thanh.', gia: 32_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Cam', giong: 'Cam vỏ vàng' },
  { ten: 'Cam sành', danhMuc: 'Trái cây', farmMa: 'TT-PHU-NONG-01', image: 'cam-sanh.jpg', moTa: 'Cam sành nhiều nước, giàu vitamin C.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Cam', giong: 'Cam sành' },
  { ten: 'Gạo ST25', danhMuc: 'Gạo', farmMa: 'TT-PHU-NONG-01', image: 'gao-st25.jpg', moTa: 'Gạo ST25 thơm dẻo, hạt dài đẹp.', gia: 120_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'ST25' },
  { ten: 'Gạo tẻ Thiên Hương', danhMuc: 'Gạo', farmMa: 'TT-PHU-NONG-01', image: 'gom-te-thien-huong.jpg', moTa: 'Gạo tẻ Thiên Hương dẻo mềm.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'Thiên Hương' },
  { ten: 'Gạo nếp Thái', danhMuc: 'Gạo', farmMa: 'TT-PHU-NONG-01', image: 'gom-nep-thai.jpg', moTa: 'Gạo nếp dẻo thơm, thích hợp đồ xôi.', gia: 38_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'Nếp Thái' },
  { ten: 'Trứng gà ta', danhMuc: 'Trứng', farmMa: 'TT-SONG-HONG-01', image: 'trung-ga-ta.jpg', moTa: 'Trứng gà ta nuôi thả vườn.', gia: 35_000, khoiLuong: '10.000', donVi: 'quả', cayTrong: 'Gà ta', giong: 'Gà ta thả vườn' },
  { ten: 'Mật ong rừng', danhMuc: 'Đặc sản', farmMa: 'TT-AN-PHU-01', image: 'mat-ong-rung.jpg', moTa: 'Mật ong nguyên chất, hương thơm tự nhiên.', gia: 180_000, khoiLuong: '0.500', donVi: 'lít', cayTrong: 'Ong mật', giong: 'Ong nội địa' },
];

/**
 * Sản phẩm demo cố ý để TẠM HẾT HÀNG (onHand = 0) để UI thể hiện đúng
 * trạng thái hết hàng. Chỉ 1 sản phẩm để không chiếm đa số danh mục.
 */
const TAM_HET_HANG = new Set(['Mật ong rừng']);

/**
 * Sản phẩm loại khỏi demo cây trồng (schema chưa có livestock/aquaculture
 * nên mọi harvest/ lot cây trồng gắn cho chúng đều sai nghiệp vụ).
 * ẨN khỏi catalog công khai thay vì xóa cứng để giữ lịch sử đơn hàng.
 */
const AN_KHOI_DEMO = new Set(['Cá hồi Na Uy', 'Thịt heo hữu cơ']);

/**
 * Mã lô công khai theo đúng format nghiệp vụ mà Backend dùng cho lô thật
 * (`Ta oLoTuThuHoachDto`: `LO-YYYYMMDD-NNN`). Ngày ở đây là NGÀY THU HOẠCH
 * ẢNH (anchor cố định) chứ không phải `new Date()` — mã phải ổn định qua mọi
 * lần chạy lại seed, nếu không sẽ sinh lô trùng mỗi lần seed.
 */
const NGAY_THU_HOACH_ANCHOR = '20261004';

function maLo(index: number): string {
  return `LO-${NGAY_THU_HOACH_ANCHOR}-${String(index + 1).padStart(3, '0')}`;
}

/** Bộ mã lô cũ (có chữ SEED) theo cùng thứ tự chỉ số, để đổi tên trong DB. */
function maLoCu(index: number): string {
  return `LO-SEED-${String(index + 1).padStart(3, '0')}`;
}

function maTruyXuatSeed(index: number): string {
  return `AGM-${(index + 1).toString(16).toUpperCase().padStart(32, '0')}`;
}

function makeTepTin(ten: string, mimeType = 'image/jpeg', kichThuoc = 250_000) {
  return {
    bucket: 'agrimarket-uploads',
    objectKey: `seed/${ten}`,
    tenGoc: ten,
    mimeType,
    kichThuoc,
    sha256: 'a'.repeat(64),
    nguoiTaiLenId: 'seed',
    nguoiTaiLen: 'Seed Script',
  };
}

function truNgay(ngay: Date, soNgay: number): Date {
  const result = new Date(ngay);
  result.setDate(result.getDate() - soNgay);
  return result;
}

function congNgay(ngay: Date, soNgay: number): Date {
  const result = new Date(ngay);
  result.setDate(result.getDate() + soNgay);
  return result;
}

async function damBaoTepTin(filename: string) {
  const objectKey = `seed/${filename}`;
  const current = await prisma.tepTin.findFirst({ where: { objectKey } });
  if (current) return current;
  return prisma.tepTin.create({ data: makeTepTin(filename) });
}

/**
 * ================= DEMO FIXTURE (LOCAL ONLY) =================
 * Tài khoản demo + đơn hàng mẫu + flash sale mẫu.
 * Mọi thực thể dùng mã ổn định, upsert/find-first → idempotent.
 */

const DEMO_CUSTOMER_EMAIL = (process.env.DEMO_CUSTOMER_EMAIL ?? 'demo.customer@agrimarket.local')
  .trim()
  .toLowerCase();
const DEMO_CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Demo-Customer-123';
const DEMO_ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@agrimarket.local')
  .trim()
  .toLowerCase();
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo-Admin-123';

/**
 * Mã đơn hàng demo cũng phải "sạch": demo customer đăng nhập vào tài khoản
 * demo.customer@agrimarket.local sẽ thấy đọc mã này trong danh sách đơn.
 * Đổi từ `MA_*_CU` trong `chuyenMaCongKhaiCu()` để DB cũ cũng đổng tên, không tạo đơn trùng.
 */
const DEMO_MA_DON_HANG = 'ORD-20261004-0001';
const DEMO_MA_DON_HANG_CU = 'AGM-DEMO-ORDER-001';
const DEMO_MA_DON_NCC = 'ORD-20261004-0001-01';
const DEMO_MA_DON_NCC_CU = 'AGM-DEMO-ORDER-001-01';
const DEMO_MA_THAM_CHIEU_DAT_CHO = `ORDER:${DEMO_MA_DON_HANG}`;
const DEMO_MA_GIAO_DICH = 'TT-20261004-0001';
const DEMO_MA_GIAO_DICH_CU = 'COD-DEMO-001';
const DEMO_MA_VAN_DON = 'VD-20261004-0001';
const DEMO_MA_VAN_DON_CU = 'VD-DEMO-001';
/** Lô phụ (cùng thu hoạch) dùng để demo multi-batch theo dòng lô. */
const MA_LO_THU_HAI = `${maLo(1)}B`;
const MA_LO_THU_HAI_CU = 'LO-SEED-002B';
const MA_THAM_CHIEU_LOYALTY = 'LOYALTY-20261004-0001';
const MA_THAM_CHIEU_LOYALTY_CU = 'LOYALTY-DEMO-001';
const DEMO_MA_TRUY_XUAT_LO_THU_HAI = 'AGM-000000000000000000000000000000DB';

function hashMatKhauDemo(matKhau: string): Promise<string> {
  // Cùng semantics với XacThucService.hash (argon2id).
  return argon2.hash(matKhau, { type: argon2.argon2id });
}

async function seedDemoNguoiDung() {
  // --- Customer demo ---
  let customerUser = await prisma.nguoiDung.findUnique({
    where: { email: DEMO_CUSTOMER_EMAIL },
    select: { id: true },
  });
  if (!customerUser) {
    customerUser = await prisma.nguoiDung.create({
      data: {
        email: DEMO_CUSTOMER_EMAIL,
        soDienThoai: '0909000001',
        matKhauHash: await hashMatKhauDemo(DEMO_CUSTOMER_PASSWORD),
        hoTen: 'Khách hàng Demo',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
      select: { id: true },
    });
  }
  let khachHang = await prisma.khachHang.findUnique({
    where: { nguoiDungId: customerUser.id },
    select: { id: true },
  });
  if (!khachHang) {
    khachHang = await prisma.khachHang.create({
      data: { nguoiDungId: customerUser.id, maKhachHang: 'KH-20261004-0001' },
      select: { id: true },
    });
  }
  const vaiTroKhach = await prisma.vaiTro.findFirst({
    where: { ma: 'KHACH_HANG', trangThai: TrangThaiBanGhi.HOAT_DONG },
    select: { id: true },
  });
  if (!vaiTroKhach) throw new Error('Thiếu role hệ thống KHACH_HANG. Hãy chạy migration RBAC.');
  const gansKhach = await prisma.nguoiDungVaiTro.findFirst({
    where: { nguoiDungId: customerUser.id, vaiTroId: vaiTroKhach.id },
  });
  if (!gansKhach) {
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: customerUser.id, vaiTroId: vaiTroKhach.id },
    });
  }

  // --- Admin demo (Staff + role ADMIN, đúng RBAC hiện hữu, không bypass) ---
  let adminUser = await prisma.nguoiDung.findUnique({
    where: { email: DEMO_ADMIN_EMAIL },
    select: { id: true },
  });
  if (!adminUser) {
    adminUser = await prisma.nguoiDung.create({
      data: {
        email: DEMO_ADMIN_EMAIL,
        soDienThoai: '0909000002',
        matKhauHash: await hashMatKhauDemo(DEMO_ADMIN_PASSWORD),
        hoTen: 'Quản trị Demo',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
      select: { id: true },
    });
  }
  const nhanVien = await prisma.nhanVien.findFirst({
    where: { nguoiDungId: adminUser.id },
    select: { id: true },
  });
  if (!nhanVien) {
    await prisma.nhanVien.create({
      data: {
        nguoiDungId: adminUser.id,
        maNhanVien: 'NV-20261004-0001',
        chucDanh: 'Quản trị hệ thống demo',
      },
      select: { id: true },
    });
  }
  const vaiTroAdmin = await prisma.vaiTro.findFirst({
    where: { ma: 'ADMIN', trangThai: TrangThaiBanGhi.HOAT_DONG },
    select: { id: true },
  });
  if (!vaiTroAdmin) throw new Error('Thiếu role hệ thống ADMIN. Hãy chạy migration RBAC.');
  const ganAdmin = await prisma.nguoiDungVaiTro.findFirst({
    where: { nguoiDungId: adminUser.id, vaiTroId: vaiTroAdmin.id },
  });
  if (!ganAdmin) {
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: adminUser.id, vaiTroId: vaiTroAdmin.id },
    });
  }

  // --- Địa chỉ demo trong phạm vi giao Hưng Yên (địa chỉ hư cấu) ---
  const diaChi = await prisma.diaChi.findFirst({
    where: { nguoiDungId: customerUser.id, dongDiaChi: '123 Đường Minh Khai (địa chỉ demo)' },
    select: { id: true },
  });
  const diaChiId = diaChi
    ? diaChi.id
    : (
        await prisma.diaChi.create({
          data: {
            nguoiDungId: customerUser.id,
            tenNguoiNhan: 'Khách hàng Demo',
            soDienThoai: '0909000001',
            dongDiaChi: '123 Đường Minh Khai (địa chỉ demo)',
            phuongXa: 'Phường Hiến Nam',
            quanHuyen: 'TP Hưng Yên',
            tinhThanh: 'Hưng Yên',
            macDinh: true,
          },
          select: { id: true },
        })
      ).id;

  console.log(`👤 Demo customer: ${DEMO_CUSTOMER_EMAIL} · admin: ${DEMO_ADMIN_EMAIL}`);
  return { customerUserId: customerUser.id, khachHangId: khachHang.id, diaChiId };
}

/**
 * Tên chiến dịch flash sale là NḍI CÔNG KHAI (header "Flash Sale" ở trang chủ, đểm và voucher).
 * Không dùng chỡ "DEMO": khách thấy tên này mà phải dữ liệu thử nghiệm.
 * `ten` là khoá định nhận vì với `findFirst` → đổi tên cũng giữ identity ốn định.
 */
const TEN_CHIEN_DICH_FLASH_SALE_CU = 'FLASH-SALE-DEMO-01';
const TEN_CHIEN_DICH_FLASH_SALE = 'Flash Sale Nông Sản Cuối Tuần';
const TEN_CHIEN_DICH_FLASH_SALE_MOTA =
  'ưu đãi nông sản tươi trong tuần, áp dụng tại AgriMarket.';

async function seedDemoFlashSale() {
  // Một chiến dịch demo duy nhất, cửa sổ hiệu lực xoay quanh thời điểm seed
  // (giữ identity ổn định qua `ten`, chỉ refresh window + trạng thái).
  const now = new Date();
  const batDauLuc = new Date(now.getTime() - 3_600_000);
  const ketThucLuc = new Date(now.getTime() + 7 * 86_400_000);

  let chienDich = await prisma.chienDichFlashSale.findFirst({
    where: { ten: TEN_CHIEN_DICH_FLASH_SALE },
    select: { id: true },
  });
  if (!chienDich) {
    chienDich = await prisma.chienDichFlashSale.create({
      data: {
        ten: TEN_CHIEN_DICH_FLASH_SALE,
        moTa: TEN_CHIEN_DICH_FLASH_SALE_MOTA,
        batDauLuc,
        ketThucLuc,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
  } else {
    await prisma.chienDichFlashSale.update({
      where: { id: chienDich.id },
      data: { batDauLuc, ketThucLuc, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
  }

  // 4 món flash demo (tránh 2 món dùng trong đơn demo Cà chua bi đỏ / Rau cải xanh
  // để tách bạch giá). Mỗi món có tỷ lệ giảm khác nhau để badge đa dạng.
  const matHangFlash: Array<{ ten: string; tyLeGiam: number }> = [
    { ten: 'Rau xà lách thủy canh', tyLeGiam: 0.2 },
    { ten: 'Bông cải xanh', tyLeGiam: 0.15 },
    { ten: 'Bí đỏ', tyLeGiam: 0.1 },
    { ten: 'Cam sành', tyLeGiam: 0.12 },
  ];
  for (const matHang of matHangFlash) {
    const sanPham = await prisma.sanPham.findFirst({
      where: { ten: matHang.ten },
      select: { id: true },
    });
    if (!sanPham) throw new Error(`Thiếu sản phẩm demo cho flash sale: ${matHang.ten}.`);
    const variant = await prisma.bienTheSanPham.findFirst({
      where: { sanPhamId: sanPham.id },
      orderBy: { khoiLuong: 'asc' },
      select: { id: true, gia: true },
    });
    if (!variant) throw new Error(`Thiếu biến thể demo cho flash sale: ${matHang.ten}.`);
    const giaGoc = Number(variant.gia);
    const giaFlash = Math.max(1_000, Math.round(giaGoc * (1 - matHang.tyLeGiam)));
    if (!(giaFlash > 0 && giaFlash < giaGoc)) {
      throw new Error(`Giá flash demo không thỏa 0 < giaFlash < giaGoc (${matHang.ten}).`);
    }

    const muc = await prisma.mucFlashSale.findFirst({
      where: { chienDichId: chienDich.id, bienTheSanPhamId: variant.id },
      select: { id: true },
    });
    if (!muc) {
      await prisma.mucFlashSale.create({
        data: {
          chienDichId: chienDich.id,
          bienTheSanPhamId: variant.id,
          giaFlash: giaFlash.toString(),
          gioiHanTong: 100,
          gioiHanMoiKhach: 5,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      });
    } else {
      await prisma.mucFlashSale.update({
        where: { id: muc.id },
        data: { giaFlash: giaFlash.toString(), trangThai: TrangThaiBanGhi.HOAT_DONG },
      });
    }
    console.log(`⚡ Flash sale demo: ${matHang.ten} ${giaFlash}/${giaGoc} (biến thể ${variant.id}).`);
  }
}

type DemoOrderCtx = {
  khachHangId: string;
  diaChiId: string;
  khoId: string;
  nccId: string;
};

/**
 * Đơn mẫu ORD-20261004-0001 (DA_GIAO, COD PAID):
 * - Item A (Cà chua bi đỏ ×3) phân bổ 2 lô → demo multi-batch trace.
 * - Item B (Rau cải xanh ×2) phân bổ 1 lô.
 * Tồn kho reconcile về giá trị cuối (không decrement lặp khi rerun).
 */
async function seedDemoOrder(ctx: DemoOrderCtx) {
  const now = new Date();

  async function layBienThe(tenSanPham: string) {
    const sanPham = await prisma.sanPham.findFirst({
      where: { ten: tenSanPham },
      select: {
        id: true,
        ten: true,
        trangTraiId: true,
        danhMucSanPhamId: true,
        trangTrai: { select: { id: true, ma: true, ten: true } },
      },
    });
    if (!sanPham) throw new Error(`Thiếu sản phẩm demo: ${tenSanPham}.`);
    const variant = await prisma.bienTheSanPham.findFirst({
      where: { sanPhamId: sanPham.id },
      orderBy: { khoiLuong: 'asc' },
      select: { id: true, sku: true, khoiLuong: true, donVi: true, gia: true },
    });
    if (!variant) throw new Error(`Thiếu biến thể demo: ${tenSanPham}.`);
    return { sanPham, variant };
  }

  const itemA = await layBienThe('Cà chua bi đỏ');
  const itemB = await layBienThe('Rau cải xanh');

  // Lô thứ hai cho biến thể A (cùng thu hoạch với lô chính) để demo multi-batch.
  const lotA1 = await prisma.loSanPham.findFirst({
    where: { maLo: maLo(1) },
    select: { id: true, thuHoachId: true, maTruyXuat: true },
  });
  const lotB = await prisma.loSanPham.findFirst({
    where: { maLo: maLo(2) },
    select: { id: true, maTruyXuat: true },
  });
  if (!lotA1 || !lotB) throw new Error(`Thiếu lô chính ${maLo(1)}/${maLo(2)}.`);
  if (!lotA1.maTruyXuat || !lotB.maTruyXuat) {
    throw new Error('Lô demo thiếu maTruyXuat.');
  }
  let lotA2 = await prisma.loSanPham.findFirst({
    where: { maLo: MA_LO_THU_HAI },
    select: { id: true, maTruyXuat: true },
  });
  if (!lotA2) {
    const tao = await prisma.loSanPham.create({
      data: {
        maLo: MA_LO_THU_HAI,
        thuHoachId: lotA1.thuHoachId,
        soLuong: '200.000',
        conLai: '200.000',
        phanHangChatLuong: 'A',
        ngayHetHan: congNgay(now, 45),
        trangThai: 'CO_THE_BAN',
        maTruyXuat: DEMO_MA_TRUY_XUAT_LO_THU_HAI,
      },
      select: { id: true, maTruyXuat: true },
    });
    lotA2 = tao;
  } else if (lotA2.maTruyXuat !== DEMO_MA_TRUY_XUAT_LO_THU_HAI) {
    lotA2 = await prisma.loSanPham.update({
      where: { id: lotA2.id },
      data: { maTruyXuat: DEMO_MA_TRUY_XUAT_LO_THU_HAI },
      select: { id: true, maTruyXuat: true },
    });
  }
  if (!lotA2.maTruyXuat) throw new Error('Lô demo thứ hai thiếu maTruyXuat.');

  // TonKhoLo cho 3 lô liên quan (base 100/50 như seed, reconcile bên dưới).
  async function damBaoTonKhoLo(loSanPhamId: string, bienTheId: string, base: string) {
    const ton = await prisma.tonKhoLo.findFirst({
      where: { khoId: ctx.khoId, loSanPhamId, bienTheSanPhamId: bienTheId },
      select: { id: true },
    });
    if (ton) return ton;
    return prisma.tonKhoLo.create({
      data: {
        khoId: ctx.khoId,
        loSanPhamId,
        bienTheSanPhamId: bienTheId,
        onHand: base,
        reserved: '0',
        blocked: '0',
      },
      select: { id: true },
    });
  }
  const tonA1 = await damBaoTonKhoLo(lotA1.id, itemA.variant.id, '100.000');
  const tonA2 = await damBaoTonKhoLo(lotA2.id, itemA.variant.id, '50.000');
  const tonB = await damBaoTonKhoLo(lotB.id, itemB.variant.id, '100.000');

  // Phân bổ demo: A(3) = A1(2) + A2(1); B(2) = B(2).
  const phanBoKeHoach = [
    { tonKhoLoId: tonA1.id, soLuong: '2.000' },
    { tonKhoLoId: tonA2.id, soLuong: '1.000' },
  ];
  const phanBoB = [{ tonKhoLoId: tonB.id, soLuong: '2.000' }];

  const giaA = Number(itemA.variant.gia);
  const giaB = Number(itemB.variant.gia);
  const tamTinh = giaA * 3 + giaB * 2;

  const diaChi = await prisma.diaChi.findUniqueOrThrow({
    where: { id: ctx.diaChiId },
    select: {
      tenNguoiNhan: true,
      soDienThoai: true,
      dongDiaChi: true,
      phuongXa: true,
      quanHuyen: true,
      tinhThanh: true,
      maBuuChinh: true,
    },
  });
  const diaChiSnapshot = [
    diaChi.dongDiaChi,
    diaChi.phuongXa,
    diaChi.quanHuyen,
    diaChi.tinhThanh,
    diaChi.maBuuChinh,
  ]
    .filter(Boolean)
    .join(', ');

  const ngayDat = new Date(now.getTime() - 3 * 86_400_000);

  let donHang = await prisma.donHang.findUnique({
    where: { maDonHang: DEMO_MA_DON_HANG },
    select: { id: true },
  });
  if (!donHang) {
    donHang = await prisma.donHang.create({
      data: {
        maDonHang: DEMO_MA_DON_HANG,
        maYeuCau: '22222222-2222-4222-8222-222222222222',
        khachHangId: ctx.khachHangId,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tongTien: tamTinh.toString(),
        tamTinhHangHoa: tamTinh.toString(),
        phiVanChuyen: '0',
        giamKhuyenMai: '0',
        diemDaDung: 0,
        giaTriDiemDaDung: '0',
        diaChiGiaoHangId: ctx.diaChiId,
        tenNguoiNhanSnapshot: diaChi.tenNguoiNhan,
        soDienThoaiSnapshot: diaChi.soDienThoai,
        diaChiGiaoHangSnapshot: diaChiSnapshot,
        createdAt: ngayDat,
      },
      select: { id: true },
    });
  } else {
    await prisma.donHang.update({
      where: { id: donHang.id },
      data: {
        trangThai: TrangThaiDonHang.DA_GIAO,
        tongTien: tamTinh.toString(),
        tamTinhHangHoa: tamTinh.toString(),
      },
    });
  }

  let suborder = await prisma.donHangNhaCungCap.findUnique({
    where: { maDon: DEMO_MA_DON_NCC },
    select: { id: true },
  });
  if (!suborder) {
    suborder = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: DEMO_MA_DON_NCC,
        donHangId: donHang.id,
        nhaCungCapId: ctx.nccId,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tamTinh: tamTinh.toString(),
      },
      select: { id: true },
    });
  } else {
    await prisma.donHangNhaCungCap.update({
      where: { id: suborder.id },
      data: { trangThai: TrangThaiDonHang.DA_GIAO, tamTinh: tamTinh.toString() },
    });
  }

  async function upsertMuc(
    bienThe: { id: string; sku: string; khoiLuong: unknown; donVi: string; gia: unknown },
    sanPham: { id: string; ten: string; danhMucSanPhamId: string; trangTrai: { id: string; ma: string; ten: string } },
    soLuong: number,
  ) {
    const data = {
      donHangNhaCungCapId: suborder.id,
      sanPhamId: sanPham.id,
      danhMucSanPhamIdSnapshot: sanPham.danhMucSanPhamId,
      bienTheSanPhamId: bienThe.id,
      trangTraiId: sanPham.trangTrai.id,
      soLuong,
      donGiaSnapshot: Number(bienThe.gia).toString(),
      tenSanPhamSnapshot: sanPham.ten,
      skuBienTheSnapshot: bienThe.sku,
      khoiLuongBienTheSnapshot: Number(bienThe.khoiLuong).toString(),
      donViBienTheSnapshot: bienThe.donVi,
      maTrangTraiSnapshot: sanPham.trangTrai.ma,
      tenTrangTraiSnapshot: sanPham.trangTrai.ten,
    };
    const daCo = await prisma.mucDonHang.findFirst({
      where: { donHangNhaCungCapId: suborder.id, bienTheSanPhamId: bienThe.id },
      select: { id: true },
    });
    if (daCo) {
      await prisma.mucDonHang.update({ where: { id: daCo.id }, data });
      return daCo.id;
    }
    const moi = await prisma.mucDonHang.create({ data, select: { id: true } });
    return moi.id;
  }

  const mucAId = await upsertMuc(itemA.variant, itemA.sanPham, 3);
  const mucBId = await upsertMuc(itemB.variant, itemB.sanPham, 2);

  // Allocation: xóa-tạo lại theo tập ổn định (unique muc+lot) → không trùng.
  await prisma.phanBoDonHang.deleteMany({ where: { mucDonHangId: mucAId } });
  await prisma.phanBoDonHang.createMany({
    data: phanBoKeHoach.map((p) => ({ mucDonHangId: mucAId, ...p })),
  });
  await prisma.phanBoDonHang.deleteMany({ where: { mucDonHangId: mucBId } });
  await prisma.phanBoDonHang.createMany({
    data: phanBoB.map((p) => ({ mucDonHangId: mucBId, ...p })),
  });

  // Reservation DA_BAN + ledger ORDER_RESERVE/ORDER_SHIP (mirror service).
  let datCho = await prisma.datChoTonKho.findUnique({
    where: { maThamChieu: DEMO_MA_THAM_CHIEU_DAT_CHO },
    select: { id: true },
  });
  if (!datCho) {
    datCho = await prisma.datChoTonKho.create({
      data: {
        maThamChieu: DEMO_MA_THAM_CHIEU_DAT_CHO,
        trangThai: TrangThaiDatChoTonKho.DA_BAN,
        hetHanLuc: new Date(now.getTime() - 2 * 86_400_000),
        ketThucLuc: new Date(now.getTime() - 2 * 86_400_000),
      },
      select: { id: true },
    });
  } else {
    await prisma.datChoTonKho.update({
      where: { id: datCho.id },
      data: { trangThai: TrangThaiDatChoTonKho.DA_BAN, ketThucLuc: new Date(now.getTime() - 2 * 86_400_000) },
    });
  }
  const mucDatCho = [
    ...phanBoKeHoach.map((p, i) => ({ ...p, thuTu: i })),
    ...phanBoB.map((p, i) => ({ ...p, thuTu: phanBoKeHoach.length + i })),
  ];
  for (const muc of mucDatCho) {
    await prisma.mucDatChoTonKho.upsert({
      where: {
        datChoTonKhoId_tonKhoLoId: { datChoTonKhoId: datCho.id, tonKhoLoId: muc.tonKhoLoId },
      },
      update: { soLuong: muc.soLuong, thuTu: muc.thuTu },
      create: {
        datChoTonKhoId: datCho.id,
        tonKhoLoId: muc.tonKhoLoId,
        soLuong: muc.soLuong,
        thuTu: muc.thuTu,
      },
    });
  }

  // Reconcile tồn kho về trạng thái cuối (đã bán): onHand = base - allocated.
  async function reconcileTonKho(tonKhoLoId: string, base: string, allocated: string) {
    const onHand = (Number(base) - Number(allocated)).toFixed(3);
    await prisma.tonKhoLo.update({
      where: { id: tonKhoLoId },
      data: { onHand, reserved: '0', blocked: '0' },
    });
    for (const loai of ['ORDER_RESERVE', 'ORDER_SHIP'] as const) {
      const daCo = await prisma.giaoDichTonKho.findFirst({
        where: { tonKhoLoId, loai },
      });
      if (!daCo) {
        await prisma.giaoDichTonKho.create({
          data: { tonKhoLoId, loai, soLuong: allocated },
        });
      }
    }
  }
  await reconcileTonKho(tonA1.id, '100.000', '2.000');
  await reconcileTonKho(tonA2.id, '50.000', '1.000');
  await reconcileTonKho(tonB.id, '100.000', '2.000');

  // Payment COD PAID (order/payment status tách biệt).
  let thanhToan = await prisma.thanhToan.findFirst({
    where: { donHangId: donHang.id },
    select: { id: true },
  });
  if (!thanhToan) {
    thanhToan = await prisma.thanhToan.create({
      data: {
        donHangId: donHang.id,
        soTien: tamTinh.toString(),
        phuongThuc: 'COD',
        trangThai: TrangThaiThanhToan.PAID,
      },
      select: { id: true },
    });
    await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: thanhToan.id,
        maGiaoDich: DEMO_MA_GIAO_DICH,
        soTien: tamTinh.toString(),
        phuongThuc: 'COD',
        trangThai: TrangThaiThanhToan.PAID,
      },
    });
  }

  // Shipment DELIVERED + timeline (refresh thời gian mỗi lần seed để demo tươi).
  const giaoLuc = new Date(now.getTime() - 2 * 86_400_000);
  let vanChuyen = await prisma.vanChuyen.findFirst({
    where: { donHangNhaCungCapId: suborder.id },
    select: { id: true },
  });
  if (!vanChuyen) {
    vanChuyen = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: suborder.id,
        maVanDon: DEMO_MA_VAN_DON,
        trangThai: TrangThaiVanChuyen.DELIVERED,
      },
      select: { id: true },
    });
  } else {
    await prisma.vanChuyen.update({
      where: { id: vanChuyen.id },
      data: { trangThai: TrangThaiVanChuyen.DELIVERED },
    });
  }
  const suKienTimeline: Array<{
    trangThai: (typeof TrangThaiVanChuyen)[keyof typeof TrangThaiVanChuyen];
    moTa: string;
    viTri: string;
    thoiGian: Date;
  }> = [
    { trangThai: TrangThaiVanChuyen.CREATED, moTa: 'Tạo vận đơn demo', viTri: 'Kho Home AgriMarket', thoiGian: new Date(now.getTime() - 4 * 86_400_000) },
    { trangThai: TrangThaiVanChuyen.PICKED_UP, moTa: 'Đã lấy hàng (demo)', viTri: 'Kho Home AgriMarket', thoiGian: new Date(now.getTime() - 4 * 86_400_000 + 3_600_000) },
    { trangThai: TrangThaiVanChuyen.IN_TRANSIT, moTa: 'Đang vận chuyển (demo)', viTri: 'Hưng Yên', thoiGian: new Date(now.getTime() - 3 * 86_400_000) },
    { trangThai: TrangThaiVanChuyen.OUT_FOR_DELIVERY, moTa: 'Đang giao hàng (demo)', viTri: 'TP Hưng Yên', thoiGian: new Date(now.getTime() - 2 * 86_400_000 - 3_600_000) },
    { trangThai: TrangThaiVanChuyen.DELIVERED, moTa: 'Đã giao hàng (demo)', viTri: 'TP Hưng Yên', thoiGian: giaoLuc },
  ];
  for (const suKien of suKienTimeline) {
    const daCo = await prisma.suKienTheoDoiVanChuyen.findFirst({
      where: { vanChuyenId: vanChuyen.id, trangThai: suKien.trangThai },
      select: { id: true },
    });
    if (daCo) {
      await prisma.suKienTheoDoiVanChuyen.update({
        where: { id: daCo.id },
        data: { moTa: suKien.moTa, viTri: suKien.viTri, thoiGian: suKien.thoiGian },
      });
    } else {
      await prisma.suKienTheoDoiVanChuyen.create({
        data: {
          vanChuyenId: vanChuyen.id,
          trangThai: suKien.trangThai,
          moTa: suKien.moTa,
          viTri: suKien.viTri,
          thoiGian: suKien.thoiGian,
        },
      });
    }
  }

  // Review (đủ điều kiện: đã có VanChuyen) cho item A.
  const review = await prisma.danhGia.findFirst({
    where: { mucDonHangId: mucAId },
    select: { id: true },
  });
  if (!review) {
    await prisma.danhGia.create({
      data: {
        mucDonHangId: mucAId,
        diem: 5,
        binhLuan: 'Sản phẩm tươi ngon, truy xuất rõ ràng từng lô. (Đánh giá demo)',
      },
    });
  }

  // Complaint (trong hạn: DELIVERED cách 2 ngày < 7 ngày mặc định) cho item B.
  const khieuNai = await prisma.khieuNai.findFirst({
    where: { mucDonHangId: mucBId },
    select: { id: true },
  });
  if (!khieuNai) {
    await prisma.khieuNai.create({
      data: {
        maKhieuNai: 'KN-20261004-0001',
        mucDonHangId: mucBId,
        lyDo: LyDoKhieuNai.HONG,
        moTa: 'Một ít rau bị héo trong quá trình vận chuyển demo. (Khiếu nại demo)',
      },
    });
  }

  console.log(`🧾 Demo order: ${DEMO_MA_DON_HANG} · item A(3)→2 lô · item B(2)→1 lô · COD PAID · DELIVERED.`);
  return { donHangId: donHang.id, mucAId, mucBId, traceCodes: [lotA1.maTruyXuat!, lotA2.maTruyXuat!, lotB.maTruyXuat!] };
}

async function seedDemoTuongTac(khachHangId: string) {
  const farm = await prisma.trangTrai.findFirst({
    where: { ma: 'TT-MINH-BACH-01' },
    select: { id: true },
  });
  if (!farm) throw new Error('Thiếu trang trải TT-MINH-BACH-01.');
  const theoDoi = await prisma.theoDoiTrangTrai.findFirst({
    where: { khachHangId, trangTraiId: farm.id },
    select: { id: true },
  });
  if (!theoDoi) {
    await prisma.theoDoiTrangTrai.create({
      data: { khachHangId, trangTraiId: farm.id },
    });
  }

  const sanPham = await prisma.sanPham.findFirst({
    where: { ten: 'Rau xà lách thủy canh' },
    select: { id: true },
  });
  if (!sanPham) throw new Error('Thiếu sản phẩm demo wishlist.');
  const yeuThich = await prisma.sanPhamYeuThich.findFirst({
    where: { khachHangId, sanPhamId: sanPham.id },
    select: { id: true },
  });
  if (!yeuThich) {
    await prisma.sanPhamYeuThich.create({
      data: { khachHangId, sanPhamId: sanPham.id },
    });
  }

  // Loyalty qua ledger thật: số dư = tổng biến động.
  let taiKhoan = await prisma.taiKhoanLoyalty.findUnique({
    where: { khachHangId },
    select: { id: true, diem: true },
  });
  if (!taiKhoan) {
    taiKhoan = await prisma.taiKhoanLoyalty.create({
      data: { khachHangId, diem: 100 },
      select: { id: true, diem: true },
    });
  }
  const giaoDich = await prisma.giaoDichLoyalty.findFirst({
    where: { maThamChieu: MA_THAM_CHIEU_LOYALTY },
    select: { id: true },
  });
  if (!giaoDich) {
    await prisma.giaoDichLoyalty.create({
      data: {
        loyaltyAccountId: taiKhoan.id,
        maThamChieu: MA_THAM_CHIEU_LOYALTY,
        bienDongDiem: 100,
        soDuSau: 100,
        lyDo: 'Điểm thưởng chào mừng demo',
      },
    });
    if (taiKhoan.diem !== 100) {
      await prisma.taiKhoanLoyalty.update({
        where: { id: taiKhoan.id },
        data: { diem: 100 },
      });
    }
  }

  console.log('💚 Demo follow + wishlist + loyalty seeded.');
}

async function seedDemoHoaHong(nccId: string) {
  // Chỉ seed QUY TẮC (cấu hình), không seed tiền settlement/payout.
  const rauCu = await prisma.danhMucSanPham.findFirst({
    where: { slug: 'rau-cu' },
    select: { id: true },
  });
  if (!rauCu) throw new Error('Thiếu danh mục rau-cu cho quy tắc demo.');
  const hieuLucTu = new Date('2026-01-01T00:00:00.000Z');
  const daCo = await prisma.quyTacHoaHong.findFirst({
    where: { nhaCungCapId: nccId, danhMucSanPhamId: rauCu.id, hieuLucTu },
    select: { id: true },
  });
  if (!daCo) {
    await prisma.quyTacHoaHong.create({
      data: {
        tyLe: '5.00',
        danhMucSanPhamId: rauCu.id,
        nhaCungCapId: nccId,
        hieuLucTu,
      },
    });
    console.log('💰 Demo commission rule: 5% Rau củ từ 2026-01-01.');
  }
}

async function seedDemoAssertions() {
  const loi: string[] = [];
  const check = (dieuKien: boolean, moTa: string) => {
    if (!dieuKien) loi.push(moTa);
  };

  const customer = await prisma.nguoiDung.findUnique({
    where: { email: DEMO_CUSTOMER_EMAIL },
    select: { id: true },
  });
  check(!!customer, 'Thiếu demo customer.');
  const admin = await prisma.nguoiDung.findUnique({
    where: { email: DEMO_ADMIN_EMAIL },
    select: { id: true },
  });
  check(!!admin, 'Thiếu demo admin.');
  if (admin) {
    const quyenAdmin = await prisma.nguoiDungVaiTro.findFirst({
      where: {
        nguoiDungId: admin.id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        vaiTro: { ma: 'ADMIN', trangThai: TrangThaiBanGhi.HOAT_DONG },
      },
      select: { id: true, vaiTroId: true },
    });
    check(!!quyenAdmin, 'Demo admin thiếu role ADMIN.');
    if (quyenAdmin) {
      const soQuyen = await prisma.vaiTroQuyen.count({
        where: { vaiTroId: quyenAdmin.vaiTroId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      });
      check(soQuyen > 0, 'Role ADMIN không có quyền nào.');
    }
  }

  const donHang = await prisma.donHang.findUnique({
    where: { maDonHang: DEMO_MA_DON_HANG },
    include: {
      donNhaCungCap: {
        include: {
          muc: { include: { phanBo: { include: { tonKhoLo: { include: { loSanPham: true } } } } } },
        },
      },
    },
  });
  check(!!donHang, 'Thiếu demo order.');
  const cacMuc = donHang?.donNhaCungCap.flatMap((s) => s.muc) ?? [];
  check(cacMuc.length >= 2, 'Demo order thiếu MucDonHang.');
  const cacPhanBo = cacMuc.flatMap((m) => m.phanBo);
  check(cacPhanBo.length >= 3, 'Demo order thiếu PhanBoDonHang (kỳ vọng multi-batch).');
  for (const muc of cacMuc) {
    check(Number(muc.donGiaSnapshot) > 0, `Snapshot giá không dương (${muc.id}).`);
    const tongPhanBo = muc.phanBo.reduce((t, p) => t + Number(p.soLuong), 0);
    check(Math.abs(tongPhanBo - muc.soLuong) < 1e-9, `Allocation lệch số lượng (${muc.id}).`);
    for (const pb of muc.phanBo) {
      check(!!pb.tonKhoLo.loSanPham.maTruyXuat, `Allocation thiếu maTruyXuat (${pb.id}).`);
      check(
        pb.tonKhoLo.bienTheSanPhamId === muc.bienTheSanPhamId,
        `Allocation sai biến thể (${pb.id}).`,
      );
    }
  }
  const loIds = [...new Set(cacPhanBo.map((p) => p.tonKhoLo.loSanPhamId))];
  check(loIds.length >= 3, 'Demo order phải chạm ≥3 lô (multi-batch).');
  for (const loId of loIds) {
    const lo = await prisma.loSanPham.findUnique({
      where: { id: loId },
      include: { thuHoach: { include: { muaVu: { include: { trangTrai: true } } } } },
    });
    check(!!lo?.thuHoach?.muaVu?.trangTrai, `Lô thiếu provenance (${loId}).`);
  }

  const cacTon = await prisma.tonKhoLo.findMany({
    where: { id: { in: [...new Set(cacPhanBo.map((p) => p.tonKhoLoId))] } },
  });
  for (const ton of cacTon) {
    const available = Number(ton.onHand) - Number(ton.reserved) - Number(ton.blocked);
    check(available >= -1e-9, `Tồn kho âm (${ton.id}).`);
    check(Number(ton.reserved) >= -1e-9, `Reserved âm (${ton.id}).`);
  }

  if (loi.length > 0) {
    console.error('❌ Seed assertions failed:');
    for (const item of loi) console.error(` - ${item}`);
    process.exit(1);
  }
  console.log('✅ Seed assertions passed.');
}

async function main() {
  if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
    console.error('Từ chối seed demo khi NODE_ENV=production hoặc APP_ENV=production.');
    process.exit(1);
  }

  console.log('🌱 Seed demo AgriMarket (product domain final)...');

  // Đổi mã công khai cũ (TT-SEED/LO-SEED/NCC-SEED/DEMO-*) sang mã nghiệp vụ
  // TRước các upsert phí dữ liệu cũ không tạo bản ghi mối.
  await chuyenMaCongKhaiCu();
  await ngungHoatDongChienDichFlashSaleCu();

  const ncc = await prisma.nhaCungCap.upsert({
    where: { ma: NHA_CUNG_CAP.ma },
    update: NHA_CUNG_CAP,
    create: NHA_CUNG_CAP,
  });

  const farmByMa = new Map<string, { id: string; ma: string; ten: string; diaChi: string }>();
  const now = new Date();

  for (const farm of FARMS) {
    const row = await prisma.trangTrai.upsert({
      where: { ma: farm.ma },
      update: {
        ten: farm.ten,
        diaChi: farm.diaChi,
        viDo: farm.viDo,
        kinhDo: farm.kinhDo,
        dienTichHa: farm.dienTichHa,
        nhaCungCapId: ncc.id,
      },
      create: {
        ma: farm.ma,
        ten: farm.ten,
        diaChi: farm.diaChi,
        viDo: farm.viDo,
        kinhDo: farm.kinhDo,
        dienTichHa: farm.dienTichHa,
        nhaCungCapId: ncc.id,
      },
    });
    farmByMa.set(farm.ma, row);

    const farmFile = await damBaoTepTin(farm.image);
    const farmImage = await prisma.trangTraiAnh.findFirst({
      where: { trangTraiId: row.id, tepTinId: farmFile.id },
    });
    if (!farmImage) {
      await prisma.trangTraiAnh.create({
        data: { trangTraiId: row.id, tepTinId: farmFile.id, thuTu: 0 },
      });
    }

    // Xóa chứng nhận cũ gây hiểu nhầm rồi tạo chứng nhận demo đúng ngữ nghĩa.
    await prisma.chungNhan.deleteMany({
      where: { trangTraiId: row.id, ma: { in: MA_CHUNG_NHAN_CU } },
    });
    await prisma.chungNhan.upsert({
      where: { ma: farm.certificateCode },
      update: {
        trangTraiId: row.id,
        loai: farm.certificate,
        donViCap: farm.certificateIssuer,
        ngayCap: new Date('2026-01-01'),
        ngayHetHan: new Date('2028-12-31'),
        tepTinId: farmFile.id,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: now,
      },
      create: {
        trangTraiId: row.id,
        loai: farm.certificate,
        ma: farm.certificateCode,
        donViCap: farm.certificateIssuer,
        ngayCap: new Date('2026-01-01'),
        ngayHetHan: new Date('2028-12-31'),
        tepTinId: farmFile.id,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: now,
      },
    });
  }

  const danhMucMap = new Map<string, string>();
  for (const dm of DANH_MUC) {
    const row = await prisma.danhMucSanPham.upsert({
      where: { slug: dm.slug },
      update: { ten: dm.ten },
      create: dm,
    });
    danhMucMap.set(dm.ten, row.id);
  }

  // "Organic" không phải danh mục (Hữu cơ là chứng nhận): chuyển sản phẩm
  // còn sót về Rau củ rồi vô hiệu hóa danh mục để facets/list sạch.
  const organicCu = await prisma.danhMucSanPham.findFirst({ where: { slug: 'organic' } });
  if (organicCu) {
    const rauCuId = danhMucMap.get('Rau củ');
    if (rauCuId) {
      await prisma.sanPham.updateMany({
        where: { danhMucSanPhamId: organicCu.id },
        data: { danhMucSanPhamId: rauCuId },
      });
    }
    await prisma.danhMucSanPham.update({
      where: { id: organicCu.id },
      data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
    });
  }

  const kho = await prisma.kho.upsert({
    where: { maKho: KHO_MA },
    update: { ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
    create: { maKho: KHO_MA, ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
  });

  for (let index = 0; index < SAN_PHAM.length; index += 1) {
    const sp = SAN_PHAM[index]!;
    const farm = farmByMa.get(sp.farmMa);
    const danhMucSanPhamId = danhMucMap.get(sp.danhMuc);
    if (!farm || !danhMucSanPhamId) continue;

    let sanPham = await prisma.sanPham.findFirst({ where: { ten: sp.ten } });
    if (!sanPham) {
      sanPham = await prisma.sanPham.create({
        data: {
          ten: sp.ten,
          moTa: sp.moTa,
          trangTraiId: farm.id,
          danhMucSanPhamId,
        },
      });
    } else {
      sanPham = await prisma.sanPham.update({
        where: { id: sanPham.id },
        data: {
          moTa: sp.moTa,
          trangTraiId: farm.id,
          danhMucSanPhamId,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      });
    }

    const file = await damBaoTepTin(sp.image);
    await prisma.sanPhamAnh.updateMany({
      where: { sanPhamId: sanPham.id, tepTinId: { not: file.id } },
      data: { laAnhBia: false },
    });
    // Gỡ ảnh gallery dùng chung sai loại còn sót từ seed cũ.
    const tepGalleryCu = await prisma.tepTin.findMany({
      where: { objectKey: { in: ['seed/cam-chanh-da-xanh.jpg'] } },
      select: { id: true },
    });
    if (tepGalleryCu.length > 0) {
      await prisma.sanPhamAnh.deleteMany({
        where: {
          sanPhamId: sanPham.id,
          tepTinId: { in: tepGalleryCu.map((item) => item.id) },
        },
      });
    }
    const currentImage = await prisma.sanPhamAnh.findFirst({
      where: { sanPhamId: sanPham.id, tepTinId: file.id },
    });
    if (!currentImage) {
      await prisma.sanPhamAnh.create({
        data: { sanPhamId: sanPham.id, tepTinId: file.id, laAnhBia: true, thuTu: 0 },
      });
    } else {
      await prisma.sanPhamAnh.update({
        where: { id: currentImage.id },
        data: { laAnhBia: true, thuTu: 0 },
      });
    }

    let variant = await prisma.bienTheSanPham.findFirst({
      where: { sanPhamId: sanPham.id, khoiLuong: sp.khoiLuong, donVi: sp.donVi },
    });
    if (!variant) {
      variant = await prisma.bienTheSanPham.create({
        data: {
          sanPhamId: sanPham.id,
          sku: `HOME-${String(index + 1).padStart(3, '0')}`,
          khoiLuong: sp.khoiLuong,
          gia: sp.gia.toString(),
          donVi: sp.donVi,
        },
      });
    } else {
      variant = await prisma.bienTheSanPham.update({
        where: { id: variant.id },
        data: { gia: sp.gia.toString() },
      });
    }

    await prisma.bienTheSanPham.updateMany({
      where: { sanPhamId: sanPham.id, id: { not: variant.id } },
      data: { gia: String(sp.gia * 2) },
    });

    // Chuỗi lô RIÊNG của sản phẩm: MuaVu/ThuHoach đúng loại cây/vật nuôi.
    const ngayThuHoach = truNgay(now, (index % 9) + 1);
    let muaVu = await prisma.muaVu.findFirst({
      where: { trangTraiId: farm.id, cayTrong: sp.cayTrong, giong: sp.giong },
    });
    if (!muaVu) {
      muaVu = await prisma.muaVu.create({
        data: {
          trangTraiId: farm.id,
          cayTrong: sp.cayTrong,
          giong: sp.giong,
          ngayTrong: truNgay(ngayThuHoach, 60),
          ngayDuKienThuHoach: ngayThuHoach,
          sanLuongDuKienKg: '1200.000',
        },
      });
    }

    let thuHoach = await prisma.thuHoach.findFirst({
      where: { muaVuId: muaVu.id, phanLoai: 'Loại 1 - Seed demo' },
    });
    if (!thuHoach) {
      thuHoach = await prisma.thuHoach.create({
        data: {
          muaVuId: muaVu.id,
          ngayThuHoach,
          soLuong: '950.000',
          donVi: sp.donVi === 'quả' || sp.donVi === 'lít' ? sp.donVi : 'kg',
          phanLoai: 'Loại 1 - Seed demo',
        },
      });
    } else {
      thuHoach = await prisma.thuHoach.update({
        where: { id: thuHoach.id },
        data: { ngayThuHoach, soLuong: '950.000' },
      });
    }

    // Nhật ký canh tác công khai tối thiểu để trace demo có nội dung thật.
    const nhatKyMau = [
      { loaiSuKien: 'TUOI' as const, noiDung: `Tưới chăm sóc ${sp.cayTrong} định kỳ.` },
      { loaiSuKien: 'KIEM_TRA' as const, noiDung: `Kiểm tra chất lượng ${sp.cayTrong} trước thu hoạch.` },
    ];
    for (const nhatKy of nhatKyMau) {
      const daCo = await prisma.nhatKyCanhTac.findFirst({
        where: { muaVuId: muaVu.id, noiDung: nhatKy.noiDung },
      });
      if (!daCo) {
        await prisma.nhatKyCanhTac.create({
          data: {
            muaVuId: muaVu.id,
            loaiSuKien: nhatKy.loaiSuKien,
            thoiGian: truNgay(ngayThuHoach, 7),
            noiDung: nhatKy.noiDung,
            hienThiCongKhai: true,
          },
        });
      }
    }

    const hetHan = sp.ten === 'Mật ong rừng' ? congNgay(now, 365) : congNgay(now, 45);
    const lot = await prisma.loSanPham.upsert({
      where: { maLo: maLo(index) },
      update: {
        thuHoachId: thuHoach.id,
        soLuong: '950.000',
        conLai: '800.000',
        phanHangChatLuong: 'A',
        ngayHetHan: hetHan,
        trangThai: 'CO_THE_BAN',
        maTruyXuat: maTruyXuatSeed(index),
      },
      create: {
        maLo: maLo(index),
        thuHoachId: thuHoach.id,
        soLuong: '950.000',
        conLai: '800.000',
        phanHangChatLuong: 'A',
        ngayHetHan: hetHan,
        trangThai: 'CO_THE_BAN',
        maTruyXuat: maTruyXuatSeed(index),
      },
    });

    const suKienMau = [
      { loai: 'THU_HOACH' as const, thoiGian: ngayThuHoach, diaDiem: farm.diaChi },
      { loai: 'DONG_GOI' as const, thoiGian: congNgay(ngayThuHoach, 1), diaDiem: farm.diaChi },
      { loai: 'NHAP_KHO' as const, thoiGian: congNgay(ngayThuHoach, 2), diaDiem: 'Kho Home AgriMarket' },
    ];
    for (const suKien of suKienMau) {
      const daCo = await prisma.suKienTruyXuat.findFirst({
        where: { loSanPhamId: lot.id, loai: suKien.loai },
      });
      if (!daCo) {
        await prisma.suKienTruyXuat.create({
          data: {
            loSanPhamId: lot.id,
            loai: suKien.loai,
            thoiGian: suKien.thoiGian,
            diaDiem: suKien.diaDiem,
            congKhai: true,
          },
        });
      }
    }

    await prisma.tonKhoLo.upsert({
      where: {
        khoId_loSanPhamId_bienTheSanPhamId: {
          khoId: kho.id,
          loSanPhamId: lot.id,
          bienTheSanPhamId: variant.id,
        },
      },
      update: { onHand: TAM_HET_HANG.has(sp.ten) ? '0.000' : '100.000', reserved: '0', blocked: '0' },
      create: {
        khoId: kho.id,
        loSanPhamId: lot.id,
        bienTheSanPhamId: variant.id,
        onHand: TAM_HET_HANG.has(sp.ten) ? '0.000' : '100.000',
        reserved: '0',
        blocked: '0',
      },
    });
    // Gỡ tồn kho cũ trỏ sang lô farm dùng chung (sai nguồn gốc) của seed cũ.
    // Bỏ qua lô đang được đơn demo tham chiếu (allocation/reservation/ledger)
    // để rerun idempotent và không vi phạm FK.
    await prisma.tonKhoLo.deleteMany({
      where: {
        bienTheSanPhamId: variant.id,
        loSanPhamId: { not: lot.id },
        phanBoDonHang: { none: {} },
        mucDatChoTonKho: { none: {} },
        giaoDich: { none: {} },
      },
    });

    console.log(`✅ ${sp.ten} · ${farm.ten} · ${lot.maLo} · ${lot.maTruyXuat}`);
  }

  // Ẩn sản phẩm ngoài domain cây trồng khỏi catalog công khai.
  for (const ten of AN_KHOI_DEMO) {
    await prisma.sanPham.updateMany({
      where: { ten },
      data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
    });
  }

  // ===== DEMO FIXTURE (LOCAL ONLY, idempotent) =====
  const demo = await seedDemoNguoiDung();
  await seedDemoFlashSale();
  const ketQuaDon = await seedDemoOrder({
    khachHangId: (await prisma.khachHang.findUniqueOrThrow({
      where: { nguoiDungId: demo.customerUserId },
      select: { id: true },
    })).id,
    diaChiId: demo.diaChiId,
    khoId: kho.id,
    nccId: ncc.id,
  });
  await seedDemoTuongTac(
    (
      await prisma.khachHang.findUniqueOrThrow({
        where: { nguoiDungId: demo.customerUserId },
        select: { id: true },
      })
    ).id,
  );
  await seedDemoHoaHong(ncc.id);
  await seedDemoAssertions();

  console.log(`🎉 Hoàn tất: ${FARMS.length} trang trại · ${SAN_PHAM.length} sản phẩm · ${DANH_MUC.length} danh mục.`);
  console.log('');
  console.log('=== AGRIMARKET DEMO READY ===');
  console.log(`Customer: ${DEMO_CUSTOMER_EMAIL} (mật khẩu: giá trị DEMO_CUSTOMER_PASSWORD)`);
  console.log(`Admin: ${DEMO_ADMIN_EMAIL} (mật khẩu: giá trị DEMO_ADMIN_PASSWORD)`);
  console.log(`Demo order: ${DEMO_MA_DON_HANG}`);
  console.log(`Exact trace codes: ${ketQuaDon.traceCodes.join(', ')}`);
  console.log(`Public trace: http://localhost:3001/truy-xuat?ma=${ketQuaDon.traceCodes[0]}`);
  console.log('FINANCE DEMO = RULE ONLY (không seed settlement/payout).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
