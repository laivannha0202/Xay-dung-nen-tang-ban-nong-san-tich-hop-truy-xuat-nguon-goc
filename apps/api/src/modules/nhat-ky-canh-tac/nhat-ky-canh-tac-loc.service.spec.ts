import type { PrismaService } from '../../database/prisma.service';

import { NhatKyCanhTacService } from './nhat-ky-canh-tac.service';

/**
 * Unit test DB-free: nhật ký canh tác lọc đúng mùa vụ/loại/công khai,
 * giữ nguyên enum sự kiện và cờ hienThiCongKhai (public trace chỉ
 * được thấy bản ghi cố ý công khai).
 */

function taoRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    muaVuId: 'mua-vu-001',
    loaiSuKien: 'BON_PHAN',
    thoiGian: new Date('2026-06-10T08:00:00.000Z'),
    noiDung: 'Bón phân đợt 1',
    hienThiCongKhai: false,
    muaVu: {
      id: 'mua-vu-001',
      cayTrong: 'Rau muống',
      giong: 'Giống A',
      trangThai: 'DANG_CANH_TAC',
      trangTrai: { id: 'farm-001', ma: 'FARM-01', ten: 'Trang trại 01' },
    },
    createdAt: new Date('2026-06-10T08:05:00.000Z'),
    updatedAt: new Date('2026-06-10T08:05:00.000Z'),
    ...overrides,
  };
}

function taoService(rows: ReturnType<typeof taoRow>[]) {
  let findManyArgs: unknown = null;
  const prismaFake = {
    nhatKyCanhTac: {
      findMany: async (args: unknown) => {
        findManyArgs = args;
        return rows;
      },
      count: async () => rows.length,
    },
    $transaction: async (items: Promise<unknown>[]) => Promise.all(items),
  };
  return {
    service: new NhatKyCanhTacService(prismaFake as unknown as PrismaService),
    layFindManyArgs: () => findManyArgs as { where: Record<string, unknown>; orderBy: unknown },
  };
}

describe('nhat-ky-canh-tac layDanhSach — lọc + công khai', () => {
  it('đẩy đúng filter muaVuId/loaiSuKien/hienThiCongKhai xuống where', async () => {
    const { service, layFindManyArgs } = taoService([taoRow('nk-001')]);

    await service.layDanhSach({
      trang: 1,
      gioiHan: 20,
      muaVuId: 'mua-vu-001',
      loaiSuKien: 'BON_PHAN',
      hienThiCongKhai: true,
    } as never);

    const args = layFindManyArgs();
    expect(args.where).toMatchObject({
      muaVuId: 'mua-vu-001',
      loaiSuKien: 'BON_PHAN',
      hienThiCongKhai: true,
    });
    expect(args.orderBy).toEqual([{ thoiGian: 'desc' }, { createdAt: 'desc' }]);
  });

  it('giữ nguyên enum sự kiện, cờ công khai và quan hệ mùa vụ/farm', async () => {
    const { service } = taoService([
      taoRow('nk-001', { loaiSuKien: 'TUOI', hienThiCongKhai: true, noiDung: 'Tưới sáng' }),
      taoRow('nk-002', { loaiSuKien: 'KHAC', hienThiCongKhai: false }),
    ]);

    const result = await service.layDanhSach({ trang: 1, gioiHan: 20 } as never);

    expect(result.tong).toBe(2);
    expect(result.duLieu[0]).toMatchObject({
      loaiSuKien: 'TUOI',
      hienThiCongKhai: true,
      noiDung: 'Tưới sáng',
    });
    expect(result.duLieu[0]!.muaVu.trangTrai.ma).toBe('FARM-01');
    expect(result.duLieu[1]).toMatchObject({ loaiSuKien: 'KHAC', hienThiCongKhai: false });
  });
});
