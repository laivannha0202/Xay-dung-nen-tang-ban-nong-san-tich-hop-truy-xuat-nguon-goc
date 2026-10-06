import { ConflictException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../../generated/prisma/client';
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
  const datCho = {
    giaiPhongTrongTransaction: jest.fn().mockResolvedValue(true),
  };
  const diemThuong = {
    hoanTrongTransaction: jest.fn().mockResolvedValue(true),
  };
  const khuyenMai = {
    hoanTacSuDungTheoMaTrongTransaction: jest.fn().mockResolvedValue(true),
  };
  const flashQuota = {
    hoanTrongTransaction: jest.fn().mockResolvedValue(undefined),
  };
  const service = new DonHangService(
    prisma as unknown as PrismaService,
    {} as GioHangService,
    datCho as unknown as DatChoTonKhoService,
    {} as CheckoutPricingService,
    khuyenMai as unknown as KhuyenMaiService,
    diemThuong as unknown as DiemThuongService,
    {} as GiaHieuLucService,
    flashQuota as unknown as FlashSaleQuotaService,
  );
  return { prisma, datCho, diemThuong, khuyenMai, flashQuota, service };
}

function detailDaHuy() {
  return {
    id: 'order-1',
    maDonHang: 'ORD-1',
    maYeuCau: '00000000-0000-4000-8000-000000000001',
    trangThai: TrangThaiDonHang.DA_HUY,
    tongTien: 100000,
    diaChiGiaoHang: null,
    coTheHuy: false,
    lyDoKhongTheHuy: 'Đơn hàng đã được hủy.',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T01:00:00.000Z'),
    donNhaCungCap: [],
    tienTrinh: [],
  };
}

function txHuyCod(trangThaiDon: TrangThaiDonHang, payments: unknown, trangThaiDatCho: unknown) {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
    donHang: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-1',
        maDonHang: 'ORD-1',
        khachHangId: 'customer-1',
        khachHang: { nguoiDungId: 'user-1' },
        trangThai: trangThaiDon,
        diemDaDung: 0,
        maKhuyenMaiSnapshot: null,
        donNhaCungCap: [{ id: 'sub-1', trangThai: trangThaiDon, muc: [] }],
        thanhToan: payments,
      }),
      update: jest.fn().mockResolvedValue({ id: 'order-1' }),
    },
    donHangNhaCungCap: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    datChoTonKho: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'reservation-1',
        trangThai: trangThaiDatCho,
      }),
    },
    thanhToan: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    giaoDichThanhToan: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

/**
 * Regression cho inconsistency COD cancel:
 * COD PENDING + DA_XAC_NHAN + reservation DA_XAC_NHAN phải hủy được,
 * payment COD về CANCELLED trong cùng transaction, không mở rộng cho online PENDING/PAID.
 */
describe('don-hang COD huy (regression)', () => {
  it('COD PENDING + DA_XAC_NHAN + DA_XAC_NHAN được hủy và đồng bộ payment CANCELLED', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.DA_XAC_NHAN,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.PENDING, phuongThuc: 'COD' }],
      TrangThaiDatChoTonKho.DA_XAC_NHAN,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));
    jest.spyOn(service, 'layChiTietCuaToi').mockResolvedValue(detailDaHuy());

    const result = await service.huyCuaToi('user-1', 'order-1');

    expect(datCho.giaiPhongTrongTransaction).toHaveBeenCalledWith(tx, 'reservation-1');
    expect(tx.thanhToan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ phuongThuc: 'COD' }),
        data: { trangThai: TrangThaiThanhToan.CANCELLED },
      }),
    );
    expect(tx.giaoDichThanhToan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ trangThai: TrangThaiThanhToan.CANCELLED }),
      }),
    );
    expect(tx.donHang.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { trangThai: TrangThaiDonHang.DA_HUY },
    });
    expect(result.trangThai).toBe(TrangThaiDonHang.DA_HUY);
  });

  it('VNPay PENDING vẫn bị chặn simple-cancel (phải đi payment/refund lifecycle)', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.CHO_THANH_TOAN,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.PENDING, phuongThuc: 'VNPAY_SANDBOX' }],
      TrangThaiDatChoTonKho.DANG_GIU,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    await expect(service.huyCuaToi('user-1', 'order-1')).rejects.toBeInstanceOf(ConflictException);
    expect(datCho.giaiPhongTrongTransaction).not.toHaveBeenCalled();
    expect(tx.donHang.update).not.toHaveBeenCalled();
    expect(tx.thanhToan.updateMany).not.toHaveBeenCalled();
  });

  it('COD đã thu (PAID) bị chặn simple-cancel, phải đi refund workflow', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.DA_GIAO,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.PAID, phuongThuc: 'COD' }],
      TrangThaiDatChoTonKho.DA_BAN,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    await expect(service.huyCuaToi('user-1', 'order-1')).rejects.toBeInstanceOf(ConflictException);
    expect(datCho.giaiPhongTrongTransaction).not.toHaveBeenCalled();
  });

  it('COD PENDING nhưng đã DANG_CHUAN_BI thì không cho hủy', async () => {
    const { prisma, datCho, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.DANG_CHUAN_BI,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.PENDING, phuongThuc: 'COD' }],
      TrangThaiDatChoTonKho.DA_XAC_NHAN,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    await expect(service.huyCuaToi('user-1', 'order-1')).rejects.toBeInstanceOf(ConflictException);
    expect(datCho.giaiPhongTrongTransaction).not.toHaveBeenCalled();
  });

  it('gọi cancel lần 2 khi đã DA_HUY không double rollback (idempotent)', async () => {
    const { prisma, datCho, flashQuota, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.DA_HUY,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.CANCELLED, phuongThuc: 'COD' }],
      TrangThaiDatChoTonKho.DA_GIAI_PHONG,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));
    jest.spyOn(service, 'layChiTietCuaToi').mockResolvedValue(detailDaHuy());

    const result = await service.huyCuaToi('user-1', 'order-1');

    expect(datCho.giaiPhongTrongTransaction).not.toHaveBeenCalled();
    expect(flashQuota.hoanTrongTransaction).not.toHaveBeenCalled();
    expect(result.trangThai).toBe(TrangThaiDonHang.DA_HUY);
  });

  it('lý do chặn online PENDING không lộ enum nội bộ', async () => {
    const { prisma, service } = taoService();
    const tx = txHuyCod(
      TrangThaiDonHang.CHO_THANH_TOAN,
      [{ id: 'pay-1', trangThai: TrangThaiThanhToan.PENDING, phuongThuc: 'VNPAY_SANDBOX' }],
      TrangThaiDatChoTonKho.DANG_GIU,
    );
    prisma.$transaction.mockImplementation(async (cb: (v: typeof tx) => Promise<void>) => cb(tx));

    const loi = await service.huyCuaToi('user-1', 'order-1').catch((e: unknown) => e);
    expect(loi).toBeInstanceOf(ConflictException);
    const message = (loi as ConflictException).message;
    expect(message).not.toMatch(/\bPENDING\b/);
    expect(message).not.toMatch(/\b(PAID|FAILED|CANCELLED|REFUNDED)\b/);
  });
});
