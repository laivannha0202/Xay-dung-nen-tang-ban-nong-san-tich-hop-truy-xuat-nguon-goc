import 'reflect-metadata';

import { MA_QUYEN } from '../src/modules/phan-quyen/ma-quyen';
import { KHOA_YEU_CAU_QUYEN } from '../src/modules/phan-quyen/yeu-cau-quyen.decorator';
import { DonHangQuanTriController } from '../src/modules/don-hang/don-hang-quan-tri.controller';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { GioHangService } from '../src/modules/gio-hang/gio-hang.service';
import { DonHangService } from '../src/modules/don-hang/don-hang.service';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

function taoService() {
  const prisma = {
    donHang: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    datChoTonKho: {
      findUnique: jest.fn(),
    },
  };
  const service = new DonHangService(
    prisma as unknown as PrismaService,
    {} as GioHangService,
    {} as DatChoTonKhoService,
  );
  return { prisma, service };
}

describe('PHIEN-061 Admin Order List/Detail', () => {
  it('controller dùng permission don_hang.xu_ly cho cả list và detail', () => {
    const listPermission = Reflect.getMetadata(
      KHOA_YEU_CAU_QUYEN,
      DonHangQuanTriController.prototype.layDanhSach,
    );
    const detailPermission = Reflect.getMetadata(
      KHOA_YEU_CAU_QUYEN,
      DonHangQuanTriController.prototype.layChiTiet,
    );

    expect(listPermission).toEqual([MA_QUYEN.DON_HANG_XU_LY]);
    expect(detailPermission).toEqual([MA_QUYEN.DON_HANG_XU_LY]);
  });

  it('admin list không scope theo một customer và map customer/payment summary', async () => {
    const { prisma, service } = taoService();
    prisma.donHang.findMany.mockResolvedValue([
      {
        id: 'order-1',
        maDonHang: 'ORD-1',
        trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        tongTien: 120000,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T01:00:00.000Z'),
        khachHang: {
          id: 'customer-1',
          nguoiDungId: 'user-1',
          nguoiDung: { email: 'khach@example.com', hoTen: 'Khách A' },
        },
        donNhaCungCap: [{ _count: { muc: 2 } }],
        thanhToan: [{ trangThai: TrangThaiThanhToan.PENDING }],
      },
    ]);
    prisma.donHang.count.mockResolvedValue(1);

    const result = await service.layDanhSachQuanTri({
      trang: 1,
      gioiHan: 20,
      trangThai: TrangThaiDonHang.DA_XAC_NHAN,
      maDonHang: 'ORD',
    });

    expect(result.duLieu[0]).toMatchObject({
      maDonHang: 'ORD-1',
      khachHang: { email: 'khach@example.com', hoTen: 'Khách A' },
      soNhaCungCap: 1,
      soMuc: 2,
      trangThaiThanhToan: TrangThaiThanhToan.PENDING,
    });
    expect(prisma.donHang.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
          maDonHang: { contains: 'ORD' },
        },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('admin detail trả customer + snapshot + payment + reservation và không mutation', async () => {
    const { prisma, service } = taoService();
    prisma.donHang.findUnique.mockResolvedValue({
      id: 'order-1',
      maDonHang: 'ORD-1',
      trangThai: TrangThaiDonHang.DA_XAC_NHAN,
      tongTien: 120000,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T01:00:00.000Z'),
      khachHang: {
        id: 'customer-1',
        nguoiDungId: 'user-1',
        nguoiDung: { email: 'khach@example.com', hoTen: 'Khách A' },
      },
      donNhaCungCap: [
        {
          id: 'sub-1',
          maDon: 'ORD-1-S1',
          nhaCungCapId: 'supplier-1',
          nhaCungCap: { ten: 'NCC A' },
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
          tamTinh: 120000,
          muc: [
            {
              id: 'item-1',
              sanPhamId: 'product-1',
              bienTheSanPhamId: 'variant-1',
              tenSanPhamSnapshot: 'Cà chua',
              skuBienTheSnapshot: 'CA-1',
              soLuong: 2,
              donGiaSnapshot: 60000,
              khoiLuongBienTheSnapshot: 1,
              donViBienTheSnapshot: 'kg',
              maTrangTraiSnapshot: 'FARM-A',
              tenTrangTraiSnapshot: 'Trang trại A',
            },
          ],
        },
      ],
      thanhToan: [
        {
          id: 'pay-1',
          phuongThuc: 'COD',
          trangThai: TrangThaiThanhToan.PENDING,
          soTien: 120000,
          createdAt: new Date('2026-09-01T00:10:00.000Z'),
          giaoDich: [
            {
              id: 'tx-1',
              maGiaoDich: 'PAY-1',
              trangThai: TrangThaiThanhToan.PENDING,
              soTien: 120000,
              thoiGian: new Date('2026-09-01T00:10:00.000Z'),
            },
          ],
        },
      ],
    });
    prisma.datChoTonKho.findUnique.mockResolvedValue({
      id: 'reserve-1',
      trangThai: TrangThaiDatChoTonKho.DA_BAN,
      hetHanLuc: new Date('2026-09-01T01:00:00.000Z'),
      ketThucLuc: new Date('2026-09-01T00:10:00.000Z'),
    });

    const result = await service.layChiTietQuanTri('order-1');

    expect(result.khachHang.email).toBe('khach@example.com');
    expect(result.donNhaCungCap[0]?.muc[0]).toMatchObject({
      tenSanPham: 'Cà chua',
      thanhTien: 120000,
    });
    expect(result.thanhToan[0]?.giaoDich[0]?.maGiaoDich).toBe('PAY-1');
    expect(result.datCho?.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);
    expect((prisma.donHang as Record<string, unknown>).update).toBeUndefined();
  });
});
