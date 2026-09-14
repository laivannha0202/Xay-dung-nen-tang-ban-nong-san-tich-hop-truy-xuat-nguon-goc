import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiVanChuyen } from '../../generated/prisma/client';
import type { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import type { TepTinService } from '../tep-tin/tep-tin.service';

import { KhieuNaiService } from './khieu-nai.service';

/**
 * DB-free: khiếu nại chỉ từ THỜI ĐIỂM GIAO THỰC TẾ —
 * sự kiện DELIVERED mới nhất, hoặc updatedAt CHỈ khi shipment DELIVERED.
 * updatedAt của shipment chưa giao KHÔNG được mở cửa sổ khiếu nại.
 */

const NGAY = (ngayTruoc: number) => new Date(Date.now() - ngayTruoc * 86_400_000);

function vanChuyen(
  trangThai: TrangThaiVanChuyen,
  suKienDelivered: Date[] = [],
  updatedAt: Date = NGAY(0),
) {
  return {
    id: 'vc-1',
    trangThai,
    updatedAt,
    suKien: suKienDelivered.map((thoiGian) => ({ thoiGian })),
  };
}

function mucCuaKhach(vanChuyenList: ReturnType<typeof vanChuyen>[]) {
  return {
    id: 'muc-1',
    sanPhamId: 'sp-1',
    tenSanPhamSnapshot: 'Rau demo',
    skuBienTheSnapshot: 'SKU-DEMO',
    donHangNhaCungCap: { vanChuyen: vanChuyenList },
  };
}

function khieuNaiDayDu() {
  const now = new Date();
  return {
    id: 'kn-1',
    lyDo: 'HONG',
    moTa: 'Héo một ít (demo)',
    createdAt: now,
    updatedAt: now,
    mucDonHang: {
      id: 'muc-1',
      sanPhamId: 'sp-1',
      bienTheSanPhamId: 'bt-1',
      tenSanPhamSnapshot: 'Rau demo',
      skuBienTheSnapshot: 'SKU-DEMO',
      soLuong: 2,
      donGiaSnapshot: '25000',
      maTrangTraiSnapshot: 'TT-01',
      tenTrangTraiSnapshot: 'Farm 01',
      phanBo: [],
      donHangNhaCungCap: {
        id: 'sub-1',
        maDon: 'SUB-01',
        donHang: { id: 'dh-1', maDonHang: 'ORD-01' },
        nhaCungCap: { ten: 'NCC Demo' },
        phanBo: [],
        vanChuyen: [
          {
            id: 'vc-1',
            maVanDon: 'VD-01',
            trangThai: TrangThaiVanChuyen.DELIVERED,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    },
    bangChung: [],
  };
}

function taoService(muc: ReturnType<typeof mucCuaKhach> | null) {
  const prismaFake = {
    khachHang: { findFirst: async () => ({ id: 'kh-1' }) },
    mucDonHang: { findFirst: async () => muc },
    khieuNai: {
      create: async () => ({ id: 'kn-1' }),
      findUnique: async () => khieuNaiDayDu(),
    },
  };
  const cauHinhFake = {
    layThoiHanKhieuNaiNgay: async () => 7,
  };
  return new KhieuNaiService(
    prismaFake as unknown as PrismaService,
    cauHinhFake as unknown as CauHinhHeThongService,
    {} as unknown as TepTinService,
  );
}

const DTO = { mucDonHangId: 'muc-1', lyDo: 'HONG' as const, moTa: 'Héo một ít trong lúc giao.' };

describe('khieu-nai delivery eligibility', () => {
  it('không shipment → không được khiếu nại', async () => {
    const service = taoService(mucCuaKhach([]));

    await expect(service.tao('nd-1', DTO)).rejects.toThrow(BadRequestException);

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(false);
    expect(dieuKien.coTheKhieuNai).toBe(false);
  });

  it.each([
    TrangThaiVanChuyen.CREATED,
    TrangThaiVanChuyen.PICKED_UP,
    TrangThaiVanChuyen.IN_TRANSIT,
    TrangThaiVanChuyen.OUT_FOR_DELIVERY,
    TrangThaiVanChuyen.FAILED,
    TrangThaiVanChuyen.RETURNED,
  ])('shipment %s với updatedAt MỚI → vẫn không mở cửa sổ khiếu nại', async (trangThai) => {
    const service = taoService(mucCuaKhach([vanChuyen(trangThai, [], NGAY(0))]));

    await expect(service.tao('nd-1', DTO)).rejects.toThrow(BadRequestException);

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(false);
    expect(dieuKien.coTheKhieuNai).toBe(false);
  });

  it('DELIVERED trong hạn (2 ngày) → được khiếu nại', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.DELIVERED, [NGAY(2)], NGAY(2))]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);
    expect(dieuKien.lyDo).toBeNull();

    const created = await service.tao('nd-1', DTO);
    expect(created.id).toBe('kn-1');
  });

  it('DELIVERED quá hạn (10 ngày > 7) → từ chối', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.DELIVERED, [NGAY(10)], NGAY(10))]),
    );

    await expect(service.tao('nd-1', DTO)).rejects.toThrow(/quá thời hạn/);

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(false);
  });

  it('dòng DELIVERED không sự kiện (legacy) → dùng updatedAt', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.DELIVERED, [], NGAY(1))]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);
  });

  it('sự kiện DELIVERED mới nhất quyết định, không phải updatedAt cũ', async () => {
    const service = taoService(
      mucCuaKhach([vanChuyen(TrangThaiVanChuyen.OUT_FOR_DELIVERY, [NGAY(1)], NGAY(20))]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);
  });

  it('mục của khách khác → NotFound (ownership giữ nguyên)', async () => {
    const service = taoService(null);

    await expect(service.tao('nd-1', DTO)).rejects.toThrow(NotFoundException);
  });

  it('A. shipment cũ DELIVERED + shipment mới CREATED → vẫn đã giao', async () => {
    const service = taoService(
      mucCuaKhach([
        vanChuyen(TrangThaiVanChuyen.CREATED, [], NGAY(0)),
        vanChuyen(TrangThaiVanChuyen.DELIVERED, [], NGAY(5)),
      ]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);

    const created = await service.tao('nd-1', DTO);
    expect(created.id).toBe('kn-1');
  });

  it('B. shipment cũ có sự kiện DELIVERED + shipment mới IN_TRANSIT → vẫn đã giao', async () => {
    const service = taoService(
      mucCuaKhach([
        vanChuyen(TrangThaiVanChuyen.IN_TRANSIT, [], NGAY(0)),
        vanChuyen(TrangThaiVanChuyen.IN_TRANSIT, [NGAY(3)], NGAY(5)),
      ]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);

    const created = await service.tao('nd-1', DTO);
    expect(created.id).toBe('kn-1');
  });

  it('C. nhiều shipment đã giao → cửa sổ khiếu nại theo DELIVERED mới nhất', async () => {
    const service = taoService(
      mucCuaKhach([
        vanChuyen(TrangThaiVanChuyen.DELIVERED, [NGAY(1)], NGAY(1)),
        vanChuyen(TrangThaiVanChuyen.DELIVERED, [NGAY(10)], NGAY(10)),
      ]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);

    const created = await service.tao('nd-1', DTO);
    expect(created.id).toBe('kn-1');
  });

  it('C2. nhiều shipment DELIVERED legacy → lấy updatedAt mới nhất', async () => {
    const service = taoService(
      mucCuaKhach([
        vanChuyen(TrangThaiVanChuyen.DELIVERED, [], NGAY(10)),
        vanChuyen(TrangThaiVanChuyen.DELIVERED, [], NGAY(1)),
      ]),
    );

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(true);
    expect(dieuKien.coTheKhieuNai).toBe(true);
  });

  it('D. nhiều shipment nhưng không cái nào giao → chưa giao', async () => {
    const service = taoService(
      mucCuaKhach([
        vanChuyen(TrangThaiVanChuyen.CREATED, [], NGAY(0)),
        vanChuyen(TrangThaiVanChuyen.IN_TRANSIT, [], NGAY(0)),
      ]),
    );

    await expect(service.tao('nd-1', DTO)).rejects.toThrow(BadRequestException);

    const dieuKien = await service.layDieuKienMuc('nd-1', 'muc-1');
    expect(dieuKien.daGiao).toBe(false);
    expect(dieuKien.coTheKhieuNai).toBe(false);
  });
});
