import { getQueueToken } from '@nestjs/bullmq';
import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { FefoService } from '../src/modules/ton-kho/fefo.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

function ngayTuHomNay(offset: number): Date {
  const bayGio = new Date();
  return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate() + offset));
}

describe('FEFO allocation service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fefo: FefoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let bienTheId = '';
  let bienTheKhacId = '';
  let khoAId = '';
  let khoBId = '';
  let khoInactiveId = '';

  let lotHomNayId = '';
  let lot2NgayId = '';
  let lot5NgayId = '';
  let lot10NgayId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    fefo = app.get(FefoService);

    const nhaCungCap = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-FEFO-${suffix}`.slice(0, 50),
        ten: 'NCC FEFO PHIEN-039',
      },
    });
    const trangTrai = await prisma.trangTrai.create({
      data: {
        ma: `FARM-FEFO-${suffix}`.slice(0, 50),
        ten: 'Farm FEFO PHIEN-039',
        diaChi: 'Hà Nội',
        nhaCungCapId: nhaCungCap.id,
      },
    });
    const muaVu = await prisma.muaVu.create({
      data: {
        trangTraiId: trangTrai.id,
        cayTrong: 'Rau FEFO',
        giong: 'FEFO-039',
        ngayTrong: ngayTuHomNay(-60),
        ngayDuKienThuHoach: ngayTuHomNay(-30),
        sanLuongDuKienKg: 1000,
      },
    });
    const thuHoach = await prisma.thuHoach.create({
      data: {
        muaVuId: muaVu.id,
        ngayThuHoach: ngayTuHomNay(-30),
        soLuong: 1000,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const danhMuc = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục FEFO ${suffix}`.slice(0, 150),
        slug: `fefo-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    const sanPham = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm FEFO PHIEN-039',
        trangTraiId: trangTrai.id,
        danhMucSanPhamId: danhMuc.id,
      },
    });
    const [bienThe, bienTheKhac] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: sanPham.id,
          sku: `FEFO-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1,
          gia: 10000,
          donVi: 'kg',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: sanPham.id,
          sku: `FEFO-OTHER-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 2,
          gia: 20000,
          donVi: 'kg',
        },
      }),
    ]);
    bienTheId = bienThe.id;
    bienTheKhacId = bienTheKhac.id;

    const [khoA, khoB, khoInactive] = await Promise.all([
      prisma.kho.create({
        data: {
          maKho: `FEFO-A-${suffix}`.slice(0, 50),
          ten: 'Kho FEFO A',
          diaChi: 'Hà Nội',
        },
      }),
      prisma.kho.create({
        data: {
          maKho: `FEFO-B-${suffix}`.slice(0, 50),
          ten: 'Kho FEFO B',
          diaChi: 'Hà Nội',
        },
      }),
      prisma.kho.create({
        data: {
          maKho: `FEFO-X-${suffix}`.slice(0, 50),
          ten: 'Kho FEFO inactive',
          diaChi: 'Hà Nội',
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);
    khoAId = khoA.id;
    khoBId = khoB.id;
    khoInactiveId = khoInactive.id;

    const taoLo = async (
      code: string,
      expiryOffset: number,
      trangThai: TrangThaiLoSanPham = TrangThaiLoSanPham.CO_THE_BAN,
    ) =>
      prisma.loSanPham.create({
        data: {
          maLo: `${code}-${suffix}`.slice(0, 100),
          thuHoachId: thuHoach.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: ngayTuHomNay(expiryOffset),
          trangThai,
        },
      });

    const [
      loHomNay,
      lo2Ngay,
      lo5Ngay,
      lo10Ngay,
      loHetHan,
      loTamGiu,
      loKhoInactive,
      loZeroAvailable,
      loVariantKhac,
    ] = await Promise.all([
      taoLo('FEFO-TODAY', 0),
      taoLo('FEFO-D2', 2),
      taoLo('FEFO-D5', 5),
      taoLo('FEFO-D10', 10),
      taoLo('FEFO-EXPIRED', -1),
      taoLo('FEFO-HOLD', 1, TrangThaiLoSanPham.TAM_GIU),
      taoLo('FEFO-INACTIVE-WH', 1),
      taoLo('FEFO-ZERO', 1),
      taoLo('FEFO-OTHER-VARIANT', 1),
    ]);

    const created = await Promise.all([
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: loHomNay.id,
          bienTheSanPhamId: bienTheId,
          onHand: 2,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: lo2Ngay.id,
          bienTheSanPhamId: bienTheId,
          onHand: 5,
          reserved: 1,
          blocked: 1,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoBId,
          loSanPhamId: lo5Ngay.id,
          bienTheSanPhamId: bienTheId,
          onHand: 4,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: lo10Ngay.id,
          bienTheSanPhamId: bienTheId,
          onHand: 10,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: loHetHan.id,
          bienTheSanPhamId: bienTheId,
          onHand: 100,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: loTamGiu.id,
          bienTheSanPhamId: bienTheId,
          onHand: 100,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoInactiveId,
          loSanPhamId: loKhoInactive.id,
          bienTheSanPhamId: bienTheId,
          onHand: 100,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: loZeroAvailable.id,
          bienTheSanPhamId: bienTheId,
          onHand: 5,
          reserved: 3,
          blocked: 2,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: khoAId,
          loSanPhamId: loVariantKhac.id,
          bienTheSanPhamId: bienTheKhacId,
          onHand: 100,
          reserved: 0,
          blocked: 0,
        },
      }),
    ]);

    [lotHomNayId, lot2NgayId, lot5NgayId, lot10NgayId] = [
      created[0].id,
      created[1].id,
      created[2].id,
      created[3].id,
    ];
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
      await Promise.all(workers.map(async (worker) => worker.worker.close(true)));

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

  it('phân bổ từ nhiều batch theo expiry ASC và dùng available', async () => {
    const result = await fefo.phanBo(bienTheId, 6);

    expect(result.soLuongYeuCau).toBe(6);
    expect(result.tongSoLuongPhanBo).toBe(6);
    expect(result.khoId).toBeNull();
    expect(result.phanBo.map((item) => item.tonKhoLoId)).toEqual([
      lotHomNayId,
      lot2NgayId,
      lot5NgayId,
    ]);
    expect(result.phanBo.map((item) => item.soLuong)).toEqual([2, 3, 1]);
    expect(result.phanBo.map((item) => item.ngayHetHan)).toEqual([
      ngayTuHomNay(0).toISOString().slice(0, 10),
      ngayTuHomNay(2).toISOString().slice(0, 10),
      ngayTuHomNay(5).toISOString().slice(0, 10),
    ]);
  });

  it('lọc Kho inactive, batch hết hạn/TAM_GIU, available=0 và variant khác', async () => {
    const result = await fefo.phanBo(bienTheId, 19);

    expect(result.tongSoLuongPhanBo).toBe(19);
    expect(result.phanBo.map((item) => item.tonKhoLoId)).toEqual([
      lotHomNayId,
      lot2NgayId,
      lot5NgayId,
      lot10NgayId,
    ]);
    expect(result.phanBo.map((item) => item.soLuong)).toEqual([2, 3, 4, 10]);
  });

  it('hạn dùng đúng hôm nay vẫn hợp lệ', async () => {
    const result = await fefo.phanBo(bienTheId, 1);
    expect(result.phanBo).toHaveLength(1);
    expect(result.phanBo[0]).toEqual(
      expect.objectContaining({
        tonKhoLoId: lotHomNayId,
        soLuong: 1,
        ngayHetHan: ngayTuHomNay(0).toISOString().slice(0, 10),
      }),
    );
  });

  it('filter khoId vẫn giữ FEFO trong đúng Kho', async () => {
    const result = await fefo.phanBo(bienTheId, 6, khoAId);

    expect(result.khoId).toBe(khoAId);
    expect(result.phanBo.map((item) => item.tonKhoLoId)).toEqual([
      lotHomNayId,
      lot2NgayId,
      lot10NgayId,
    ]);
    expect(result.phanBo.map((item) => item.soLuong)).toEqual([2, 3, 1]);
  });

  it('thiếu tồn hợp lệ reject dù các batch không hợp lệ có quantity lớn', async () => {
    await expect(fefo.phanBo(bienTheId, 20)).rejects.toThrow('Không đủ tồn kho hợp lệ theo FEFO');
  });

  it('quantity invalid hoặc biến thể không tồn tại bị reject', async () => {
    await expect(fefo.phanBo(bienTheId, 0)).rejects.toThrow('Số lượng FEFO phải > 0');
    await expect(fefo.phanBo(bienTheId, -1)).rejects.toThrow('Số lượng FEFO phải > 0');
    await expect(fefo.phanBo(bienTheId, 1.0001)).rejects.toThrow('tối đa 3 chữ số thập phân');
    await expect(fefo.phanBo('01900000-0000-7000-8000-000000000000', 1)).rejects.toThrow(
      'Không tìm thấy biến thể sản phẩm',
    );
  });

  it('FEFO là planner read-only: không đổi InventoryLot và không ghi ledger', async () => {
    const beforeInventory = await prisma.tonKhoLo.findMany({
      where: {
        id: {
          in: [lotHomNayId, lot2NgayId, lot5NgayId, lot10NgayId],
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

    await fefo.phanBo(bienTheId, 12);

    const afterInventory = await prisma.tonKhoLo.findMany({
      where: {
        id: {
          in: [lotHomNayId, lot2NgayId, lot5NgayId, lot10NgayId],
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

    expect(afterInventory).toEqual(beforeInventory);
    expect(afterLedger).toBe(beforeLedger);
  });

  it('PHIEN-040 chưa làm: FefoService không tạo cảnh báo/job/queue', () => {
    const source = readFileSync('src/modules/ton-kho/fefo.service.ts', 'utf8');

    expect(source).not.toContain('BullMQ');
    expect(source).not.toContain('Queue');
    expect(source).not.toContain('notification');
    expect(source).not.toContain('canhBao');
  });

  it('variant khác có tồn nhưng không được dùng cho allocation', async () => {
    const result = await fefo.phanBo(bienTheKhacId, 1);
    expect(result.bienTheSanPhamId).toBe(bienTheKhacId);
    expect(result.phanBo).toHaveLength(1);
    expect(result.phanBo[0]?.soLuong).toBe(1);
  });
});
