import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';

import { TonKhoService } from './ton-kho.service';

/**
 * Unit test DB-free: TonKhoLoDto phải giữ đúng
 * available = onHand - reserved - blocked (server-side)
 * và mang maTruyXuat của đúng lô (kể cả null).
 */

function taoLotGia(maTruyXuat: string | null) {
  return {
    id: 'lot-001',
    kho: { id: 'kho-001', maKho: 'KHO-01', ten: 'Kho 01', trangThai: 'HOAT_DONG' },
    loSanPham: {
      id: 'lo-001',
      maLo: 'LO-TEST-001',
      maTruyXuat,
      ngayHetHan: new Date('2026-12-31T00:00:00.000Z'),
      trangThai: 'CO_THE_BAN',
    },
    bienTheSanPham: {
      id: 'bien-the-001',
      sku: 'SKU-001',
      khoiLuong: 500,
      donVi: 'gói',
      sanPham: { id: 'san-pham-001', ten: 'Rau muống' },
    },
    onHand: 100,
    reserved: 20,
    blocked: 5,
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    updatedAt: new Date('2026-08-03T00:00:00.000Z'),
  };
}

function taoService(row: ReturnType<typeof taoLotGia> | null) {
  const prismaFake = {
    tonKhoLo: {
      findUnique: async () => row,
    },
  };
  return new TonKhoService(prismaFake as unknown as PrismaService);
}

describe('ton-kho layChiTiet — available + trace code', () => {
  it('available = onHand - reserved - blocked, đúng trace code lô', async () => {
    const service = taoService(taoLotGia('AGM-TRACE-001'));

    const dto = await service.layChiTiet('lot-001');

    expect(dto.onHand).toBe(100);
    expect(dto.reserved).toBe(20);
    expect(dto.blocked).toBe(5);
    expect(dto.available).toBe(75);
    expect(dto.loSanPham.maLo).toBe('LO-TEST-001');
    expect(dto.loSanPham.maTruyXuat).toBe('AGM-TRACE-001');
    expect(dto.kho.maKho).toBe('KHO-01');
    expect(dto.bienThe.sku).toBe('SKU-001');
  });

  it('lô chưa có mã truy xuất → null, không bịa', async () => {
    const service = taoService(taoLotGia(null));

    const dto = await service.layChiTiet('lot-001');

    expect(dto.loSanPham.maTruyXuat).toBeNull();
  });

  it('lot không tồn tại → NotFound', async () => {
    const service = taoService(null);

    await expect(service.layChiTiet('lot-khong-co')).rejects.toThrow(NotFoundException);
  });
});
