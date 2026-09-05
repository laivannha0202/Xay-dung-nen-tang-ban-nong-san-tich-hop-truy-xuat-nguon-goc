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
  TrangThaiDatChoTonKho,
  TrangThaiLoSanPham,
  TrangThaiNguoiDung,
} from '../src/generated/prisma/client';
import { GioHangService } from '../src/modules/gio-hang/gio-hang.service';
import { DonHangQuanTriController } from '../src/modules/don-hang/don-hang-quan-tri.controller';
import { DonHangController } from '../src/modules/don-hang/don-hang.controller';
import { DonHangService } from '../src/modules/don-hang/don-hang.service';
import { QuyenGuard } from '../src/modules/phan-quyen/quyen.guard';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';
import { JwtAccessGuard } from '../src/modules/xac-thuc/jwt-access.guard';

const THOI_GIAN_CHO_E2E_MS = 30_000;
const JWT_ACCESS_SECRET_MAC_DINH = 'agrimarket-local-access-secret-change-before-production-012';

describe('Order Sync PHIEN-108 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let mobileAccessToken = '';
  let webCustomerAccessToken = '';
  let adminAccessToken = '';
  let orderId = '';
  let orderCode = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ids = {
    customerUser: '',
    customer: '',
    adminUser: '',
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
    cart: '',
    cartItem: '',
  };

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        JwtModule.register({}),
      ],
      controllers: [DonHangController, DonHangQuanTriController],
      providers: [
        GioHangService,
        DonHangService,
        JwtAccessGuard,
        QuyenGuard,
        {
          provide: DatChoTonKhoService,
          inject: [PrismaService],
          useFactory: (db: PrismaService) => ({
            datCho: jest.fn(
              async (input: {
                maThamChieu: string;
                items: Array<{
                  bienTheSanPhamId: string;
                  soLuong: number;
                }>;
              }) => {
                expect(input.items).toEqual([
                  {
                    bienTheSanPhamId: ids.variant,
                    soLuong: 2,
                  },
                ]);

                const inventory = await db.tonKhoLo.findUniqueOrThrow({
                  where: { id: ids.inventory },
                  include: {
                    kho: true,
                    loSanPham: true,
                  },
                });

                const expiry = new Date(Date.now() + 15 * 60_000);

                const reservation = await db.datChoTonKho.create({
                  data: {
                    maThamChieu: input.maThamChieu,
                    trangThai: TrangThaiDatChoTonKho.DANG_GIU,
                    hetHanLuc: expiry,
                    muc: {
                      create: {
                        tonKhoLoId: ids.inventory,
                        soLuong: 2,
                        thuTu: 0,
                      },
                    },
                  },
                });

                return {
                  id: reservation.id,
                  maThamChieu: input.maThamChieu,
                  trangThai: TrangThaiDatChoTonKho.DANG_GIU,
                  hetHanLuc: expiry,
                  ketThucLuc: null,
                  phanBo: [
                    {
                      tonKhoLoId: inventory.id,
                      khoId: inventory.khoId,
                      maKho: inventory.kho.maKho,
                      loSanPhamId: inventory.loSanPhamId,
                      maLo: inventory.loSanPham.maLo,
                      ngayHetHan: inventory.loSanPham.ngayHetHan.toISOString(),
                      bienTheSanPhamId: ids.variant,
                      soLuong: 2,
                    },
                  ],
                };
              },
            ),
            giaiPhong: jest.fn(async (id: string) => {
              await db.datChoTonKho.updateMany({
                where: { id },
                data: {
                  trangThai: TrangThaiDatChoTonKho.DA_GIAI_PHONG,
                  ketThucLuc: new Date(),
                },
              });
            }),
          }),
        },
      ],
    });

    builder.overrideGuard(QuyenGuard).useValue({
      canActivate: () => true,
    });

    const moduleRef = await builder.compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const customerUser = await prisma.nguoiDung.create({
      data: {
        email: `order-sync-customer-${suffix}@example.com`,
        matKhauHash: 'khong-dung-trong-order-sync-test',
        hoTen: 'Khách Order Sync PHIEN 108',
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

    ids.customerUser = customerUser.id;
    ids.customer = customerUser.khachHang!.id;

    const adminUser = await prisma.nguoiDung.create({
      data: {
        email: `order-sync-admin-${suffix}@example.com`,
        matKhauHash: 'khong-dung-trong-order-sync-test',
        hoTen: 'Admin Order Sync PHIEN 108',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    ids.adminUser = adminUser.id;

    const jwtSecret = process.env.JWT_ACCESS_SECRET ?? JWT_ACCESS_SECRET_MAC_DINH;

    mobileAccessToken = await jwtService.signAsync(
      {
        sub: customerUser.id,
        loai: 'access',
        nenTang: 'MOBILE',
        jti: `mobile-${suffix}`,
      },
      {
        secret: jwtSecret,
        expiresIn: 3600,
      },
    );

    webCustomerAccessToken = await jwtService.signAsync(
      {
        sub: customerUser.id,
        loai: 'access',
        nenTang: 'WEB',
        jti: `web-customer-${suffix}`,
      },
      {
        secret: jwtSecret,
        expiresIn: 3600,
      },
    );

    adminAccessToken = await jwtService.signAsync(
      {
        sub: adminUser.id,
        loai: 'access',
        nenTang: 'WEB',
        jti: `web-admin-${suffix}`,
      },
      {
        secret: jwtSecret,
        expiresIn: 3600,
      },
    );

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P108-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Order Sync 108',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P108-${suffix}`.slice(0, 50),
        ten: 'Trang trại Order Sync 108',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Order Sync 108',
        slug: `order-sync-p108-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Order Sync 108',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `ORDER-SYNC-P108-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 48000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Order Sync',
        giong: 'P108',
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
        maLo: `LO-P108-${suffix}`.slice(0, 100),
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
        maKho: `KHO-P108-${suffix}`.slice(0, 50),
        ten: 'Kho Order Sync 108',
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
        reserved: 0,
        blocked: 0,
      },
    });
    ids.inventory = inventory.id;

    const cart = await prisma.gioHang.create({
      data: {
        khachHangId: ids.customer,
        muc: {
          create: {
            bienTheSanPhamId: ids.variant,
            soLuong: 2,
          },
        },
      },
      include: {
        muc: true,
      },
    });

    ids.cart = cart.id;
    ids.cartItem = cart.muc[0]!.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('order mobile → web customer sees → admin sees', async () => {
    const maYeuCau = '10800000-0000-4000-8000-000000000108';

    const mobileOrder = await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${mobileAccessToken}`)
      .send({
        maYeuCau,
        items: [
          {
            bienTheSanPhamId: ids.variant,
            soLuong: 2,
            donGiaDuKien: 48000,
          },
        ],
      })
      .expect(201);

    orderId = mobileOrder.body.id as string;
    orderCode = mobileOrder.body.maDonHang as string;

    expect(orderId).toEqual(expect.any(String));
    expect(orderCode).toEqual(expect.any(String));
    expect(mobileOrder.body.tongTien).toBe(96000);
    expect(mobileOrder.body.donNhaCungCap).toHaveLength(1);
    expect(mobileOrder.body.donNhaCungCap[0].muc[0].bienTheSanPhamId).toBe(ids.variant);

    const webCustomerList = await request(app.getHttpServer())
      .get('/api/v1/don-hang')
      .query({
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${webCustomerAccessToken}`)
      .expect(200);

    const webCustomerItem = webCustomerList.body.duLieu.find(
      (item: { id: string }) => item.id === orderId,
    );

    expect(webCustomerItem).toMatchObject({
      id: orderId,
      maDonHang: orderCode,
      tongTien: 96000,
      soNhaCungCap: 1,
      soMuc: 1,
    });

    const webCustomerDetail = await request(app.getHttpServer())
      .get(`/api/v1/don-hang/${orderId}`)
      .set('Authorization', `Bearer ${webCustomerAccessToken}`)
      .expect(200);

    expect(webCustomerDetail.body.id).toBe(orderId);
    expect(webCustomerDetail.body.maDonHang).toBe(orderCode);
    expect(webCustomerDetail.body.donNhaCungCap[0].muc[0].bienTheSanPhamId).toBe(ids.variant);
    expect(webCustomerDetail.body.donNhaCungCap[0].muc[0].soLuong).toBe(2);

    const adminList = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/don-hang')
      .query({
        trang: 1,
        gioiHan: 20,
        maDonHang: orderCode,
      })
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const adminItem = adminList.body.duLieu.find((item: { id: string }) => item.id === orderId);

    expect(adminItem).toMatchObject({
      id: orderId,
      maDonHang: orderCode,
      tongTien: 96000,
      soNhaCungCap: 1,
      soMuc: 1,
    });

    const adminDetail = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/don-hang/${orderId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(adminDetail.body.id).toBe(orderId);
    expect(adminDetail.body.maDonHang).toBe(orderCode);
    expect(adminDetail.body.khachHang.id).toBe(ids.customer);
    expect(adminDetail.body.khachHang.email).toBe(`order-sync-customer-${suffix}@example.com`);
    expect(adminDetail.body.donNhaCungCap[0].muc[0].bienTheSanPhamId).toBe(ids.variant);
    expect(adminDetail.body.donNhaCungCap[0].muc[0].soLuong).toBe(2);

    await expect(
      prisma.donHang.count({
        where: {
          id: orderId,
          khachHangId: ids.customer,
        },
      }),
    ).resolves.toBe(1);
  });
});
