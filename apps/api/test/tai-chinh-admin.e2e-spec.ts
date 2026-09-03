import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiThanhToan } from '../src/generated/prisma/client';
import { ThanhToanTaiChinhService } from '../src/modules/thanh-toan/thanh-toan-tai-chinh.service';

function taoHarness() {
  const payment = {
    id: '11111111-1111-4111-8111-111111111111',
    donHangId: '22222222-2222-4222-8222-222222222222',
    soTien: 500000,
    phuongThuc: 'MOCK',
    trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
    createdAt: new Date('2026-09-03T10:00:00.000Z'),
    updatedAt: new Date('2026-09-03T11:00:00.000Z'),
    donHang: {
      id: '22222222-2222-4222-8222-222222222222',
      maDonHang: 'ORDER-FINANCE-001',
    },
    giaoDich: [
      {
        maGiaoDich: 'MOCK-PAID-001',
        soTien: 500000,
        trangThai: TrangThaiThanhToan.PAID,
      },
      {
        maGiaoDich: 'REFUND-ABCDEF',
        soTien: 50000,
        trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
      },
      {
        maGiaoDich: 'REFUND-FAILED',
        soTien: 10000,
        trangThai: TrangThaiThanhToan.FAILED,
      },
    ],
  };
  const refund = {
    id: '33333333-3333-4333-8333-333333333333',
    thanhToanId: payment.id,
    maGiaoDich: 'REFUND-ABCDEF',
    soTien: 50000,
    phuongThuc: 'MOCK',
    trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
    thoiGian: new Date('2026-09-03T10:30:00.000Z'),
    thanhToan: {
      id: payment.id,
      donHangId: payment.donHangId,
      donHang: payment.donHang,
    },
  };
  const prisma = {
    thanhToan: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([payment]),
    },
    giaoDichThanhToan: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([refund]),
    },
    $transaction: jest.fn(async (items: Promise<unknown>[]) => Promise.all(items)),
  };
  return {
    service: new ThanhToanTaiChinhService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('PHIEN-086 ThanhToanTaiChinhService', () => {
  it('liệt kê payment và chỉ cộng refund thành công', async () => {
    const { service, prisma } = taoHarness();
    const result = await service.layDanhSachThanhToan({
      trang: 1,
      gioiHan: 20,
      trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
      maDonHang: 'FINANCE',
    });

    expect(result.tong).toBe(1);
    expect(result.duLieu[0]?.tongDaHoan).toBe(50000);
    expect(result.duLieu[0]?.maDonHang).toBe('ORDER-FINANCE-001');
    expect(prisma.thanhToan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
        }),
      }),
    );
  });

  it('liệt kê riêng transaction có prefix REFUND-', async () => {
    const { service, prisma } = taoHarness();
    const result = await service.layDanhSachHoanTien({
      trang: 1,
      gioiHan: 20,
      trangThai: TrangThaiThanhToan.PARTIALLY_REFUNDED,
    });

    expect(result.tong).toBe(1);
    expect(result.duLieu[0]?.maGiaoDich).toBe('REFUND-ABCDEF');
    expect(result.duLieu[0]?.soTien).toBe(50000);
    expect(prisma.giaoDichThanhToan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          maGiaoDich: { startsWith: 'REFUND-' },
        }),
      }),
    );
  });
});
