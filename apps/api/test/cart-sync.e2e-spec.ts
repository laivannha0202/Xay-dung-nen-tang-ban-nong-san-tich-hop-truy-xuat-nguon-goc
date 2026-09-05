import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiNguoiDung,
} from '../src/generated/prisma/client';
import { CheckoutPreviewService } from '../src/modules/gio-hang/checkout-preview.service';
import { GioHangController } from '../src/modules/gio-hang/gio-hang.controller';
import { GioHangService } from '../src/modules/gio-hang/gio-hang.service';
import { JwtAccessGuard } from '../src/modules/xac-thuc/jwt-access.guard';

const THOI_GIAN_CHO_E2E_MS = 30_000;
const JWT_ACCESS_SECRET_MAC_DINH = 'agrimarket-local-access-secret-change-before-production-012';

describe('Cart Sync PHIEN-107 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mobileAccessToken = '';
  let webAccessToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `cart-sync-p107-${suffix}@example.com`;

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
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        JwtModule.register({}),
      ],
      controllers: [GioHangController],
      providers: [
        GioHangService,
        JwtAccessGuard,
        {
          provide: CheckoutPreviewService,
          useValue: {},
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);

    const user = await prisma.nguoiDung.create({
      data: {
        email,
        matKhauHash: 'khong-dung-trong-focused-cart-sync-test',
        hoTen: 'Khách Cart Sync PHIEN 107',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
        khachHang: {
          create: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
          },
        },
      },
      include: {
        khachHang: true,
      },
    });

    ids.user = user.id;
    ids.customer = user.khachHang!.id;

    const jwtSecret = process.env.JWT_ACCESS_SECRET ?? JWT_ACCESS_SECRET_MAC_DINH;

    mobileAccessToken = await jwtService.signAsync(
      {
        sub: user.id,
        loai: 'access',
        nenTang: 'MOBILE',
        jti: `mobile-${suffix}`,
      },
      {
        secret: jwtSecret,
        expiresIn: 3600,
      },
    );

    webAccessToken = await jwtService.signAsync(
      {
        sub: user.id,
        loai: 'access',
        nenTang: 'WEB',
        jti: `web-${suffix}`,
      },
      {
        secret: jwtSecret,
        expiresIn: 3600,
      },
    );

    expect(mobileAccessToken).toEqual(expect.any(String));
    expect(webAccessToken).toEqual(expect.any(String));
    expect(webAccessToken).not.toBe(mobileAccessToken);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P107-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Cart Sync 107',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P107-${suffix}`.slice(0, 50),
        ten: 'Trang trại Cart Sync 107',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Cart Sync 107',
        slug: `cart-sync-p107-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Cart Sync 107',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `CART-SYNC-P107-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 45000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Cart Sync',
        giong: 'P107',
        ngayTrong: new Date('2026-07-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-09-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });
    ids.season = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-09-01T00:00:00.000Z'),
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
        maLo: `LO-P107-${suffix}`.slice(0, 100),
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
        maKho: `KHO-P107-${suffix}`.slice(0, 50),
        ten: 'Kho Cart Sync 107',
        diaChi: 'Lâm Đồng',
      },
    });
    ids.warehouse = warehouse.id;

    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 12,
        reserved: 1,
        blocked: 1,
      },
    });
    ids.inventory = inventory.id;
  }, THOI_GIAN_CHO_E2E_MS);

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

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('add mobile → web sees item trên cùng Backend cart', async () => {
    const mobileCart = await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${mobileAccessToken}`)
      .send({
        bienTheSanPhamId: ids.variant,
        soLuong: 2,
      })
      .expect(201);

    expect(mobileCart.body.khachHangId).toBe(ids.customer);
    expect(mobileCart.body.muc).toHaveLength(1);
    expect(mobileCart.body.muc[0].soLuong).toBe(2);
    expect(mobileCart.body.muc[0].bienThe.id).toBe(ids.variant);

    const webCart = await request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${webAccessToken}`)
      .expect(200);

    expect(webCart.body.id).toBe(mobileCart.body.id);
    expect(webCart.body.khachHangId).toBe(ids.customer);
    expect(webCart.body.muc).toHaveLength(1);
    expect(webCart.body.muc[0].id).toBe(mobileCart.body.muc[0].id);
    expect(webCart.body.muc[0].soLuong).toBe(2);
    expect(webCart.body.muc[0].bienThe.id).toBe(ids.variant);
    expect(webCart.body.muc[0].bienThe.sanPham.id).toBe(ids.product);

    await expect(
      prisma.gioHang.count({
        where: { khachHangId: ids.customer },
      }),
    ).resolves.toBe(1);

    await expect(
      prisma.mucGioHang.count({
        where: { gioHangId: webCart.body.id as string },
      }),
    ).resolves.toBe(1);
  });
});
