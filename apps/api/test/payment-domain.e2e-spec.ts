import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiThanhToan } from '../src/generated/prisma/client';

describe('Payment Domain PHIEN-053 (e2e)', () => {
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
    // Payment history/transactions là dữ liệu domain cần giữ lịch sử.
    // Validation DB là disposable nên chỉ đóng app, không cleanup row thủ công.
    if (app) {
      await app.close();
      console.log(
        '[PAYMENT DOMAIN E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  it('payment mặc định CREATED và transaction lưu đủ mã/tiền/phương thức/thời gian/trạng thái', async () => {
    const user = await prisma.nguoiDung.create({
      data: {
        email: `payment-p53-${suffix}@example.com`,
        matKhauHash: 'hash-phien053',
        hoTen: 'Khách Payment PHIEN 053',
      },
    });

    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
      },
    });

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `PAY-ORDER-${suffix}`.slice(0, 100),
        khachHangId: customer.id,
        tongTien: 109000,
      },
    });

    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: 109000,
        phuongThuc: 'MOCK',
      },
    });

    expect(payment.trangThai).toBe(TrangThaiThanhToan.CREATED);
    expect(Number(payment.soTien)).toBe(109000);
    expect(payment.phuongThuc).toBe('MOCK');

    const transaction = await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: payment.id,
        maGiaoDich: `TX-P53-${suffix}`.slice(0, 191),
        soTien: 109000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PENDING,
      },
    });

    expect(transaction.maGiaoDich).toContain('TX-P53-');
    expect(Number(transaction.soTien)).toBe(109000);
    expect(transaction.phuongThuc).toBe('MOCK');
    expect(transaction.trangThai).toBe(TrangThaiThanhToan.PENDING);
    expect(transaction.thoiGian).toBeInstanceOf(Date);

    const loaded = await prisma.thanhToan.findUniqueOrThrow({
      where: { id: payment.id },
      include: {
        donHang: true,
        giaoDich: true,
      },
    });

    expect(loaded.donHang.id).toBe(order.id);
    expect(loaded.giaoDich).toHaveLength(1);
  });

  it('exact master states tồn tại trong generated enum', () => {
    expect(Object.values(TrangThaiThanhToan)).toEqual(
      expect.arrayContaining([
        'CREATED',
        'PENDING',
        'PAID',
        'FAILED',
        'CANCELLED',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
      ]),
    );
  });

  it('maGiaoDich unique để ngăn duplicate transaction code ở DB', async () => {
    const payment = await prisma.thanhToan.findFirstOrThrow();
    const existing = await prisma.giaoDichThanhToan.findFirstOrThrow();

    await expect(
      prisma.giaoDichThanhToan.create({
        data: {
          thanhToanId: payment.id,
          maGiaoDich: existing.maGiaoDich,
          soTien: 109000,
          phuongThuc: 'MOCK',
          trangThai: TrangThaiThanhToan.PENDING,
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('DB CHECK chặn payment và transaction amount <= 0', async () => {
    const payment = await prisma.thanhToan.findFirstOrThrow();

    await expect(
      prisma.$executeRawUnsafe('UPDATE `payment` SET `so_tien` = 0 WHERE `id` = ?', payment.id),
    ).rejects.toBeTruthy();

    const transaction = await prisma.giaoDichThanhToan.findFirstOrThrow();

    await expect(
      prisma.$executeRawUnsafe(
        'UPDATE `payment_transaction` SET `so_tien` = 0 WHERE `id` = ?',
        transaction.id,
      ),
    ).rejects.toBeTruthy();
  });
});
