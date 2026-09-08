/**
 * Seed script: creates 8 categories + 13 products + variants + images
 * Run: npx tsx scripts/seed-data.ts   (from apps/api/)
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

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
if (!databaseUrl) { console.error('Thiếu DATABASE_URL'); process.exit(1); }
const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
const prisma = new PrismaClient({ adapter });

const NHA_CUNG_CAP = {
  ma: 'NCC-SEED-001',
  ten: 'Nông trại Thiên Nhiên',
  nguoiDaiDien: 'Nguyễn Văn A',
  soDienThoai: '0909123456',
  email: 'sales@nongtrai.example.com',
  diaChi: 'Xã Tân Phong, TP Thủ Đức, TP.HCM',
};

const TRANG_TRAI = {
  ma: 'TT-SEED-001',
  ten: 'Nông trại Thiên Nhiên - Vùng trồng rau sạch',
  diaChi: 'Ấp Tân Lập, xã Tân Phong, TP Thủ Đức, TP.HCM',
  viDo: '10.8231',
  kinhDo: '106.6297',
  dienTichHa: '5.5',
};

const MUA_VU = {
  cayTrong: 'Cà chua',
  giong: 'Cà chua bi đỏ',
  ngayTrong: new Date('2025-05-01'),
  ngayDuKienThuHoach: new Date('2025-07-15'),
  sanLuongDuKienKg: '1000.000',
};

const THU_HOACH = {
  ngayThuHoach: new Date('2025-07-10'),
  soLuong: '950.000',
  donVi: 'kg',
  phanLoai: 'Cà chua bi đỏ',
};

const LO_SAN_PHAM = {
  maLo: 'LO-SEED-001',
  soLuong: '950.000',
  conLai: '800.000',
  phanHangChatLuong: 'A',
  ngayHetHan: new Date('2025-08-10'),
};

const DANH_MUC = [
  { ten: 'Rau củ', slug: 'rau-cu' },
  { ten: 'Trái cây', slug: 'trai-cay' },
  { ten: 'Gạo', slug: 'gom' },
  { ten: 'Trứng', slug: 'trung' },
  { ten: 'Thịt', slug: 'thit' },
  { ten: 'Thủy sản', slug: 'thuy-san' },
  { ten: 'Organic', slug: 'organic' },
  { ten: 'Đặc sản', slug: 'dac-san' },
];

function makeTepTin(ten: string, mimeType = 'image/jpeg', kichThuoc = 150000) {
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

const SAN_PHAM = [
  { ten: 'Cà chua bi đỏ', danhMuc: 'Rau củ', slug: 'ca-chua-bi-do', moTa: 'Cà chua bi đỏ mọng nước, trồng sạch.' },
  { ten: 'Dưa leo', danhMuc: 'Rau củ', slug: 'dua-leo', moTa: 'Dưa leo tươi xanh, giòn ngọt.' },
  { ten: 'Cà rốt', danhMuc: 'Rau củ', slug: 'ca-ro-t', moTa: 'Cà rốt hạt nhỏ, ngọt tự nhiên.' },
  { ten: 'Bông cải xanh', danhMuc: 'Organic', slug: 'bong-cai-xanh', moTa: 'Bông cải xanh organic VOFA.' },
  { ten: 'Táo đỏ', danhMuc: 'Trái cây', slug: 'tao-do', moTa: 'Táo đỏ Nhật Bản, giòn ngọt.' },
  { ten: 'Chuối xanh', danhMuc: 'Trái cây', slug: 'chuoi-xanh', moTa: 'Chuối xanh Việt Nam VietGAP.' },
  { ten: 'Cam vỏ vàng', danhMuc: 'Trái cây', slug: 'cam-vo-vang', moTa: 'Cam vỏ vàng mật ngọt.' },
  { ten: 'Gạo tẻ Thiên Hương', danhMuc: 'Gạo', slug: 'gom-te-thien-huong', moTa: 'Gạo tẻ Thiên Hương lộ thiên.' },
  { ten: 'Gạo nếp Thái', danhMuc: 'Gạo', slug: 'gom-nep-thai', moTa: 'Gạo nếp Thái dẻo dai.' },
  { ten: 'Trứng gà ta', danhMuc: 'Trứng', slug: 'trung-ga-ta', moTa: 'Trứng gà ta nuôi thả vườn.' },
  { ten: 'Thịt heo hữu cơ', danhMuc: 'Thịt', slug: 'thit-heo-huu-co', moTa: 'Thịt heo hữu cơ không chất tăng trưởng.' },
  { ten: 'Cá hồi Na Uy', danhMuc: 'Thủy sản', slug: 'ca-hoi-na-uy', moTa: 'Cá hồi Na Uy đông lạnh.' },
  { ten: 'Mật ong rừng', danhMuc: 'Đặc sản', slug: 'mat-ong-rung', moTa: 'Mật ong rừng nguyên chất.' },
];

const BIEN_THE = [
  { khoiLuong: '0.500', donVi: 'kg' },
  { khoiLuong: '1.000', donVi: 'kg' },
];

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  const ncc = await prisma.nhaCungCap.upsert({
    where: { ma: NHA_CUNG_CAP.ma },
    update: {},
    create: NHA_CUNG_CAP,
  });
  console.log('✅ NhaCungCap:', ncc.ten);

  const tt = await prisma.trangTrai.upsert({
    where: { ma: TRANG_TRAI.ma },
    update: {},
    create: { ...TRANG_TRAI, nhaCungCapId: ncc.id },
  });
  console.log('✅ TrangTrai:', tt.ten);

  let mv = await prisma.muaVu.findFirst({ where: { trangTraiId: tt.id, cayTrong: MUA_VU.cayTrong } });
  if (!mv) mv = await prisma.muaVu.create({ data: { ...MUA_VU, trangTraiId: tt.id } });
  console.log('✅ MuaVu:', mv.cayTrong);

  let th = await prisma.thuHoach.findFirst({ where: { muaVuId: mv.id, ngayThuHoach: THU_HOACH.ngayThuHoach } });
  if (!th) th = await prisma.thuHoach.create({ data: { ...THU_HOACH, muaVuId: mv.id } });
  console.log('✅ ThuHoach:', th.phanLoai);

  const lo = await prisma.loSanPham.upsert({
    where: { maLo: LO_SAN_PHAM.maLo },
    update: {},
    create: { ...LO_SAN_PHAM, thuHoachId: th.id },
  });
  console.log('✅ LoSanPham:', lo.maLo);

  const danhMucMap: Record<string, string> = {};
  for (const dm of DANH_MUC) {
    const created = await prisma.danhMucSanPham.upsert({
      where: { slug: dm.slug },
      update: {},
      create: { ten: dm.ten, slug: dm.slug },
    });
    danhMucMap[dm.ten] = created.id;
    console.log(`✅ DanhMuc: ${dm.ten}`);
  }

  const imageNames = [
    'ca-chua-bi-do.jpg', 'dua-leo.jpg', 'ca-ro-t.jpg', 'bong-cai-xanh.jpg',
    'tao-do.jpg', 'chuoi-xanh.jpg', 'cam-vo-vang.jpg', 'gom-te-thien-huong.jpg',
    'gom-nep-thai.jpg', 'trung-ga-ta.jpg', 'thit-heo-huu-co.jpg', 'ca-hoi-na-uys.jpg',
    'mat-ong-rung.jpg',
  ];

  for (let i = 0; i < SAN_PHAM.length; i++) {
    const sp = SAN_PHAM[i];
    const dmId = danhMucMap[sp.danhMuc];
    if (!dmId) { console.warn(`⚠️ Bỏ qua ${sp.ten}`); continue; }

    const img = imageNames[i] || `${sp.slug}.jpg`;
    let tepTin = await prisma.tepTin.findFirst({ where: { objectKey: `seed/${img}` } });
    if (!tepTin) {
      tepTin = await prisma.tepTin.create({ data: makeTepTin(img) });
    }

    let sanPham = await prisma.sanPham.findFirst({ where: { ten: sp.ten } });
    if (!sanPham) {
      sanPham = await prisma.sanPham.create({
        data: {
          ten: sp.ten,
          moTa: sp.moTa,
          trangTraiId: tt.id,
          danhMucSanPhamId: dmId,
        },
      });
    }

    let anh = await prisma.sanPhamAnh.findFirst({ where: { sanPhamId: sanPham.id, tepTinId: tepTin.id } });
    if (!anh) {
      anh = await prisma.sanPhamAnh.create({
        data: { sanPhamId: sanPham.id, tepTinId: tepTin.id, laAnhBia: true, thuTu: 0 },
      });
    }

    const gia = sp.danhMuc === 'Thủy sản' ? 350000 : sp.danhMuc === 'Đặc sản' ? 450000 : sp.danhMuc === 'Gạo' ? 28000 : 35000;
    for (let j = 0; j < BIEN_THE.length; j++) {
      const bt = BIEN_THE[j];
      const sku = `SKU-${String(i + 1).padStart(3, '0')}-${j}`;
      const exists = await prisma.bienTheSanPham.findFirst({ where: { sanPhamId: sanPham.id, khoiLuong: bt.khoiLuong, donVi: bt.donVi } });
      if (!exists) {
        await prisma.bienTheSanPham.create({
          data: {
            sanPhamId: sanPham.id,
            sku,
            khoiLuong: bt.khoiLuong,
            gia: gia.toString(),
            donVi: bt.donVi,
          },
        });
      }
    }
    console.log(`✅ SanPham: ${sp.ten}`);
  }

  // ── Tồn kho (TonKhoLo) cho mỗi biến thể ──
  const kho = await prisma.kho.upsert({
    where: { maKho: 'KHO-SEED-001' },
    update: {},
    create: { maKho: 'KHO-SEED-001', ten: 'Kho seed AgriMarket', diaChi: 'Nông trại Thiên Nhiên' },
  });
  console.log('✅ Kho:', kho.ten);

  const tatCaBienThe = await prisma.bienTheSanPham.findMany({
    where: { sanPham: { ten: { in: SAN_PHAM.map(s => s.ten) } } },
    select: { id: true },
  });
  let taoTonKho = 0;
  for (const bt of tatCaBienThe) {
    const tonKho = await prisma.tonKhoLo.upsert({
      where: { khoId_loSanPhamId_bienTheSanPhamId: { khoId: kho.id, loSanPhamId: lo.id, bienTheSanPhamId: bt.id } },
      update: {},
      create: { khoId: kho.id, loSanPhamId: lo.id, bienTheSanPhamId: bt.id, onHand: '100.000', reserved: '0', blocked: '0' },
    });
    if (tonKho) taoTonKho++;
  }
  console.log(`✅ TonKhoLo: ${taoTonKho} bản ghi (kho=${kho.maKho}, lo=${lo.maLo})`);

  console.log('\n🎉 Seed hoàn tất!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
