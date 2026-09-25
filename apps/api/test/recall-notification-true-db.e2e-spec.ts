import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { LoSanPhamService } from '../src/modules/lo-san-pham/lo-san-pham.service';

describe('True DB E2E Recall Customer Notification & Idempotency (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let loSanPhamService: LoSanPhamService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let customerAId = '';
  let customerBId = '';
  let batchId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    loSanPhamService = app.get(LoSanPhamService);

    const admin = await prisma.nguoiDung.create({
      data: { email: `admin-rc-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Admin Recall' },
    });
    adminId = admin.id;

    // Customer A
    const userA = await prisma.nguoiDung.create({
      data: { email: `custA-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Khach Hang A' },
    });
    const custA = await prisma.khachHang.create({
      data: { nguoiDungId: userA.id, maKhachHang: `KH-A-${suffix}`.slice(0, 30) },
    });
    customerAId = custA.id;

    // Customer B
    const userB = await prisma.nguoiDung.create({
      data: { email: `custB-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Khach Hang B' },
    });
    const custB = await prisma.khachHang.create({
      data: { nguoiDungId: userB.id, maKhachHang: `KH-B-${suffix}`.slice(0, 30) },
    });
    customerBId = custB.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-RC-${suffix}`.slice(0, 30),
        ten: 'NCC Recall Notify',
        soDienThoai: '0911223344',
        email: `ncc-rc-${suffix}@example.com`,
        diaChi: 'HN',
      },
    });

    const farm = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplier.id, ma: `F-RC-${suffix}`.slice(0, 30), ten: 'Farm Recall', diaChi: 'HN' },
    });

    const category = await prisma.danhMucSanPham.create({
      data: { ten: `Cat RC ${suffix}`, slug: `cat-rc-${suffix}` },
    });

    const product = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: category.id, ten: 'Prod Recall' },
    });

    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku: `SKU-RC-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 50000 },
    });

    const warehouse = await prisma.kho.create({
      data: { maKho: `KHO-RC-${suffix}`.slice(0, 30), ten: 'Kho Recall', diaChi: 'HN' },
    });

    // Mua vụ và Lô sản phẩm X
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVu: {
          create: {
            trangTraiId: farm.id,
            cayTrong: 'Bưởi',
            giong: 'Da xanh',
            ngayTrong: new Date(),
            ngayDuKienThuHoach: new Date(),
            sanLuongDuKienKg: 1000,
          },
        },
        ngayThuHoach: new Date(),
        soLuong: 500,
        donVi: 'kg',
        phanLoai: 'Loai 1',
      },
    });

    const batch = await prisma.loSanPham.create({
      data: {
        thuHoachId: harvest.id,
        maLo: `BATCH-X-${suffix}`.slice(0, 30),
        soLuong: 500,
        conLai: 500,
        ngayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    batchId = batch.id;

    const inventoryLot = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 100,
        reserved: 0,
        blocked: 0,
      },
    });

    // Tạo Order A cho Customer A có allocation từ Batch X
    const orderA = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-A-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: custA.id,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tongTien: 50000,
        tamTinhHangHoa: 50000,
      },
    });
    const subA = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SUB-A-${suffix}`.slice(0, 30),
        donHangId: orderA.id,
        nhaCungCapId: supplier.id,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tamTinh: 50000,
      },
    });
    const itemA = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: subA.id,
        sanPhamId: product.id,
        danhMucSanPhamIdSnapshot: category.id,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 1,
        donGiaSnapshot: 50000,
        tenSanPhamSnapshot: product.ten,
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: farm.ma,
        tenTrangTraiSnapshot: farm.ten,
        tienHangGoc: 50000,
        tienThucTra: 50000,
      },
    });
    await prisma.phanBoDonHang.create({
      data: {
        mucDonHangId: itemA.id,
        tonKhoLoId: inventoryLot.id,
        soLuong: 1,
      },
    });

    // Tạo Order B cho Customer B có allocation từ Batch X
    const orderB = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-B-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: custB.id,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tongTien: 50000,
        tamTinhHangHoa: 50000,
      },
    });
    const subB = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SUB-B-${suffix}`.slice(0, 30),
        donHangId: orderB.id,
        nhaCungCapId: supplier.id,
        trangThai: TrangThaiDonHang.DA_GIAO,
        tamTinh: 50000,
      },
    });
    const itemB = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: subB.id,
        sanPhamId: product.id,
        danhMucSanPhamIdSnapshot: category.id,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 1,
        donGiaSnapshot: 50000,
        tenSanPhamSnapshot: product.ten,
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: farm.ma,
        tenTrangTraiSnapshot: farm.ten,
        tienHangGoc: 50000,
        tienThucTra: 50000,
      },
    });
    await prisma.phanBoDonHang.create({
      data: {
        mucDonHangId: itemB.id,
        tonKhoLoId: inventoryLot.id,
        soLuong: 1,
      },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('Recall Batch X -> DB tạo đúng 1 notification cho Customer A, 1 cho Customer B; retry không duplicate', async () => {
    // 1. Thực hiện recall Batch X
    await loSanPhamService.thuHoi(
      adminId,
      batchId,
      {
        lyDo: 'Pesticide residue detected in batch X',
        thongBaoKhachHang: 'Lô sản phẩm X có vấn đề chất lượng, vui lòng ngừng sử dụng.',
      },
      { ip: '127.0.0.1', userAgent: 'Jest' },
    );

    // 2. Query trực tiếp table thong_bao_thu_hoi từ MySQL
    const notifsCustA = await prisma.thongBaoThuHoi.findMany({
      where: {
        khachHangId: customerAId,
        loSanPhamId: batchId,
      },
    });

    const notifsCustB = await prisma.thongBaoThuHoi.findMany({
      where: {
        khachHangId: customerBId,
        loSanPhamId: batchId,
      },
    });

    // Assert DB rows
    expect(notifsCustA.length).toBe(1);
    expect(notifsCustB.length).toBe(1);

    expect(notifsCustA[0]!.tieuDe).toContain('Cảnh báo thu hồi');
    expect(notifsCustA[0]!.noiDung).toBe('Lô sản phẩm X có vấn đề chất lượng, vui lòng ngừng sử dụng.');
    expect(notifsCustA[0]!.khoaIdempotent).toMatch(/^RECALL-/);

    // 3. Giả lập retry tạo notification / re-process idempotency
    const idempotencyKeyA = notifsCustA[0]!.khoaIdempotent;

    // Cố ý insert lại với cùng idempotency key -> unique constraint must block duplicate
    await expect(
      prisma.thongBaoThuHoi.create({
        data: {
          thuHoiId: notifsCustA[0]!.thuHoiId,
          loSanPhamId: batchId,
          donHangId: notifsCustA[0]!.donHangId,
          khachHangId: customerAId,
          tieuDe: 'Duplicate attempt',
          noiDung: 'Duplicate content',
          khoaIdempotent: idempotencyKeyA,
        },
      }),
    ).rejects.toThrow();

    // Query lại: Số lượng notifications vẫn là 1 cho A, 1 cho B
    const notifsCustAAfter = await prisma.thongBaoThuHoi.count({
      where: {
        khachHangId: customerAId,
        loSanPhamId: batchId,
      },
    });
    const notifsCustBAfter = await prisma.thongBaoThuHoi.count({
      where: {
        khachHangId: customerBId,
        loSanPhamId: batchId,
      },
    });

    expect(notifsCustAAfter).toBe(1);
    expect(notifsCustBAfter).toBe(1);
  });
});
