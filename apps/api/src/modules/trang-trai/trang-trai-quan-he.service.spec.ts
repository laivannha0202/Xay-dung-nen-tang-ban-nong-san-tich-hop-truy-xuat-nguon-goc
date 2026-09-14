import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { TepTinService } from '../tep-tin/tep-tin.service';

import { TrangTraiService } from './trang-trai.service';

/**
 * Unit test DB-free cho Farm:
 * - farm → supplier thật qua nhaCungCapId
 * - featured noiBatTrangChu/thuTuNoiBat persist thật
 * - ảnh dùng tepTinId persisted, có signed url, không base64/blob
 * - không có rating/followers/certification badge/product count giả
 * - public chỉ HOAT_DONG + chứng nhận DA_XAC_MINH còn hạn
 */

function taoFarmRow() {
  return {
    id: 'farm-001',
    ma: 'FARM-0001',
    ten: 'Trang trại Rau Xanh',
    diaChi: 'Đà Lạt, Lâm Đồng',
    viDo: '11.940400',
    kinhDo: '108.458300',
    dienTichHa: '12.50',
    nhaCungCapId: 'ncc-001',
    noiBatTrangChu: true,
    thuTuNoiBat: 2,
    trangThai: TrangThaiBanGhi.HOAT_DONG,
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-02T00:00:00.000Z'),
    nhaCungCap: { id: 'ncc-001', ma: 'NCC-0001', ten: 'Hợp tác xã Rau Xanh' },
    anh: [
      {
        trangTraiId: 'farm-001',
        tepTinId: 'tep-001',
        thuTu: 0,
        tepTin: { id: 'tep-001', tenGoc: 'vuon.jpg', mimeType: 'image/jpeg' },
      },
    ],
  };
}

function taoService(prismaFake: unknown) {
  const tepTinFake = {
    taoSignedUrlAnhNoiBo: async (id: string) => `https://cdn.local/anh/${id}`,
    layMetadata: async () => ({ mimeType: 'image/jpeg' }),
  };
  return new TrangTraiService(
    prismaFake as unknown as PrismaService,
    tepTinFake as unknown as TepTinService,
  );
}

describe('trang-trai quan hệ farm → supplier', () => {
  it('layChiTiet trả supplier/area/featured/ảnh thật, không field giả', async () => {
    const row = taoFarmRow();
    const service = taoService({
      trangTrai: { findUnique: async () => row },
    });

    const dto = await service.layChiTiet('farm-001');

    expect(dto.ma).toBe('FARM-0001');
    expect(dto.nhaCungCap).toEqual({ id: 'ncc-001', ma: 'NCC-0001', ten: 'Hợp tác xã Rau Xanh' });
    expect(dto.dienTichHa).toBe(12.5);
    expect(dto.noiBatTrangChu).toBe(true);
    expect(dto.thuTuNoiBat).toBe(2);
    expect(dto.soAnh).toBe(1);
    expect(dto.anh[0]!).toMatchObject({
      tepTinId: 'tep-001',
      tenGoc: 'vuon.jpg',
      mimeType: 'image/jpeg',
      thuTu: 0,
      url: 'https://cdn.local/anh/tep-001',
    });
    expect(dto.anh[0]!.url.startsWith('data:')).toBe(false);
    expect(dto.anh[0]!.url.startsWith('blob:')).toBe(false);
    expect(dto).not.toHaveProperty('rating');
    expect(dto).not.toHaveProperty('followers');
    expect(dto).not.toHaveProperty('productCount');
  });

  it('layChiTiet không tồn tại → NotFound', async () => {
    const service = taoService({ trangTrai: { findUnique: async () => null } });

    await expect(service.layChiTiet('khong-co')).rejects.toThrow(NotFoundException);
  });

  it('layDanhSach lọc đúng nhaCungCapId và giữ featured thật', async () => {
    const row = {
      ...taoFarmRow(),
      _count: { anh: 1 },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { anh: _anh, ...rowTomTat } = row;
    let whereDaNhan: unknown;
    const service = taoService({
      $transaction: async (promises: [Promise<unknown>, Promise<unknown>]) => Promise.all(promises),
      trangTrai: {
        findMany: async (args: { where: unknown }) => {
          whereDaNhan = args.where;
          return [rowTomTat];
        },
        count: async () => 1,
      },
    });

    const ketQua = await service.layDanhSach({
      trang: 1,
      gioiHan: 20,
      nhaCungCapId: 'ncc-001',
      trangThai: TrangThaiBanGhi.HOAT_DONG,
    });

    expect(whereDaNhan).toMatchObject({ nhaCungCapId: 'ncc-001' });
    expect(ketQua.duLieu[0]!.noiBatTrangChu).toBe(true);
    expect(ketQua.duLieu[0]!.thuTuNoiBat).toBe(2);
    expect(ketQua.duLieu[0]).not.toHaveProperty('rating');
  });

  it('layDanhSachCongKhai chỉ farm + supplier HOAT_DONG, cert DA_XAC_MINH còn hạn', async () => {
    let whereDaNhan: unknown;
    const service = taoService({
      $transaction: async (promises: [Promise<unknown>, Promise<unknown>]) => Promise.all(promises),
      trangTrai: {
        findMany: async (args: { where: unknown }) => {
          whereDaNhan = args.where;
          return [];
        },
        count: async () => 0,
      },
    });

    await service.layDanhSachCongKhai({ trang: 1, gioiHan: 12 });

    expect(whereDaNhan).toMatchObject({
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
  });

  it.each([TrangThaiBanGhi.HOAT_DONG, TrangThaiBanGhi.NGUNG_HOAT_DONG])(
    'doiTrangThai giữ nguyên enum thật %s khi trùng',
    async (trangThai) => {
      const raw = { ...taoFarmRow(), trangThai };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { nhaCungCap: _ncc, anh: _anh, ...rawSnapshot } = raw;
      const chiTietRow = { ...taoFarmRow(), trangThai };
      const service = taoService({
        nguoiDung: { findUnique: async () => ({ id: 'actor-1', email: 'admin@local' }) },
        trangTrai: {
          findUnique: async (args: unknown) => {
            if (JSON.stringify(args).includes('nhaCungCap')) {
              return chiTietRow;
            }
            return rawSnapshot;
          },
        },
      });
      const dto = await service.doiTrangThai('actor-1', 'farm-001', trangThai, {
        ip: null,
        userAgent: null,
      });

      expect(dto.trangThai).toBe(trangThai);
    },
  );
});
