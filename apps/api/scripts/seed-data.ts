/**
 * Seed demo Home Mobile AgriMarket.
 * Tạo dữ liệu idempotent: 8 danh mục, 4 trang trại, chứng nhận,
 * mùa vụ/thu hoạch gần đây, sản phẩm, ảnh thật, biến thể và tồn kho.
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
    certificateCode: 'VGP-MB-2026',
    crop: 'Rau thủy canh',
    variety: 'Xà lách và rau cải',
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
    certificateCode: 'ORG-AP-2026',
    crop: 'Cà chua',
    variety: 'Cà chua bi đỏ',
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
    certificateCode: 'VGP-PN-2026',
    crop: 'Lúa',
    variety: 'ST25',
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
    certificateCode: 'ATSH-SH-2026',
    crop: 'Gia cầm',
    variety: 'Gà ta thả vườn',
  },
] as const;

const DANH_MUC = [
  { ten: 'Rau củ', slug: 'rau-cu' },
  { ten: 'Trái cây', slug: 'trai-cay' },
  { ten: 'Gạo', slug: 'gom' },
  { ten: 'Trứng', slug: 'trung' },
  { ten: 'Thịt', slug: 'thit' },
  { ten: 'Thủy sản', slug: 'thuy-san' },
  { ten: 'Organic', slug: 'organic' },
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
};

const SAN_PHAM: SeedProduct[] = [
  { ten: 'Rau xà lách thủy canh', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-xa-lach-thuy-canh.jpg', moTa: 'Xà lách thủy canh giòn ngọt, thu hoạch trong ngày.', gia: 25_000, khoiLuong: '0.300', donVi: 'kg' },
  { ten: 'Cà chua bi đỏ', danhMuc: 'Rau củ', farmMa: 'TT-SEED-AN-PHU', image: 'ca-chua-bi-do.jpg', moTa: 'Cà chua bi đỏ mọng nước, canh tác minh bạch.', gia: 32_000, khoiLuong: '0.500', donVi: 'kg' },
  { ten: 'Rau cải xanh', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-cai-xanh.jpg', moTa: 'Rau cải xanh tươi, phù hợp món luộc và xào.', gia: 20_000, khoiLuong: '0.300', donVi: 'kg' },
  { ten: 'Cà rốt', danhMuc: 'Rau củ', farmMa: 'TT-SEED-PHU-NONG', image: 'ca-ro-t.jpg', moTa: 'Cà rốt tươi giòn, vị ngọt tự nhiên.', gia: 22_000, khoiLuong: '0.500', donVi: 'kg' },
  { ten: 'Bí đỏ', danhMuc: 'Rau củ', farmMa: 'TT-SEED-PHU-NONG', image: 'bi-do.jpg', moTa: 'Bí đỏ ruột vàng, dẻo bùi.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Dưa leo', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'dua-leo.jpg', moTa: 'Dưa leo tươi xanh, giòn mát.', gia: 24_000, khoiLuong: '0.500', donVi: 'kg' },
  { ten: 'Bông cải xanh', danhMuc: 'Organic', farmMa: 'TT-SEED-001', image: 'bong-cai-xanh.jpg', moTa: 'Bông cải xanh giàu dinh dưỡng, canh tác sạch.', gia: 28_000, khoiLuong: '0.300', donVi: 'kg' },
  { ten: 'Rau mồng tơi', danhMuc: 'Rau củ', farmMa: 'TT-SEED-001', image: 'rau-mong-toi.jpg', moTa: 'Rau mồng tơi non, thu hoạch mỗi sáng.', gia: 18_000, khoiLuong: '0.300', donVi: 'kg' },
  { ten: 'Táo đỏ', danhMuc: 'Trái cây', farmMa: 'TT-SEED-AN-PHU', image: 'tao-do.jpg', moTa: 'Táo đỏ giòn ngọt, chọn lọc kỹ.', gia: 45_000, khoiLuong: '0.500', donVi: 'kg' },
  { ten: 'Chuối xanh', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'chuoi-xanh.jpg', moTa: 'Chuối Việt Nam tươi, chín tự nhiên.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Cam vỏ vàng', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'cam-vo-vang.jpg', moTa: 'Cam mọng nước, vị ngọt thanh.', gia: 32_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Cam sành', danhMuc: 'Trái cây', farmMa: 'TT-SEED-PHU-NONG', image: 'cam-sanh.jpg', moTa: 'Cam sành nhiều nước, giàu vitamin C.', gia: 28_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Gạo ST25', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gao-st25.jpg', moTa: 'Gạo ST25 thơm dẻo, hạt dài đẹp.', gia: 120_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Gạo tẻ Thiên Hương', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gom-te-thien-huong.jpg', moTa: 'Gạo tẻ Thiên Hương dẻo mềm.', gia: 30_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Gạo nếp Thái', danhMuc: 'Gạo', farmMa: 'TT-SEED-PHU-NONG', image: 'gom-nep-thai.jpg', moTa: 'Gạo nếp dẻo thơm, thích hợp đồ xôi.', gia: 38_000, khoiLuong: '1.000', donVi: 'kg' },
  { ten: 'Trứng gà ta', danhMuc: 'Trứng', farmMa: 'TT-SEED-SONG-HONG', image: 'trung-ga-ta.jpg', moTa: 'Trứng gà ta nuôi thả vườn.', gia: 35_000, khoiLuong: '10.000', donVi: 'quả' },
  { ten: 'Thịt heo hữu cơ', danhMuc: 'Thịt', farmMa: 'TT-SEED-SONG-HONG', image: 'thit-heo-huu-co.jpg', moTa: 'Thịt heo sạch, kiểm soát nguồn thức ăn.', gia: 150_000, khoiLuong: '0.500', donVi: 'kg' },
  { ten: 'Cá hồi Na Uy', danhMuc: 'Thủy sản', farmMa: 'TT-SEED-001', image: 'ca-hoi-na-uys.jpg', moTa: 'Cá hồi tươi, bảo quản lạnh đúng chuẩn.', gia: 220_000, khoiLuong: '0.300', donVi: 'kg' },
  { ten: 'Mật ong rừng', danhMuc: 'Đặc sản', farmMa: 'TT-SEED-AN-PHU', image: 'mat-ong-rung.jpg', moTa: 'Mật ong nguyên chất, hương thơm tự nhiên.', gia: 180_000, khoiLuong: '0.500', donVi: 'lít' },
];

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
  console.log('🌱 Seed Home Mobile AgriMarket...');

  const ncc = await prisma.nhaCungCap.upsert({
    where: { ma: NHA_CUNG_CAP.ma },
    update: NHA_CUNG_CAP,
    create: NHA_CUNG_CAP,
  });

  const farmByMa = new Map<string, { id: string; ma: string; ten: string }>();
  const lotByFarm = new Map<string, string>();
  const now = new Date();

  for (let index = 0; index < FARMS.length; index += 1) {
    const farm = FARMS[index]!;
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

    await prisma.chungNhan.upsert({
      where: { ma: farm.certificateCode },
      update: {
        trangTraiId: row.id,
        loai: farm.certificate,
        donViCap: 'AgriMarket Quality Network',
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
        donViCap: 'AgriMarket Quality Network',
        ngayCap: new Date('2026-01-01'),
        ngayHetHan: new Date('2028-12-31'),
        tepTinId: farmFile.id,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: now,
      },
    });

    let muaVu = await prisma.muaVu.findFirst({
      where: { trangTraiId: row.id, cayTrong: farm.crop },
    });
    if (!muaVu) {
      muaVu = await prisma.muaVu.create({
        data: {
          trangTraiId: row.id,
          cayTrong: farm.crop,
          giong: farm.variety,
          ngayTrong: truNgay(now, 70 + index * 4),
          ngayDuKienThuHoach: congNgay(now, 7),
          sanLuongDuKienKg: '1200.000',
        },
      });
    } else {
      muaVu = await prisma.muaVu.update({
        where: { id: muaVu.id },
        data: {
          giong: farm.variety,
          ngayTrong: truNgay(now, 70 + index * 4),
          ngayDuKienThuHoach: congNgay(now, 7),
          sanLuongDuKienKg: '1200.000',
        },
      });
    }

    let thuHoach = await prisma.thuHoach.findFirst({
      where: { muaVuId: muaVu.id, phanLoai: 'Loại 1 - Home demo' },
    });
    if (!thuHoach) {
      thuHoach = await prisma.thuHoach.create({
        data: {
          muaVuId: muaVu.id,
          ngayThuHoach: truNgay(now, index + 1),
          soLuong: '950.000',
          donVi: 'kg',
          phanLoai: 'Loại 1 - Home demo',
        },
      });
    } else {
      thuHoach = await prisma.thuHoach.update({
        where: { id: thuHoach.id },
        data: { ngayThuHoach: truNgay(now, index + 1), soLuong: '950.000' },
      });
    }

    const lot = await prisma.loSanPham.upsert({
      where: { maLo: `LO-HOME-${String(index + 1).padStart(3, '0')}` },
      update: {
        thuHoachId: thuHoach.id,
        soLuong: '950.000',
        conLai: '800.000',
        phanHangChatLuong: 'A',
        ngayHetHan: congNgay(now, 45),
      },
      create: {
        maLo: `LO-HOME-${String(index + 1).padStart(3, '0')}`,
        thuHoachId: thuHoach.id,
        soLuong: '950.000',
        conLai: '800.000',
        phanHangChatLuong: 'A',
        ngayHetHan: congNgay(now, 45),
      },
    });
    lotByFarm.set(farm.ma, lot.id);
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

  const kho = await prisma.kho.upsert({
    where: { maKho: 'KHO-SEED-001' },
    update: { ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
    create: { maKho: 'KHO-SEED-001', ten: 'Kho Home AgriMarket', diaChi: 'Hà Nội' },
  });

  for (let index = 0; index < SAN_PHAM.length; index += 1) {
    const sp = SAN_PHAM[index]!;
    const farm = farmByMa.get(sp.farmMa);
    const danhMucSanPhamId = danhMucMap.get(sp.danhMuc);
    const loSanPhamId = lotByFarm.get(sp.farmMa);
    if (!farm || !danhMucSanPhamId || !loSanPhamId) continue;

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
        },
      });
    }

    const file = await damBaoTepTin(sp.image);
    await prisma.sanPhamAnh.updateMany({
      where: { sanPhamId: sanPham.id, tepTinId: { not: file.id } },
      data: { laAnhBia: false },
    });
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

    await prisma.tonKhoLo.upsert({
      where: {
        khoId_loSanPhamId_bienTheSanPhamId: {
          khoId: kho.id,
          loSanPhamId,
          bienTheSanPhamId: variant.id,
        },
      },
      update: { onHand: '100.000', reserved: '0', blocked: '0' },
      create: {
        khoId: kho.id,
        loSanPhamId,
        bienTheSanPhamId: variant.id,
        onHand: '100.000',
        reserved: '0',
        blocked: '0',
      },
    });

    console.log(`✅ ${sp.ten} · ${farm.ten}`);
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
