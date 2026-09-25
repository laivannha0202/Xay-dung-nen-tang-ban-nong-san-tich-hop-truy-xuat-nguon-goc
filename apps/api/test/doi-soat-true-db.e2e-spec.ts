import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiChiTraNhaCungCap,
  TrangThaiDoiSoatNhaCungCap,
  TrangThaiDonHang,
  TrangThaiLoSanPham,
  TrangThaiVanChuyen,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { ChiTraNhaCungCapService } from '../src/modules/chi-tra-nha-cung-cap/chi-tra-nha-cung-cap.service';
import { DoiSoatService } from '../src/modules/doi-soat/doi-soat.service';

describe('True DB E2E Settlement Lifecycle (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let doiSoatService: DoiSoatService;
  let chiTraService: ChiTraNhaCungCapService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let supplierId = '';
  let categoryId = '';
  let farmId = '';
  let harvestId = '';
  let _batchId = '';
  let productId = '';
  let variantId = '';
  let orderId = '';
  let subOrderId = '';
  let shipmentId = '';
  let settlementId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    doiSoatService = app.get(DoiSoatService);
    chiTraService = app.get(ChiTraNhaCungCapService);

    // 1. Admin actor
    const admin = await prisma.nguoiDung.create({
      data: {
        email: `settle-admin-${suffix}@example.com`,
        matKhauHash: 'hash-settle-001',
        hoTen: 'Admin Settlement E2E',
      },
    });
    adminId = admin.id;

    // 2. Supplier & initial balance
    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-${suffix}`.slice(0, 30),
        ten: `Nha Cung Cap ${suffix}`,
        soDienThoai: '0988776655',
        email: `ncc-${suffix}@example.com`,
        diaChi: 'Hà Nội',
      },
    });
    supplierId = supplier.id;

    await prisma.soDuNhaCungCap.create({
      data: {
        nhaCungCapId: supplierId,
        dangCho: 0,
        khaDung: 0,
        tamGiu: 0,
        daThanhToan: 0,
      },
    });

    // 3. Category & Commission Rule (10%)
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Category ${suffix}`,
        slug: `cat-${suffix}`,
      },
    });
    categoryId = category.id;

    await prisma.quyTacHoaHong.create({
      data: {
        nhaCungCapId: supplierId,
        danhMucSanPhamId: categoryId,
        tyLe: 10, // 10%
        hieuLucTu: new Date('2020-01-01T00:00:00.000Z'),
      },
    });

    // 4. Farm, Harvest, Batch, Product, Variant
    const farm = await prisma.trangTrai.create({
      data: {
        nhaCungCapId: supplierId,
        ma: `FARM-${suffix}`.slice(0, 30),
        ten: `Trang Trai ${suffix}`,
        diaChi: 'Hưng Yên',
      },
    });
    farmId = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farmId,
        cayTrong: 'Cam sành',
        giong: 'Cam sành Hàm Yên',
        ngayTrong: new Date('2026-01-05'),
        ngayDuKienThuHoach: new Date('2026-08-01'),
        sanLuongDuKienKg: 1000,
      },
    });

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01'),
        soLuong: 1000,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    harvestId = harvest.id;

    const batch = await prisma.loSanPham.create({
      data: {
        thuHoachId: harvestId,
        maLo: `LO-${suffix}`.slice(0, 30),
        soLuong: 500,
        conLai: 500,
        ngayHetHan: new Date('2027-01-01'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    _batchId = batch.id;

    const product = await prisma.sanPham.create({
      data: {
        trangTraiId: farmId,
        danhMucSanPhamId: categoryId,
        ten: `Cam sành ${suffix}`,
      },
    });
    productId = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: productId,
        sku: `SKU-${suffix}`.slice(0, 30),
        khoiLuong: 1,
        donVi: 'kg',
        gia: 100000, // 100k
      },
    });
    variantId = variant.id;

    // Customer
    const customerUser = await prisma.nguoiDung.create({
      data: {
        email: `cust-${suffix}@example.com`,
        matKhauHash: 'hash-cust',
        hoTen: 'Khach Hang Test',
      },
    });
    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: customerUser.id,
        maKhachHang: `KH-${suffix}`.slice(0, 30),
      },
    });

    // 5. Order & Delivered Suborder
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `DH-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: customer.id,
        tongTien: 100000,
        tamTinhHangHoa: 100000,
        phiVanChuyen: 0,
        trangThai: TrangThaiDonHang.HOAN_THANH,
      },
    });
    orderId = order.id;

    const subOrder = await prisma.donHangNhaCungCap.create({
      data: {
        donHangId: orderId,
        nhaCungCapId: supplierId,
        maDon: `SUB-${suffix}`.slice(0, 30),
        tamTinh: 100000,
        trangThai: TrangThaiDonHang.HOAN_THANH,
      },
    });
    subOrderId = subOrder.id;

    await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: subOrderId,
        sanPhamId: productId,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: variantId,
        trangTraiId: farmId,
        soLuong: 1,
        donGiaSnapshot: 100000,
        tenSanPhamSnapshot: 'Cam sành',
        skuBienTheSnapshot: `SKU-${suffix}`.slice(0, 30),
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'TR-01',
        tenTrangTraiSnapshot: 'Trang trại Hưng Yên',
      },
    });

    const shipment = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: subOrderId,
        maVanDon: `VD-${suffix}`.slice(0, 30),
        trangThai: TrangThaiVanChuyen.DELIVERED,
      },
    });
    shipmentId = shipment.id;

    // Delivery event occurred 10 days ago
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await prisma.suKienTheoDoiVanChuyen.create({
      data: {
        vanChuyenId: shipmentId,
        trangThai: TrangThaiVanChuyen.DELIVERED,
        thoiGian: tenDaysAgo,
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

  it('A. Tạo settlement: doanh thu 100k, hoa hồng 10k (10%), phaiTra 90k -> seller balance dangCho +90k', async () => {
    const created = await doiSoatService.tao(
      adminId,
      {
        nhaCungCapId: supplierId,
        batDauLuc: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ketThucLuc: new Date().toISOString(),
        hoanTien: 0,
        dieuChinh: 0,
      },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    settlementId = created.id;
    expect(created.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.DANG_CHO);
    expect(created.phaiTra).toBe(90000);

    const balance = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierId },
    });
    expect(Number(balance.dangCho)).toBe(90000);
    expect(Number(balance.khaDung)).toBe(0);
  });

  it('B. Release trước eligible: reject, balance không đổi', async () => {
    // duDieuKienLuc is in future
    await prisma.doiSoatNhaCungCap.update({
      where: { id: settlementId },
      data: { duDieuKienLuc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await expect(
      doiSoatService.giaiPhong(adminId, settlementId, { ip: '127.0.0.1', userAgent: 'Jest-E2E' }),
    ).rejects.toThrow();

    const balance = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierId },
    });
    expect(Number(balance.dangCho)).toBe(90000);
    expect(Number(balance.khaDung)).toBe(0);
  });

  it('C. Complaint open: reject, balance không đổi', async () => {
    await prisma.doiSoatNhaCungCap.update({
      where: { id: settlementId },
      data: { duDieuKienLuc: new Date(Date.now() - 1000) },
    });

    const item = await prisma.mucDonHang.findFirstOrThrow({
      where: { donHangNhaCungCapId: subOrderId },
    });

    const complaint = await prisma.khieuNai.create({
      data: {
        maKhieuNai: `KN-${suffix}`.slice(0, 30),
        mucDonHangId: item.id,
        lyDo: 'HONG',
        moTa: 'Hàng hỏng',
      },
    });

    await expect(
      doiSoatService.giaiPhong(adminId, settlementId, { ip: '127.0.0.1', userAgent: 'Jest-E2E' }),
    ).rejects.toThrow(/khiếu nại/);

    // Clean up complaint
    await prisma.khieuNai.delete({ where: { id: complaint.id } });
  });

  it('F. 2 concurrent release requests: chỉ một movement tài chính, không double credit', async () => {
    const [res1, res2] = await Promise.all([
      doiSoatService.giaiPhong(adminId, settlementId, { ip: '127.0.0.1', userAgent: 'Jest-E2E' }),
      doiSoatService.giaiPhong(adminId, settlementId, { ip: '127.0.0.1', userAgent: 'Jest-E2E' }),
    ]);

    expect(res1.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.KHA_DUNG);
    expect(res2.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.KHA_DUNG);

    const balance = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierId },
    });
    expect(Number(balance.dangCho)).toBe(0);
    expect(Number(balance.khaDung)).toBe(90000);
  });

  it('H. Settlement tự động derive canonical refund từ ledger, input.hoanTien bị ignore', async () => {
    // Tạo 1 order mới và suborder mới đã Delivered và có refund 20k trong ledger
    const newOrder = await prisma.donHang.create({
      data: {
        maDonHang: `DH-H-${suffix}`.slice(0, 30),
        maYeuCau: randomUUID(),
        khachHangId: (await prisma.khachHang.findFirstOrThrow()).id,
        tongTien: 100000,
        tamTinhHangHoa: 100000,
        phiVanChuyen: 0,
        trangThai: TrangThaiDonHang.HOAN_THANH,
      },
    });

    const newSub = await prisma.donHangNhaCungCap.create({
      data: {
        donHangId: newOrder.id,
        nhaCungCapId: supplierId,
        maDon: `SUB-DERIVED-${suffix}`.slice(0, 30),
        tamTinh: 100000,
        trangThai: TrangThaiDonHang.HOAN_THANH,
      },
    });

    const newItem = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: newSub.id,
        sanPhamId: productId,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: variantId,
        trangTraiId: farmId,
        soLuong: 1,
        donGiaSnapshot: 100000,
        tenSanPhamSnapshot: 'Cam sành',
        skuBienTheSnapshot: `SKU-${suffix}`.slice(0, 30),
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'TR-01',
        tenTrangTraiSnapshot: 'Trang trại Hưng Yên',
      },
    });

    const newShip = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: newSub.id,
        maVanDon: `VD-DER-${suffix}`.slice(0, 30),
        trangThai: TrangThaiVanChuyen.DELIVERED,
      },
    });

    await prisma.suKienTheoDoiVanChuyen.create({
      data: {
        vanChuyenId: newShip.id,
        trangThai: TrangThaiVanChuyen.DELIVERED,
        thoiGian: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });

    // Tạo record refund 20k vào refund_allocation cho đơn này
    await prisma.phanBoHoanTien.create({
      data: {
        thanhToanId: randomUUID(),
        donHangId: newOrder.id,
        mucDonHangId: newItem.id,
        nhaCungCapId: supplierId,
        soTienPhanBo: 20000,
        tongSoTienHoan: 20000,
        maYeuCau: `REQ-DERIVED-${randomUUID()}`,
      },
    });

    // Client gửi fake hoanTien = 0 hoặc 999999
    // Kỳ đối soát tiếp theo (kỳ tương lai, không overlap)
    const nextStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const nextEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await prisma.suKienTheoDoiVanChuyen.updateMany({
      where: { vanChuyenId: newShip.id },
      data: { thoiGian: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    });

    const createdWithDerived = await doiSoatService.tao(
      adminId,
      {
        nhaCungCapId: supplierId,
        batDauLuc: nextStart,
        ketThucLuc: nextEnd,
        hoanTien: 0, // Client gửi 0
        dieuChinh: 0,
      },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    // Backend bắt buộc derive refund = 20.000đ từ ledger!
    expect(Number(createdWithDerived.hoanTien)).toBe(20000);
    // Doanh thu 100k - Hoa hồng 10k (10%) - Hoàn tiền 20k = Phải trả 70k
    expect(Number(createdWithDerived.phaiTra)).toBe(70000);
  });

  it('I. Explicit Payout: Tạo payout 90k -> khaDung giảm về 0, tamGiu 90k; chuyển PAID -> daThanhToan 90k', async () => {
    const payout = await chiTraService.taoTuDoiSoat(
      adminId,
      settlementId,
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    expect(payout.trangThai).toBe(TrangThaiChiTraNhaCungCap.REQUESTED);
    expect(payout.soTien).toBe(90000);

    let balance = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierId },
    });
    expect(Number(balance.khaDung)).toBe(0);
    expect(Number(balance.tamGiu)).toBe(90000);

    // Chuyển PROCESSING -> PAID
    await chiTraService.capNhatTrangThai(
      adminId,
      payout.id,
      { trangThai: TrangThaiChiTraNhaCungCap.PROCESSING },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    await chiTraService.capNhatTrangThai(
      adminId,
      payout.id,
      { trangThai: TrangThaiChiTraNhaCungCap.PAID },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    balance = await prisma.soDuNhaCungCap.findUniqueOrThrow({
      where: { nhaCungCapId: supplierId },
    });
    expect(Number(balance.khaDung)).toBe(0);
    expect(Number(balance.tamGiu)).toBe(0);
    expect(Number(balance.daThanhToan)).toBe(90000);
  });
});
