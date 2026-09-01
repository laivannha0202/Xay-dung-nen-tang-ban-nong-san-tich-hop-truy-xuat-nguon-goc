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
import { MockPaymentGateway } from '../src/modules/thanh-toan/gateway/mock-payment.gateway';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

describe('Payment Callback Idempotency PHIEN-056 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reservationService: DatChoTonKhoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ids = {
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
    successPayment: '',
    successTransaction: '',
    successReservation: '',
    failedPayment: '',
    failedTransaction: '',
    failedReservation: '',
    guardPayment: '',
    guardTransaction: '',
    guardReservation: '',
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

    const user = await prisma.nguoiDung.create({
      data: {
        email: `callback-p56-${suffix}@example.com`,
        matKhauHash: 'hash-callback-056',
        hoTen: 'Khách Callback PHIEN 056',
      },
    });

    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
      },
    });
    ids.customer = customer.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-CB56-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Callback 056',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-CB56-${suffix}`.slice(0, 50),
        ten: 'Trang trại Callback 056',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Callback 056',
        slug: `callback-p56-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Callback 056',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `CALLBACK-P56-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 32000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Callback',
        giong: 'P56',
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
        maLo: `LO-CB56-${suffix}`.slice(0, 100),
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
        maKho: `KHO-CB56-${suffix}`.slice(0, 50),
        ten: 'Kho Callback 056',
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

    const createPending = async (label: string, transactionCode: string) => {
      const order = await prisma.donHang.create({
        data: {
          maDonHang: `P56-${label}-${suffix}`.slice(0, 100),
          khachHangId: customer.id,
          tongTien: 32000,
        },
      });

      const reservation = await reservationService.datCho({
        maThamChieu: `ORDER:${order.maDonHang}`,
        items: [
          {
            bienTheSanPhamId: variant.id,
            soLuong: 1,
          },
        ],
        ttlMs: 600_000,
      });

      const payment = await prisma.thanhToan.create({
        data: {
          donHangId: order.id,
          soTien: 32000,
          phuongThuc: 'MOCK',
          trangThai: TrangThaiThanhToan.PENDING,
        },
      });

      const transaction = await prisma.giaoDichThanhToan.create({
        data: {
          thanhToanId: payment.id,
          maGiaoDich: transactionCode,
          soTien: 32000,
          phuongThuc: 'MOCK',
          trangThai: TrangThaiThanhToan.PENDING,
        },
      });

      return {
        payment,
        transaction,
        reservation,
      };
    };

    const success = await createPending('SUCCESS', 'CALLBACKSUCCESS056');
    ids.successPayment = success.payment.id;
    ids.successTransaction = success.transaction.id;
    ids.successReservation = success.reservation.id;

    const failed = await createPending('FAILED', 'CALLBACKFAILED056');
    ids.failedPayment = failed.payment.id;
    ids.failedTransaction = failed.transaction.id;
    ids.failedReservation = failed.reservation.id;

    const guard = await createPending('GUARD', 'CALLBACKGUARD056');
    ids.guardPayment = guard.payment.id;
    ids.guardTransaction = guard.transaction.id;
    ids.guardReservation = guard.reservation.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
      console.log(
        '[PAYMENT CALLBACK E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  const callbackQuery = (transaction: string, result: 'SUCCESS' | 'FAILED', amount = '32000') => ({
    mock_signature: MockPaymentGateway.callbackSignature(),
    mock_result: result,
    mock_transaction: transaction,
    mock_gateway_transaction: `GW-${transaction}`,
    mock_amount: amount,
  });

  it('5 callback success đồng thời chỉ ghi nhận một ORDER_SHIP và không duplicate transaction', async () => {
    const beforeTransactions = await prisma.giaoDichThanhToan.count({
      where: {
        thanhToanId: ids.successPayment,
      },
    });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/thanh-toan/callback/MOCK')
          .query(callbackQuery('CALLBACKSUCCESS056', 'SUCCESS')),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.trangThaiThanhToan).toBe(TrangThaiThanhToan.PAID);
      expect(response.body.trangThaiGiaoDich).toBe(TrangThaiThanhToan.PAID);
      expect(response.body.trangThaiDatCho).toBe(TrangThaiDatChoTonKho.DA_BAN);
    }

    await expect(
      prisma.giaoDichThanhToan.count({
        where: {
          thanhToanId: ids.successPayment,
        },
      }),
    ).resolves.toBe(beforeTransactions);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
        },
      }),
    ).resolves.toBe(1);
  });

  it('3 callback fail đồng thời chỉ ghi nhận một ORDER_RELEASE và một transaction', async () => {
    const beforeTransactions = await prisma.giaoDichThanhToan.count({
      where: {
        thanhToanId: ids.failedPayment,
      },
    });

    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/thanh-toan/callback/MOCK')
          .query(callbackQuery('CALLBACKFAILED056', 'FAILED')),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.trangThaiThanhToan).toBe(TrangThaiThanhToan.FAILED);
      expect(response.body.trangThaiGiaoDich).toBe(TrangThaiThanhToan.FAILED);
      expect(response.body.trangThaiDatCho).toBe(TrangThaiDatChoTonKho.DA_GIAI_PHONG);
    }

    await expect(
      prisma.giaoDichThanhToan.count({
        where: {
          thanhToanId: ids.failedPayment,
        },
      }),
    ).resolves.toBe(beforeTransactions);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: LoaiGiaoDichTonKho.ORDER_RELEASE,
        },
      }),
    ).resolves.toBe(1);
  });

  it('invalid signature không gây Payment/Inventory business effect', async () => {
    const before = await prisma.tonKhoLo.findUniqueOrThrow({
      where: {
        id: ids.inventory,
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/thanh-toan/callback/MOCK')
      .query({
        ...callbackQuery('CALLBACKGUARD056', 'SUCCESS'),
        mock_signature: 'tampered',
      })
      .expect(400);

    const payment = await prisma.thanhToan.findUniqueOrThrow({
      where: {
        id: ids.guardPayment,
      },
    });
    const transaction = await prisma.giaoDichThanhToan.findUniqueOrThrow({
      where: {
        id: ids.guardTransaction,
      },
    });
    const reservation = await prisma.datChoTonKho.findUniqueOrThrow({
      where: {
        id: ids.guardReservation,
      },
    });
    const after = await prisma.tonKhoLo.findUniqueOrThrow({
      where: {
        id: ids.inventory,
      },
    });

    expect(payment.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(transaction.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(reservation.trangThai).toBe(TrangThaiDatChoTonKho.DANG_GIU);
    expect(Number(after.onHand)).toBe(Number(before.onHand));
    expect(Number(after.reserved)).toBe(Number(before.reserved));
  });

  it('amount mismatch không gây Payment/Inventory business effect', async () => {
    const beforeLedger = await prisma.giaoDichTonKho.count({
      where: {
        tonKhoLoId: ids.inventory,
        loai: {
          in: [LoaiGiaoDichTonKho.ORDER_SHIP, LoaiGiaoDichTonKho.ORDER_RELEASE],
        },
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/thanh-toan/callback/MOCK')
      .query(callbackQuery('CALLBACKGUARD056', 'SUCCESS', '99999'))
      .expect(409);

    const payment = await prisma.thanhToan.findUniqueOrThrow({
      where: {
        id: ids.guardPayment,
      },
    });
    const reservation = await prisma.datChoTonKho.findUniqueOrThrow({
      where: {
        id: ids.guardReservation,
      },
    });

    expect(payment.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(reservation.trangThai).toBe(TrangThaiDatChoTonKho.DANG_GIU);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: {
            in: [LoaiGiaoDichTonKho.ORDER_SHIP, LoaiGiaoDichTonKho.ORDER_RELEASE],
          },
        },
      }),
    ).resolves.toBe(beforeLedger);
  });

  it('duplicate terminal callback cùng kết quả vẫn trả idempotent success', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/thanh-toan/callback/MOCK')
      .query(callbackQuery('CALLBACKSUCCESS056', 'SUCCESS'))
      .expect(200);

    expect(response.body.daXuLyTruoc).toBe(true);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: ids.inventory,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
        },
      }),
    ).resolves.toBe(1);
  });
});
