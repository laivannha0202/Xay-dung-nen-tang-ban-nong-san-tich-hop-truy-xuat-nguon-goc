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
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

describe('COD + Mock Payment PHIEN-054 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reservationService: DatChoTonKhoService;
  let accessToken = '';
  let foreignAccessToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ids = {
    customer: '',
    foreignCustomer: '',
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
    orderCod: '',
    orderMockSuccess: '',
    orderMockFail: '',
    orderForeign: '',
    reservationCod: '',
    reservationMockSuccess: '',
    reservationMockFail: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    reservationService = app.get(DatChoTonKhoService);

    const email = `payment-p54-${suffix}@example.com`;
    const password = 'MatKhau-054-Payment';

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: password,
        hoTen: 'Khách Payment PHIEN 054',
        soDienThoai: `05${Date.now().toString().slice(-8)}`,
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
    ids.customer = user.khachHang!.id;

    const foreignEmail = `payment-p54-foreign-${suffix}@example.com`;

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email: foreignEmail,
        matKhau: password,
        hoTen: 'Khách khác Payment PHIEN 054',
        soDienThoai: `04${Date.now().toString().slice(-8)}`,
      })
      .expect(201);

    const foreignLogin = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email: foreignEmail,
        matKhau: password,
        nenTang: 'MOBILE',
      })
      .expect(200);
    foreignAccessToken = foreignLogin.body.accessToken as string;

    const foreignUser = await prisma.nguoiDung.findUniqueOrThrow({
      where: { email: foreignEmail },
      include: { khachHang: true },
    });
    ids.foreignCustomer = foreignUser.khachHang!.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P54-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Payment 054',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P54-${suffix}`.slice(0, 50),
        ten: 'Trang trại Payment 054',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Payment 054',
        slug: `payment-p54-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Payment 054',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `PAY-P54-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 32000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Payment',
        giong: 'P54',
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
        maLo: `LO-P54-${suffix}`.slice(0, 100),
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
        maKho: `KHO-P54-${suffix}`.slice(0, 50),
        ten: 'Kho Payment 054',
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

    const taoOrderReservation = async (
      label: string,
      customerId: string,
      withReservation = true,
    ) => {
      const order = await prisma.donHang.create({
        data: {
          maDonHang: `P54-${label}-${suffix}`.slice(0, 100),
          khachHangId: customerId,
          tongTien: 32000,
        },
      });

      if (!withReservation) {
        return {
          order,
          reservationId: '',
        };
      }

      const reservation = await reservationService.datCho({
        maThamChieu: `ORDER:${order.maDonHang}`,
        items: [
          {
            bienTheSanPhamId: variant.id,
            soLuong: 1,
          },
        ],
        ttlMs: 60_000,
      });

      return {
        order,
        reservationId: reservation.id,
      };
    };

    const cod = await taoOrderReservation('COD', ids.customer);
    ids.orderCod = cod.order.id;
    ids.reservationCod = cod.reservationId;

    const mockSuccess = await taoOrderReservation('MOCK-SUCCESS', ids.customer);
    ids.orderMockSuccess = mockSuccess.order.id;
    ids.reservationMockSuccess = mockSuccess.reservationId;

    const mockFail = await taoOrderReservation('MOCK-FAIL', ids.customer);
    ids.orderMockFail = mockFail.order.id;
    ids.reservationMockFail = mockFail.reservationId;

    const foreign = await taoOrderReservation('FOREIGN', ids.foreignCustomer, false);
    ids.orderForeign = foreign.order.id;
  });

  afterAll(async () => {
    // Payment/ledger là lịch sử domain; validation DB disposable.
    if (app) {
      await app.close();
      console.log(
        '[COD MOCK PAYMENT E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  it('bắt buộc đăng nhập', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .send({
        donHangId: ids.orderCod,
        maYeuCau: '00000000-0000-4000-8000-000000000054',
        phuongThuc: 'COD',
      })
      .expect(401);
  });

  it('không được thanh toán Order của khách khác', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderForeign,
        maYeuCau: '10000000-0000-4000-8000-000000000054',
        phuongThuc: 'COD',
      })
      .expect(403);
  });

  it('COD: amount từ Order, payment PENDING và reservation chuyển DA_BAN', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderCod,
        maYeuCau: '20000000-0000-4000-8000-000000000054',
        phuongThuc: 'COD',
      })
      .expect(201);

    expect(result.body.soTien).toBe(32000);
    expect(result.body.phuongThuc).toBe('COD');
    expect(result.body.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(result.body.giaoDich.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(result.body.giaoDich.maGiaoDich).toBe('PAY-20000000000040008000000000000054');
    expect(result.body.datCho.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);

    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });
    expect(Number(inventory.onHand)).toBe(9);
    expect(Number(inventory.reserved)).toBe(2);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
        },
      }),
    ).resolves.toBe(1);
  });

  it('retry cùng maYeuCau là idempotent, không duplicate payment/transaction', async () => {
    const beforePayments = await prisma.thanhToan.count();
    const beforeTransactions = await prisma.giaoDichThanhToan.count();

    const first = await prisma.giaoDichThanhToan.findUniqueOrThrow({
      where: {
        maGiaoDich: 'PAY-20000000000040008000000000000054',
      },
    });

    const retry = await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderCod,
        maYeuCau: '20000000-0000-4000-8000-000000000054',
        phuongThuc: 'COD',
      })
      .expect(201);

    expect(retry.body.giaoDich.id).toBe(first.id);

    await expect(prisma.thanhToan.count()).resolves.toBe(beforePayments);
    await expect(prisma.giaoDichThanhToan.count()).resolves.toBe(beforeTransactions);
  });

  it('MOCK thành công: payment PAID và commit reservation', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderMockSuccess,
        maYeuCau: '30000000-0000-4000-8000-000000000054',
        phuongThuc: 'MOCK',
        ketQuaMock: 'THANH_CONG',
      })
      .expect(201);

    expect(result.body.soTien).toBe(32000);
    expect(result.body.trangThai).toBe(TrangThaiThanhToan.PAID);
    expect(result.body.giaoDich.trangThai).toBe(TrangThaiThanhToan.PAID);
    expect(result.body.datCho.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);

    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });
    expect(Number(inventory.onHand)).toBe(8);
    expect(Number(inventory.reserved)).toBe(1);
  });

  it('MOCK thất bại: payment FAILED và release reservation', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderMockFail,
        maYeuCau: '40000000-0000-4000-8000-000000000054',
        phuongThuc: 'MOCK',
        ketQuaMock: 'THAT_BAI',
      })
      .expect(201);

    expect(result.body.soTien).toBe(32000);
    expect(result.body.trangThai).toBe(TrangThaiThanhToan.FAILED);
    expect(result.body.giaoDich.trangThai).toBe(TrangThaiThanhToan.FAILED);
    expect(result.body.datCho.trangThai).toBe(TrangThaiDatChoTonKho.DA_GIAI_PHONG);

    const inventory = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });
    expect(Number(inventory.onHand)).toBe(8);
    expect(Number(inventory.reserved)).toBe(0);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: LoaiGiaoDichTonKho.ORDER_RELEASE,
        },
      }),
    ).resolves.toBe(1);
  });

  it('MOCK bắt buộc kết quả và COD không nhận ketQuaMock', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        donHangId: ids.orderMockFail,
        maYeuCau: '50000000-0000-4000-8000-000000000054',
        phuongThuc: 'MOCK',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/thanh-toan')
      .set('Authorization', `Bearer ${foreignAccessToken}`)
      .send({
        donHangId: ids.orderForeign,
        maYeuCau: '60000000-0000-4000-8000-000000000054',
        phuongThuc: 'COD',
        ketQuaMock: 'THANH_CONG',
      })
      .expect(400);
  });
});
