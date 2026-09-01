import { ConflictException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';
import { GioHangService } from '../src/modules/gio-hang/gio-hang.service';
import { DonHangService } from '../src/modules/don-hang/don-hang.service';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

function detailDaHuy() {
  return {
    id: 'order-1',
    maDonHang: 'ORD-1',
    trangThai: TrangThaiDonHang.DA_HUY,
    tongTien: 100000,
    coTheHuy: false,
    lyDoKhongTheHuy: 'Đơn hàng đã được hủy.',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    donNhaCungCap: [],
    tienTrinh: [],
  };
}

function taoService() {
  const prisma = {
    khachHang: {
      findFirst: jest.fn().mockResolvedValue({ id: 'customer-1' }),
    },
    donHang: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    datChoTonKho: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const datCho = {
    giaiPhongTrongTransaction: jest.fn().mockResolvedValue(true),
  };
  const service = new DonHangService(
    prisma as unknown as PrismaService,
    {} as GioHangService,
    datCho as unknown as DatChoTonKhoService,
  );

  return { prisma, datCho, service };
}

describe('PHIEN-060 Customer Order List/Detail', () => {
  it('list chỉ map dữ liệu customer và filter/pagination contract', async () => {
    const { prisma, service } = taoService();
    prisma.donHang.findMany.mockResolvedValue([
      {
        id: 'order-1',
        maDonHang: 'ORD-1',
        trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        tongTien: 120000,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T01:00:00.000Z'),
        donNhaCungCap: [{ _count: { muc: 2 } }, { _count: { muc: 1 } }],
        thanhToan: [],
      },
    ]);
    prisma.donHang.count.mockResolvedValue(1);
    prisma.datChoTonKho.findMany.mockResolvedValue([
      {
        maThamChieu: 'ORDER:ORD-1',
        trangThai: TrangThaiDatChoTonKho.DANG_GIU,
      },
    ]);

    const result = await service.layDanhSachCuaToi('user-1', {
      trang: 1,
      gioiHan: 20,
      trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
    });

    expect(result.tong).toBe(1);
    expect(result.duLieu).toHaveLength(1);
    expect(result.duLieu[0]).toMatchObject({
      maDonHang: 'ORD-1',
      soNhaCungCap: 2,
      soMuc: 3,
      coTheHuy: true,
    });
    expect(prisma.donHang.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          khachHangId: 'customer-1',
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('detail tạo timeline theo current state nhưng không bịa timestamp history', async () => {
    const { prisma, service } = taoService();
    prisma.donHang.findFirst.mockResolvedValue({
      id: 'order-1',
      maDonHang: 'ORD-1',
      trangThai: TrangThaiDonHang.DANG_GIAO,
      tongTien: 120000,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T01:00:00.000Z'),
      thanhToan: [],
      donNhaCungCap: [
        {
          id: 'sub-1',
          maDon: 'ORD-1-S1',
          nhaCungCapId: 'supplier-1',
          nhaCungCap: { ten: 'Nông trại A' },
          trangThai: TrangThaiDonHang.DANG_GIAO,
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
              createdAt: new Date('2026-09-01T00:00:00.000Z'),
            },
          ],
        },
      ],
    });
    prisma.datChoTonKho.findUnique.mockResolvedValue({
      trangThai: TrangThaiDatChoTonKho.DA_BAN,
    });

    const result = await service.layChiTietCuaToi('user-1', 'order-1');

    expect(result.trangThai).toBe(TrangThaiDonHang.DANG_GIAO);
    expect(result.coTheHuy).toBe(false);
    expect(result.donNhaCungCap[0]?.muc[0]).toMatchObject({
      tenSanPham: 'Cà chua',
      thanhTien: 120000,
    });
    expect(result.tienTrinh.find((moc) => moc.trangThai === TrangThaiDonHang.DANG_GIAO)).toEqual({
      trangThai: TrangThaiDonHang.DANG_GIAO,
      daDat: true,
      hienTai: true,
    });
    expect(result.tienTrinh.find((moc) => moc.trangThai === TrangThaiDonHang.DA_GIAO)?.daDat).toBe(
      false,
    );
    expect('thoiGian' in result.tienTrinh[0]!).toBe(false);
  });

  it('cancel release reservation và đổi Order/Suborder trong cùng transaction', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
      donHang: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          maDonHang: 'ORD-1',
          khachHangId: 'customer-1',
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
          donNhaCungCap: [{ id: 'sub-1', trangThai: TrangThaiDonHang.CHO_THANH_TOAN }],
          thanhToan: [],
        }),
        update: jest.fn().mockResolvedValue({ id: 'order-1' }),
      },
      donHangNhaCungCap: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      datChoTonKho: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reservation-1',
          trangThai: TrangThaiDatChoTonKho.DANG_GIU,
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<void>) =>
      callback(tx),
    );
    jest.spyOn(service, 'layChiTietCuaToi').mockResolvedValue(detailDaHuy());

    const result = await service.huyCuaToi('user-1', 'order-1');

    expect(datCho.giaiPhongTrongTransaction).toHaveBeenCalledWith(tx, 'reservation-1');
    expect(tx.donHangNhaCungCap.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { trangThai: TrangThaiDonHang.DA_HUY },
      }),
    );
    expect(tx.donHang.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { trangThai: TrangThaiDonHang.DA_HUY },
    });
    expect(result.trangThai).toBe(TrangThaiDonHang.DA_HUY);
  });

  it('cancel bị chặn khi payment đang pending/paid thay vì tự refund hoặc sửa payment', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
      donHang: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          maDonHang: 'ORD-1',
          khachHangId: 'customer-1',
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
          donNhaCungCap: [{ id: 'sub-1', trangThai: TrangThaiDonHang.CHO_THANH_TOAN }],
          thanhToan: [{ trangThai: TrangThaiThanhToan.PENDING }],
        }),
        update: jest.fn(),
      },
      donHangNhaCungCap: {
        updateMany: jest.fn(),
      },
      datChoTonKho: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reservation-1',
          trangThai: TrangThaiDatChoTonKho.DANG_GIU,
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<void>) =>
      callback(tx),
    );

    await expect(service.huyCuaToi('user-1', 'order-1')).rejects.toBeInstanceOf(ConflictException);
    expect(datCho.giaiPhongTrongTransaction).not.toHaveBeenCalled();
    expect(tx.donHang.update).not.toHaveBeenCalled();
  });
});
