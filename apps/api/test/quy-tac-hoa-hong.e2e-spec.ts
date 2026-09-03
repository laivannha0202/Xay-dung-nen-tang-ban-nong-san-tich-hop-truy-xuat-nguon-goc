import { BadRequestException } from '@nestjs/common';

import type { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';
import { QuyTacHoaHongService } from '../src/modules/quy-tac-hoa-hong/quy-tac-hoa-hong.service';

function fixture(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    tyLe: 8.5,
    danhMucSanPhamId: '22222222-2222-4222-8222-222222222222',
    nhaCungCapId: '33333333-3333-4333-8333-333333333333',
    hieuLucTu: new Date('2026-09-10T00:00:00.000Z'),
    createdAt: new Date('2026-09-03T13:00:00.000Z'),
    updatedAt: new Date('2026-09-03T13:00:00.000Z'),
    danhMucSanPham: {
      id: '22222222-2222-4222-8222-222222222222',
      ten: 'Rau củ',
    },
    nhaCungCap: {
      id: '33333333-3333-4333-8333-333333333333',
      ten: 'NCC 082',
    },
    ...overrides,
  };
}

function taoPrismaMock() {
  const prisma = {
    nguoiDung: {
      findUnique: jest.fn(),
    },
    danhMucSanPham: {
      findUnique: jest.fn(),
    },
    nhaCungCap: {
      findUnique: jest.fn(),
    },
    quyTacHoaHong: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    nhatKyKiemToan: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(async (value: unknown) => {
    if (typeof value === 'function') {
      return (value as (tx: typeof prisma) => Promise<unknown>)(prisma);
    }
    return Promise.all(value as Array<Promise<unknown>>);
  });

  return prisma;
}

function mockFoundation(prisma: ReturnType<typeof taoPrismaMock>) {
  prisma.nguoiDung.findUnique.mockResolvedValue({ id: 'admin-082', email: 'admin@agrimarket.vn' });
  prisma.danhMucSanPham.findUnique.mockResolvedValue({
    id: '22222222-2222-4222-8222-222222222222',
    trangThai: TrangThaiBanGhi.HOAT_DONG,
  });
  prisma.nhaCungCap.findUnique.mockResolvedValue({
    id: '33333333-3333-4333-8333-333333333333',
    trangThai: TrangThaiBanGhi.HOAT_DONG,
  });
}

describe('Commission Rules PHIEN-082', () => {
  it('tạo rule percentage/category/supplier/effective date và ghi audit', async () => {
    const prisma = taoPrismaMock();
    mockFoundation(prisma);
    prisma.quyTacHoaHong.findFirst.mockResolvedValue(null);
    prisma.quyTacHoaHong.create.mockResolvedValue(fixture());
    prisma.nhatKyKiemToan.create.mockResolvedValue({ id: 'audit-082' });
    const service = new QuyTacHoaHongService(prisma as unknown as PrismaService);

    const result = await service.tao(
      'admin-082',
      {
        tyLe: 8.5,
        danhMucSanPhamId: '22222222-2222-4222-8222-222222222222',
        nhaCungCapId: '33333333-3333-4333-8333-333333333333',
        hieuLucTu: '2026-09-10T00:00:00.000Z',
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.tyLe).toBe(8.5);
    expect(result.tenDanhMucSanPham).toBe('Rau củ');
    expect(result.tenNhaCungCap).toBe('NCC 082');
    expect(prisma.nhatKyKiemToan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hanhDong: 'QUY_TAC_HOA_HONG_TAO',
          thucThe: 'commission_rule',
        }),
      }),
    );
  });

  it('chặn trùng supplier + category + effective date', async () => {
    const prisma = taoPrismaMock();
    mockFoundation(prisma);
    prisma.quyTacHoaHong.findFirst.mockResolvedValue({ id: 'existing-082' });
    const service = new QuyTacHoaHongService(prisma as unknown as PrismaService);

    await expect(
      service.tao(
        'admin-082',
        {
          tyLe: 10,
          danhMucSanPhamId: '22222222-2222-4222-8222-222222222222',
          nhaCungCapId: '33333333-3333-4333-8333-333333333333',
          hieuLucTu: '2026-09-10T00:00:00.000Z',
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.quyTacHoaHong.create).not.toHaveBeenCalled();
  });

  it('resolver lấy rule mới nhất đã có hiệu lực cho exact supplier/category', async () => {
    const prisma = taoPrismaMock();
    prisma.quyTacHoaHong.findFirst.mockResolvedValue(
      fixture({ hieuLucTu: new Date('2026-09-05T00:00:00.000Z'), tyLe: 9.25 }),
    );
    const service = new QuyTacHoaHongService(prisma as unknown as PrismaService);
    const at = new Date('2026-09-06T00:00:00.000Z');

    const result = await service.layQuyTacApDung(
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
      at,
    );

    expect(result?.tyLe).toBe(9.25);
    expect(prisma.quyTacHoaHong.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          nhaCungCapId: '33333333-3333-4333-8333-333333333333',
          danhMucSanPhamId: '22222222-2222-4222-8222-222222222222',
          hieuLucTu: { lte: at },
        },
        orderBy: [{ hieuLucTu: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  });

  it('không cho sửa rule đã có hiệu lực', async () => {
    const prisma = taoPrismaMock();
    mockFoundation(prisma);
    prisma.quyTacHoaHong.findUnique.mockResolvedValue(
      fixture({ hieuLucTu: new Date('2020-01-01T00:00:00.000Z') }),
    );
    const service = new QuyTacHoaHongService(prisma as unknown as PrismaService);

    await expect(
      service.capNhat(
        'admin-082',
        '11111111-1111-4111-8111-111111111111',
        {
          tyLe: 7,
          danhMucSanPhamId: '22222222-2222-4222-8222-222222222222',
          nhaCungCapId: '33333333-3333-4333-8333-333333333333',
          hieuLucTu: '2026-09-20T00:00:00.000Z',
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.quyTacHoaHong.update).not.toHaveBeenCalled();
  });

  it('list pagination trả DTO có tên supplier/category', async () => {
    const prisma = taoPrismaMock();
    prisma.quyTacHoaHong.count.mockResolvedValue(1);
    prisma.quyTacHoaHong.findMany.mockResolvedValue([fixture()]);
    const service = new QuyTacHoaHongService(prisma as unknown as PrismaService);

    const result = await service.layDanhSach({ trang: 1, gioiHan: 20 });

    expect(result.tong).toBe(1);
    expect(result.duLieu[0]?.tenNhaCungCap).toBe('NCC 082');
    expect(result.duLieu[0]?.tenDanhMucSanPham).toBe('Rau củ');
  });
});
