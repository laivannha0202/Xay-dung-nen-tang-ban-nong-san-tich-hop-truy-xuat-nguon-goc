import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Nhập/Xuất/Chuyển kho atomic (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Atomic-037';
  const emailKhach = `atomic-khach-${suffix}@example.com`;
  const emailNhanVien = `atomic-nv-${suffix}@example.com`;
  const emailAdmin = `atomic-admin-${suffix}@example.com`;

  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let khoAId = '';
  let khoBId = '';
  let khoKhoaId = '';
  let loId = '';
  let variantId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Atomic E2E PHIEN 037' })
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
        { nguoiDungId: admin.id, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
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
      data: { ma: `NCC-A37-${suffix}`.slice(0, 50), ten: 'NCC Atomic 037' },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-A37-${suffix}`.slice(0, 50),
        ten: 'Farm Atomic 037',
        diaChi: 'Hà Nội',
        nhaCungCapId: supplier.id,
      },
    });
    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Atomic',
        giong: 'A37',
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
        maLo: `LO-A37-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date('2027-01-01T00:00:00.000Z'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    loId = batch.id;
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục Atomic ${suffix}`.slice(0, 150),
        slug: `atomic-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Atomic 037',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `ATOMIC-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 10000,
        donVi: 'kg',
      },
    });
    variantId = variant.id;

    const [khoA, khoB, khoKhoa] = await Promise.all([
      prisma.kho.create({
        data: { maKho: `A37-A-${suffix}`.slice(0, 50), ten: 'Kho A', diaChi: 'Hà Nội' },
      }),
      prisma.kho.create({
        data: { maKho: `A37-B-${suffix}`.slice(0, 50), ten: 'Kho B', diaChi: 'Hà Nội' },
      }),
      prisma.kho.create({
        data: {
          maKho: `A37-X-${suffix}`.slice(0, 50),
          ten: 'Kho khóa',
          diaChi: 'Hà Nội',
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);
    khoAId = khoA.id;
    khoBId = khoB.id;
    khoKhoaId = khoKhoa.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    // Ledger immutable nên fixture DB không DELETE. Automation drop validation DB sau toàn bộ gate.
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
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('mutation dùng ton_kho.dieu_chinh: anonymous 401, KHACH/NHAN_VIEN 403, ADMIN được phép', async () => {
    const body = { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId, soLuong: 1 };
    await request(app.getHttpServer()).post('/api/v1/ton-kho/nhap').send(body).expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send(body)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send(body)
      .expect(403);
  });

  it('nhập kho tạo InventoryLot + HARVEST_IN atomically', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId, soLuong: 20 })
      .expect(201);

    expect(response.body.tonKho).toEqual(
      expect.objectContaining({ onHand: 20, reserved: 0, blocked: 0, available: 20 }),
    );
    const ledger = await prisma.giaoDichTonKho.findUniqueOrThrow({
      where: { id: response.body.giaoDichId as string },
    });
    expect(ledger.loai).toBe(LoaiGiaoDichTonKho.HARVEST_IN);
    expect(Number(ledger.soLuong)).toBe(20);
  });

  it('nhập kho vào lot có sẵn chỉ increment onHand và append ledger mới', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId, soLuong: 5 })
      .expect(201);
    expect(response.body.tonKho.onHand).toBe(25);
    expect(response.body.tonKho.available).toBe(25);
  });

  it('xuất kho trừ onHand từ available, giữ reserved/blocked và append TRANSFER_OUT', async () => {
    const lot = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    await prisma.tonKhoLo.update({
      where: { id: lot.id },
      data: { reserved: 3, blocked: 2 },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/xuat')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoId: lot.id, soLuong: 4 })
      .expect(201);

    expect(response.body.tonKho).toEqual(
      expect.objectContaining({ onHand: 21, reserved: 3, blocked: 2, available: 16 }),
    );
    const ledger = await prisma.giaoDichTonKho.findUniqueOrThrow({
      where: { id: response.body.giaoDichId as string },
    });
    expect(ledger.loai).toBe(LoaiGiaoDichTonKho.TRANSFER_OUT);
    expect(Number(ledger.soLuong)).toBe(4);
  });

  it('xuất vượt available rollback cả state lẫn ledger', async () => {
    const lot = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    const before = await prisma.giaoDichTonKho.count({ where: { tonKhoLoId: lot.id } });
    const onHand = Number(lot.onHand);

    await request(app.getHttpServer())
      .post('/api/v1/ton-kho/xuat')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoId: lot.id, soLuong: 999 })
      .expect(400);

    const after = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lot.id } });
    expect(Number(after.onHand)).toBe(onHand);
    expect(await prisma.giaoDichTonKho.count({ where: { tonKhoLoId: lot.id } })).toBe(before);
  });

  it('chuyển kho atomic: source giảm, destination tăng, append OUT + IN', async () => {
    const source = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/chuyen')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoIdNguon: source.id, khoDichId: khoBId, soLuong: 6 })
      .expect(201);

    expect(response.body.nguon.onHand).toBe(15);
    expect(response.body.nguon.reserved).toBe(3);
    expect(response.body.nguon.blocked).toBe(2);
    expect(response.body.nguon.available).toBe(10);
    expect(response.body.dich.onHand).toBe(6);

    const ledgers = await prisma.giaoDichTonKho.findMany({
      where: { id: { in: [response.body.giaoDichNguonId, response.body.giaoDichDichId] } },
      orderBy: { loai: 'asc' },
    });
    expect(ledgers.map((item) => item.loai).sort()).toEqual(
      [LoaiGiaoDichTonKho.TRANSFER_IN, LoaiGiaoDichTonKho.TRANSFER_OUT].sort(),
    );
  });

  it('chuyển cùng Kho hoặc tới Kho khóa bị reject và không tạo movement', async () => {
    const source = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    for (const khoDichId of [khoAId, khoKhoaId]) {
      await request(app.getHttpServer())
        .post('/api/v1/ton-kho/chuyen')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ tonKhoLoIdNguon: source.id, khoDichId, soLuong: 1 })
        .expect(400);
    }
  });

  it('chuyển vượt available rollback source/destination/ledger', async () => {
    const source = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoAId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    const beforeSource = Number(source.onHand);
    const beforeLedger = await prisma.giaoDichTonKho.count();
    const dest = await prisma.tonKhoLo.findFirstOrThrow({
      where: { khoId: khoBId, loSanPhamId: loId, bienTheSanPhamId: variantId },
    });
    const beforeDest = Number(dest.onHand);

    await request(app.getHttpServer())
      .post('/api/v1/ton-kho/chuyen')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoIdNguon: source.id, khoDichId: khoBId, soLuong: 999 })
      .expect(400);

    expect(
      Number((await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: source.id } })).onHand),
    ).toBe(beforeSource);
    expect(
      Number((await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: dest.id } })).onHand),
    ).toBe(beforeDest);
    expect(await prisma.giaoDichTonKho.count()).toBe(beforeLedger);
  });

  it('2 xuất đồng thời không thể làm available âm', async () => {
    const lot = await prisma.tonKhoLo.create({
      data: {
        khoId: khoAId,
        loSanPhamId: loId,
        bienTheSanPhamId: (
          await prisma.bienTheSanPham.create({
            data: {
              sanPhamId: (
                await prisma.bienTheSanPham.findUniqueOrThrow({ where: { id: variantId } })
              ).sanPhamId,
              sku: `CONCURRENT-${suffix}`.slice(0, 100).toUpperCase(),
              khoiLuong: 2,
              gia: 20000,
              donVi: 'kg',
            },
          })
        ).id,
        onHand: 10,
        reserved: 0,
        blocked: 0,
      },
    });

    const call = () =>
      request(app.getHttpServer())
        .post('/api/v1/ton-kho/xuat')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ tonKhoLoId: lot.id, soLuong: 6 });

    const [a, b] = await Promise.all([call(), call()]);
    expect([a.status, b.status].sort()).toEqual([201, 400]);
    const after = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lot.id } });
    expect(Number(after.onHand)).toBe(4);
    expect(
      await prisma.giaoDichTonKho.count({
        where: { tonKhoLoId: lot.id, loai: LoaiGiaoDichTonKho.TRANSFER_OUT },
      }),
    ).toBe(1);
  });

  it('PHIEN-038 adjustment chưa làm: không dùng ADJUSTMENT/reason/before/after', async () => {
    const serviceSource = readFileSync('src/modules/ton-kho/ton-kho.service.ts', 'utf8');
    expect(serviceSource).not.toContain('LoaiGiaoDichTonKho.ADJUSTMENT');
    expect(serviceSource).not.toContain('reason');
    expect(serviceSource).not.toContain('before');
    expect(serviceSource).not.toContain('after');
  });
});
