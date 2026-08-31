import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Tồn kho theo lô / InventoryLot (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-TonKho-035';
  const emailKhach = `ton-kho-khach-${suffix}@example.com`;
  const emailNhanVien = `ton-kho-nv-${suffix}@example.com`;
  const emailAdmin = `ton-kho-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';

  let nhaCungCapId = '';
  let trangTraiId = '';
  let danhMucId = '';
  let sanPhamId = '';
  let bienThe500Id = '';
  let bienThe1000Id = '';
  let muaVuId = '';
  let thuHoachId = '';
  let loHopLeId = '';
  let loHetHanId = '';
  let loKiemTraId = '';
  let khoHoatDongId = '';
  let khoKhoaId = '';
  let tonKhoChinhId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Tồn kho E2E PHIEN 035' })
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

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-TK35-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Tồn kho PHIEN 035',
      },
    });
    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-TK35-${suffix}`.slice(0, 50),
        ten: 'Trang trại Tồn kho PHIEN 035',
        diaChi: 'Lâm Đồng',
        nhaCungCapId,
      },
    });
    trangTraiId = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Rau Tồn kho PHIEN 035',
        slug: `rau-ton-kho-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    danhMucId = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Cà chua tồn kho PHIEN 035',
        moTa: 'Sản phẩm dùng kiểm tra InventoryLot',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
      },
    });
    sanPhamId = product.id;

    const [v500, v1000] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId,
          sku: `TK35-500-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId,
          sku: `TK35-1000-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1000,
          gia: 62000,
          donVi: 'g',
        },
      }),
    ]);
    bienThe500Id = v500.id;
    bienThe1000Id = v1000.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Ruby',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        sanLuongDuKienKg: 1000,
      },
    });
    muaVuId = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId,
        ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        soLuong: 300,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    thuHoachId = harvest.id;

    const now = new Date();
    const ngayHomNay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const future = new Date(ngayHomNay);
    future.setUTCDate(future.getUTCDate() + 30);
    const past = new Date(ngayHomNay);
    past.setUTCDate(past.getUTCDate() - 1);

    const [loHopLe, loHetHan, loKiemTra] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `LO-TK35-OK-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: future,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-TK35-EXP-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 50,
          conLai: 50,
          ngayHetHan: past,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-TK35-CHECK-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 30,
          conLai: 30,
          ngayHetHan: future,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
    ]);
    loHopLeId = loHopLe.id;
    loHetHanId = loHetHan.id;
    loKiemTraId = loKiemTra.id;

    const [khoHoatDong, khoKhoa] = await Promise.all([
      prisma.kho.create({
        data: {
          maKho: `KHO-TK35-A-${suffix}`.slice(0, 50),
          ten: 'Kho hoạt động PHIEN 035',
          diaChi: 'Hà Nội',
        },
      }),
      prisma.kho.create({
        data: {
          maKho: `KHO-TK35-X-${suffix}`.slice(0, 50),
          ten: 'Kho khóa PHIEN 035',
          diaChi: 'Đà Nẵng',
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);
    khoHoatDongId = khoHoatDong.id;
    khoKhoaId = khoKhoa.id;

    const mainLot = await prisma.tonKhoLo.create({
      data: {
        khoId: khoHoatDongId,
        loSanPhamId: loHopLeId,
        bienTheSanPhamId: bienThe500Id,
        onHand: 20,
        reserved: 3,
        blocked: 2,
      },
    });
    tonKhoChinhId = mainLot.id;

    await prisma.tonKhoLo.createMany({
      data: [
        {
          khoId: khoHoatDongId,
          loSanPhamId: loHopLeId,
          bienTheSanPhamId: bienThe1000Id,
          onHand: 5,
          reserved: 1,
          blocked: 1,
        },
        {
          khoId: khoKhoaId,
          loSanPhamId: loHopLeId,
          bienTheSanPhamId: bienThe500Id,
          onHand: 10,
          reserved: 0,
          blocked: 0,
        },
        {
          khoId: khoHoatDongId,
          loSanPhamId: loHetHanId,
          bienTheSanPhamId: bienThe500Id,
          onHand: 7,
          reserved: 0,
          blocked: 0,
        },
      ],
    });
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();
    const log = (text: string) =>
      console.log(`[TON KHO E2E cleanup +${Date.now() - start}ms] ${text}`);

    if (prisma) {
      await prisma.tonKhoLo.deleteMany({
        where: {
          OR: [
            { khoId: { in: [khoHoatDongId, khoKhoaId].filter(Boolean) } },
            { loSanPhamId: { in: [loHopLeId, loHetHanId, loKiemTraId].filter(Boolean) } },
            { bienTheSanPhamId: { in: [bienThe500Id, bienThe1000Id].filter(Boolean) } },
          ],
        },
      });

      const loIds = [loHopLeId, loHetHanId, loKiemTraId].filter(Boolean);
      if (loIds.length) await prisma.loSanPham.deleteMany({ where: { id: { in: loIds } } });
      if (thuHoachId) await prisma.thuHoach.deleteMany({ where: { id: thuHoachId } });
      if (muaVuId) await prisma.muaVu.deleteMany({ where: { id: muaVuId } });

      const variantIds = [bienThe500Id, bienThe1000Id].filter(Boolean);
      if (variantIds.length) {
        await prisma.bienTheSanPham.deleteMany({ where: { id: { in: variantIds } } });
      }
      if (sanPhamId) await prisma.sanPham.deleteMany({ where: { id: sanPhamId } });
      if (danhMucId) await prisma.danhMucSanPham.deleteMany({ where: { id: danhMucId } });

      const khoIds = [khoHoatDongId, khoKhoaId].filter(Boolean);
      if (khoIds.length) await prisma.kho.deleteMany({ where: { id: { in: khoIds } } });

      if (trangTraiId) await prisma.trangTrai.deleteMany({ where: { id: trangTraiId } });
      if (nhaCungCapId) await prisma.nhaCungCap.deleteMany({ where: { id: nhaCungCapId } });

      const userIds = [khachId, nhanVienId, adminId].filter(Boolean);
      if (userIds.length) {
        await prisma.nguoiDung.deleteMany({ where: { id: { in: userIds } } });
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

  it('RBAC giữ nguyên: kho.xem cho NHAN_VIEN/ADMIN; ton_kho.dieu_chinh chỉ ADMIN', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: { in: ['kho.xem', 'ton_kho.dieu_chinh'] },
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: { select: { ma: true } },
        quyen: { select: { ma: true } },
      },
    });

    const pairs = mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort();
    expect(pairs).toEqual(
      expect.arrayContaining(['ADMIN:kho.xem', 'NHAN_VIEN:kho.xem', 'ADMIN:ton_kho.dieu_chinh']),
    );
    expect(pairs).not.toContain('NHAN_VIEN:ton_kho.dieu_chinh');
    expect(pairs).not.toContain('KHACH_HANG:kho.xem');
  });

  it('API Tồn kho cần auth; KHACH_HANG bị 403; NHAN_VIEN xem được', async () => {
    await request(app.getHttpServer()).get('/api/v1/ton-kho').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/ton-kho')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/ton-kho')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
  });

  it('list/detail trả đúng key W+B+V và available = onHand - reserved - blocked', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/ton-kho')
      .query({
        khoId: khoHoatDongId,
        loSanPhamId: loHopLeId,
        bienTheSanPhamId: bienThe500Id,
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0]).toEqual(
      expect.objectContaining({
        id: tonKhoChinhId,
        onHand: 20,
        reserved: 3,
        blocked: 2,
        available: 15,
      }),
    );
    expect(list.body.duLieu[0].kho.id).toBe(khoHoatDongId);
    expect(list.body.duLieu[0].loSanPham.id).toBe(loHopLeId);
    expect(list.body.duLieu[0].bienThe.id).toBe(bienThe500Id);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/ton-kho/${tonKhoChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(detail.body.available).toBe(15);
    expect(detail.body.bienThe.tenSanPham).toBe('Cà chua tồn kho PHIEN 035');
  });

  it('search theo mã Kho / mã Lô / SKU / tên Sản phẩm', async () => {
    for (const timKiem of ['KHO-TK35-A', 'LO-TK35-OK', 'TK35-500', 'Cà chua tồn kho']) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ton-kho')
        .query({ timKiem, trang: 1, gioiHan: 50 })
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .expect(200);
      expect(response.body.duLieu.some((item: { id: string }) => item.id === tonKhoChinhId)).toBe(
        true,
      );
    }
  });

  it('DB unique key cấm trùng Warehouse + Batch + Variant', async () => {
    await expect(
      prisma.tonKhoLo.create({
        data: {
          khoId: khoHoatDongId,
          loSanPhamId: loHopLeId,
          bienTheSanPhamId: bienThe500Id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('DB CHECK cấm quantity âm', async () => {
    await expect(
      prisma.tonKhoLo.create({
        data: {
          khoId: khoHoatDongId,
          loSanPhamId: loKiemTraId,
          bienTheSanPhamId: bienThe500Id,
          onHand: -1,
          reserved: 0,
          blocked: 0,
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('DB CHECK cấm reserved + blocked vượt onHand', async () => {
    await expect(
      prisma.tonKhoLo.create({
        data: {
          khoId: khoHoatDongId,
          loSanPhamId: loKiemTraId,
          bienTheSanPhamId: bienThe1000Id,
          onHand: 5,
          reserved: 4,
          blocked: 2,
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('public Product chỉ tính Kho active + Lô CO_THE_BAN chưa hết hạn', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/${sanPhamId}`)
      .expect(200);

    // Valid: variant 500g = 15, variant 1000g = 3.
    // Stock ở Kho khóa (10) và Lô hết hạn (7) phải bị loại.
    expect(response.body.khaDung).toEqual({
      coGia: true,
      soLuongKhaDung: 18,
      coTheDatHang: true,
      lyDo: 'Còn hàng.',
    });

    const variants = response.body.bienThe as Array<{
      sku: string;
      soLuongKhaDung: number;
    }>;
    expect(variants.find((item) => item.sku.includes('500'))?.soLuongKhaDung).toBe(15);
    expect(variants.find((item) => item.sku.includes('1000'))?.soLuongKhaDung).toBe(3);
  });

  it('PHIEN-035 read-only: không POST/PATCH/DELETE; chưa InventoryTransaction ledger', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ton-kho')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/ton-kho/${tonKhoChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/ton-kho/${tonKhoChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        columns: number;
        availableCol: number;
        fks: number;
        checks: number;
        ledger: number;
      }>
    >(`
SELECT
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot') AS columns,
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot'
      AND COLUMN_NAME = 'available') AS availableCol,
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot'
      AND REFERENCED_TABLE_NAME IS NOT NULL) AS fks,
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lot'
      AND CONSTRAINT_TYPE = 'CHECK') AS checks,
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_transaction') AS ledger
`);
    expect(Number(rows[0]?.columns ?? -1)).toBe(9);
    expect(Number(rows[0]?.availableCol ?? -1)).toBe(0);
    expect(Number(rows[0]?.fks ?? -1)).toBe(3);
    expect(Number(rows[0]?.checks ?? -1)).toBe(4);
    expect(Number(rows[0]?.ledger ?? -1)).toBe(0);
  });
});
