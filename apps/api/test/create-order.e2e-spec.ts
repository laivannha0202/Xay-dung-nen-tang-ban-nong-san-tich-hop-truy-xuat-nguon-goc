import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  TrangThaiDatChoTonKho,
  TrangThaiLoSanPham,
} from '../src/generated/prisma/client';

describe('Create Order PHIEN-052 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ids = {
    supplierA: '',
    supplierB: '',
    farmA: '',
    farmB: '',
    category: '',
    productA: '',
    productB: '',
    productRace: '',
    variantA: '',
    variantB: '',
    variantRace: '',
    seasonA: '',
    seasonB: '',
    harvestA: '',
    harvestB: '',
    batchA: '',
    batchB: '',
    warehouse: '',
    inventoryA: '',
    inventoryB: '',
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

    const email = `order-p52-${suffix}@example.com`;
    const password = 'MatKhau-052-Order';

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: password,
        hoTen: 'Khách Create Order PHIEN 052',
        soDienThoai: `06${Date.now().toString().slice(-8)}`,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: password,
        nenTang: 'MOBILE',
      })
      .expect(200);
    accessToken = login.body.accessToken as string;

    const [supplierA, supplierB] = await Promise.all([
      prisma.nhaCungCap.create({
        data: {
          ma: `NCC-A-P52-${suffix}`.slice(0, 50),
          ten: 'Nhà cung cấp A PHIEN 052',
        },
      }),
      prisma.nhaCungCap.create({
        data: {
          ma: `NCC-B-P52-${suffix}`.slice(0, 50),
          ten: 'Nhà cung cấp B PHIEN 052',
        },
      }),
    ]);
    ids.supplierA = supplierA.id;
    ids.supplierB = supplierB.id;

    const [farmA, farmB] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-A-P52-${suffix}`.slice(0, 50),
          ten: 'Trang trại A PHIEN 052',
          diaChi: 'Lâm Đồng',
          nhaCungCapId: supplierA.id,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-B-P52-${suffix}`.slice(0, 50),
          ten: 'Trang trại B PHIEN 052',
          diaChi: 'Đắk Lắk',
          nhaCungCapId: supplierB.id,
        },
      }),
    ]);
    ids.farmA = farmA.id;
    ids.farmB = farmB.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Create Order 052',
        slug: `create-order-p52-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const [productA, productB, productRace] = await Promise.all([
      prisma.sanPham.create({
        data: {
          ten: 'Sản phẩm A PHIEN 052',
          trangTraiId: farmA.id,
          danhMucSanPhamId: category.id,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Sản phẩm B PHIEN 052',
          trangTraiId: farmB.id,
          danhMucSanPhamId: category.id,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Sản phẩm Race PHIEN 052',
          trangTraiId: farmA.id,
          danhMucSanPhamId: category.id,
        },
      }),
    ]);
    ids.productA = productA.id;
    ids.productB = productB.id;
    ids.productRace = productRace.id;

    const [variantA, variantB, variantRace] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: productA.id,
          sku: `P52-A-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 32000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: productB.id,
          sku: `P52-B-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1000,
          gia: 45000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: productRace.id,
          sku: `P52-RACE-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 250,
          gia: 12000,
          donVi: 'g',
        },
      }),
    ]);
    ids.variantA = variantA.id;
    ids.variantB = variantB.id;
    ids.variantRace = variantRace.id;

    const [seasonA, seasonB] = await Promise.all([
      prisma.muaVu.create({
        data: {
          trangTraiId: farmA.id,
          cayTrong: 'Rau A',
          giong: 'P52-A',
          ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
          sanLuongDuKienKg: 100,
        },
      }),
      prisma.muaVu.create({
        data: {
          trangTraiId: farmB.id,
          cayTrong: 'Rau B',
          giong: 'P52-B',
          ngayTrong: new Date('2026-06-02T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-08-02T00:00:00.000Z'),
          sanLuongDuKienKg: 100,
        },
      }),
    ]);
    ids.seasonA = seasonA.id;
    ids.seasonB = seasonB.id;

    const [harvestA, harvestB] = await Promise.all([
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonA.id,
          ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
          soLuong: 100,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonB.id,
          ngayThuHoach: new Date('2026-08-02T00:00:00.000Z'),
          soLuong: 100,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
    ]);
    ids.harvestA = harvestA.id;
    ids.harvestB = harvestB.id;

    const expiryA = new Date();
    expiryA.setUTCDate(expiryA.getUTCDate() + 15);
    const expiryB = new Date();
    expiryB.setUTCDate(expiryB.getUTCDate() + 20);

    const [batchA, batchB] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `LO-A-P52-${suffix}`.slice(0, 100),
          thuHoachId: harvestA.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: expiryA,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-B-P52-${suffix}`.slice(0, 100),
          thuHoachId: harvestB.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: expiryB,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
    ]);
    ids.batchA = batchA.id;
    ids.batchB = batchB.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P52-${suffix}`.slice(0, 50),
        ten: 'Kho Create Order 052',
        diaChi: 'Lâm Đồng',
      },
    });
    ids.warehouse = warehouse.id;

    const [inventoryA, inventoryB, inventoryRace] = await Promise.all([
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchA.id,
          bienTheSanPhamId: variantA.id,
          onHand: 10,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchB.id,
          bienTheSanPhamId: variantB.id,
          onHand: 10,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchA.id,
          bienTheSanPhamId: variantRace.id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
    ]);
    ids.inventoryA = inventoryA.id;
    ids.inventoryB = inventoryB.id;
    ids.inventoryRace = inventoryRace.id;

    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: variantA.id,
        soLuong: 2,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: variantB.id,
        soLuong: 1,
      })
      .expect(201);
  });

  afterAll(async () => {
    // Inventory ledger và Order history là immutable-oriented.
    // Validation DB là disposable; chỉ đóng Nest/BullMQ rồi để automation drop DB.
    if (app) {
      await app.close();
      console.log(
        '[CREATE ORDER E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  it('bắt buộc đăng nhập', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .send({
        maYeuCau: '00000000-0000-4000-8000-000000000052',
        items: [],
      })
      .expect(401);
  });

  it('reject stale price trước reserve và không tạo orphan reservation/order', async () => {
    const beforeReservation = await prisma.datChoTonKho.count();
    const beforeOrder = await prisma.donHang.count();

    await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maYeuCau: '10000000-0000-4000-8000-000000000052',
        items: [
          {
            bienTheSanPhamId: ids.variantA,
            soLuong: 2,
            donGiaDuKien: 1,
          },
          {
            bienTheSanPhamId: ids.variantB,
            soLuong: 1,
            donGiaDuKien: 45000,
          },
        ],
      })
      .expect(400);

    await expect(prisma.datChoTonKho.count()).resolves.toBe(beforeReservation);
    await expect(prisma.donHang.count()).resolves.toBe(beforeOrder);
  });

  it('validate -> reserve -> create order/suborders/items -> allocate', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maYeuCau: '20000000-0000-4000-8000-000000000052',
        items: [
          {
            bienTheSanPhamId: ids.variantA,
            soLuong: 2,
            donGiaDuKien: 32000,
          },
          {
            bienTheSanPhamId: ids.variantB,
            soLuong: 1,
            donGiaDuKien: 45000,
          },
        ],
      })
      .expect(201);

    expect(result.body.maDonHang).toBe('ORD-20000000000040008000000000000052');
    expect(result.body.tongTien).toBe(109000);
    expect(result.body.donNhaCungCap).toHaveLength(2);
    expect(result.body.datCho.trangThai).toBe(TrangThaiDatChoTonKho.DANG_GIU);

    const items = result.body.donNhaCungCap.flatMap(
      (suborder: { muc: unknown[] }) => suborder.muc,
    ) as Array<{
      bienTheSanPhamId: string;
      soLuong: number;
      donGiaSnapshot: number;
      tenSanPhamSnapshot: string;
      phanBo: Array<{
        tonKhoLoId: string;
        soLuong: number;
      }>;
    }>;

    expect(items).toHaveLength(2);

    for (const item of items) {
      expect(item.phanBo.length).toBeGreaterThan(0);
      expect(item.phanBo.reduce((tong, allocation) => tong + allocation.soLuong, 0)).toBe(
        item.soLuong,
      );
    }

    const itemA = items.find((item) => item.bienTheSanPhamId === ids.variantA);
    expect(itemA?.donGiaSnapshot).toBe(32000);
    expect(itemA?.tenSanPhamSnapshot).toBe('Sản phẩm A PHIEN 052');
    expect(itemA?.phanBo[0]?.tonKhoLoId).toBe(ids.inventoryA);

    const inventoryA = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryA },
    });
    const inventoryB = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryB },
    });

    expect(Number(inventoryA.reserved)).toBe(2);
    expect(Number(inventoryB.reserved)).toBe(1);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          loai: LoaiGiaoDichTonKho.ORDER_RESERVE,
          tonKhoLoId: {
            in: [ids.inventoryA, ids.inventoryB],
          },
        },
      }),
    ).resolves.toBe(2);
  });

  it('retry cùng maYeuCau idempotent, không tạo thêm Order/Reservation', async () => {
    const beforeOrders = await prisma.donHang.count();
    const beforeReservations = await prisma.datChoTonKho.count();

    const retry = await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maYeuCau: '20000000-0000-4000-8000-000000000052',
        items: [
          {
            bienTheSanPhamId: ids.variantA,
            soLuong: 2,
            donGiaDuKien: 32000,
          },
          {
            bienTheSanPhamId: ids.variantB,
            soLuong: 1,
            donGiaDuKien: 45000,
          },
        ],
      })
      .expect(201);

    expect(retry.body.maDonHang).toBe('ORD-20000000000040008000000000000052');
    await expect(prisma.donHang.count()).resolves.toBe(beforeOrders);
    await expect(prisma.datChoTonKho.count()).resolves.toBe(beforeReservations);
  });

  it('reserve failure do stock thay đổi không tạo Order orphan', async () => {
    const cart = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    for (const muc of cart.body.muc as Array<{
      id: string;
    }>) {
      await request(app.getHttpServer())
        .delete(`/api/v1/gio-hang/muc/${muc.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: ids.variantRace,
        soLuong: 1,
      })
      .expect(201);

    await prisma.tonKhoLo.update({
      where: { id: ids.inventoryRace },
      data: { blocked: 1 },
    });

    const beforeOrders = await prisma.donHang.count();

    await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maYeuCau: '30000000-0000-4000-8000-000000000052',
        items: [
          {
            bienTheSanPhamId: ids.variantRace,
            soLuong: 1,
            donGiaDuKien: 12000,
          },
        ],
      })
      .expect(400);

    await expect(prisma.donHang.count()).resolves.toBe(beforeOrders);

    await expect(
      prisma.datChoTonKho.count({
        where: {
          maThamChieu: 'ORDER:ORD-30000000000040008000000000000052',
        },
      }),
    ).resolves.toBe(0);
  });
});
