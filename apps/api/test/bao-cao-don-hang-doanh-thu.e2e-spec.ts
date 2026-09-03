import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiThanhToan } from '../src/generated/prisma/client';
import { BaoCaoDonHangDoanhThuService } from '../src/modules/bao-cao-don-hang-doanh-thu/bao-cao-don-hang-doanh-thu.service';

describe('PHIEN-090 BaoCaoDonHangDoanhThuService', () => {
  const prisma = {
    mucDonHang: { findMany: jest.fn() },
    danhMucSanPham: { findMany: jest.fn() },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
  };
  let service: BaoCaoDonHangDoanhThuService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BaoCaoDonHangDoanhThuService(prisma as unknown as PrismaService);
  });

  it('lọc ngày/farm/category trên snapshot và tính gross revenue của paid orders', async () => {
    prisma.mucDonHang.findMany
      .mockResolvedValueOnce([
        {
          soLuong: 2,
          donGiaSnapshot: 100000,
          donHangNhaCungCap: { donHangId: 'order-1' },
        },
        {
          soLuong: 1,
          donGiaSnapshot: 50000,
          donHangNhaCungCap: { donHangId: 'order-1' },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'item-1',
          sanPhamId: 'product-1',
          danhMucSanPhamIdSnapshot: 'category-1',
          trangTraiId: 'farm-1',
          soLuong: 2,
          donGiaSnapshot: 100000,
          tenSanPhamSnapshot: 'Rau sạch',
          skuBienTheSnapshot: 'RAU-1',
          maTrangTraiSnapshot: 'FARM-01',
          tenTrangTraiSnapshot: 'Trang trại A',
          donHangNhaCungCap: {
            id: 'supplier-order-1',
            maDon: 'SO-001',
            trangThai: TrangThaiDonHang.HOAN_THANH,
            donHang: {
              id: 'order-1',
              maDonHang: 'ORD-001',
              trangThai: TrangThaiDonHang.HOAN_THANH,
              createdAt: new Date('2026-09-03T05:00:00.000Z'),
            },
            nhaCungCap: { id: 'supplier-1', ma: 'NCC-01', ten: 'NCC A' },
          },
        },
      ]);
    prisma.danhMucSanPham.findMany.mockResolvedValue([{ id: 'category-1', ten: 'Rau củ' }]);

    const result = await service.layBaoCao({
      trang: 1,
      gioiHan: 20,
      tuNgay: '2026-09-01',
      denNgay: '2026-09-03',
      trangTraiId: 'farm-1',
      danhMucSanPhamId: 'category-1',
    });

    expect(result.tongDonHang).toBe(1);
    expect(result.tongMuc).toBe(2);
    expect(result.tongSoLuong).toBe(3);
    expect(result.doanhThuGop).toBe(250000);
    expect(result.duLieu[0]).toMatchObject({
      maDonHang: 'ORD-001',
      maTrangTrai: 'FARM-01',
      danhMucSanPhamId: 'category-1',
      tenDanhMucSanPham: 'Rau củ',
      doanhThuGop: 200000,
    });

    const where = prisma.mucDonHang.findMany.mock.calls[0][0].where;
    expect(where.trangTraiId).toBe('farm-1');
    expect(where.danhMucSanPhamIdSnapshot).toBe('category-1');
    expect(where.donHangNhaCungCap.donHang.createdAt.gte).toEqual(
      new Date('2026-09-01T00:00:00.000Z'),
    );
    expect(where.donHangNhaCungCap.donHang.createdAt.lt).toEqual(
      new Date('2026-09-04T00:00:00.000Z'),
    );
    expect(where.donHangNhaCungCap.donHang.thanhToan.some.trangThai.in).toEqual([
      TrangThaiThanhToan.PAID,
      TrangThaiThanhToan.PARTIALLY_REFUNDED,
      TrangThaiThanhToan.REFUNDED,
    ]);
  });

  it('từ chối date range đảo ngược trước khi query DB', async () => {
    await expect(
      service.layBaoCao({ trang: 1, gioiHan: 20, tuNgay: '2026-09-10', denNgay: '2026-09-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.mucDonHang.findMany).not.toHaveBeenCalled();
  });
});
