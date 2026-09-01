import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiVanChuyen } from '../src/generated/prisma/client';

describe('Shipment Domain PHIEN-063 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Shipment/tracking event là lịch sử domain. DB validation của project là disposable.
    if (app) {
      await app.close();
      console.log(
        '[SHIPMENT DOMAIN E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  async function taoSupplierOrder() {
    const user = await prisma.nguoiDung.create({
      data: {
        email: `shipment-p63-${suffix}@example.com`,
        matKhauHash: 'hash-phien063',
        hoTen: 'Khách Shipment PHIEN 063',
      },
    });
    const customer = await prisma.khachHang.create({ data: { nguoiDungId: user.id } });
    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `SHIP63-${suffix}`.slice(0, 50),
        ten: 'NCC Shipment PHIEN 063',
      },
    });
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `SHIP-ORDER-${suffix}`.slice(0, 100),
        khachHangId: customer.id,
        trangThai: TrangThaiDonHang.DA_DONG_GOI,
        tongTien: 99000,
      },
    });
    return prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SHIP-SUB-${suffix}`.slice(0, 100),
        donHangId: order.id,
        nhaCungCapId: supplier.id,
        trangThai: TrangThaiDonHang.DA_DONG_GOI,
        tamTinh: 99000,
      },
    });
  }

  it('exact master states tồn tại trong generated enum', () => {
    expect(Object.values(TrangThaiVanChuyen)).toEqual(
      expect.arrayContaining([
        'CREATED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'RETURNED',
      ]),
    );
  });

  it('shipment mặc định CREATED, thuộc supplier order và tracking_event lưu lịch sử', async () => {
    const supplierOrder = await taoSupplierOrder();
    const shipment = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: supplierOrder.id,
        maVanDon: `TRACK-${suffix}`.slice(0, 191),
      },
    });

    expect(shipment.trangThai).toBe(TrangThaiVanChuyen.CREATED);

    await prisma.suKienTheoDoiVanChuyen.createMany({
      data: [
        {
          vanChuyenId: shipment.id,
          trangThai: TrangThaiVanChuyen.PICKED_UP,
          moTa: 'Đã nhận kiện từ điểm đóng gói',
          viTri: 'Kho A',
          thoiGian: new Date('2026-09-01T10:00:00.000Z'),
        },
        {
          vanChuyenId: shipment.id,
          trangThai: TrangThaiVanChuyen.IN_TRANSIT,
          moTa: 'Đang trung chuyển',
          viTri: 'Hub B',
          thoiGian: new Date('2026-09-01T11:00:00.000Z'),
        },
      ],
    });

    const loaded = await prisma.vanChuyen.findUniqueOrThrow({
      where: { id: shipment.id },
      include: {
        donHangNhaCungCap: true,
        suKien: { orderBy: { thoiGian: 'asc' } },
      },
    });

    expect(loaded.donHangNhaCungCap.id).toBe(supplierOrder.id);
    expect(loaded.suKien.map((event) => event.trangThai)).toEqual([
      TrangThaiVanChuyen.PICKED_UP,
      TrangThaiVanChuyen.IN_TRANSIT,
    ]);
    expect(loaded.suKien[0]?.viTri).toBe('Kho A');
  });

  it('maVanDon unique ở DB', async () => {
    const shipment = await prisma.vanChuyen.findFirstOrThrow();

    await expect(
      prisma.vanChuyen.create({
        data: {
          donHangNhaCungCapId: shipment.donHangNhaCungCapId,
          maVanDon: shipment.maVanDon,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('supplier order có thể có shipment mới sau một attempt RETURNED/FAILED', async () => {
    const shipment = await prisma.vanChuyen.findFirstOrThrow();
    await prisma.vanChuyen.update({
      where: { id: shipment.id },
      data: { trangThai: TrangThaiVanChuyen.RETURNED },
    });

    const retry = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: shipment.donHangNhaCungCapId,
        maVanDon: `TRACK-RETRY-${suffix}`.slice(0, 191),
      },
    });

    expect(retry.id).not.toBe(shipment.id);
    expect(retry.trangThai).toBe(TrangThaiVanChuyen.CREATED);
  });
});
