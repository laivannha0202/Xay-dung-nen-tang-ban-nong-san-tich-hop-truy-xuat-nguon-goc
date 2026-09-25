import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiDonHang,
  TrangThaiKhieuNai,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { KhieuNaiService } from '../src/modules/khieu-nai/khieu-nai.service';

describe('True DB E2E Complaint Saga & Freeze (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let khieuNaiService: KhieuNaiService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let customerId = '';
  let supplierId = '';
  let categoryId = '';
  let itemId = '';
  let paymentId = '';
  let complaintId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    khieuNaiService = app.get(KhieuNaiService);

    // Admin
    const admin = await prisma.nguoiDung.create({
      data: {
        email: `c-admin-${suffix}@example.com`,
        matKhauHash: 'hash',
        hoTen: 'Admin Complaint Test',
      },
    });
    adminId = admin.id;

    // Customer
    const user = await prisma.nguoiDung.create({
      data: {
        email: `c-cust-${suffix}@example.com`,
        matKhauHash: 'hash',
        hoTen: 'Cust Complaint Test',
      },
    });
    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
        maKhachHang: `KH-CMP-${suffix}`.slice(0, 30),
      },
    });
    customerId = customer.id;

    // Supplier
    const ncc = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-CMP-${suffix}`.slice(0, 30),
        ten: 'Supplier CMP',
        soDienThoai: '0933333333',
        email: `nccCMP-${suffix}@example.com`,
        diaChi: 'Hà Nội',
      },
    });
    supplierId = ncc.id;

    const cat = await prisma.danhMucSanPham.create({
      data: { ten: `Cat ${suffix}`, slug: `cat-c-${suffix}` },
    });
    categoryId = cat.id;

    const farm = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplierId, ma: `FC-${suffix}`.slice(0, 30), ten: 'Farm C', diaChi: 'HN' },
    });

    const prod = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: categoryId, ten: 'Prod C' },
    });

    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: prod.id, sku: `SKU-C-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 100000 },
    });

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-CMP-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: customerId,
        tongTien: 100000,
        tamTinhHangHoa: 100000,
        phiVanChuyen: 0,
        trangThai: TrangThaiDonHang.DA_GIAO,
      },
    });

    const sub = await prisma.donHangNhaCungCap.create({
      data: { donHangId: order.id, nhaCungCapId: supplierId, maDon: `SUBC-${suffix}`.slice(0, 30), tamTinh: 100000 },
    });

    const item = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: sub.id,
        sanPhamId: prod.id,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 1,
        donGiaSnapshot: 100000,
        tenSanPhamSnapshot: 'Prod C',
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'FC',
        tenTrangTraiSnapshot: 'Farm C',
      },
    });
    itemId = item.id;

    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: 100000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
      },
    });
    paymentId = payment.id;

    await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: payment.id,
        maGiaoDich: `PAY-CMP-${suffix}`.slice(0, 50),
        soTien: 100000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
        thoiGian: new Date(),
      },
    });

    const complaint = await prisma.khieuNai.create({
      data: {
        maKhieuNai: `KN-${suffix}`.slice(0, 30),
        mucDonHangId: itemId,
        lyDo: 'HONG',
        moTa: 'Hàng hỏng cần hoàn tiền',
        trangThai: TrangThaiKhieuNai.MOI,
      },
    });
    complaintId = complaint.id;
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

  it('Admin CHAP_NHAN khiếu nại kèm refund: saga execute ngoài SQL transaction, chuyển DA_HOAN_TIEN', async () => {
    const updated = await khieuNaiService.capNhatXuLyQuanTri(
      adminId,
      complaintId,
      {
        trangThai: TrangThaiKhieuNai.CHAP_NHAN,
        soTienDieuChinh: 50000,
        lyDoDieuChinh: 'Chấp nhận hoàn tiền một phần',
        phanHoiKhachHang: 'Đã hoàn 50.000đ cho bạn',
      },
    );

    expect(updated.trangThai).toBe(TrangThaiKhieuNai.DA_HOAN_TIEN);

    // Verify Payment row updated
    const payment = await prisma.thanhToan.findUniqueOrThrow({
      where: { id: paymentId },
    });
    expect(payment.trangThai).toBe(TrangThaiThanhToan.PARTIALLY_REFUNDED);

    // Verify refund allocation row created
    const allocations = await prisma.phanBoHoanTien.findMany({
      where: { thanhToanId: paymentId },
    });
    expect(allocations.length).toBeGreaterThan(0);
    expect(allocations.some((a) => Number(a.soTienPhanBo) === 50000)).toBe(true);
  });
});
