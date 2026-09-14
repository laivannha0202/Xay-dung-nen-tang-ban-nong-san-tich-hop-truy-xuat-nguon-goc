import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';

import { ThuHoachService } from './thu-hoach.service';

/**
 * Unit test DB-free: Harvest → Season → Farm là quan hệ thật,
 * số lượng đi kèm đúng đơn vị persisted (không ép kg).
 */

function taoThuHoachGia() {
  return {
    id: 'thu-hoach-001',
    muaVuId: 'mua-vu-001',
    ngayThuHoach: new Date('2026-07-10T00:00:00.000Z'),
    soLuong: 120.5,
    donVi: 'KG',
    phanLoai: 'LOAI_1',
    ghiChu: 'Thu hoạch đợt 1',
    muaVu: {
      id: 'mua-vu-001',
      cayTrong: 'Rau muống',
      giong: 'Giống A',
      ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
      trangThai: 'DANG_CANH_TAC',
      trangTrai: { id: 'farm-001', ma: 'FARM-01', ten: 'Trang trại 01' },
    },
    createdAt: new Date('2026-07-10T01:00:00.000Z'),
    updatedAt: new Date('2026-07-10T01:00:00.000Z'),
  };
}

describe('thu-hoach layChiTiet — Harvest → Season → Farm', () => {
  function taoService(row: ReturnType<typeof taoThuHoachGia> | null) {
    const prismaFake = {
      thuHoach: {
        findUnique: async () => row,
      },
    };
    // ThuHoachService còn phụ thuộc notify/follow services nhưng layChiTiet
    // chỉ dùng prisma nên fake phần còn lại.
    return new ThuHoachService(
      prismaFake as unknown as PrismaService,
      {} as never,
      {} as never,
    );
  }

  it('farm suy qua đúng season, số lượng kèm đúng đơn vị', async () => {
    const service = taoService(taoThuHoachGia());

    const dto = await service.layChiTiet('thu-hoach-001');

    expect(dto.muaVu.trangTrai).toEqual({
      id: 'farm-001',
      ma: 'FARM-01',
      ten: 'Trang trại 01',
    });
    expect(dto.muaVu.cayTrong).toBe('Rau muống');
    expect(dto.muaVu.giong).toBe('Giống A');
    expect(dto.ngayThuHoach).toBe('2026-07-10');
    expect(dto.soLuong).toBe(120.5);
    expect(dto.donVi).toBe('KG');
    expect(dto.phanLoai).toBe('LOAI_1');
  });

  it('thu hoạch không tồn tại → NotFound', async () => {
    const service = taoService(null);

    await expect(service.layChiTiet('thu-hoach-khong-co')).rejects.toThrow(NotFoundException);
  });
});
