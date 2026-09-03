import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { DoiSoatService } from '../src/modules/doi-soat/doi-soat.service';
import { SoDuNhaCungCapService } from '../src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service';

const SUPPLIER_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_A = '33333333-3333-4333-8333-333333333333';
const CATEGORY_B = '44444444-4444-4444-8444-444444444444';

function taoPrismaMock() {
  const tx = {
    $queryRaw: jest.fn(),
    doiSoatNhaCungCap: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    donHangNhaCungCap: {
      findMany: jest.fn(),
    },
    quyTacHoaHong: {
      findMany: jest.fn(),
    },
    nhatKyKiemToan: {
      create: jest.fn(),
    },
  };
  const prisma = {
    nguoiDung: {
      findUnique: jest.fn(),
    },
    doiSoatNhaCungCap: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (arg: Array<Promise<unknown>> | ((client: typeof tx) => Promise<unknown>)) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        return arg(tx);
      },
    ),
  };
  return { prisma, tx };
}

function taoBalanceMock() {
  return {
    congKhaDungTrongGiaoDich: jest.fn(),
  };
}

function taoService() {
  const { prisma, tx } = taoPrismaMock();
  const balance = taoBalanceMock();
  prisma.nguoiDung.findUnique.mockResolvedValue({
    id: ACTOR_ID,
    email: 'admin@example.com',
  });
  tx.$queryRaw.mockResolvedValue([{ id: SUPPLIER_ID }]);
  tx.doiSoatNhaCungCap.findFirst.mockResolvedValue(null);

  return {
    prisma,
    tx,
    balance,
    service: new DoiSoatService(
      prisma as unknown as PrismaService,
      balance as unknown as SoDuNhaCungCapService,
    ),
  };
}

describe('PHIEN-084 DoiSoatService', () => {
  it('tính revenue - commission - refunds - adjustments = payable và credit available', async () => {
    const { service, tx, balance } = taoService();
    const orderCreatedAt = new Date('2026-09-01T00:00:00.000Z');

    tx.donHangNhaCungCap.findMany.mockResolvedValue([
      {
        id: 'order-1',
        maDon: 'SUP-001',
        tamTinh: 1000,
        createdAt: orderCreatedAt,
        muc: [
          {
            soLuong: 2,
            donGiaSnapshot: 300,
            danhMucSanPhamIdSnapshot: CATEGORY_A,
          },
          {
            soLuong: 1,
            donGiaSnapshot: 400,
            danhMucSanPhamIdSnapshot: CATEGORY_B,
          },
        ],
      },
    ]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([
      {
        danhMucSanPhamId: CATEGORY_A,
        tyLe: 10,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        danhMucSanPhamId: CATEGORY_B,
        tyLe: 5,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    tx.doiSoatNhaCungCap.create.mockImplementation(async ({ data }) => ({
      id: '55555555-5555-4555-8555-555555555555',
      ...data,
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
      updatedAt: new Date('2026-09-03T00:00:00.000Z'),
      nhaCungCap: {
        id: SUPPLIER_ID,
        ma: 'NCC-001',
        ten: 'Nhà cung cấp 1',
      },
    }));

    const result = await service.tao(
      ACTOR_ID,
      {
        nhaCungCapId: SUPPLIER_ID,
        batDauLuc: '2026-09-01T00:00:00.000Z',
        ketThucLuc: '2026-09-03T00:00:00.000Z',
        hoanTien: 100,
        dieuChinh: 20,
      },
      { ip: null, userAgent: null },
    );

    expect(result).toMatchObject({
      doanhThu: 1000,
      hoaHong: 80,
      hoanTien: 100,
      dieuChinh: 20,
      phaiTra: 800,
    });
    expect(balance.congKhaDungTrongGiaoDich).toHaveBeenCalledWith(tx, SUPPLIER_ID, 800);
    expect(tx.nhatKyKiemToan.create).toHaveBeenCalled();
  });

  it('chọn commission rule mới nhất có effective_from <= order created_at', async () => {
    const { service, tx } = taoService();

    tx.donHangNhaCungCap.findMany.mockResolvedValue([
      {
        id: 'order-2',
        maDon: 'SUP-002',
        tamTinh: 100,
        createdAt: new Date('2026-06-15T00:00:00.000Z'),
        muc: [
          {
            soLuong: 1,
            donGiaSnapshot: 100,
            danhMucSanPhamIdSnapshot: CATEGORY_A,
          },
        ],
      },
    ]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([
      {
        danhMucSanPhamId: CATEGORY_A,
        tyLe: 5,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        danhMucSanPhamId: CATEGORY_A,
        tyLe: 10,
        hieuLucTu: new Date('2026-06-01T00:00:00.000Z'),
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      {
        danhMucSanPhamId: CATEGORY_A,
        tyLe: 20,
        hieuLucTu: new Date('2026-07-01T00:00:00.000Z'),
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      },
    ]);
    tx.doiSoatNhaCungCap.create.mockImplementation(async ({ data }) => ({
      id: '66666666-6666-4666-8666-666666666666',
      ...data,
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
      updatedAt: new Date('2026-09-03T00:00:00.000Z'),
      nhaCungCap: {
        id: SUPPLIER_ID,
        ma: 'NCC-001',
        ten: 'Nhà cung cấp 1',
      },
    }));

    const result = await service.tao(
      ACTOR_ID,
      {
        nhaCungCapId: SUPPLIER_ID,
        batDauLuc: '2026-06-01T00:00:00.000Z',
        ketThucLuc: '2026-07-01T00:00:00.000Z',
        hoanTien: 0,
        dieuChinh: 0,
      },
      { ip: null, userAgent: null },
    );

    expect(result.hoaHong).toBe(10);
    expect(result.phaiTra).toBe(90);
  });

  it('không tự coi commission là 0 khi thiếu rule', async () => {
    const { service, tx } = taoService();
    tx.donHangNhaCungCap.findMany.mockResolvedValue([
      {
        id: 'order-3',
        maDon: 'SUP-003',
        tamTinh: 100,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        muc: [
          {
            soLuong: 1,
            donGiaSnapshot: 100,
            danhMucSanPhamIdSnapshot: CATEGORY_A,
          },
        ],
      },
    ]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([]);

    await expect(
      service.tao(
        ACTOR_ID,
        {
          nhaCungCapId: SUPPLIER_ID,
          batDauLuc: '2026-09-01T00:00:00.000Z',
          ketThucLuc: '2026-09-03T00:00:00.000Z',
          hoanTien: 0,
          dieuChinh: 0,
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('chặn settlement period chồng lấn', async () => {
    const { service, tx } = taoService();
    tx.doiSoatNhaCungCap.findFirst.mockResolvedValue({
      id: '77777777-7777-4777-8777-777777777777',
    });

    await expect(
      service.tao(
        ACTOR_ID,
        {
          nhaCungCapId: SUPPLIER_ID,
          batDauLuc: '2026-09-01T00:00:00.000Z',
          ketThucLuc: '2026-09-03T00:00:00.000Z',
          hoanTien: 0,
          dieuChinh: 0,
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('chặn payable âm', async () => {
    const { service, tx } = taoService();
    tx.donHangNhaCungCap.findMany.mockResolvedValue([
      {
        id: 'order-4',
        maDon: 'SUP-004',
        tamTinh: 100,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        muc: [
          {
            soLuong: 1,
            donGiaSnapshot: 100,
            danhMucSanPhamIdSnapshot: CATEGORY_A,
          },
        ],
      },
    ]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([
      {
        danhMucSanPhamId: CATEGORY_A,
        tyLe: 20,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    await expect(
      service.tao(
        ACTOR_ID,
        {
          nhaCungCapId: SUPPLIER_ID,
          batDauLuc: '2026-09-01T00:00:00.000Z',
          ketThucLuc: '2026-09-03T00:00:00.000Z',
          hoanTien: 90,
          dieuChinh: 0,
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
