import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiDonHang } from '../../generated/prisma/client';
import { DiemThuongService } from '../diem-thuong/diem-thuong.service';
import { GiaHieuLucService } from '../flash-sale/gia-hieu-luc.service';
import type { FlashSaleQuotaService } from '../flash-sale/flash-sale-quota.service';
import { CheckoutPricingService } from '../gio-hang/checkout-pricing.service';
import { GioHangService } from '../gio-hang/gio-hang.service';
import { KhuyenMaiService } from '../khuyen-mai/khuyen-mai.service';
import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';
import { DonHangService } from './don-hang.service';

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
  const service = new DonHangService(
    prisma as unknown as PrismaService,
    {} as GioHangService,
    {} as DatChoTonKhoService,
    {} as CheckoutPricingService,
    {} as KhuyenMaiService,
    {} as DiemThuongService,
    {} as GiaHieuLucService,
    {} as FlashSaleQuotaService,
  );
  return { prisma, service };
}

function detailHoanThanh() {
  return {
    id: 'order-1',
    maDonHang: 'ORD-1',
    maYeuCau: '00000000-0000-4000-8000-000000000001',
    trangThai: TrangThaiDonHang.HOAN_THANH,
    tongTien: 100000,
    diaChiGiaoHang: null,
    coTheHuy: false,
    lyDoKhongTheHuy: 'Đơn hàng đã bắt đầu chuẩn bị hoặc giao nên không thể hủy ở bước này.',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T01:00:00.000Z'),
    donNhaCungCap: [],
    tienTrinh: [],
  };
}

function txXacNhan(trangThaiDon: TrangThaiDonHang, khachHangId = 'customer-1') {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
    donHang: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-1',
        khachHangId,
        trangThai: trangThaiDon,
        donNhaCungCap: [{ id: 'sub-1', trangThai: trangThaiDon }],
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    donHangNhaCungCap: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

/**
 * Production driver DA_GIAO -> HOAN_THANH: khách xác nhận đã nhận hàng.
 * Chỉ chủ đơn, chỉ từ DA_GIAO, idempotent, không chạm payment/inventory.
 */
describe('don-hang xac nhan da nhan (DA_GIAO -> HOAN_THANH)', () => {
  it('DA_GIAO -> HOAN_THANH thành công cho cả đơn cha và đơn NCC', async () => {
    const { prisma, service } = taoService();
    const tx = txXacNhan(TrangThaiDonHang.DA_GIAO);
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));
    jest.spyOn(service, 'layChiTietCuaToi').mockResolvedValue(detailHoanThanh());

    const result = await service.xacNhanDaNhan('user-1', 'order-1');

    expect(tx.donHangNhaCungCap.updateMany).toHaveBeenCalledWith({
      where: { donHangId: 'order-1', trangThai: TrangThaiDonHang.DA_GIAO },
      data: { trangThai: TrangThaiDonHang.HOAN_THANH },
    });
    expect(tx.donHang.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', trangThai: TrangThaiDonHang.DA_GIAO },
      data: { trangThai: TrangThaiDonHang.HOAN_THANH },
    });
    expect(result.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);
  });

  it.each([
    [TrangThaiDonHang.DANG_GIAO],
    [TrangThaiDonHang.DA_DONG_GOI],
    [TrangThaiDonHang.DA_XAC_NHAN],
    [TrangThaiDonHang.CHO_THANH_TOAN],
    [TrangThaiDonHang.DA_HUY],
  ])('từ chối %s -> HOAN_THANH', async (trangThai) => {
    const { prisma, service } = taoService();
    const tx = txXacNhan(trangThai);
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    await expect(service.xacNhanDaNhan('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.donHang.updateMany).not.toHaveBeenCalled();
    expect(tx.donHangNhaCungCap.updateMany).not.toHaveBeenCalled();
  });

  it('user khác không xác nhận được đơn (NotFound, không lộ đơn)', async () => {
    const { prisma, service } = taoService();
    const tx = txXacNhan(TrangThaiDonHang.DA_GIAO, 'customer-khac');
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    await expect(service.xacNhanDaNhan('user-1', 'order-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tx.donHang.updateMany).not.toHaveBeenCalled();
  });

  it('gọi lần 2 ở HOAN_THANH không side-effect (idempotent)', async () => {
    const { prisma, service } = taoService();
    const tx = txXacNhan(TrangThaiDonHang.HOAN_THANH);
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));
    jest.spyOn(service, 'layChiTietCuaToi').mockResolvedValue(detailHoanThanh());

    const result = await service.xacNhanDaNhan('user-1', 'order-1');

    expect(tx.donHang.updateMany).not.toHaveBeenCalled();
    expect(tx.donHangNhaCungCap.updateMany).not.toHaveBeenCalled();
    expect(result.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);
  });
});
