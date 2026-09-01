import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  TrangThaiDatChoTonKho,
  TrangThaiLoSanPham,
} from '../src/generated/prisma/client';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

describe('Inventory Reservation PHIEN-050 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: DatChoTonKhoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    supplier: '',
    farm: '',
    category: '',
    product: '',
    variantMain: '',
    variantRace: '',
    season: '',
    harvest: '',
    batchEarly: '',
    batchLate: '',
    warehouse: '',
    inventoryEarly: '',
    inventoryLate: '',
    inventoryRace: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    service = app.get(DatChoTonKhoService);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P50-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Reservation 050',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P50-${suffix}`.slice(0, 50),
        ten: 'Trang trại Reservation 050',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Reservation 050',
        slug: `reservation-p50-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Reservation 050',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const [variantMain, variantRace] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: product.id,
          sku: `RES-MAIN-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 32000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: product.id,
          sku: `RES-RACE-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 750,
          gia: 45000,
          donVi: 'g',
        },
      }),
    ]);
    ids.variantMain = variantMain.id;
    ids.variantRace = variantRace.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Reservation',
        giong: 'P50',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });
    ids.season = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    ids.harvest = harvest.id;

    const earlyExpiry = new Date();
    earlyExpiry.setUTCDate(earlyExpiry.getUTCDate() + 10);
    const lateExpiry = new Date();
    lateExpiry.setUTCDate(lateExpiry.getUTCDate() + 20);

    const [batchEarly, batchLate] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `LO-EARLY-P50-${suffix}`.slice(0, 100),
          thuHoachId: harvest.id,
          soLuong: 50,
          conLai: 50,
          ngayHetHan: earlyExpiry,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-LATE-P50-${suffix}`.slice(0, 100),
          thuHoachId: harvest.id,
          soLuong: 50,
          conLai: 50,
          ngayHetHan: lateExpiry,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
    ]);
    ids.batchEarly = batchEarly.id;
    ids.batchLate = batchLate.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P50-${suffix}`.slice(0, 50),
        ten: 'Kho Reservation 050',
        diaChi: 'Lâm Đồng',
      },
    });
    ids.warehouse = warehouse.id;

    const [inventoryEarly, inventoryLate, inventoryRace] = await Promise.all([
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchEarly.id,
          bienTheSanPhamId: variantMain.id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchLate.id,
          bienTheSanPhamId: variantMain.id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchLate.id,
          bienTheSanPhamId: variantRace.id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
    ]);

    ids.inventoryEarly = inventoryEarly.id;
    ids.inventoryLate = inventoryLate.id;
    ids.inventoryRace = inventoryRace.id;
  });

  afterAll(async () => {
    // PHIEN-036 ledger là immutable bằng DB trigger.
    // Không delete fixture inventory/ledger trong E2E; validation DB là disposable
    // và automation sẽ drop toàn bộ DB sau khi Jest đóng Nest/BullMQ.
    if (app) {
      await app.close();
      console.log(
        '[RESERVATION E2E cleanup] app.close() hoàn tất; fixture immutable để DB validation tự drop.',
      );
    }
  });

  it('reserve theo FEFO, tăng reserved và ghi ORDER_RESERVE atomic', async () => {
    const result = await service.datCho({
      maThamChieu: `P50-FEFO-${suffix}`,
      items: [
        {
          bienTheSanPhamId: ids.variantMain,
          soLuong: 2,
        },
      ],
      ttlMs: 60_000,
    });

    expect(result.trangThai).toBe(TrangThaiDatChoTonKho.DANG_GIU);
    expect(result.phanBo.map((item) => item.tonKhoLoId)).toEqual([
      ids.inventoryEarly,
      ids.inventoryLate,
    ]);

    const [early, late] = await Promise.all([
      prisma.tonKhoLo.findUniqueOrThrow({
        where: { id: ids.inventoryEarly },
      }),
      prisma.tonKhoLo.findUniqueOrThrow({
        where: { id: ids.inventoryLate },
      }),
    ]);

    expect(Number(early.reserved)).toBe(1);
    expect(Number(late.reserved)).toBe(1);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: {
            in: [ids.inventoryEarly, ids.inventoryLate],
          },
          loai: LoaiGiaoDichTonKho.ORDER_RESERVE,
        },
      }),
    ).resolves.toBe(2);

    const released = await service.giaiPhong(result.id);
    expect(released.trangThai).toBe(TrangThaiDatChoTonKho.DA_GIAI_PHONG);

    const [earlyAfter, lateAfter] = await Promise.all([
      prisma.tonKhoLo.findUniqueOrThrow({
        where: { id: ids.inventoryEarly },
      }),
      prisma.tonKhoLo.findUniqueOrThrow({
        where: { id: ids.inventoryLate },
      }),
    ]);
    expect(Number(earlyAfter.reserved)).toBe(0);
    expect(Number(lateAfter.reserved)).toBe(0);
  });

  it('sold chuyển reserved thành onHand giảm và ghi ORDER_SHIP', async () => {
    const result = await service.datCho({
      maThamChieu: `P50-SOLD-${suffix}`,
      items: [
        {
          bienTheSanPhamId: ids.variantMain,
          soLuong: 1,
        },
      ],
      ttlMs: 60_000,
    });

    expect(result.phanBo[0]?.tonKhoLoId).toBe(ids.inventoryEarly);

    const sold = await service.xacNhanDaBan(result.id);
    expect(sold.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);

    const early = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryEarly },
    });
    expect(Number(early.onHand)).toBe(0);
    expect(Number(early.reserved)).toBe(0);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventoryEarly,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
        },
      }),
    ).resolves.toBe(1);
  });

  it('TTL hết hạn tự/lazy release reserved và đánh dấu HET_HAN', async () => {
    const result = await service.datCho({
      maThamChieu: `P50-TTL-${suffix}`,
      items: [
        {
          bienTheSanPhamId: ids.variantMain,
          soLuong: 1,
        },
      ],
      ttlMs: 120,
    });

    expect(result.phanBo[0]?.tonKhoLoId).toBe(ids.inventoryLate);

    await new Promise((resolve) => {
      setTimeout(resolve, 350);
    });

    await service.giaiPhongHetHanDaQua();

    const reservation = await prisma.datChoTonKho.findUniqueOrThrow({
      where: { id: result.id },
    });
    expect(reservation.trangThai).toBe(TrangThaiDatChoTonKho.HET_HAN);

    const late = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryLate },
    });
    expect(Number(late.reserved)).toBe(0);
  });

  it('10 request concurrent tranh hàng cuối: đúng 1 thắng, không oversell', async () => {
    const requests = Array.from({ length: 10 }, (_, index) =>
      service.datCho({
        maThamChieu: `P50-RACE-${suffix}-${index}`,
        items: [
          {
            bienTheSanPhamId: ids.variantRace,
            soLuong: 1,
          },
        ],
        ttlMs: 60_000,
      }),
    );

    const results = await Promise.allSettled(requests);
    const thanhCong = results.filter((item) => item.status === 'fulfilled');
    const thatBai = results.filter((item) => item.status === 'rejected');

    expect(thanhCong).toHaveLength(1);
    expect(thatBai).toHaveLength(9);

    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryRace },
    });
    expect(Number(inventory.onHand)).toBe(1);
    expect(Number(inventory.reserved)).toBe(1);
    expect(Number(inventory.onHand) - Number(inventory.reserved) - Number(inventory.blocked)).toBe(
      0,
    );

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventoryRace,
          loai: LoaiGiaoDichTonKho.ORDER_RESERVE,
        },
      }),
    ).resolves.toBe(1);

    const winner = thanhCong[0];
    if (!winner || winner.status !== 'fulfilled') {
      throw new Error('Thiếu reservation thắng race.');
    }

    await service.giaiPhong(winner.value.id);

    const after = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryRace },
    });
    expect(Number(after.reserved)).toBe(0);
  });
});
