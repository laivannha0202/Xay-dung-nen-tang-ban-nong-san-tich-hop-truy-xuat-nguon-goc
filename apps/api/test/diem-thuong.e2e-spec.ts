import { ForbiddenException } from '@nestjs/common';

import type { PrismaService } from '../src/database/prisma.service';
import { DiemThuongService } from '../src/modules/diem-thuong/diem-thuong.service';

function taoPrismaMock() {
  return {
    khachHang: {
      findFirst: jest.fn(),
    },
    taiKhoanLoyalty: {
      findUnique: jest.fn(),
    },
    giaoDichLoyalty: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function taoService(prisma: ReturnType<typeof taoPrismaMock>) {
  return new DiemThuongService(prisma as unknown as PrismaService);
}

describe('Customer loyalty read model', () => {
  it('trả đúng số dư và tổng giao dịch từ loyalty account', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-loyalty' });
    prisma.taiKhoanLoyalty.findUnique.mockResolvedValue({
      diem: 125,
      updatedAt: new Date('2026-09-10T10:00:00.000Z'),
      _count: { giaoDich: 3 },
    });

    const result = await taoService(prisma).layTongQuan('user-loyalty');

    expect(result.diem).toBe(125);
    expect(result.tongGiaoDich).toBe(3);
    expect(result.capNhatLuc).toEqual(new Date('2026-09-10T10:00:00.000Z'));
  });

  it('khách chưa có loyalty account vẫn nhận số dư 0 thay vì lỗi', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-no-loyalty' });
    prisma.taiKhoanLoyalty.findUnique.mockResolvedValue(null);

    await expect(taoService(prisma).layTongQuan('user-no-loyalty')).resolves.toEqual({
      diem: 0,
      tongGiaoDich: 0,
      capNhatLuc: null,
    });
  });

  it('lịch sử điểm phân trang và sắp xếp mới nhất trước', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-ledger' });
    prisma.taiKhoanLoyalty.findUnique.mockResolvedValue({ id: 'loyalty-account' });
    prisma.giaoDichLoyalty.count.mockResolvedValue(12);
    prisma.giaoDichLoyalty.findMany.mockResolvedValue([
      {
        id: 'tx-1',
        bienDongDiem: 20,
        soDuSau: 120,
        lyDo: 'Ghi nhận điểm',
        createdAt: new Date('2026-09-10T09:00:00.000Z'),
      },
    ]);
    prisma.$transaction.mockResolvedValue([12, await prisma.giaoDichLoyalty.findMany()]);

    const result = await taoService(prisma).layGiaoDich('user-ledger', {
      trang: 2,
      gioiHan: 5,
    });

    expect(result.tong).toBe(12);
    expect(result.trang).toBe(2);
    expect(result.gioiHan).toBe(5);
    expect(result.items[0]?.soDuSau).toBe(120);
    expect(prisma.giaoDichLoyalty.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { loyaltyAccountId: 'loyalty-account' },
        skip: 5,
        take: 5,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('không cho tài khoản ngoài customer hoạt động đọc điểm', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue(null);

    await expect(taoService(prisma).layTongQuan('user-khac')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
