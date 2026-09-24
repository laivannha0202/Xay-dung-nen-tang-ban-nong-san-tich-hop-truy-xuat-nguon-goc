import { BadRequestException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';

import { FefoService } from './fefo.service';

import type { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';

/**
 * Unit test DB-free cho FEFO reservation ordering.
 *
 * - Thứ tự phân bổ: ngayHetHan asc → maLo asc → maKho asc → createdAt → id.
 * - Chỉ lô bán được, chưa hết hạn, kho hoạt động, onHand > 0.
 * - available = onHand - reserved - blocked; bỏ qua lô hết available;
 *   thiếu hàng → BadRequest (không tự bịa allocation).
 */

const BIEN_THE_ID = 'bien-the-001';

function taoLot(
  id: string,
  overrides: {
    maLo?: string;
    maKho?: string;
    ngayHetHan?: string;
    onHand?: number;
    reserved?: number;
    blocked?: number;
  } = {},
) {
  const {
    maLo = `LO-${id}`,
    maKho = 'KHO-01',
    ngayHetHan = '2099-12-31',
    onHand = 10,
    reserved = 0,
    blocked = 0,
  } = overrides;
  return {
    id,
    khoId: `kho-${maKho}`,
    bienTheSanPhamId: BIEN_THE_ID,
    onHand,
    reserved,
    blocked,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    kho: { maKho, trangThai: 'HOAT_DONG' },
    loSanPham: {
      maLo,
      ngayHetHan: new Date(`${ngayHetHan}T00:00:00.000Z`),
      trangThai: 'CO_THE_BAN',
    },
  };
}

function taoService(lots: ReturnType<typeof taoLot>[]) {
  let findManyArgs: unknown = null;
  const prismaFake = {
    bienTheSanPham: {
      findUnique: async () => ({ id: BIEN_THE_ID }),
    },
    tonKhoLo: {
      findMany: async (args: unknown) => {
        findManyArgs = args;
        return lots;
      },
    },
  };
  return {
    service: new FefoService(
      prismaFake as unknown as PrismaService,
      { layNguongTonKhoToiThieuNgay: async () => 0 } as unknown as CauHinhHeThongService,
    ),
    layFindManyArgs: () => findManyArgs as {
      where: Record<string, unknown>;
      orderBy: unknown;
    },
  };
}

describe('fefo phanBo', () => {
  it('truy vấn đúng hợp đồng FEFO: lọc + orderBy', async () => {
    const { service, layFindManyArgs } = taoService([taoLot('lot-1')]);

    await service.phanBo(BIEN_THE_ID, 2);

    const args = layFindManyArgs();
    expect(args.orderBy).toEqual([
      { loSanPham: { ngayHetHan: 'asc' } },
      { loSanPham: { maLo: 'asc' } },
      { kho: { maKho: 'asc' } },
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
    expect(args.where).toMatchObject({
      bienTheSanPhamId: BIEN_THE_ID,
      onHand: { gt: 0 },
      kho: { trangThai: 'HOAT_DONG' },
      loSanPham: { trangThai: 'CO_THE_BAN' },
    });
  });

  it('chia allocation theo available, bỏ qua lô hết available', async () => {
    const { service } = taoService([
      taoLot('lot-het', { onHand: 5, reserved: 5 }),
      taoLot('lot-a', { maLo: 'LO-A', onHand: 10, reserved: 2, blocked: 1 }),
      taoLot('lot-b', { maLo: 'LO-B', onHand: 10 }),
    ]);

    const result = await service.phanBo(BIEN_THE_ID, 10);

    expect(result.tongSoLuongPhanBo).toBe(10);
    expect(result.phanBo.map((item) => item.maLo)).toEqual(['LO-A', 'LO-B']);
    expect(result.phanBo[0]!.soLuong).toBe(7);
    expect(result.phanBo[1]!.soLuong).toBe(3);
  });

  it('thiếu hàng → BadRequest, không bịa allocation', async () => {
    const { service } = taoService([taoLot('lot-a', { onHand: 3 })]);

    await expect(service.phanBo(BIEN_THE_ID, 10)).rejects.toThrow(BadRequestException);
  });

  it('biến thể không tồn tại → NotFound', async () => {
    const prismaFake = {
      bienTheSanPham: { findUnique: async () => null },
      tonKhoLo: { findMany: async () => [] },
    };
    const service = new FefoService(
      prismaFake as unknown as PrismaService,
      { layNguongTonKhoToiThieuNgay: async () => 0 } as unknown as CauHinhHeThongService,
    );

    await expect(service.phanBo('bien-the-khong-co', 1)).rejects.toThrow(
      'Không tìm thấy biến thể sản phẩm để phân bổ FEFO.',
    );
  });
});
