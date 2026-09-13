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
 * - Chứng nhận demo do "Tổ chức chứng nhận demo" cấp với mã DEMO-*;
 *   AgriMarket chỉ XÁC MINH, không tự cấp VietGAP/Hữu cơ.
 * - Mỗi lô demo có mã truy xuất AGM-* thật + sự kiện công khai + nhật ký
 *   canh tác công khai để /truy-xuat demo được end-to-end.
 *
 * Chạy từ root bằng:
 * pnpm --filter @agrimarket/api-client exec tsx ../../apps/api/scripts/seed-data.ts
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PrismaClient,
  TrangThaiBanGhi,
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

const DON_VI_CAP_DEMO = 'Tổ chức chứng nhận demo';

const NHA_CUNG_CAP = {
  ma: 'NCC-SEED-001',
  ten: 'AgriMarket Farm Network',
  nguoiDaiDien: 'Nguyễn Văn Minh',
  soDienThoai: '0909123456',
  email: 'farm@agrimarket.local',
  diaChi: 'Việt Nam',
};

const FARMS = [
  {
    ma: 'TT-SEED-001',
    ten: 'Trang trại Minh Bạch',
    diaChi: 'Sóc Sơn - Hà Nội',
    viDo: '21.2570',
    kinhDo: '105.8490',
    dienTichHa: '5.5',
    image: 'farm-minh-bach.jpg',
    certificate: 'VietGAP',
    certificateCode: 'DEMO-VG-MB-01',
  },
  {
    ma: 'TT-SEED-AN-PHU',
    ten: 'Nông trại An Phú',
    diaChi: 'Lâm Hà - Lâm Đồng',
    viDo: '11.7350',
    kinhDo: '108.2680',
    dienTichHa: '8.2',
    image: 'farm-an-phu.jpg',
    certificate: 'Hữu cơ',
    certificateCode: 'DEMO-HC-AP-01',
  },
  {
    ma: 'TT-SEED-PHU-NONG',
    ten: 'HTX Phú Nông',
    diaChi: 'Đồng Nai',
    viDo: '10.9570',
    kinhDo: '106.8420',
    dienTichHa: '12.4',
    image: 'farm-phu-nong.jpg',
    certificate: 'VietGAP',
    certificateCode: 'DEMO-VG-PN-01',
  },
  {
    ma: 'TT-SEED-SONG-HONG',
    ten: 'Trang trại Sông Hồng',
    diaChi: 'Hà Nội',
    viDo: '21.0820',
    kinhDo: '105.8210',
    dienTichHa: '6.8',
    image: 'farm-song-hong.jpg',
    certificate: 'An toàn sinh học',
    certificateCode: 'DEMO-ATSH-SH-01',
  },
] as const;

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
  { ten: 'Rau xà lách thủy canh', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-xa-lach-thuy-canh.jpg', moTa: 'Xà lách thủy canh giòn ngọt, thu hoạch trong ngày.', gia: 25_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Xà lách', giong: 'Xà lách mỡ' },
  { ten: 'Cà chua bi đỏ', danhMuc: 'Rau củ', farmMa: 'TT-SEED-AN-PHU', image: 'ca-chua-bi-do.jpg', moTa: 'Cà chua bi đỏ mọng nước, canh tác minh bạch.', gia: 32_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Cà chua', giong: 'Cà chua bi đỏ' },
  { ten: 'Rau cải xanh', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-cai-xanh.jpg', moTa: 'Rau cải xanh tươi, phù hợp món luộc và xào.', gia: 20_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Rau cải', giong: 'Cải xanh' },
  { ten: 'Cà rốt', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'ca-ro-t.jpg', moTa: 'Cà rốt tươi giòn, vị ngọt tự nhiên.', gia: 22_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Cà rốt', giong: 'Cà rốt Đà Lạt' },
  { ten: 'Bí đỏ', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'bi-do.jpg', moTa: 'Bí đỏ ruột vàng, dẻo bùi.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Bí đỏ', giong: 'Bí đỏ hồ lô' },
  { ten: 'Dưa leo', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'dua-leo.jpg', moTa: 'Dưa leo tươi xanh, giòn mát.', gia: 24_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Dưa leo', giong: 'Dưa leo xanh' },
  { ten: 'Bông cải xanh', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'bong-cai-xanh.jpg', moTa: 'Bông cải xanh giàu dinh dưỡng, canh tác sạch.', gia: 28_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Bông cải', giong: 'Bông cải xanh' },
  { ten: 'Rau mồng tơi', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-mong-toi.jpg', moTa: 'Rau mồng tơi non, thu hoạch mỗi sáng.', gia: 18_000, khoiLuong: '0.300', donVi: 'kg', cayTrong: 'Rau mồng tơi', giong: 'Mồng tơi lá to' },
  { ten: 'Táo đỏ', danhMuc: 'Trái cây', farmMa: 'TT-SEED-AN-PHU', image: 'tao-do.jpg', moTa: 'Táo đỏ giòn ngọt, chọn lọc kỹ.', gia: 45_000, khoiLuong: '0.500', donVi: 'kg', cayTrong: 'Táo', giong: 'Táo đỏ' },
  { ten: 'Chuối xanh', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'chuoi-xanh.jpg', moTa: 'Chuối Việt Nam tươi, chín tự nhiên.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Chuối', giong: 'Chuối tiêu' },
  { ten: 'Cam vỏ vàng', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'cam-vo-vang.jpg', moTa: 'Cam mọng nước, vị ngọt thanh.', gia: 32_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Cam', giong: 'Cam vỏ vàng' },
  { ten: 'Cam sành', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'cam-sanh.jpg', moTa: 'Cam sành nhiều nước, giàu vitamin C.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Cam', giong: 'Cam sành' },
  { ten: 'Gạo ST25', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gao-st25.jpg', moTa: 'Gạo ST25 thơm dẻo, hạt dài đẹp.', gia: 120_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'ST25' },
  { ten: 'Gạo tẻ Thiên Hương', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gom-te-thien-huong.jpg', moTa: 'Gạo tẻ Thiên Hương dẻo mềm.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'Thiên Hương' },
  { ten: 'Gạo nếp Thái', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gom-nep-thai.jpg', moTa: 'Gạo nếp dẻo thơm, thích hợp đồ xôi.', gia: 38_000, khoiLuong: '1.000', donVi: 'kg', cayTrong: 'Lúa', giong: 'Nếp Thái' },
  { ten: 'Trứng gà ta', danhMuc: 'Trứng', farmMa: 'TT-SEED-SONG-HONG', image: 'trung-ga-ta.jpg', moTa: 'Trứng gà ta nuôi thả vườn.', gia: 35_000, khoiLuong: '10.000', donVi: 'quả', cayTrong: 'Gà ta', giong: 'Gà ta thả vườn' },
  { ten: 'Mật ong rừng', danhMuc: 'Đặc sản', farmMa: 'TT-SEED-AN-PHU', image: 'mat-ong-rung.jpg', moTa: 'Mật ong nguyên chất, hương thơm tự nhiên.', gia: 180_000, khoiLuong: '0.500', donVi: 'lít', cayTrong: 'Ong mật', giong: 'Ong nội địa' },
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

/** Mã lô/trace demo ổn định theo từng sản phẩm (idempotent). */
function maLoSeed(index: number): string {
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

async function main() {
  console.log('🌱 Seed demo AgriMarket (product domain final)...');

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
        donViCap: DON_VI_CAP_DEMO,
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
        donViCap: DON_VI_CAP_DEMO,
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
    where: { maKho: 'KHO-SEED-001' },
    update: { ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
    create: { maKho: 'KHO-SEED-001', ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
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
      where: { maLo: maLoSeed(index) },
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
        maLo: maLoSeed(index),
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
    await prisma.tonKhoLo.deleteMany({
      where: { bienTheSanPhamId: variant.id, loSanPhamId: { not: lot.id } },
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

  console.log(`🎉 Hoàn tất: ${FARMS.length} trang trại · ${SAN_PHAM.length} sản phẩm · ${DANH_MUC.length} danh mục.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
