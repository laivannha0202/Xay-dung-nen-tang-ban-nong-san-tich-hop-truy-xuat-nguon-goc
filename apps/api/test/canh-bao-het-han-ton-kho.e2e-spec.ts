import { getQueueToken } from '@nestjs/bullmq';
import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job, Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import {
  CanhBaoHetHanTonKhoService,
  SO_NGAY_CANH_BAO_HET_HAN_TON_KHO,
} from '../src/modules/hang-doi/canh-bao-het-han-ton-kho.service';
import { TEN_CONG_VIEC, TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import type { DuLieuCanhBaoHetHanTonKho } from '../src/modules/hang-doi/hang-doi.service';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

function ngayTuHomNay(offset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
}

describe('Cảnh báo hàng sắp hết hạn (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let canhBao: CanhBaoHetHanTonKhoService;
  let worker: HeThongWorker;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Expiry-040';
  const emailKhach = `expiry-khach-${suffix}@example.com`;
  const emailNhanVien = `expiry-nv-${suffix}@example.com`;
  const emailAdmin = `expiry-admin-${suffix}@example.com`;

  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let variantId = '';
  let khoId = '';
  let nearTodayId = '';
  let near7Id = '';
  let expiredId = '';
  let baselineSapHetHan = 0;
  let baselineHetHan = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    canhBao = app.get(CanhBaoHetHanTonKhoService);
    worker = app.get(HeThongWorker);

    const baseline = await canhBao.layCanhBao({
      ngayThamChieu: ngayTuHomNay(0).toISOString().slice(0, 10),
      soNgay: SO_NGAY_CANH_BAO_HET_HAN_TON_KHO,
      gioiHan: 50,
    });
    baselineSapHetHan = baseline.tongSapHetHan;
    baselineHetHan = baseline.tongHetHan;

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'Expiry PHIEN 040',
        })
        .expect(201);
    }

    const [_khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailKhach },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailNhanVien },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailAdmin },
      }),
    ]);
    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({
        where: { ma: 'NHAN_VIEN' },
      }),
      prisma.vaiTro.findUniqueOrThrow({
        where: { ma: 'ADMIN' },
      }),
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
        .send({
          email,
          matKhau,
          nenTang: 'MOBILE',
        })
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
        ma: `NCC-E40-${suffix}`.slice(0, 50),
        ten: 'NCC Expiry 040',
      },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-E40-${suffix}`.slice(0, 50),
        ten: 'Farm Expiry 040',
        diaChi: 'Hà Nội',
        nhaCungCapId: supplier.id,
      },
    });
    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Expiry',
        giong: 'E40',
        ngayTrong: ngayTuHomNay(-60),
        ngayDuKienThuHoach: ngayTuHomNay(-30),
        sanLuongDuKienKg: 500,
      },
    });
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: ngayTuHomNay(-30),
        soLuong: 500,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục Expiry ${suffix}`.slice(0, 150),
        slug: `expiry-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Expiry 040',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `EXPIRY-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 10000,
        donVi: 'kg',
      },
    });
    variantId = variant.id;

    const kho = await prisma.kho.create({
      data: {
        maKho: `E40-${suffix}`.slice(0, 50),
        ten: 'Kho Expiry 040',
        diaChi: 'Hà Nội',
      },
    });
    khoId = kho.id;

    const createLot = async (
      code: string,
      offset: number,
      onHand: number,
      trangThai: TrangThaiLoSanPham = TrangThaiLoSanPham.CO_THE_BAN,
    ) => {
      const lot = await prisma.loSanPham.create({
        data: {
          maLo: `${code}-${suffix}`.slice(0, 100),
          thuHoachId: harvest.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: ngayTuHomNay(offset),
          trangThai,
        },
      });
      return prisma.tonKhoLo.create({
        data: {
          khoId,
          loSanPhamId: lot.id,
          bienTheSanPhamId: variantId,
          onHand,
          reserved: 0,
          blocked: 0,
        },
      });
    };

    const [nearToday, near7, _outside, expired, _zero] = await Promise.all([
      createLot('E40-TODAY', 0, 2),
      createLot('E40-D7', 7, 3, TrangThaiLoSanPham.TAM_GIU),
      createLot('E40-D8', 8, 4),
      createLot('E40-EXPIRED', -1, 5),
      createLot('E40-ZERO', -5, 0),
    ]);

    nearTodayId = nearToday.id;
    near7Id = near7.id;
    expiredId = expired.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

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
      await Promise.all(workers.map(async (item) => item.worker.close(true)));

      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), {
          strict: false,
        }),
      ];
      await Promise.all(queues.map(async (queue) => queue.close()));
      await app.close();
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('service phân loại near-expiry/expired đúng mốc 7 ngày', async () => {
    const result = await canhBao.layCanhBao({
      ngayThamChieu: ngayTuHomNay(0).toISOString().slice(0, 10),
      soNgay: SO_NGAY_CANH_BAO_HET_HAN_TON_KHO,
      gioiHan: 50,
    });

    expect(result.soNgayCanhBao).toBe(7);
    expect(result.tongSapHetHan).toBe(baselineSapHetHan + 2);
    expect(result.tongHetHan).toBe(baselineHetHan + 1);

    expect(result.sapHetHan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tonKhoLoId: nearTodayId,
          trangThai: 'SAP_HET_HAN',
          soNgayConLai: 0,
        }),
        expect.objectContaining({
          tonKhoLoId: near7Id,
          trangThai: 'SAP_HET_HAN',
          soNgayConLai: 7,
        }),
      ]),
    );
    expect(result.hetHan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tonKhoLoId: expiredId,
          trangThai: 'HET_HAN',
          soNgayConLai: -1,
        }),
      ]),
    );
  });

  it('alert xét physical onHand > 0, không phụ thuộc trạng thái sellable', async () => {
    const result = await canhBao.layCanhBao({
      ngayThamChieu: ngayTuHomNay(0).toISOString().slice(0, 10),
      soNgay: 7,
      gioiHan: 50,
    });

    expect(result.sapHetHan.some((item) => item.tonKhoLoId === near7Id)).toBe(true);
  });

  it('API dùng kho.xem: anonymous 401, KHACH 403, NHAN_VIEN/ADMIN 200', async () => {
    await request(app.getHttpServer()).get('/api/v1/ton-kho/canh-bao-het-han').expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/ton-kho/canh-bao-het-han')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);

    for (const token of [tokenNhanVien, tokenAdmin]) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ton-kho/canh-bao-het-han')
        .query({ soNgay: 7, gioiHan: 50 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          soNgayCanhBao: 7,
          tongSapHetHan: baselineSapHetHan + 2,
          tongHetHan: baselineHetHan + 1,
        }),
      );
    }
  });

  it('HeThongWorker xử lý job near-expiry/expired và trả summary', async () => {
    const job = {
      name: TEN_CONG_VIEC.CANH_BAO_HET_HAN_TON_KHO,
      data: {
        ngayThamChieu: ngayTuHomNay(0).toISOString().slice(0, 10),
        soNgay: 7,
        gioiHan: 1,
      } satisfies DuLieuCanhBaoHetHanTonKho,
    } as unknown as Job<DuLieuCanhBaoHetHanTonKho>;

    const result = await worker.process(job);

    expect(result).toEqual(
      expect.objectContaining({
        tongSapHetHan: baselineSapHetHan + 2,
        tongHetHan: baselineHetHan + 1,
        soNgayCanhBao: 7,
      }),
    );
  });

  it('service/job read-only: không đổi InventoryLot và không ghi EXPIRE ledger', async () => {
    const beforeLots = await prisma.tonKhoLo.findMany({
      where: {
        id: {
          in: [nearTodayId, near7Id, expiredId],
        },
      },
      select: {
        id: true,
        onHand: true,
        reserved: true,
        blocked: true,
      },
      orderBy: { id: 'asc' },
    });
    const beforeLedger = await prisma.giaoDichTonKho.count();

    await canhBao.layCanhBao({
      ngayThamChieu: ngayTuHomNay(0).toISOString().slice(0, 10),
      soNgay: 7,
      gioiHan: 50,
    });

    const afterLots = await prisma.tonKhoLo.findMany({
      where: {
        id: {
          in: [nearTodayId, near7Id, expiredId],
        },
      },
      select: {
        id: true,
        onHand: true,
        reserved: true,
        blocked: true,
      },
      orderBy: { id: 'asc' },
    });
    const afterLedger = await prisma.giaoDichTonKho.count();

    expect(afterLots).toEqual(beforeLots);
    expect(afterLedger).toBe(beforeLedger);
  });

  it('validation soNgay/gioiHan chặn input ngoài contract', async () => {
    await expect(canhBao.layCanhBao({ soNgay: 0 })).rejects.toThrow(
      'soNgay phải là số nguyên từ 1 đến 30',
    );

    await expect(canhBao.layCanhBao({ gioiHan: 51 })).rejects.toThrow(
      'gioiHan phải là số nguyên từ 1 đến 50',
    );
  });

  it('scheduler daily tồn tại trong source và không notification/email/EXPIRE mutation', () => {
    const queueSource = readFileSync('src/modules/hang-doi/hang-doi.service.ts', 'utf8');
    const alertSource = readFileSync(
      'src/modules/hang-doi/canh-bao-het-han-ton-kho.service.ts',
      'utf8',
    );

    expect(queueSource).toContain("'ton-kho-het-han-hang-ngay'");
    expect(queueSource).toContain("pattern: '0 10 1 * * *'");
    expect(queueSource).toContain('CANH_BAO_HET_HAN_TON_KHO');

    expect(alertSource).not.toContain('giaoDichTonKho.create');
    expect(alertSource).not.toContain('LoaiGiaoDichTonKho.EXPIRE');
    expect(alertSource).not.toContain('notification');
    expect(alertSource).not.toContain('emailQueue');
  });
});
