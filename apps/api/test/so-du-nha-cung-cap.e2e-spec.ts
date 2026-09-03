import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { SoDuNhaCungCapService } from '../src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service';

function taoPrismaMock() {
  const nhaCungCap = {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  return {
    nhaCungCap,
    $transaction: jest.fn((items: Array<Promise<unknown>>) => Promise.all(items)),
  };
}

describe('PHIEN-083 SoDuNhaCungCapService', () => {
  it('trả 0 cho đủ bốn bucket khi supplier chưa có seller_balance row', async () => {
    const prisma = taoPrismaMock();
    prisma.nhaCungCap.findUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      ma: 'NCC-001',
      ten: 'Nhà cung cấp 1',
      soDu: null,
    });
    const service = new SoDuNhaCungCapService(prisma as unknown as PrismaService);

    await expect(
      service.layTheoNhaCungCap('11111111-1111-4111-8111-111111111111'),
    ).resolves.toEqual({
      nhaCungCapId: '11111111-1111-4111-8111-111111111111',
      maNhaCungCap: 'NCC-001',
      tenNhaCungCap: 'Nhà cung cấp 1',
      dangCho: 0,
      khaDung: 0,
      tamGiu: 0,
      daThanhToan: 0,
    });
  });

  it('map Decimal chính xác sang pending/available/withheld/paid API buckets', async () => {
    const prisma = taoPrismaMock();
    prisma.nhaCungCap.findUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      ma: 'NCC-002',
      ten: 'Nhà cung cấp 2',
      soDu: {
        dangCho: 1250.5,
        khaDung: 800.25,
        tamGiu: 100,
        daThanhToan: 350.25,
      },
    });
    const service = new SoDuNhaCungCapService(prisma as unknown as PrismaService);

    const result = await service.layTheoNhaCungCap('22222222-2222-4222-8222-222222222222');

    expect(result).toMatchObject({
      dangCho: 1250.5,
      khaDung: 800.25,
      tamGiu: 100,
      daThanhToan: 350.25,
    });
  });

  it('list paginate trên supplier và vẫn zero-project row thiếu balance', async () => {
    const prisma = taoPrismaMock();
    prisma.nhaCungCap.count.mockResolvedValue(2);
    prisma.nhaCungCap.findMany.mockResolvedValue([
      {
        id: '33333333-3333-4333-8333-333333333333',
        ma: 'NCC-003',
        ten: 'A',
        soDu: null,
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        ma: 'NCC-004',
        ten: 'B',
        soDu: {
          dangCho: 10,
          khaDung: 20,
          tamGiu: 30,
          daThanhToan: 40,
        },
      },
    ]);
    const service = new SoDuNhaCungCapService(prisma as unknown as PrismaService);

    const result = await service.layDanhSach({
      trang: 1,
      gioiHan: 20,
    });

    expect(result.tong).toBe(2);
    expect(result.duLieu).toHaveLength(2);
    expect(result.duLieu[0]).toMatchObject({
      dangCho: 0,
      khaDung: 0,
      tamGiu: 0,
      daThanhToan: 0,
    });
    expect(result.duLieu[1]).toMatchObject({
      dangCho: 10,
      khaDung: 20,
      tamGiu: 30,
      daThanhToan: 40,
    });
  });

  it('detail báo not found nếu supplier không tồn tại', async () => {
    const prisma = taoPrismaMock();
    prisma.nhaCungCap.findUnique.mockResolvedValue(null);
    const service = new SoDuNhaCungCapService(prisma as unknown as PrismaService);

    await expect(
      service.layTheoNhaCungCap('55555555-5555-4555-8555-555555555555'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
