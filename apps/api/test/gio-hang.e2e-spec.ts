import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiLoSanPham } from '../src/generated/prisma/client';

describe('Cart Backend PHIEN-047 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `cart-p47-${suffix}@example.com`;
  const password = 'MatKhau-047-Cart';
  const ids = {
    user: '',
    customer: '',
    supplier: '',
    farm: '',
    category: '',
    product: '',
    variant: '',
    season: '',
    harvest: '',
    batch: '',
    warehouse: '',
    inventory: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: password,
        hoTen: 'Khách Cart PHIEN 047',
        soDienThoai: `08${Date.now().toString().slice(-8)}`,
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

    const user = await prisma.nguoiDung.findUniqueOrThrow({
      where: { email },
      include: { khachHang: true },
    });
    ids.user = user.id;
    ids.customer = user.khachHang!.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P47-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Cart 047',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P47-${suffix}`.slice(0, 50),
        ten: 'Trang trại Cart 047',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Cart 047',
        slug: `cart-p47-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Cart 047',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `CART-P47-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 32000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Cart',
        giong: 'P47',
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

    const expiry = new Date();
    expiry.setUTCDate(expiry.getUTCDate() + 30);

    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-P47-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    ids.batch = batch.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P47-${suffix}`.slice(0, 50),
        ten: 'Kho Cart 047',
        diaChi: 'Lâm Đồng',
      },
    });
    ids.warehouse = warehouse.id;

    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 10,
        reserved: 3,
        blocked: 2,
      },
    });
    ids.inventory = inventory.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (ids.user) {
        await prisma.nguoiDung.deleteMany({
          where: { id: ids.user },
        });
      }
      if (ids.inventory) {
        await prisma.tonKhoLo.deleteMany({
          where: { id: ids.inventory },
        });
      }
      if (ids.batch) {
        await prisma.loSanPham.deleteMany({
          where: { id: ids.batch },
        });
      }
      if (ids.harvest) {
        await prisma.thuHoach.deleteMany({
          where: { id: ids.harvest },
        });
      }
      if (ids.season) {
        await prisma.muaVu.deleteMany({
          where: { id: ids.season },
        });
      }
      if (ids.variant) {
        await prisma.bienTheSanPham.deleteMany({
          where: { id: ids.variant },
        });
      }
      if (ids.product) {
        await prisma.sanPham.deleteMany({
          where: { id: ids.product },
        });
      }
      if (ids.category) {
        await prisma.danhMucSanPham.deleteMany({
          where: { id: ids.category },
        });
      }
      if (ids.warehouse) {
        await prisma.kho.deleteMany({
          where: { id: ids.warehouse },
        });
      }
      if (ids.farm) {
        await prisma.trangTrai.deleteMany({
          where: { id: ids.farm },
        });
      }
      if (ids.supplier) {
        await prisma.nhaCungCap.deleteMany({
          where: { id: ids.supplier },
        });
      }
    }

    if (app) await app.close();
  });

  it('bắt buộc đăng nhập', async () => {
    await request(app.getHttpServer()).get('/api/v1/gio-hang').expect(401);
  });

  it('mỗi khách chỉ có một cart active', async () => {
    const first = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const second = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(second.body.id).toBe(first.body.id);

    await expect(
      prisma.gioHang.count({
        where: { khachHangId: ids.customer },
      }),
    ).resolves.toBe(1);
  });

  it('add cùng variant cộng quantity và trả farm/supplier/current price/available', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: ids.variant,
        soLuong: 2,
      })
      .expect(201);

    expect(first.body.muc).toHaveLength(1);
    expect(first.body.muc[0].soLuong).toBe(2);
    expect(first.body.muc[0].bienThe.giaHienTai).toBe(32000);
    expect(first.body.muc[0].bienThe.soLuongKhaDung).toBe(5);
    expect(first.body.muc[0].bienThe.sanPham.trangTrai.id).toBe(ids.farm);
    expect(first.body.muc[0].bienThe.sanPham.trangTrai.nhaCungCap.id).toBe(ids.supplier);

    const second = await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: ids.variant,
        soLuong: 1,
      })
      .expect(201);

    expect(second.body.muc).toHaveLength(1);
    expect(second.body.muc[0].soLuong).toBe(3);

    await expect(prisma.mucGioHang.count()).resolves.toBe(1);
  });

  it('update không được vượt available và cart không reserve tồn', async () => {
    const cart = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const mucId = cart.body.muc[0].id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/gio-hang/muc/${mucId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ soLuong: 5 })
      .expect(200);

    expect(updated.body.muc[0].soLuong).toBe(5);

    await request(app.getHttpServer())
      .patch(`/api/v1/gio-hang/muc/${mucId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ soLuong: 6 })
      .expect(400);

    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });
    expect(Number(inventory.reserved)).toBe(3);
    expect(Number(inventory.blocked)).toBe(2);
    expect(Number(inventory.onHand)).toBe(10);
  });

  it('xóa item giữ lại active cart rỗng', async () => {
    const cart = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const mucId = cart.body.muc[0].id as string;

    const result = await request(app.getHttpServer())
      .delete(`/api/v1/gio-hang/muc/${mucId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(result.body.muc).toEqual([]);

    await expect(
      prisma.gioHang.count({
        where: { khachHangId: ids.customer },
      }),
    ).resolves.toBe(1);
  });
});
