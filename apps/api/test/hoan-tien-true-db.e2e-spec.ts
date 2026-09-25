import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { ThanhToanHoanTienService } from '../src/modules/thanh-toan/thanh-toan-hoan-tien.service';

describe('True DB E2E Partial Refund Item-Scoped (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let refundService: ThanhToanHoanTienService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let customerId = '';
  let supplierAId = '';
  let supplierBId = '';
  let categoryId = '';
  let itemAId = '';
  let _itemBId = '';
  let paymentId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    refundService = app.get(ThanhToanHoanTienService);

    // 1. Admin
    const admin = await prisma.nguoiDung.create({
      data: {
        email: `refund-admin-${suffix}@example.com`,
        matKhauHash: 'hash',
        hoTen: 'Admin Refund Test',
      },
    });
    adminId = admin.id;

    // 2. Customer
    const user = await prisma.nguoiDung.create({
      data: {
        email: `refund-cust-${suffix}@example.com`,
        matKhauHash: 'hash',
        hoTen: 'Cust Refund Test',
      },
    });
    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
        maKhachHang: `KH-REF-${suffix}`.slice(0, 30),
      },
    });
    customerId = customer.id;

    // 3. Supplier A & B
    const nccA = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-A-${suffix}`.slice(0, 30),
        ten: 'Supplier A',
        soDienThoai: '0911111111',
        email: `nccA-${suffix}@example.com`,
        diaChi: 'Hà Nội',
      },
    });
    supplierAId = nccA.id;

    const nccB = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-B-${suffix}`.slice(0, 30),
        ten: 'Supplier B',
        soDienThoai: '0922222222',
        email: `nccB-${suffix}@example.com`,
        diaChi: 'Hải Phòng',
      },
    });
    supplierBId = nccB.id;

    // Category
    const cat = await prisma.danhMucSanPham.create({
      data: { ten: `Cat ${suffix}`, slug: `cat-${suffix}` },
    });
    categoryId = cat.id;

    // Farm A & B
    const farmA = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplierAId, ma: `FA-${suffix}`.slice(0, 30), ten: 'Farm A', diaChi: 'HN' },
    });
    const farmB = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplierBId, ma: `FB-${suffix}`.slice(0, 30), ten: 'Farm B', diaChi: 'HP' },
    });

    const prodA = await prisma.sanPham.create({
      data: { trangTraiId: farmA.id, danhMucSanPhamId: categoryId, ten: 'Prod A' },
    });
    const prodB = await prisma.sanPham.create({
      data: { trangTraiId: farmB.id, danhMucSanPhamId: categoryId, ten: 'Prod B' },
    });

    const varA = await prisma.bienTheSanPham.create({
      data: { sanPhamId: prodA.id, sku: `SKU-A-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 100000 },
    });
    const varB = await prisma.bienTheSanPham.create({
      data: { sanPhamId: prodB.id, sku: `SKU-B-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 200000 },
    });

    // 4. Order with 2 SubOrders (A: 100k, B: 200k) => Total 300k
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-REF-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: customerId,
        tongTien: 300000,
        tamTinhHangHoa: 300000,
        phiVanChuyen: 0,
        trangThai: TrangThaiDonHang.DA_GIAO,
      },
    });

    const subA = await prisma.donHangNhaCungCap.create({
      data: { donHangId: order.id, nhaCungCapId: supplierAId, maDon: `SUBA-${suffix}`.slice(0, 30), tamTinh: 100000 },
    });
    const subB = await prisma.donHangNhaCungCap.create({
      data: { donHangId: order.id, nhaCungCapId: supplierBId, maDon: `SUBB-${suffix}`.slice(0, 30), tamTinh: 200000 },
    });

    const itemA = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: subA.id,
        sanPhamId: prodA.id,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: varA.id,
        trangTraiId: farmA.id,
        soLuong: 1,
        donGiaSnapshot: 100000,
        tenSanPhamSnapshot: 'Prod A',
        skuBienTheSnapshot: varA.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'FA',
        tenTrangTraiSnapshot: 'Farm A',
      },
    });
    itemAId = itemA.id;

    const itemB = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: subB.id,
        sanPhamId: prodB.id,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: varB.id,
        trangTraiId: farmB.id,
        soLuong: 1,
        donGiaSnapshot: 200000,
        tenSanPhamSnapshot: 'Prod B',
        skuBienTheSnapshot: varB.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'FB',
        tenTrangTraiSnapshot: 'Farm B',
      },
    });
    _itemBId = itemB.id;

    // Payment PAID 300k
    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: 300000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
      },
    });
    paymentId = payment.id;

    await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: payment.id,
        maGiaoDich: `PAY-${suffix}`.slice(0, 50),
        soTien: 300000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
        thoiGian: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };
      httpServer.closeIdleConnections?.();
      httpServer.closeAllConnections?.();

      const workers = [
        app.get(EmailWorker, { strict: false }),
        app.get(ThongBaoWorker, { strict: false }),
        app.get(HeThongWorker, { strict: false }),
      ];
      await Promise.all(workers.map(async (worker) => worker.worker.close(true)));

      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), { strict: false }),
      ];
      await Promise.all(queues.map(async (queue) => queue.close()));

      await app.close();
    }
  });

  it('Hoàn tiền 90k cho Item A: Item A/NCC A chịu 90k, Item B/NCC B chịu 0 (Item-Scoped Refund)', async () => {
    const maYeuCau = randomUUID();
    const res = await refundService.hoanTien(
      adminId,
      paymentId,
      {
        maYeuCau,
        soTien: 90000,
        lyDo: 'Hoàn tiền cho Item A bị lỗi chất lượng',
        mucDonHangId: itemAId,
      },
      '127.0.0.1',
    );

    expect(res.trangThaiThanhToan).toBe(TrangThaiThanhToan.PARTIALLY_REFUNDED);
    expect(res.tongDaHoan).toBe(90000);
    expect(res.conLai).toBe(210000);

    // Read real MySQL rows in refund_allocation
    const allocations = await prisma.phanBoHoanTien.findMany({
      where: { thanhToanId: paymentId },
    });

    expect(allocations.length).toBe(1);
    expect(allocations[0]!.mucDonHangId).toBe(itemAId);
    expect(allocations[0]!.nhaCungCapId).toBe(supplierAId);
    expect(Number(allocations[0]!.soTienPhanBo)).toBe(90000);

    // NCC B không bị charge đồng nào
    const allocB = allocations.filter((a) => a.nhaCungCapId === supplierBId);
    expect(allocB).toHaveLength(0);

    // Retry cùng maYeuCau -> Idempotent, không tạo duplicate allocation
    const resRetry = await refundService.hoanTien(
      adminId,
      paymentId,
      {
        maYeuCau,
        soTien: 90000,
        lyDo: 'Hoàn tiền cho Item A bị lỗi chất lượng',
        mucDonHangId: itemAId,
      },
      '127.0.0.1',
    );
    expect(resRetry.tongDaHoan).toBe(90000);

    const allocationsAfterRetry = await prisma.phanBoHoanTien.findMany({
      where: { thanhToanId: paymentId },
    });
    expect(allocationsAfterRetry.length).toBe(1);
  });

  it('Refund khi settlement DANG_CHO: seller_balance.dangCho giảm đúng liability của NCC', async () => {
    // 1. Tạo settlement DANG_CHO cho NCC B (SubOrder B = 200k, hoa hồng 10% = 20k -> phaiTra 180k)
    // Setup delivery event
    const shipB = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: (await prisma.donHangNhaCungCap.findFirstOrThrow({ where: { nhaCungCapId: supplierBId } })).id,
        maVanDon: `VD-B-${suffix}`.slice(0, 30),
        trangThai: 'DELIVERED',
      },
    });
    await prisma.suKienTheoDoiVanChuyen.create({
      data: {
        vanChuyenId: shipB.id,
        trangThai: 'DELIVERED',
        thoiGian: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.quyTacHoaHong.create({
      data: {
        nhaCungCapId: supplierBId,
        danhMucSanPhamId: categoryId,
        tyLe: 10,
        hieuLucTu: new Date('2020-01-01'),
      },
    });

    const subOrderB = await prisma.donHangNhaCungCap.findFirstOrThrow({ where: { nhaCungCapId: supplierBId } });
    const settleB = await prisma.doiSoatNhaCungCap.create({
      data: {
        nhaCungCapId: supplierBId,
        batDauLuc: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ketThucLuc: new Date(),
        doanhThu: 200000,
        hoaHong: 20000,
        hoanTien: 0,
        dieuChinh: 0,
        phaiTra: 180000,
        trangThai: 'DANG_CHO',
        duDieuKienLuc: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.donHangNhaCungCap.update({
      where: { id: subOrderB.id },
      data: { doiSoatId: settleB.id, trangThai: 'HOAN_THANH' },
    });
    await prisma.soDuNhaCungCap.upsert({
      where: { nhaCungCapId: supplierBId },
      create: { nhaCungCapId: supplierBId, dangCho: 180000 },
      update: { dangCho: { increment: 180000 } },
    });

    // 2. Thực hiện Refund 50k cho Item B của NCC B
    const itemB = await prisma.mucDonHang.findFirstOrThrow({
      where: { donHangNhaCungCapId: subOrderB.id },
    });

    await refundService.hoanTien(
      adminId,
      paymentId,
      {
        maYeuCau: randomUUID(),
        soTien: 50000,
        lyDo: 'Hoàn một phần Item B khi settlement DANG_CHO',
        mucDonHangId: itemB.id,
      },
      '127.0.0.1',
    );

    // Assert seller_balance.dangCho của NCC B giảm chính xác 50k (180k - 50k = 130k)
    const balanceB = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierBId },
    });
    expect(Number(balanceB.dangCho)).toBe(130000);
  });

  it('Refund khi settlement KHA_DUNG: seller_balance.khaDung giảm đúng liability của NCC', async () => {
    // 1. Chuyển settlement B sang KHA_DUNG (chuyển 130k từ dangCho sang khaDung)
    await prisma.doiSoatNhaCungCap.updateMany({
      where: { nhaCungCapId: supplierBId },
      data: { trangThai: 'KHA_DUNG' },
    });
    await prisma.soDuNhaCungCap.update({
      where: { nhaCungCapId: supplierBId },
      data: { dangCho: 0, khaDung: 130000 },
    });

    const subOrderB = await prisma.donHangNhaCungCap.findFirstOrThrow({ where: { nhaCungCapId: supplierBId } });
    const itemB = await prisma.mucDonHang.findFirstOrThrow({
      where: { donHangNhaCungCapId: subOrderB.id },
    });

    // 2. Refund thêm 30k cho Item B
    await refundService.hoanTien(
      adminId,
      paymentId,
      {
        maYeuCau: randomUUID(),
        soTien: 30000,
        lyDo: 'Hoàn thêm 30k khi settlement đã khả dụng',
        mucDonHangId: itemB.id,
      },
      '127.0.0.1',
    );

    // Assert seller_balance.khaDung của NCC B giảm chính xác 30k (130k - 30k = 100k)
    const balanceB = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierBId },
    });
    expect(Number(balanceB.khaDung)).toBe(100000);
  });
});
