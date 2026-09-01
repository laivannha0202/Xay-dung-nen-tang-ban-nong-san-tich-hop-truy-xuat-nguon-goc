import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiThanhToan } from '../src/generated/prisma/client';
import { MockPaymentGateway } from '../src/modules/thanh-toan/gateway/mock-payment.gateway';
import { ThanhToanHoanTienService } from '../src/modules/thanh-toan/thanh-toan-hoan-tien.service';

describe('Refund PHIEN-070 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ThanhToanHoanTienService;
  let mockGateway: MockPaymentGateway;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    user: '',
    customer: '',
    orders: [] as string[],
    payments: [] as string[],
  };

  const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    service = app.get(ThanhToanHoanTienService);
    mockGateway = app.get(MockPaymentGateway);

    const user = await prisma.nguoiDung.create({
      data: {
        email: `refund-p70-${suffix}@example.com`,
        matKhauHash: 'hash-refund-070',
        hoTen: 'Refund PHIEN 070',
      },
    });
    ids.user = user.id;
    const customer = await prisma.khachHang.create({ data: { nguoiDungId: user.id } });
    ids.customer = customer.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (ids.payments.length > 0) {
        await prisma.giaoDichThanhToan.deleteMany({ where: { thanhToanId: { in: ids.payments } } });
        await prisma.thanhToan.deleteMany({ where: { id: { in: ids.payments } } });
      }
      if (ids.orders.length > 0) {
        await prisma.donHang.deleteMany({ where: { id: { in: ids.orders } } });
      }
      if (ids.customer) await prisma.khachHang.deleteMany({ where: { id: ids.customer } });
      if (ids.user) await prisma.nguoiDung.deleteMany({ where: { id: ids.user } });
    }
    if (app) await app.close();
  });

  const createPaid = async (
    amount: number,
    status: TrangThaiThanhToan = TrangThaiThanhToan.PAID,
  ) => {
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `P70-${suffix}-${ids.orders.length}`.slice(0, 100),
        khachHangId: ids.customer,
        tongTien: amount,
      },
    });
    ids.orders.push(order.id);
    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: amount,
        phuongThuc: 'MOCK',
        trangThai: status,
      },
    });
    ids.payments.push(payment.id);
    await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: payment.id,
        maGiaoDich: `P70PAID${ids.payments.length}${Date.now()}`.slice(0, 191),
        soTien: amount,
        phuongThuc: 'MOCK',
        trangThai: status === TrangThaiThanhToan.PAID ? TrangThaiThanhToan.PAID : status,
        thoiGian: new Date(),
      },
    });
    return payment;
  };

  it('partial refund qua Payment adapter và chuyển Payment -> PARTIALLY_REFUNDED', async () => {
    const payment = await createPaid(100000);
    const spy = jest.spyOn(mockGateway, 'refund');
    try {
      const result = await service.hoanTien(
        ids.user,
        payment.id,
        {
          maYeuCau: uuid(1),
          soTien: 30000,
          lyDo: 'Hoàn một phần PHIEN 070',
        },
        '127.0.0.1',
      );
      expect(result.trangThaiThanhToan).toBe(TrangThaiThanhToan.PARTIALLY_REFUNDED);
      expect(result.trangThaiGiaoDichHoanTien).toBe(TrangThaiThanhToan.PARTIALLY_REFUNDED);
      expect(result.tongDaHoan).toBe(30000);
      expect(result.conLai).toBe(70000);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 30000, transactionType: 'PARTIAL' }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('full refund đúng paid amount dùng FULL và chuyển Payment -> REFUNDED', async () => {
    const payment = await createPaid(50000);
    const spy = jest.spyOn(mockGateway, 'refund');
    try {
      const result = await service.hoanTien(
        ids.user,
        payment.id,
        {
          maYeuCau: uuid(2),
          soTien: 50000,
          lyDo: 'Hoàn toàn bộ PHIEN 070',
        },
        '127.0.0.1',
      );
      expect(result.trangThaiThanhToan).toBe(TrangThaiThanhToan.REFUNDED);
      expect(result.tongDaHoan).toBe(50000);
      expect(result.conLai).toBe(0);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50000, transactionType: 'FULL' }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('same maYeuCau sau thành công idempotent, không gọi Payment adapter lần hai', async () => {
    const payment = await createPaid(60000);
    const spy = jest.spyOn(mockGateway, 'refund');
    try {
      const input = { maYeuCau: uuid(3), soTien: 20000, lyDo: 'Idempotency refund PHIEN 070' };
      const first = await service.hoanTien(ids.user, payment.id, input, '127.0.0.1');
      const second = await service.hoanTien(ids.user, payment.id, input, '127.0.0.1');
      expect(first.daXuLyTruoc).toBe(false);
      expect(second.daXuLyTruoc).toBe(true);
      expect(second.refundTransactionId).toBe(first.refundTransactionId);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('concurrent refund reservations không thể vượt paid amount', async () => {
    const payment = await createPaid(100000);
    const settled = await Promise.allSettled([
      service.hoanTien(
        ids.user,
        payment.id,
        {
          maYeuCau: uuid(4),
          soTien: 70000,
          lyDo: 'Concurrent refund A',
        },
        '127.0.0.1',
      ),
      service.hoanTien(
        ids.user,
        payment.id,
        {
          maYeuCau: uuid(5),
          soTien: 40000,
          lyDo: 'Concurrent refund B',
        },
        '127.0.0.1',
      ),
    ]);
    expect(settled.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(settled.filter((item) => item.status === 'rejected')).toHaveLength(1);

    const txs = await prisma.giaoDichThanhToan.findMany({ where: { thanhToanId: payment.id } });
    const totalReservedOrRefunded = txs
      .filter((item) => item.maGiaoDich.startsWith('REFUND-'))
      .filter((item) =>
        (
          [
            TrangThaiThanhToan.CREATED,
            TrangThaiThanhToan.PARTIALLY_REFUNDED,
            TrangThaiThanhToan.REFUNDED,
          ] as readonly TrangThaiThanhToan[]
        ).includes(item.trangThai),
      )
      .reduce((sum, item) => sum + Number(item.soTien), 0);
    expect(totalReservedOrRefunded).toBeLessThanOrEqual(100000);
  });

  it('Payment chưa PAID bị chặn trước khi gọi adapter', async () => {
    const payment = await createPaid(45000, TrangThaiThanhToan.PENDING);
    const spy = jest.spyOn(mockGateway, 'refund');
    try {
      await expect(
        service.hoanTien(
          ids.user,
          payment.id,
          {
            maYeuCau: uuid(6),
            soTien: 10000,
            lyDo: 'Không được refund pending',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow('Chỉ Payment PAID/PARTIALLY_REFUNDED');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
