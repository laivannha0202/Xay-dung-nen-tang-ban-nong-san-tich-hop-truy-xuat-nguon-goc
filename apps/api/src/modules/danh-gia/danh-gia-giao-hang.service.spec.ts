import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiVanChuyen } from '../../generated/prisma/client';

import { DanhGiaService } from './danh-gia.service';

/**
 * DB-free: review chỉ khi có bằng chứng đã giao —
 * sự kiện DELIVERED persisted hoặc dòng shipment DELIVERED.
 * Tồn tại shipment CREATED/PICKED_UP/... KHÔNG phải đã giao.
 */

const NGAY = (ngayTruoc: number) => new Date(Date.now() - ngayTruoc * 86_400_000);

function vanChuyen(trangThai: TrangThaiVanChuyen, suKienDelivered: Date[] = []) {
  return {
    id: 'vc-1',
    trangThai,
    suKien: suKienDelivered.map((thoiGian) => ({ thoiGian })),
  };
}

function mucCuaKhach(
  vanChuyenList: ReturnType<typeof vanChuyen>[],
  danhGia: { id: string } | null = null,
) {
  return {
    id: 'muc-1',
    sanPhamId: 'sp-1',
    tenSanPhamSnapshot: 'Rau demo',
    skuBienTheSnapshot: 'SKU-DEMO',
    danhGia,
    donHangNhaCungCap: { vanChuyen: vanChuyenList },
  };
}

function taoService(muc: ReturnType<typeof mucCuaKhach> | null) {
  const prismaFake = {
    khachHang: { findFirst: async () => ({ id: 'kh-1' }) },
    mucDonHang: { findFirst: async () => muc },
    danhGia: {
      create: async (args: { data: { diem: number; binhLuan: string | null } }) => ({
        id: 'dg-1',
        mucDonHangId: 'muc-1',
        diem: args.data.diem,
        binhLuan: args.data.binhLuan,
        createdAt: new Date(),
        updatedAt: new Date(),
        mucDonHang: {
          sanPhamId: 'sp-1',
          donHangNhaCungCap: {
            donHang: { khachHang: { nguoiDung: { hoTen: 'Khách Demo' } } },
          },
        },
      }),
    },
  };
  return new DanhGiaService(prismaFake as unknown as PrismaService);
}

describe('danh-gia delivery eligibility', () => {
  it('không shipment → không được đánh giá', async () => {
    const service = taoService(mucCuaKhach([]));

    await expect(service.tao('nd-1', { mucDonHangId: 'muc-1', diem: 5 })).rejects.toThrow(
      BadRequestException,
    );

    const trangThai = await service.layTrangThaiMuc('nd-1', 'muc-1');
    expect(trangThai.daGiao).toBe(false);
    expect(trangThai.coTheDanhGia).toBe(false);
  });

  it.each([
    TrangThaiVanChuyen.CREATED,
    TrangThaiVanChuyen.PICKED_UP,
    TrangThaiVanChuyen.IN_TRANSIT,
    TrangThaiVanChuyen.OUT_FOR_DELIVERY,
    TrangThaiVanChuyen.FAILED,
    TrangThaiVanChuyen.RETURNED,
  ])('shipment %s (không sự kiện DELIVERED) → không được đánh giá', async (trangThai) => {
    const service = taoService(mucCuaKhach([vanChuyen(trangThai)]));

    await expect(service.tao('nd-1', { mucDonHangId: 'muc-1', diem: 5 })).rejects.toThrow(
      BadRequestException,
    );

    const dieuKien = await service.layTrangThaiMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(false);
    expect(dieuKien.coTheDanhGia).toBe(false);
  });

  it('sự kiện DELIVERED trên shipment IN_TRANSIT → được đánh giá', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.IN_TRANSIT, [NGAY(1)])]),
    );

    const dieuKien = await service.layTrangThaiMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheDanhGia).toBe(true);

    const created = await service.tao('nd-1', { mucDonHangId: 'muc-1', diem: 5 });
    expect(created.diem).toBe(5);
  });

  it('dòng shipment DELIVERED (không sự kiện, legacy) → được đánh giá', async () => {
    const service = taoService(mucCuaKhach([vanChuyen(TrangThaiVanChuyen.DELIVERED)]));

    const dieuKien = await service.layTrangThaiMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);

    const created = await service.tao('nd-1', {
      mucDonHangId: 'muc-1',
      diem: 4,
      binhLuan: 'Tốt',
    });
    expect(created.diem).toBe(4);
  });

  it('đã đánh giá rồi → vẫn chặn trùng', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.DELIVERED)], { id: 'dg-cu' }),
    );

    await expect(service.tao('nd-1', { mucDonHangId: 'muc-1', diem: 5 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('mục của khách khác → NotFound (ownership giữ nguyên)', async () => {
    const service = taoService(null);

    await expect(service.tao('nd-1', { mucDonHangId: 'muc-la', diem: 5 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
