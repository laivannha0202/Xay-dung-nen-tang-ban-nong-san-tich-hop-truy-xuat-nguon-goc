import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiLoSanPham } from '../../generated/prisma/client';

import { LoSanPhamService } from './lo-san-pham.service';

/**
 * Unit test DB-free: LoSanPhamDto phải mang maTruyXuat của đúng lô
 * (cả khi null), kèm provenance ThuHoach → MuaVu → Farm còn nguyên.
 * Admin batch page và public trace resolve cùng một batch qua field này.
 */

function taoLoGia(maTruyXuat: string | null) {
  return {
    id: 'lo-001',
    maLo: 'LO-TEST-001',
    maTruyXuat,
    thuHoach: {
      id: 'thu-hoach-001',
      ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
      soLuong: 100,
      donVi: 'kg',
      phanLoai: 'LOAI_1',
      muaVu: {
        id: 'mua-vu-001',
        cayTrong: 'Rau muống',
        giong: 'Giống A',
        trangThai: 'DANG_CANH_TAC',
        trangTrai: { id: 'farm-001', ma: 'FARM-01', ten: 'Trang trại 01' },
      },
    },
    soLuong: 100,
    conLai: 60,
    phanHangChatLuong: null,
    ngayHetHan: new Date('2026-12-31T00:00:00.000Z'),
    trangThai: TrangThaiLoSanPham.CO_THE_BAN,
    thuHoi: null,
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    updatedAt: new Date('2026-08-03T00:00:00.000Z'),
  };
}

function taoService(row: ReturnType<typeof taoLoGia> | null) {
  const prismaFake = {
    loSanPham: {
      findUnique: async () => row,
    },
  };
  return new LoSanPhamService(prismaFake as unknown as PrismaService);
}

describe('lo-san-pham layChiTiet — maTruyXuat + provenance', () => {
  it('trả đúng maTruyXuat của lô kèm provenance đầy đủ', async () => {
    const service = taoService(taoLoGia('AGM-TRACE-001'));

    const dto = await service.layChiTiet('lo-001');

    expect(dto.maLo).toBe('LO-TEST-001');
    expect(dto.maTruyXuat).toBe('AGM-TRACE-001');
    expect(dto.thuHoach.muaVu.trangTrai.ma).toBe('FARM-01');
    expect(dto.thuHoach.muaVu.cayTrong).toBe('Rau muống');
    expect(dto.trangThai).toBe(TrangThaiLoSanPham.CO_THE_BAN);
  });

  it('lô chưa có mã → null, không bịa trace code', async () => {
    const service = taoService(taoLoGia(null));

    const dto = await service.layChiTiet('lo-001');

    expect(dto.maTruyXuat).toBeNull();
  });

  it('lô không tồn tại → NotFound', async () => {
    const service = taoService(null);

    await expect(service.layChiTiet('lo-khong-co')).rejects.toThrow(NotFoundException);
  });
});
