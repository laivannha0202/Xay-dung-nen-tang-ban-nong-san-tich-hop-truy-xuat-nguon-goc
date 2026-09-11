import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  PhamViKhuyenMai,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { ThanhToanHoanTienHauXuLyService } from '../src/modules/thanh-toan/thanh-toan-hoan-tien-hau-xu-ly.service';

const TIMEOUT = 90_000;

describe('Refund benefit reconciliation V8B (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ThanhToanHoanTienHauXuLyService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const maKhuyenMai = `REFUND-V8B-${suffix}`.slice(0, 80).toUpperCase();
  let userId = '';
  let customerId = '';
  let loyaltyAccountId = '';
  let orderId = '';
  let paymentId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    service = app.get(ThanhToanHoanTienHauXuLyService);

    const user = await prisma.nguoiDung.create({
      data: {
        email: `refund-benefit-${suffix}@example.com`,
        matKhauHash: 'REFUND-BENEFIT-V8B-NOT-USED',
        hoTen: 'Refund Benefit V8B',
      },
    });
    userId = user.id;

    const customer = await prisma.khachHang.create({
      data: { nguoiDungId: user.id },
    });
    customerId = customer.id;

    const account = await prisma.taiKhoanLoyalty.create({
      data: {
        khachHangId: customer.id,
        diem: 75,
      },
    });
    loyaltyAccountId = account.id;

    await prisma.giaoDichLoyalty.create({
      data: {
        loyaltyAccountId: account.id,
        bienDongDiem: -25,
        soDuSau: 75,
        lyDo: 'Fixture: 25 điểm đã dùng cho order trước refund',
        maThamChieu: `ORDER:REFUND-${suffix}:LOYALTY_REDEEM`,
      },
    });

    await prisma.khuyenMai.create({
      data: {
        ma: maKhuyenMai,
        ten: 'Refund promotion V8B',
        phamVi: PhamViKhuyenMai.PLATFORM,
        donHangToiThieu: 0,
        giaTriGiam: 20_000,
        batDauLuc: new Date(Date.now() - 60_000),
        ketThucLuc: new Date(Date.now() + 3_600_000),
        gioiHanSuDung: 100,
        soLanDaSuDung: 1,
      },
    });

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `REFUND-${suffix}`.slice(0, 100),
        khachHangId: customer.id,
        tongTien: 80_000,
        tamTinhHangHoa: 125_000,
        phiVanChuyen: 0,
        maKhuyenMaiSnapshot: maKhuyenMai,
        giamKhuyenMai: 20_000,
        diemDaDung: 25,
        giaTriDiemDaDung: 25_000,
        trangThai: TrangThaiDonHang.HOAN_THANH,
      },
    });
    orderId = order.id;

    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: 80_000,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.REFUNDED,
      },
    });
    paymentId = payment.id;
  }, TIMEOUT);

  afterAll(async () => {
    if (prisma) {
      if (paymentId) {
        await prisma.giaoDichThanhToan.deleteMany({ where: { thanhToanId: paymentId } });
        await prisma.thanhToan.deleteMany({ where: { id: paymentId } });
      }
      if (orderId) await prisma.donHang.deleteMany({ where: { id: orderId } });
      await prisma.khuyenMai.deleteMany({ where: { ma: maKhuyenMai } });
      if (loyaltyAccountId) {
        await prisma.giaoDichLoyalty.deleteMany({ where: { loyaltyAccountId } });
        await prisma.taiKhoanLoyalty.deleteMany({ where: { id: loyaltyAccountId } });
      }
      if (customerId) await prisma.khachHang.deleteMany({ where: { id: customerId } });
      if (userId) await prisma.nguoiDung.deleteMany({ where: { id: userId } });
    }
    if (app) await app.close();
  }, TIMEOUT);

  it('full refund hoàn điểm, trả lượt voucher và chuyển order đúng một lần', async () => {
    await service.dongBo(paymentId);
    await service.dongBo(paymentId);

    const [account, promotion, order, refundLedgerCount] = await Promise.all([
      prisma.taiKhoanLoyalty.findUniqueOrThrow({ where: { id: loyaltyAccountId } }),
      prisma.khuyenMai.findUniqueOrThrow({ where: { ma: maKhuyenMai } }),
      prisma.donHang.findUniqueOrThrow({ where: { id: orderId } }),
      prisma.giaoDichLoyalty.count({
        where: {
          loyaltyAccountId,
          maThamChieu: { endsWith: ':LOYALTY_REFUND' },
        },
      }),
    ]);

    expect(account.diem).toBe(100);
    expect(promotion.soLanDaSuDung).toBe(0);
    expect(order.trangThai).toBe(TrangThaiDonHang.HOAN_TIEN_TOAN_BO);
    expect(refundLedgerCount).toBe(1);
  });
});
