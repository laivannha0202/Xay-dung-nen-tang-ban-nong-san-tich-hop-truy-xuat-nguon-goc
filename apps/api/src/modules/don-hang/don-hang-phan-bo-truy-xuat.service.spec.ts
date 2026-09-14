import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiDonHang } from '../../generated/prisma/client';

import { DonHangService } from './don-hang.service';

/**
 * Unit test DB-free cho exact batch traceability của Customer Order Detail.
 *
 * layChiTietCuaToi() phải trả về persisted allocations
 * (MucDonHang → PhanBoDonHang → TonKhoLo → LoSanPham) theo dạng
 * customer-safe { maLo, maTruyXuat, soLuong } — không internal ID kho,
 * không suy latest batch, không bịa mã khi null.
 */

const NGUOI_DUNG_ID = 'nguoi-dung-001';
const KHACH_HANG_ID = 'khach-hang-001';

type PhanBoGia = {
  maLo: string;
  maTruyXuat: string | null;
  soLuong: number;
};

function taoMucGia(id: string, phanBo: PhanBoGia[] = []) {
  return {
    id,
    sanPhamId: 'san-pham-001',
    bienTheSanPhamId: 'bien-the-001',
    tenSanPhamSnapshot: 'Rau muống',
    skuBienTheSnapshot: 'RAU-MUONG-500G',
    soLuong: 2,
    donGiaSnapshot: 25000,
    khoiLuongBienTheSnapshot: 500,
    donViBienTheSnapshot: 'gói',
    maTrangTraiSnapshot: 'FARM-01',
    tenTrangTraiSnapshot: 'Trang trại 01',
    phanBo: phanBo.map((allocation, index) => ({
      tonKhoLoId: `ton-kho-lo-${index}`,
      soLuong: allocation.soLuong,
      createdAt: new Date(`2026-09-01T10:0${index}:00.000Z`),
      tonKhoLo: {
        loSanPham: {
          maLo: allocation.maLo,
          maTruyXuat: allocation.maTruyXuat,
        },
      },
    })),
  };
}

function taoDonHangGia(muc: ReturnType<typeof taoMucGia>[]) {
  return {
    id: 'don-hang-001',
    maDonHang: 'ORD-001',
    khachHangId: KHACH_HANG_ID,
    trangThai: TrangThaiDonHang.DA_GIAO,
    tongTien: 50000,
    tamTinhHangHoa: 50000,
    phiVanChuyen: 0,
    maKhuyenMaiSnapshot: null,
    giamKhuyenMai: 0,
    diemDaDung: 0,
    giaTriDiemDaDung: 0,
    diaChiGiaoHangId: null,
    tenNguoiNhanSnapshot: null,
    soDienThoaiSnapshot: null,
    diaChiGiaoHangSnapshot: null,
    createdAt: new Date('2026-09-01T09:00:00.000Z'),
    updatedAt: new Date('2026-09-02T09:00:00.000Z'),
    donNhaCungCap: [
      {
        id: 'suborder-001',
        maDon: 'ORD-001-01',
        nhaCungCapId: 'ncc-001',
        nhaCungCap: { ten: 'Nhà cung cấp 01' },
        trangThai: TrangThaiDonHang.DA_GIAO,
        tamTinh: 50000,
        muc,
      },
    ],
    thanhToan: [],
  };
}

function taoService(donHang: ReturnType<typeof taoDonHangGia> | null) {
  let includeNhanDuoc: unknown = null;

  const prismaFake = {
    khachHang: {
      findFirst: async () => ({ id: KHACH_HANG_ID }),
    },
    donHang: {
      // Giữ đúng ownership: chỉ trả đơn khi khachHangId khớp chủ sở hữu.
      findFirst: async (args: { where: { id: string; khachHangId: string }; include: unknown }) => {
        includeNhanDuoc = args.include;
        if (donHang && args.where.khachHangId === KHACH_HANG_ID) {
          return donHang;
        }
        return null;
      },
    },
    datChoTonKho: {
      findUnique: async () => null,
    },
  };

  const service = new DonHangService(
    prismaFake as unknown as PrismaService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, layInclude: () => includeNhanDuoc };
}

describe('layChiTietCuaToi — exact batch traceability', () => {
  it('CASE 1: một mục, một allocation → đúng maLo + maTruyXuat', async () => {
    const { service } = taoService(
      taoDonHangGia([taoMucGia('muc-001', [{ maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 2 }])]),
    );

    const detail = await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');
    const muc = detail.donNhaCungCap[0]!.muc[0]!;

    expect(muc.phanBo).toEqual([{ maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 2 }]);
    // Không lộ internal ID kho/vận hành cho khách.
    for (const allocation of muc.phanBo) {
      expect(allocation).not.toHaveProperty('tonKhoLoId');
      expect(allocation).not.toHaveProperty('loSanPhamId');
      expect(allocation).not.toHaveProperty('maKho');
    }
  });

  it('CASE 2: một mục, hai allocations → trả đủ cả hai, giữ thứ tự', async () => {
    const { service } = taoService(
      taoDonHangGia([
        taoMucGia('muc-001', [
          { maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 1.2 },
          { maLo: 'LOT-B', maTruyXuat: 'TX-B-002', soLuong: 0.8 },
        ]),
      ]),
    );

    const detail = await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');
    const muc = detail.donNhaCungCap[0]!.muc[0]!;

    expect(muc.phanBo).toHaveLength(2);
    expect(muc.phanBo[0]).toEqual({ maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 1.2 });
    expect(muc.phanBo[1]).toEqual({ maLo: 'LOT-B', maTruyXuat: 'TX-B-002', soLuong: 0.8 });
    expect(muc.phanBo[0]!.maLo).toBe('LOT-A');
    expect(muc.phanBo[1]!.maLo).toBe('LOT-B');
  });

  it('CASE 3: allocation batch chưa có maTruyXuat → null, không bịa mã', async () => {
    const { service } = taoService(
      taoDonHangGia([taoMucGia('muc-001', [{ maLo: 'LOT-C', maTruyXuat: null, soLuong: 1 }])]),
    );

    const detail = await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');
    const muc = detail.donNhaCungCap[0]!.muc[0]!;

    expect(muc.phanBo).toEqual([{ maLo: 'LOT-C', maTruyXuat: null, soLuong: 1 }]);
  });

  it('CASE 3b: mục không allocation → [] chứ không suy batch', async () => {
    const { service } = taoService(taoDonHangGia([taoMucGia('muc-001', [])]));

    const detail = await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');

    expect(detail.donNhaCungCap[0]!.muc[0]!.phanBo).toEqual([]);
  });

  it('CASE 4: đơn của khách khác → vẫn NotFound (ownership giữ nguyên)', async () => {
    const { service } = taoService(
      taoDonHangGia([taoMucGia('muc-001', [{ maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 1 }])]),
    );

    // khachHangId trong fake khớp chủ sở hữu; đơn của người khác = findFirst null.
    const { service: serviceKhac } = taoService(null);

    await expect(serviceKhac.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-cua-nguoi-khac')).rejects.toThrow(
      NotFoundException,
    );
    // Sanity: chủ sở hữu vẫn đọc được.
    const detail = await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');
    expect(detail.maDonHang).toBe('ORD-001');
  });

  it('query allocation có thứ tự deterministic (createdAt asc)', async () => {
    const { service, layInclude } = taoService(
      taoDonHangGia([taoMucGia('muc-001', [{ maLo: 'LOT-A', maTruyXuat: 'TX-A-001', soLuong: 1 }])]),
    );

    await service.layChiTietCuaToi(NGUOI_DUNG_ID, 'don-hang-001');

    const include = layInclude() as {
      donNhaCungCap: { include: { muc: { include: { phanBo: { orderBy: unknown } } } } };
    };
    expect(include.donNhaCungCap.include.muc.include.phanBo.orderBy).toEqual({
      createdAt: 'asc',
    });
  });
});
