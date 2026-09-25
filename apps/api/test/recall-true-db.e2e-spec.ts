import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { BaoCaoTruyXuatService } from '../src/modules/bao-cao-truy-xuat/bao-cao-truy-xuat.service';
import { LoSanPhamService } from '../src/modules/lo-san-pham/lo-san-pham.service';

describe('True DB E2E Recall & Traceability Report (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let loSanPhamService: LoSanPhamService;
  let baoCaoTruyXuatService: BaoCaoTruyXuatService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let lotId = '';
  let orderId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    loSanPhamService = app.get(LoSanPhamService);
    baoCaoTruyXuatService = app.get(BaoCaoTruyXuatService);

    // Admin
    const admin = await prisma.nguoiDung.create({
      data: { email: `recall-admin-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Admin Recall' },
    });
    adminId = admin.id;

    // Customer
    const user = await prisma.nguoiDung.create({
      data: { email: `recall-cust-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Customer Recall' },
    });
    const customer = await prisma.khachHang.create({
      data: { nguoiDungId: user.id, maKhachHang: `KH-REC-${suffix}`.slice(0, 30) },
    });

    const warehouse = await prisma.kho.create({
      data: { maKho: `KHO-REC-${suffix}`.slice(0, 30), ten: 'Kho Recall', diaChi: 'HN' },
    });

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-REC-${suffix}`.slice(0, 30), ten: 'NCC Recall', soDienThoai: '0955555555', email: `nccrec-${suffix}@example.com`, diaChi: 'HN' },
    });
    const farm = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplier.id, ma: `FREC-${suffix}`.slice(0, 30), ten: 'Farm Recall', diaChi: 'HN' },
    });
    const category = await prisma.danhMucSanPham.create({
      data: { ten: `Cat REC ${suffix}`, slug: `cat-rec-${suffix}` },
    });
    const product = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: category.id, ten: 'Prod Recall' },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku: `SKU-REC-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 60000 },
    });

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Bưởi',
        giong: 'Bưởi da xanh',
        ngayTrong: new Date('2026-01-01'),
        ngayDuKienThuHoach: new Date('2026-08-01'),
        sanLuongDuKienKg: 1000,
      },
    });
    const harvest = await prisma.thuHoach.create({
      data: { muaVuId: season.id, ngayThuHoach: new Date('2026-08-01'), soLuong: 500, donVi: 'kg', phanLoai: 'Loại 1' },
    });

    const lot = await prisma.loSanPham.create({
      data: {
        thuHoachId: harvest.id,
        maLo: `LO-REC-${suffix}`.slice(0, 30),
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date('2027-01-01'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    lotId = lot.id;

    const inventoryLot = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: lotId,
        bienTheSanPhamId: variant.id,
        onHand: 10,
        reserved: 0,
        blocked: 0,
      },
    });

    // Order with allocation from this lot
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-REC-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: customer.id,
        tongTien: 60000,
        tamTinhHangHoa: 60000,
        phiVanChuyen: 0,
        trangThai: TrangThaiDonHang.DA_GIAO,
      },
    });
    orderId = order.id;

    const sub = await prisma.donHangNhaCungCap.create({
      data: { donHangId: order.id, nhaCungCapId: supplier.id, maDon: `SUB-REC-${suffix}`.slice(0, 30), tamTinh: 60000 },
    });

    const item = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: sub.id,
        sanPhamId: product.id,
        danhMucSanPhamIdSnapshot: category.id,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 1,
        donGiaSnapshot: 60000,
        tenSanPhamSnapshot: 'Prod Recall',
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'FREC',
        tenTrangTraiSnapshot: 'Farm Recall',
      },
    });

    await prisma.phanBoDonHang.create({
      data: {
        mucDonHangId: item.id,
        tonKhoLoId: inventoryLot.id,
        soLuong: 1,
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

  it('Thu hồi lô sản phẩm và kiểm tra báo cáo impacted order/batch', async () => {
    // 1. Thu hồi lô
    const resThuHoi = await loSanPhamService.thuHoi(
      adminId,
      lotId,
      {
        lyDo: 'Phát hiện dư lượng thuốc BVTV vượt ngưỡng',
        thongBaoKhachHang: 'Kính gửi quý khách, lô hàng có sự cố chất lượng vui lòng liên hệ hoàn tiền.',
      },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    expect(resThuHoi.trangThai).toBe(TrangThaiLoSanPham.THU_HOI);
    expect(resThuHoi.thuHoi).not.toBeNull();

    // 2. Báo cáo danh sách thu hồi có lô này
    const danhSachThuHoi = await baoCaoTruyXuatService.layDanhSachThuHoi({
      trang: 1,
      gioiHan: 10,
      timKiem: `LO-REC-${suffix}`.slice(0, 30),
    });
    expect(danhSachThuHoi.duLieu.length).toBe(1);
    expect(danhSachThuHoi.duLieu[0]!.loSanPhamId).toBe(lotId);
    expect(danhSachThuHoi.duLieu[0]!.soDonHangAnhHuong).toBe(1);

    // 3. Báo cáo đơn hàng bị ảnh hưởng
    const affectedOrders = await baoCaoTruyXuatService.layDonHangAnhHuong({
      trang: 1,
      gioiHan: 10,
      loSanPhamId: lotId,
    });
    expect(affectedOrders.duLieu.length).toBe(1);
    expect(affectedOrders.duLieu[0]!.donHangId).toBe(orderId);
    expect(affectedOrders.tongDonHang).toBe(1);
  });
});
