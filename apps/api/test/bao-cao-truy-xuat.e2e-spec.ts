import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { BaoCaoTruyXuatService } from '../src/modules/bao-cao-truy-xuat/bao-cao-truy-xuat.service';

describe('PHIEN-091 BaoCaoTruyXuatService', () => {
  const prisma = {
    loSanPham: { findMany: jest.fn(), count: jest.fn() },
    thuHoiLoSanPham: { findMany: jest.fn(), count: jest.fn() },
    phanBoDonHang: { findMany: jest.fn() },
  };
  let service: BaoCaoTruyXuatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BaoCaoTruyXuatService(prisma as unknown as PrismaService);
  });

  it('batch report nối farm lineage và đếm historical affected orders', async () => {
    prisma.loSanPham.findMany.mockResolvedValue([
      {
        id: 'lo-1',
        maLo: 'LO-001',
        maTruyXuat: 'AGM-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        trangThai: TrangThaiLoSanPham.THU_HOI,
        soLuong: 100,
        conLai: 20,
        phanHangChatLuong: 'A',
        ngayHetHan: new Date('2026-10-01T00:00:00.000Z'),
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        thuHoach: {
          ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
          muaVu: {
            cayTrong: 'Xoài',
            giong: 'Cát Chu',
            trangTrai: { id: 'farm-1', ma: 'FARM-01', ten: 'Trang trại A' },
          },
        },
        thuHoi: { thuHoiLuc: new Date('2026-09-01T09:00:00.000Z') },
      },
    ]);
    prisma.loSanPham.count.mockResolvedValue(1);
    prisma.phanBoDonHang.findMany.mockResolvedValue([
      {
        soLuong: 3,
        tonKhoLo: { loSanPhamId: 'lo-1' },
        mucDonHang: { donHangNhaCungCap: { donHangId: 'order-1' } },
      },
      {
        soLuong: 2,
        tonKhoLo: { loSanPhamId: 'lo-1' },
        mucDonHang: { donHangNhaCungCap: { donHangId: 'order-2' } },
      },
    ]);

    const result = await service.layDanhSachLo({ trang: 1, gioiHan: 20 });

    expect(result.tong).toBe(1);
    expect(result.duLieu[0]).toMatchObject({
      maLo: 'LO-001',
      daThuHoi: true,
      soDonHangAnhHuong: 2,
      soLuongDaPhanBo: 5,
      trangTrai: { ma: 'FARM-01', ten: 'Trang trại A' },
    });
  });

  it('affected orders giữ cả order DA_HUY vì allocation là lịch sử traceability', async () => {
    prisma.phanBoDonHang.findMany
      .mockResolvedValueOnce([
        {
          soLuong: 4,
          mucDonHang: { donHangNhaCungCap: { donHangId: 'order-cancelled' } },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'alloc-1',
          soLuong: 4,
          createdAt: new Date('2026-08-02T00:00:00.000Z'),
          tonKhoLo: {
            kho: { maKho: 'KHO-01' },
            loSanPham: {
              id: 'lo-1',
              maLo: 'LO-001',
              maTruyXuat: 'AGM-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              thuHoi: { thuHoiLuc: new Date('2026-09-01T09:00:00.000Z') },
            },
          },
          mucDonHang: {
            id: 'item-1',
            sanPhamId: 'product-1',
            tenSanPhamSnapshot: 'Xoài',
            skuBienTheSnapshot: 'XOAI-1KG',
            trangTraiId: 'farm-1',
            maTrangTraiSnapshot: 'FARM-01',
            tenTrangTraiSnapshot: 'Trang trại A',
            donHangNhaCungCap: {
              id: 'sub-1',
              maDon: 'SUB-001',
              trangThai: TrangThaiDonHang.DA_HUY,
              donHangId: 'order-cancelled',
              donHang: {
                id: 'order-cancelled',
                maDonHang: 'ORD-001',
                trangThai: TrangThaiDonHang.DA_HUY,
                createdAt: new Date('2026-08-02T00:00:00.000Z'),
              },
            },
          },
        },
      ]);

    const result = await service.layDonHangAnhHuong({ trang: 1, gioiHan: 20 });

    expect(result.tongDonHang).toBe(1);
    expect(result.tongPhanBo).toBe(1);
    expect(result.tongSoLuongPhanBo).toBe(4);
    expect(result.duLieu[0]).toMatchObject({
      maDonHang: 'ORD-001',
      maLo: 'LO-001',
      trangThaiDonHang: TrangThaiDonHang.DA_HUY,
      soLuongPhanBo: 4,
    });
    const firstWhere = prisma.phanBoDonHang.findMany.mock.calls[0][0].where;
    expect(firstWhere.AND[0]).toEqual({
      tonKhoLo: { loSanPham: { thuHoi: { isNot: null } } },
    });
  });
});
