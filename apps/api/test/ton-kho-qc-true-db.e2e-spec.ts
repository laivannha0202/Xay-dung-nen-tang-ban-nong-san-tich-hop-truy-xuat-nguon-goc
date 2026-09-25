import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { LoaiGiaoDichTonKho, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { TonKhoService } from '../src/modules/ton-kho/ton-kho.service';

describe('True DB E2E Returned Stock QC (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tonKhoService: TonKhoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let warehouseId = '';
  let lotId = '';
  let variantId = '';
  let inventoryLotId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    tonKhoService = app.get(TonKhoService);

    const admin = await prisma.nguoiDung.create({
      data: { email: `qc-admin-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Admin QC' },
    });
    adminId = admin.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-QC-${suffix}`.slice(0, 30),
        ten: 'Kho Test QC',
        diaChi: 'Hà Nội',
      },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-QC-${suffix}`.slice(0, 30), ten: 'NCC QC', soDienThoai: '0944444444', email: `nccqc-${suffix}@example.com`, diaChi: 'HN' },
    });
    const farm = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplier.id, ma: `FQC-${suffix}`.slice(0, 30), ten: 'Farm QC', diaChi: 'HN' },
    });
    const category = await prisma.danhMucSanPham.create({
      data: { ten: `Cat QC ${suffix}`, slug: `cat-qc-${suffix}` },
    });
    const product = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: category.id, ten: 'Prod QC' },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku: `SKU-QC-${suffix}`.slice(0, 30), khoiLuong: 1, donVi: 'kg', gia: 50000 },
    });
    variantId = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Cam',
        giong: 'Cam Vinh',
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
        maLo: `LO-QC-${suffix}`.slice(0, 30),
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date('2027-01-01'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    lotId = lot.id;

    // Start with: onHand = 10, reserved = 0, blocked = 3
    const inventoryLot = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouseId,
        loSanPhamId: lotId,
        bienTheSanPhamId: variantId,
        onHand: 10,
        reserved: 0,
        blocked: 3,
      },
    });
    inventoryLotId = inventoryLot.id;
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

  it('QC PASS: blocked giảm 1, onHand giữ nguyên 10 -> available tăng 1', async () => {
    const res = await tonKhoService.kiemTraChatLuongLo(
      adminId,
      inventoryLotId,
      { soLuong: 1, quyetDinh: 'PASS', lyDo: 'Hàng hoàn bao bì nguyên vẹn' },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    expect(res.daThayDoi).toBe(true);
    expect(res.quyetDinh).toBe('PASS');

    const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: inventoryLotId } });
    expect(Number(lot.onHand)).toBe(10);
    expect(Number(lot.blocked)).toBe(2);
    // available = 10 - 0 - 2 = 8 (tăng từ 7 lên 8)
  });

  it('QC DAMAGE: blocked giảm 1, onHand giảm 1 (còn 9), ghi DAMAGE ledger', async () => {
    const res = await tonKhoService.kiemTraChatLuongLo(
      adminId,
      inventoryLotId,
      { soLuong: 1, quyetDinh: 'DAMAGE', lyDo: 'Hàng hoàn bị vỡ dập' },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    expect(res.daThayDoi).toBe(true);

    const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: inventoryLotId } });
    expect(Number(lot.onHand)).toBe(9);
    expect(Number(lot.blocked)).toBe(1);

    const txs = await prisma.giaoDichTonKho.findMany({
      where: { tonKhoLoId: inventoryLotId, loai: LoaiGiaoDichTonKho.DAMAGE },
    });
    expect(txs.length).toBe(1);
    expect(Number(txs[0]!.soLuong)).toBe(1);
  });

  it('QC EXPIRE: blocked giảm 1, onHand giảm 1 (còn 8), ghi EXPIRE ledger', async () => {
    const res = await tonKhoService.kiemTraChatLuongLo(
      adminId,
      inventoryLotId,
      { soLuong: 1, quyetDinh: 'EXPIRE', lyDo: 'Hàng hoàn quá hạn sử dụng' },
      { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
    );

    expect(res.daThayDoi).toBe(true);

    const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: inventoryLotId } });
    expect(Number(lot.onHand)).toBe(8);
    expect(Number(lot.blocked)).toBe(0);

    const txs = await prisma.giaoDichTonKho.findMany({
      where: { tonKhoLoId: inventoryLotId, loai: LoaiGiaoDichTonKho.EXPIRE },
    });
    expect(txs.length).toBe(1);
    expect(Number(txs[0]!.soLuong)).toBe(1);
  });

  it('Chặn QC khi số lượng vượt quá blocked (hiện blocked = 0)', async () => {
    await expect(
      tonKhoService.kiemTraChatLuongLo(
        adminId,
        inventoryLotId,
        { soLuong: 1, quyetDinh: 'PASS', lyDo: 'Thử vượt blocked' },
        { ip: '127.0.0.1', userAgent: 'Jest-E2E' },
      ),
    ).rejects.toThrow();
  });
});
