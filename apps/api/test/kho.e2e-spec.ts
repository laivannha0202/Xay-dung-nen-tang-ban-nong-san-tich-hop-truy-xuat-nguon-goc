import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Kho (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Kho-034';
  const emailKhach = `kho-khach-${suffix}@example.com`;
  const emailNhanVien = `kho-nv-${suffix}@example.com`;
  const emailAdmin = `kho-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let khoId = '';
  let maKho = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Kho E2E PHIEN 034' })
        .expect(201);
    }

    const [khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNhanVien } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
    ]);
    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVienId,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        {
          nguoiDungId: adminId,
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
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();
    const log = (text: string) => console.log(`[KHO E2E cleanup +${Date.now() - start}ms] ${text}`);

    if (prisma) {
      await prisma.nhatKyKiemToan.deleteMany({
        where: {
          OR: [
            { thucThe: 'kho', thucTheId: khoId || undefined },
            { tacNhanId: { in: [khachId, nhanVienId, adminId].filter(Boolean) } },
          ],
        },
      });
      if (khoId) {
        await prisma.kho.deleteMany({ where: { id: khoId } });
      }
      const ids = [khachId, nhanVienId, adminId].filter(Boolean);
      if (ids.length) {
        await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } });
      }
      log('Cleanup MySQL hoàn tất.');
    }

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
      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('seed permission Kho đúng least privilege', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: { ma: { startsWith: 'kho.' } },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: { select: { ma: true } },
        quyen: { select: { ma: true } },
      },
    });
    expect(mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort()).toEqual([
      'ADMIN:kho.khoa',
      'ADMIN:kho.sua',
      'ADMIN:kho.tao',
      'ADMIN:kho.xem',
      'NHAN_VIEN:kho.sua',
      'NHAN_VIEN:kho.tao',
      'NHAN_VIEN:kho.xem',
    ]);
  });

  it('API Kho cần auth; KHACH_HANG không xem được', async () => {
    await request(app.getHttpServer()).get('/api/v1/kho').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/kho')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('maKho/ten/diaChi không được rỗng sau trim', async () => {
    for (const body of [
      { maKho: '   ', ten: 'Kho A', diaChi: 'Hà Nội' },
      { maKho: `KHO-V-${suffix}`.slice(0, 50), ten: '   ', diaChi: 'Hà Nội' },
      { maKho: `KHO-V2-${suffix}`.slice(0, 50), ten: 'Kho A', diaChi: '   ' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/kho')
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .send(body)
        .expect(400);
    }
  });

  it('NHAN_VIEN tạo/list/detail Kho và duplicate maKho -> 409', async () => {
    maKho = `KHO-034-${suffix}`.slice(0, 50);
    const created = await request(app.getHttpServer())
      .post('/api/v1/kho')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Kho-E2E')
      .send({
        maKho,
        ten: 'Kho trung tâm PHIEN 034',
        diaChi: 'Hà Nội',
      })
      .expect(201);

    khoId = created.body.id as string;
    expect(created.body.maKho).toBe(maKho);
    expect(created.body.trangThai).toBe('HOAT_DONG');

    const list = await request(app.getHttpServer())
      .get('/api/v1/kho')
      .query({ timKiem: maKho, trang: 1, gioiHan: 10 })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0].id).toBe(khoId);

    await request(app.getHttpServer())
      .get(`/api/v1/kho/${khoId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.diaChi).toBe('Hà Nội');
      });

    await request(app.getHttpServer())
      .post('/api/v1/kho')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ maKho, ten: 'Trùng mã', diaChi: 'Đà Nẵng' })
      .expect(409);
  });

  it('list hỗ trợ search và status filter', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/kho')
      .query({ timKiem: 'Hà Nội', trangThai: 'HOAT_DONG', trang: 1, gioiHan: 10 })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(list.body.duLieu.some((item: { id: string }) => item.id === khoId)).toBe(true);
  });

  it('NHAN_VIEN cập nhật mã/tên/địa chỉ Kho', async () => {
    const maMoi = `KHO-034-UP-${suffix}`.slice(0, 50);
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/kho/${khoId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maKho: maMoi,
        ten: 'Kho trung tâm đã cập nhật',
        diaChi: 'Hải Phòng',
      })
      .expect(200);
    expect(updated.body.maKho).toBe(maMoi);
    expect(updated.body.ten).toBe('Kho trung tâm đã cập nhật');
    expect(updated.body.diaChi).toBe('Hải Phòng');
    maKho = maMoi;
  });

  it('NHAN_VIEN không khóa Kho', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/kho/${khoId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(403);
  });

  it('ADMIN khóa/mở Kho', async () => {
    const locked = await request(app.getHttpServer())
      .patch(`/api/v1/kho/${khoId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('User-Agent', 'AgriMarket-Kho-Admin-E2E')
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(200);
    expect(locked.body.trangThai).toBe('NGUNG_HOAT_DONG');

    const filtered = await request(app.getHttpServer())
      .get('/api/v1/kho')
      .query({ trangThai: 'NGUNG_HOAT_DONG', timKiem: maKho })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(filtered.body.tong).toBe(1);

    await request(app.getHttpServer())
      .patch(`/api/v1/kho/${khoId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'HOAT_DONG' })
      .expect(200);
  });

  it('Audit ghi create/update/status đúng actor', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: { thucThe: 'kho', thucTheId: khoId },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs.map((item) => item.hanhDong)).toEqual([
      'KHO_TAO',
      'KHO_SUA',
      'KHO_DOI_TRANG_THAI',
      'KHO_DOI_TRANG_THAI',
    ]);
    const stateLog = logs.find((item) => item.hanhDong === 'KHO_DOI_TRANG_THAI');
    expect(stateLog?.tacNhanId).toBe(adminId);
    expect(stateLog?.metadata).toEqual(
      expect.objectContaining({ userAgent: 'AgriMarket-Kho-Admin-E2E' }),
    );
  });

  it('không có DELETE Kho; PHIEN-035 tạo InventoryLot riêng, Kho vẫn là master data', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/kho/${khoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        inventoryLot: number;
        inventoryCols: number;
        availableCol: number;
        inventoryFks: number;
        khoQuantityCols: number;
        khoFks: number;
        ledger: number;
      }>
    >(`
SELECT
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot') AS inventoryLot,
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot') AS inventoryCols,
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot'
      AND COLUMN_NAME = 'available') AS availableCol,
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot'
      AND REFERENCED_TABLE_NAME IS NOT NULL) AS inventoryFks,
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kho'
      AND COLUMN_NAME IN ('on_hand','reserved','blocked','available','so_luong')) AS khoQuantityCols,
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kho'
      AND REFERENCED_TABLE_NAME IS NOT NULL) AS khoFks,
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_transaction') AS ledger
`);
    expect(Number(rows[0]?.inventoryLot ?? -1)).toBe(1);
    expect(Number(rows[0]?.inventoryCols ?? -1)).toBe(9);
    expect(Number(rows[0]?.availableCol ?? -1)).toBe(0);
    expect(Number(rows[0]?.inventoryFks ?? -1)).toBe(3);
    expect(Number(rows[0]?.khoQuantityCols ?? -1)).toBe(0);
    expect(Number(rows[0]?.khoFks ?? -1)).toBe(0);
    expect(Number(rows[0]?.ledger ?? -1)).toBe(1);
  });
});
