import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  TrangThaiLoSanPham,
  TrangThaiBanGhi,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Inventory Transaction Ledger (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Ledger-036';
  const emailKhach = `ledger-khach-${suffix}@example.com`;
  const emailNhanVien = `ledger-nv-${suffix}@example.com`;
  const emailAdmin = `ledger-admin-${suffix}@example.com`;

  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let tonKhoLoId = '';
  let giaoDichId = '';
  let onHandBanDau = 0;
  let reservedBanDau = 0;
  let blockedBanDau = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Ledger E2E PHIEN 036' })
        .expect(201);
    }

    const [_khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNhanVien } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
    ]);

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVien.id,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        {
          nguoiDungId: admin.id,
          vaiTroId: roleAdmin.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      ],
    });

    const login = async (email: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'MOBILE' })
        .expect(200);
      return response.body.accessToken as string;
    };
    [tokenKhach, tokenNhanVien, tokenAdmin] = await Promise.all([
      login(emailKhach),
      login(emailNhanVien),
      login(emailAdmin),
    ]);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-L36-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Ledger PHIEN 036',
      },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-L36-${suffix}`.slice(0, 50),
        ten: 'Trang trại Ledger',
        diaChi: 'Hà Nội',
        nhaCungCapId: supplier.id,
      },
    });
    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Ledger',
        giong: 'L36',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-L36-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date('2027-01-01T00:00:00.000Z'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục Ledger ${suffix}`.slice(0, 150),
        slug: `ledger-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Ledger',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `LEDGER-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 10000,
        donVi: 'kg',
      },
    });
    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-L36-${suffix}`.slice(0, 50),
        ten: 'Kho Ledger',
        diaChi: 'Hà Nội',
      },
    });
    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 50,
        reserved: 5,
        blocked: 2,
      },
    });
    tonKhoLoId = inventory.id;
    onHandBanDau = Number(inventory.onHand);
    reservedBanDau = Number(inventory.reserved);
    blockedBanDau = Number(inventory.blocked);

    const transactions = [
      [LoaiGiaoDichTonKho.HARVEST_IN, 10],
      [LoaiGiaoDichTonKho.TRANSFER_IN, 2],
      [LoaiGiaoDichTonKho.TRANSFER_OUT, 1],
      [LoaiGiaoDichTonKho.ORDER_RESERVE, 1],
      [LoaiGiaoDichTonKho.ORDER_RELEASE, 1],
      [LoaiGiaoDichTonKho.ORDER_SHIP, 1],
      [LoaiGiaoDichTonKho.RETURN_IN, 1],
      [LoaiGiaoDichTonKho.DAMAGE, 1],
      [LoaiGiaoDichTonKho.EXPIRE, 1],
      [LoaiGiaoDichTonKho.ADJUSTMENT, -0.5],
    ] as const;

    for (const [loai, soLuong] of transactions) {
      const item = await prisma.giaoDichTonKho.create({
        data: { tonKhoLoId, loai, soLuong },
      });
      if (loai === LoaiGiaoDichTonKho.HARVEST_IN) giaoDichId = item.id;
    }
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();
    const log = (text: string) =>
      console.log(`[LEDGER E2E cleanup +${Date.now() - start}ms] ${text}`);

    // Ledger immutable nên cố ý không DELETE fixture DB.
    // Validation DB là DB cô lập và automation sẽ DROP sau toàn bộ gate.
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
      log('app.close() hoàn tất; fixture immutable để DB validation tự drop.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('DB enum có đúng 10 transaction type master', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ columnType: string }>>(`
SELECT COLUMN_TYPE AS columnType
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'inventory_transaction'
  AND COLUMN_NAME = 'loai'
`);
    const value = rows[0]?.columnType ?? '';
    for (const type of Object.values(LoaiGiaoDichTonKho)) {
      expect(value).toContain(type);
    }
    expect(Object.values(LoaiGiaoDichTonKho)).toHaveLength(10);
  });

  it('API ledger cần auth; KHACH_HANG 403; NHAN_VIEN/ADMIN xem được', async () => {
    await request(app.getHttpServer()).get('/api/v1/giao-dich-ton-kho').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/giao-dich-ton-kho')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/giao-dich-ton-kho')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/giao-dich-ton-kho')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });

  it('list/detail trả ledger + key Warehouse/Batch/Variant', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/giao-dich-ton-kho')
      .query({ tonKhoLoId, trang: 1, gioiHan: 20 })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(list.body.tong).toBe(10);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/giao-dich-ton-kho/${giaoDichId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(detail.body.tonKhoLoId).toBe(tonKhoLoId);
    expect(detail.body.loai).toBe('HARVEST_IN');
    expect(detail.body.soLuong).toBe(10);
    expect(detail.body.kho.maKho).toContain('KHO-L36');
    expect(detail.body.loSanPham.maLo).toContain('LO-L36');
    expect(detail.body.bienThe.sku).toContain('LEDGER');
  });

  it('list lọc theo loại và ADJUSTMENT giữ signed quantity', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/giao-dich-ton-kho')
      .query({ tonKhoLoId, loai: 'ADJUSTMENT' })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(response.body.tong).toBe(1);
    expect(response.body.duLieu[0].loai).toBe('ADJUSTMENT');
    expect(response.body.duLieu[0].soLuong).toBe(-0.5);
  });

  it('DB quantity rule: type thường >0; ADJUSTMENT !=0', async () => {
    await expect(
      prisma.giaoDichTonKho.create({
        data: {
          tonKhoLoId,
          loai: LoaiGiaoDichTonKho.DAMAGE,
          soLuong: 0,
        },
      }),
    ).rejects.toBeTruthy();

    await expect(
      prisma.giaoDichTonKho.create({
        data: {
          tonKhoLoId,
          loai: LoaiGiaoDichTonKho.TRANSFER_OUT,
          soLuong: -1,
        },
      }),
    ).rejects.toBeTruthy();

    await expect(
      prisma.giaoDichTonKho.create({
        data: {
          tonKhoLoId,
          loai: LoaiGiaoDichTonKho.ADJUSTMENT,
          soLuong: 0,
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('ledger immutable ở DB: UPDATE bị trigger chặn', async () => {
    await expect(
      prisma.giaoDichTonKho.update({
        where: { id: giaoDichId },
        data: { soLuong: 999 },
      }),
    ).rejects.toBeTruthy();
  });

  it('ledger immutable ở DB: DELETE bị trigger chặn', async () => {
    await expect(
      prisma.giaoDichTonKho.delete({
        where: { id: giaoDichId },
      }),
    ).rejects.toBeTruthy();
  });

  it('append ledger trực tiếp ở PHIEN-036 không tự mutate InventoryLot quantity', async () => {
    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: tonKhoLoId } });
    expect(Number(inventory.onHand)).toBe(onHandBanDau);
    expect(Number(inventory.reserved)).toBe(reservedBanDau);
    expect(Number(inventory.blocked)).toBe(blockedBanDau);
  });

  it('PHIEN-037 movement đi qua TonKho; Ledger API vẫn read-only', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/giao-dich-ton-kho')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/giao-dich-ton-kho/${giaoDichId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/giao-dich-ton-kho/${giaoDichId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    for (const path of ['/api/v1/ton-kho/nhap', '/api/v1/ton-kho/xuat', '/api/v1/ton-kho/chuyen']) {
      await request(app.getHttpServer())
        .post(path)
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .send({})
        .expect(403);
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ ledger: number; ledgerCols: number; triggers: number; phaseSau: number }>
    >(`
SELECT
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_transaction') AS ledger,
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_transaction') AS ledgerCols,
  (SELECT COUNT(*) FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'inventory_transaction') AS triggers,
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('don_hang','gio_hang')) AS phaseSau
`);
    expect(Number(rows[0]?.ledger ?? -1)).toBe(1);
    expect(Number(rows[0]?.ledgerCols ?? -1)).toBe(5);
    expect(Number(rows[0]?.triggers ?? -1)).toBe(2);
    expect(Number(rows[0]?.phaseSau ?? -1)).toBe(0);
  });
});
