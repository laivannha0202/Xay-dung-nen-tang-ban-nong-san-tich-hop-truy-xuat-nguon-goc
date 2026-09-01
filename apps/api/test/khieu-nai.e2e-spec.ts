import { BadRequestException, NotFoundException } from '@nestjs/common';

import { LyDoKhieuNai, TrangThaiVanChuyen } from '../src/generated/prisma/client';
import { KhieuNaiService } from '../src/modules/khieu-nai/khieu-nai.service';
import type { PrismaService } from '../src/database/prisma.service';

function taoPrismaMock() {
  return {
    khachHang: {
      findFirst: jest.fn(),
    },
    mucDonHang: {
      findFirst: jest.fn(),
    },
    tepTin: {
      findMany: jest.fn(),
    },
    khieuNai: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function detailFixture() {
  return {
    id: 'complaint-067',
    lyDo: LyDoKhieuNai.HONG,
    moTa: 'Sản phẩm bị hỏng khi nhận.',
    createdAt: new Date('2026-09-01T15:10:00.000Z'),
    updatedAt: new Date('2026-09-01T15:10:00.000Z'),
    mucDonHang: {
      id: 'item-067',
      sanPhamId: 'product-067',
      bienTheSanPhamId: 'variant-067',
      tenSanPhamSnapshot: 'Rau sạch',
      skuBienTheSnapshot: 'RAU-067',
      soLuong: 2,
      donGiaSnapshot: 50000,
      maTrangTraiSnapshot: 'FARM-067',
      tenTrangTraiSnapshot: 'Trang trại 067',
      donHangNhaCungCap: {
        id: 'sub-067',
        maDon: 'SUB-067',
        donHang: { id: 'order-067', maDonHang: 'ORDER-067' },
        nhaCungCap: { ten: 'NCC 067' },
        vanChuyen: [
          {
            id: 'shipment-067',
            maVanDon: 'TRACK-067',
            trangThai: TrangThaiVanChuyen.DELIVERED,
            createdAt: new Date('2026-09-01T14:00:00.000Z'),
            updatedAt: new Date('2026-09-01T14:30:00.000Z'),
          },
        ],
      },
      phanBo: [
        {
          tonKhoLoId: 'inventory-lot-067',
          soLuong: 2,
          tonKhoLo: {
            kho: { maKho: 'KHO-067' },
            loSanPham: { maLo: 'LO-067', maTruyXuat: 'TRACE-067' },
          },
        },
      ],
    },
    bangChung: [
      {
        id: 'evidence-067',
        tepTinId: '11111111-1111-4111-8111-111111111111',
        createdAt: new Date('2026-09-01T15:10:00.000Z'),
        tepTin: { tenGoc: 'anh-hong.jpg', mimeType: 'image/jpeg' },
      },
    ],
  };
}

describe('Complaint Domain PHIEN-067', () => {
  it('exact master reason mapping đủ 7 giá trị', () => {
    expect(Object.values(LyDoKhieuNai)).toEqual([
      'HONG',
      'DAP',
      'SAI',
      'THIEU',
      'HET_HAN',
      'CHAT_LUONG',
      'CHUNG_NHAN',
    ]);
  });

  it('chặn complaint khi order item chưa có Shipment DELIVERED', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-067' });
    prisma.mucDonHang.findFirst.mockResolvedValue({
      id: 'item-067',
      sanPhamId: 'product-067',
      tenSanPhamSnapshot: 'Rau sạch',
      skuBienTheSnapshot: 'RAU-067',
      donHangNhaCungCap: { vanChuyen: [] },
    });
    const service = new KhieuNaiService(prisma as unknown as PrismaService);

    await expect(
      service.tao('user-067', {
        mucDonHangId: '11111111-1111-4111-8111-111111111111',
        lyDo: LyDoKhieuNai.HONG,
        moTa: 'Sản phẩm bị hỏng khi nhận.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.khieuNai.create).not.toHaveBeenCalled();
  });

  it('evidence phải active, thuộc user và là image/video', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-067' });
    prisma.mucDonHang.findFirst.mockResolvedValue({
      id: 'item-067',
      sanPhamId: 'product-067',
      tenSanPhamSnapshot: 'Rau sạch',
      skuBienTheSnapshot: 'RAU-067',
      donHangNhaCungCap: { vanChuyen: [{ id: 'shipment-067' }] },
    });
    prisma.tepTin.findMany.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        mimeType: 'application/pdf',
      },
    ]);
    const service = new KhieuNaiService(prisma as unknown as PrismaService);

    await expect(
      service.tao('user-067', {
        mucDonHangId: '11111111-1111-4111-8111-111111111111',
        lyDo: LyDoKhieuNai.CHAT_LUONG,
        moTa: 'Chất lượng thực tế không đạt như mong đợi.',
        tepTinIds: ['11111111-1111-4111-8111-111111111111'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('tạo complaint + evidence và trả detail từ source-of-truth', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-067' });
    prisma.mucDonHang.findFirst.mockResolvedValue({
      id: 'item-067',
      sanPhamId: 'product-067',
      tenSanPhamSnapshot: 'Rau sạch',
      skuBienTheSnapshot: 'RAU-067',
      donHangNhaCungCap: { vanChuyen: [{ id: 'shipment-067' }] },
    });
    prisma.tepTin.findMany.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        mimeType: 'image/jpeg',
      },
    ]);
    prisma.khieuNai.create.mockResolvedValue({ id: 'complaint-067' });
    prisma.khieuNai.findUnique.mockResolvedValue(detailFixture());
    const service = new KhieuNaiService(prisma as unknown as PrismaService);

    const result = await service.tao('user-067', {
      mucDonHangId: '11111111-1111-4111-8111-111111111111',
      lyDo: LyDoKhieuNai.HONG,
      moTa: 'Sản phẩm bị hỏng khi nhận.',
      tepTinIds: ['11111111-1111-4111-8111-111111111111'],
    });

    expect(prisma.khieuNai.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lyDo: LyDoKhieuNai.HONG,
          bangChung: {
            create: [{ tepTinId: '11111111-1111-4111-8111-111111111111' }],
          },
        }),
      }),
    );
    expect(result.donHang.maDonHang).toBe('ORDER-067');
    expect(result.phanBo[0]?.maLo).toBe('LO-067');
    expect(result.vanChuyen[0]?.trangThai).toBe(TrangThaiVanChuyen.DELIVERED);
    expect(result.bangChung[0]?.mimeType).toBe('image/jpeg');
  });

  it('customer detail không đọc complaint ngoài ownership', async () => {
    const prisma = taoPrismaMock();
    prisma.khachHang.findFirst.mockResolvedValue({ id: 'customer-067' });
    prisma.khieuNai.findFirst.mockResolvedValue(null);
    const service = new KhieuNaiService(prisma as unknown as PrismaService);

    await expect(service.layChiTietCuaToi('user-067', 'complaint-khac')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('admin list dùng pagination/reason filter, không mutate resolution/refund', async () => {
    const prisma = taoPrismaMock();
    prisma.khieuNai.count.mockResolvedValue(1);
    prisma.khieuNai.findMany.mockResolvedValue([
      {
        id: 'complaint-067',
        lyDo: LyDoKhieuNai.SAI,
        createdAt: new Date('2026-09-01T15:10:00.000Z'),
        _count: { bangChung: 0 },
        mucDonHang: {
          tenSanPhamSnapshot: 'Rau sạch',
          donHangNhaCungCap: { donHang: { maDonHang: 'ORDER-067' } },
        },
      },
    ]);
    prisma.$transaction.mockResolvedValue([1, await prisma.khieuNai.findMany()]);
    const service = new KhieuNaiService(prisma as unknown as PrismaService);

    const result = await service.layDanhSachQuanTri({
      trang: 2,
      gioiHan: 10,
      lyDo: LyDoKhieuNai.SAI,
    });
    expect(result.tong).toBe(1);
    expect(result.trang).toBe(2);
    expect(prisma.khieuNai.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: { lyDo: LyDoKhieuNai.SAI },
      }),
    );
  });
});
