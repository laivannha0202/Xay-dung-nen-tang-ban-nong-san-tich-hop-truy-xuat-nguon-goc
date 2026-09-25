import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DonHangService } from '../src/modules/don-hang/don-hang.service';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

describe('True DB E2E Item Monetary Allocation (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let donHangService: DonHangService;
  let _datChoService: DatChoTonKhoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let userId = '';
  let _customerId = '';
  let orderId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    donHangService = app.get(DonHangService);
    _datChoService = app.get(DatChoTonKhoService);

    // Tạo User & Khách hàng
    const user = await prisma.nguoiDung.create({
      data: {
        email: `alloc-user-${suffix}@example.com`,
        matKhauHash: 'hash',
        hoTen: 'Khach Hang Money Allocation',
      },
    });
    userId = user.id;

    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
        maKhachHang: `KH-AL-${suffix}`.slice(0, 30),
      },
    });
    _customerId = customer.id;

    // Cấu hình quy đổi điểm thưởng và phí vận chuyển cho test này
    await prisma.cauHinhHeThong.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        giaTriQuyDoiMoiDiem: 1,
        phiVanChuyenCoBan: 0,
        thoiHanKhieuNaiNgay: 7,
      },
      update: {
        giaTriQuyDoiMoiDiem: 1,
        phiVanChuyenCoBan: 0,
        thoiHanKhieuNaiNgay: 7,
      },
    });

    // Tạo Giỏ hàng
    const cart = await prisma.gioHang.create({
      data: {
        khachHangId: customer.id,
      },
    });

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-AL-${suffix}`.slice(0, 30),
        ten: 'Kho Allocation Test',
        diaChi: 'HN',
      },
    });

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-AL-${suffix}`.slice(0, 30),
        ten: 'NCC Allocation Test',
        soDienThoai: '0988776655',
        email: `ncc-al-${suffix}@example.com`,
        diaChi: 'HN',
      },
    });

    const farm = await prisma.trangTrai.create({
      data: {
        nhaCungCapId: supplier.id,
        ma: `F-AL-${suffix}`.slice(0, 30),
        ten: 'Farm Allocation',
        diaChi: 'HN',
      },
    });

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Cat AL ${suffix}`,
        slug: `cat-al-${suffix}`,
      },
    });

    const product = await prisma.sanPham.create({
      data: {
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
        ten: 'San Pham AL',
      },
    });

    // 3 Biến thể với đơn giá lẻ không chia hết đều:
    // Item A: 100,001đ
    // Item B: 200,002đ
    // Item C: 300,003đ
    // Tổng tạm tính hàng hóa = 600,006đ
    const varA = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `SKU-A-${suffix}`.slice(0, 30),
        khoiLuong: 1,
        donVi: 'kg',
        gia: 100001,
      },
    });

    const varB = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `SKU-B-${suffix}`.slice(0, 30),
        khoiLuong: 2,
        donVi: 'kg',
        gia: 200002,
      },
    });

    const varC = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `SKU-C-${suffix}`.slice(0, 30),
        khoiLuong: 3,
        donVi: 'kg',
        gia: 300003,
      },
    });

    // Lô hàng và tồn kho
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: (
          await prisma.muaVu.create({
            data: {
              trangTraiId: farm.id,
              cayTrong: 'Cam',
              giong: 'Cam Sanh',
              ngayTrong: new Date(),
              ngayDuKienThuHoach: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              sanLuongDuKienKg: 1000,
            },
          })
        ).id,
        ngayThuHoach: new Date(),
        soLuong: 1000,
        donVi: 'kg',
        phanLoai: 'Loai 1',
      },
    });

    const batch = await prisma.loSanPham.create({
      data: {
        thuHoachId: harvest.id,
        maLo: `LO-AL-${suffix}`.slice(0, 30),
        soLuong: 1000,
        conLai: 1000,
        ngayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trangThai: 'CO_THE_BAN',
      },
    });

    for (const v of [varA, varB, varC]) {
      await prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batch.id,
          bienTheSanPhamId: v.id,
          onHand: 100,
          reserved: 0,
          blocked: 0,
        },
      });
    }

    // Thêm vào giỏ hàng
    await prisma.mucGioHang.createMany({
      data: [
        { gioHangId: cart.id, bienTheSanPhamId: varA.id, soLuong: 1 },
        { gioHangId: cart.id, bienTheSanPhamId: varB.id, soLuong: 1 },
        { gioHangId: cart.id, bienTheSanPhamId: varC.id, soLuong: 1 },
      ],
    });

    // Điểm thưởng cho khách
    await prisma.taiKhoanLoyalty.create({
      data: {
        khachHangId: customer.id,
        diem: 50000,
      },
    });

    // Tạo đơn hàng với khuyến mãi và điểm thưởng không chia hết đều
    // Khuyến mãi = 50,000đ
    // Điểm dùng = 30,000 điểm = 30,000đ
    const voucher = await prisma.khuyenMai.create({
      data: {
        ma: `KM-AL-${suffix}`.slice(0, 20),
        ten: 'Voucher Allocation',
        phamVi: 'PLATFORM',
        giaTriGiam: 50000,
        donHangToiThieu: 100000,
        batDauLuc: new Date(),
        ketThucLuc: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.khachHangKhuyenMai.create({
      data: {
        khachHangId: customer.id,
        khuyenMaiId: voucher.id,
        soLanDaSuDung: 0,
      },
    });

    const address = await prisma.diaChi.create({
      data: {
        nguoiDungId: user.id,
        tenNguoiNhan: 'Khach Hang Alloc',
        soDienThoai: '0988776655',
        dongDiaChi: '123 Pho Hien',
        phuongXa: 'Phuong Hien Nam',
        quanHuyen: 'Thanh pho Hung Yen',
        tinhThanh: 'Hung Yen',
      },
    });

    // Tạo đơn hàng
    const orderRes = await donHangService.tao(userId, {
      maYeuCau: randomUUID(),
      diaChiGiaoHangId: address.id,
      maKhuyenMai: voucher.ma,
      diemSuDung: 30000,
      items: [
        { bienTheSanPhamId: varA.id, soLuong: 1, donGiaDuKien: 100001 },
        { bienTheSanPhamId: varB.id, soLuong: 1, donGiaDuKien: 200002 },
        { bienTheSanPhamId: varC.id, soLuong: 1, donGiaDuKien: 300003 },
      ],
    });
    orderId = orderRes.id;
  });

  afterAll(async () => {
    // Khôi phục cauHinhHeThong về default của DB
    await prisma.cauHinhHeThong.upsert({
      where: { id: 1 },
      create: { id: 1, thoiHanKhieuNaiNgay: 7, phiVanChuyenCoBan: 0, giaTriQuyDoiMoiDiem: 0 },
      update: { thoiHanKhieuNaiNgay: 7, phiVanChuyenCoBan: 0, giaTriQuyDoiMoiDiem: 0 },
    });
    if (app) await app.close();
  });

  it('MySQL DB row verification: Assert exact item money allocations and sum invariants', async () => {
    // Đọc trực tiếp từ MySQL bằng Prisma raw query / findUnique
    const order = await prisma.donHang.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        donNhaCungCap: {
          include: {
            muc: true,
          },
        },
      },
    });

    const items = order.donNhaCungCap.flatMap((sub) => sub.muc);
    expect(items.length).toBe(3);

    // 1. Từng item có persist immutable financial allocation
    for (const item of items) {
      expect(Number(item.tienHangGoc)).toBeGreaterThan(0);
      expect(Number(item.tienThucTra)).toBeGreaterThan(0);
      expect(Number(item.tienDaHoan)).toBe(0);
    }

    // 2. Exact sum invariants
    const sumGross = items.reduce((sum, item) => sum + Number(item.tienHangGoc), 0);
    const sumPromo = items.reduce((sum, item) => sum + Number(item.tienKhuyenMaiPhanBo), 0);
    const sumPoints = items.reduce((sum, item) => sum + Number(item.tienDiemPhanBo), 0);
    const sumShipping = items.reduce((sum, item) => sum + Number(item.tienVanChuyenPhanBo), 0);
    const sumNetPaid = items.reduce((sum, item) => sum + Number(item.tienThucTra), 0);

    // SUM(item.grossAmount) == order.tamTinhHangHoa (600006)
    expect(Math.round(sumGross)).toBe(Math.round(Number(order.tamTinhHangHoa)));
    expect(Math.round(sumGross)).toBe(600006);

    // SUM(item promotion/voucher allocation) == order.giamKhuyenMai (50000)
    expect(Math.round(sumPromo)).toBe(Math.round(Number(order.giamKhuyenMai)));
    expect(Math.round(sumPromo)).toBe(50000);

    // SUM(item loyalty allocation) == order.giaTriDiemDaDung (30000)
    expect(Math.round(sumPoints)).toBe(Math.round(Number(order.giaTriDiemDaDung)));
    expect(Math.round(sumPoints)).toBe(30000);

    // SUM(item shipping allocation) == order.phiVanChuyen
    expect(Math.round(sumShipping)).toBe(Math.round(Number(order.phiVanChuyen)));

    // SUM(item.netPaidAmount) == canonical payable amount (order.tongTien)
    expect(Math.round(sumNetPaid)).toBe(Math.round(Number(order.tongTien)));

    // Không lệch dù chỉ 1 đồng
    expect(sumGross - sumPromo - sumPoints + sumShipping).toBe(sumNetPaid);
  });
});
