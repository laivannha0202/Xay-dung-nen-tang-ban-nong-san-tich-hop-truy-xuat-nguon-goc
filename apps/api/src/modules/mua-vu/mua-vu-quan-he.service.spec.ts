import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiMuaVu } from '../../generated/prisma/client';

import { MuaVuService } from './mua-vu.service';

/**
 * Unit test DB-free: Season luôn gắn đúng Farm thật,
 * trạng thái là exact enum backend, ngày ở dạng date-only.
 */

function taoMuaVuGia(trangThai: TrangThaiMuaVu = TrangThaiMuaVu.DANG_CANH_TAC) {
  return {
    id: 'mua-vu-001',
    trangTraiId: 'farm-001',
    cayTrong: 'Rau muống',
    giong: 'Giống A',
    ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
    ngayDuKienThuHoach: new Date('2026-07-15T00:00:00.000Z'),
    sanLuongDuKienKg: 500,
    trangThai,
    trangTrai: { id: 'farm-001', ma: 'FARM-01', ten: 'Trang trại 01' },
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-02T00:00:00.000Z'),
  };
}

function taoService(row: ReturnType<typeof taoMuaVuGia> | null) {
  const prismaFake = {
    muaVu: {
      findUnique: async () => row,
    },
  };
  return new MuaVuService(prismaFake as unknown as PrismaService);
}

describe('mua-vu layChiTiet — Season → Farm', () => {
  it('trả đúng farm, cây trồng, giống, ngày, sản lượng, trạng thái', async () => {
    const service = taoService(taoMuaVuGia());

    const dto = await service.layChiTiet('mua-vu-001');

    expect(dto.trangTrai).toEqual({ id: 'farm-001', ma: 'FARM-01', ten: 'Trang trại 01' });
    expect(dto.cayTrong).toBe('Rau muống');
    expect(dto.giong).toBe('Giống A');
    expect(dto.ngayTrong).toBe('2026-06-01');
    expect(dto.ngayDuKienThuHoach).toBe('2026-07-15');
    expect(dto.sanLuongDuKienKg).toBe(500);
    expect(dto.trangThai).toBe(TrangThaiMuaVu.DANG_CANH_TAC);
  });

  it.each([
    TrangThaiMuaVu.KE_HOACH,
    TrangThaiMuaVu.CHO_THU_HOACH,
    TrangThaiMuaVu.DA_KET_THUC,
    TrangThaiMuaVu.HUY,
  ])('giữ nguyên trạng thái thật %s', async (trangThai) => {
    const service = taoService(taoMuaVuGia(trangThai));

    const dto = await service.layChiTiet('mua-vu-001');

    expect(dto.trangThai).toBe(trangThai);
  });

  it('mùa vụ không tồn tại → NotFound', async () => {
    const service = taoService(null);

    await expect(service.layChiTiet('mua-vu-khong-co')).rejects.toThrow(NotFoundException);
  });
});
