import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { DanhGiaService } from '../src/modules/danh-gia/danh-gia.service';

function taoPrismaMock() {
  return {
    khachHang: { findFirst: jest.fn() },
    mucDonHang: { findFirst: jest.fn() },
    danhGia: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    sanPham: { findFirst: jest.fn() },
  };
}

function mucFixture(options?: { delivered?: boolean; reviewed?: boolean }) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    sanPhamId: '22222222-2222-4222-8222-222222222222',
    tenSanPhamSnapshot: 'Cam PHIEN 065',
    skuBienTheSnapshot: 'CAM-1KG',
    danhGia: options?.reviewed ? { id: 'review-065' } : null,
    donHangNhaCungCap: {
      vanChuyen: options?.delivered === false ? [] : [{ id: 'shipment-delivered' }],
    },
  };
}

function reviewFixture() {
  return {
    id: 'review-065',
    mucDonHangId: '11111111-1111-4111-8111-111111111111',
    diem: 5,
    binhLuan: 'Tươi và đóng gói tốt',
    createdAt: new Date('2026-09-01T14:50:00.000Z'),
    updatedAt: new Date('2026-09-01T14:50:00.000Z'),
    mucDonHang: {
      sanPhamId: '22222222-2222-4222-8222-222222222222',
      donHangNhaCungCap: {
        donHang: {
          khachHang: {
            nguoiDung: { hoTen: 'Khách PHIEN 065' },
          },
        },
      },
    },
  };
}

describe('Review Backend PHIEN-065', () => {
  it('chỉ delivered item mới được đánh giá', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-065' });
    prisma.mucDonHang.findFirst.mockResolvedValue(mucFixture({ delivered: false }));
    const service = new DanhGiaService(prisma as unknown as PrismaService);

    await expect(
      service.tao('user-065', {
        mucDonHangId: '11111111-1111-4111-8111-111111111111',
        diem: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.danhGia.create).not.toHaveBeenCalled();
  });

  it('item DELIVERED của đúng khách tạo review 1 lần và server tự map product/customer', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-065' });
    prisma.mucDonHang.findFirst.mockResolvedValue(mucFixture());
    prisma.danhGia.create.mockResolvedValue(reviewFixture());
    const service = new DanhGiaService(prisma as unknown as PrismaService);

    const result = await service.tao('user-065', {
      mucDonHangId: '11111111-1111-4111-8111-111111111111',
      diem: 5,
      binhLuan: '  Tươi và đóng gói tốt  ',
    });

    expect(prisma.mucDonHang.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          donHangNhaCungCap: { donHang: { khachHangId: 'customer-065' } },
        }),
      }),
    );
    expect(prisma.danhGia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          mucDonHangId: '11111111-1111-4111-8111-111111111111',
          diem: 5,
          binhLuan: 'Tươi và đóng gói tốt',
        },
      }),
    );
    expect(result.sanPhamId).toBe('22222222-2222-4222-8222-222222222222');
    expect(result.nguoiDanhGia).toBe('Khách PHIEN 065');
  });

  it('một review/order item: review đã tồn tại và DB P2002 đều thành Conflict', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-065' });
    prisma.mucDonHang.findFirst.mockResolvedValueOnce(mucFixture({ reviewed: true }));
    const service = new DanhGiaService(prisma as unknown as PrismaService);

    await expect(
      service.tao('user-065', {
        mucDonHangId: '11111111-1111-4111-8111-111111111111',
        diem: 4,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.mucDonHang.findFirst.mockResolvedValueOnce(mucFixture());
    prisma.danhGia.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(
      service.tao('user-065', {
        mucDonHangId: '11111111-1111-4111-8111-111111111111',
        diem: 4,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('không cho truy cập order item không thuộc khách hiện tại', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-065' });
    prisma.mucDonHang.findFirst.mockResolvedValue(null);
    const service = new DanhGiaService(prisma as unknown as PrismaService);

    await expect(
      service.layTrangThaiMuc('user-065', '11111111-1111-4111-8111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('public product review trả average + pagination, không cần auth', async () => {
    const prisma = taoPrismaMock();
    prisma.sanPham.findFirst.mockResolvedValue({ id: 'product-065' });
    prisma.danhGia.count.mockResolvedValue(3);
    prisma.danhGia.aggregate.mockResolvedValue({ _avg: { diem: 4.333333 } });
    prisma.danhGia.findMany.mockResolvedValue([reviewFixture()]);
    const service = new DanhGiaService(prisma as unknown as PrismaService);

    const result = await service.layDanhSachSanPham('product-065', { trang: 2, gioiHan: 10 });
    expect(result.tong).toBe(3);
    expect(result.diemTrungBinh).toBe(4.33);
    expect(result.trang).toBe(2);
    expect(prisma.danhGia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});
