import { BadRequestException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiChiTraNhaCungCap } from '../src/generated/prisma/client';
import { ChiTraNhaCungCapService } from '../src/modules/chi-tra-nha-cung-cap/chi-tra-nha-cung-cap.service';
import { SoDuNhaCungCapService } from '../src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service';

const PAYOUT_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_ID = '22222222-2222-4222-8222-222222222222';
const SUPPLIER_ID = '33333333-3333-4333-8333-333333333333';
const ACTOR_ID = '44444444-4444-4444-8444-444444444444';

function row(status: TrangThaiChiTraNhaCungCap = TrangThaiChiTraNhaCungCap.REQUESTED) {
  const now = new Date('2026-09-03T10:00:00.000Z');
  return {
    id: PAYOUT_ID,
    maYeuCau: REQUEST_ID,
    nhaCungCapId: SUPPLIER_ID,
    soTien: 500000,
    trangThai: status,
    yeuCauLuc: now,
    xuLyLuc: status === TrangThaiChiTraNhaCungCap.REQUESTED ? null : now,
    thanhToanLuc: status === TrangThaiChiTraNhaCungCap.PAID ? now : null,
    thatBaiLuc: status === TrangThaiChiTraNhaCungCap.FAILED ? now : null,
    lyDoThatBai: status === TrangThaiChiTraNhaCungCap.FAILED ? 'Ngân hàng từ chối' : null,
    createdAt: now,
    updatedAt: now,
    nhaCungCap: { id: SUPPLIER_ID, ma: 'NCC-001', ten: 'NCC Test' },
  };
}

function taoHarness() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: PAYOUT_ID }]),
    nhaCungCap: { findUnique: jest.fn().mockResolvedValue({ id: SUPPLIER_ID }) },
    chiTraNhaCungCap: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    nhatKyKiemToan: { create: jest.fn().mockResolvedValue({ id: 'audit' }) },
  };
  const prisma = {
    nguoiDung: {
      findUnique: jest.fn().mockResolvedValue({ id: ACTOR_ID, email: 'finance@example.com' }),
    },
    chiTraNhaCungCap: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (client: typeof tx) => Promise<unknown>)(tx);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };
  const balance = {
    giuTienChiTraTrongGiaoDich: jest.fn().mockResolvedValue(undefined),
    xacNhanChiTraThanhCongTrongGiaoDich: jest.fn().mockResolvedValue(undefined),
    hoanTraChiTraThatBaiTrongGiaoDich: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ChiTraNhaCungCapService(
    prisma as unknown as PrismaService,
    balance as unknown as SoDuNhaCungCapService,
  );
  return { service, prisma, tx, balance };
}

describe('PHIEN-085 ChiTraNhaCungCapService', () => {
  it('REQUESTED giữ available -> withheld đúng một lần', async () => {
    const { service, tx, balance } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(null);
    tx.chiTraNhaCungCap.create.mockResolvedValue(row());

    const result = await service.tao(
      ACTOR_ID,
      { maYeuCau: REQUEST_ID, nhaCungCapId: SUPPLIER_ID, soTien: 500000 },
      { ip: null, userAgent: null },
    );

    expect(result.trangThai).toBe(TrangThaiChiTraNhaCungCap.REQUESTED);
    expect(balance.giuTienChiTraTrongGiaoDich).toHaveBeenCalledWith(tx, SUPPLIER_ID, 500000);
    expect(tx.chiTraNhaCungCap.create).toHaveBeenCalledTimes(1);
    expect(tx.nhatKyKiemToan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hanhDong: 'PAYOUT_REQUESTED', thucThe: 'payout' }),
      }),
    );
  });

  it('retry cùng maYeuCau + cùng payload là idempotent', async () => {
    const { service, tx, balance } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row());

    const result = await service.tao(
      ACTOR_ID,
      { maYeuCau: REQUEST_ID, nhaCungCapId: SUPPLIER_ID, soTien: 500000 },
      { ip: null, userAgent: null },
    );

    expect(result.id).toBe(PAYOUT_ID);
    expect(balance.giuTienChiTraTrongGiaoDich).not.toHaveBeenCalled();
    expect(tx.chiTraNhaCungCap.create).not.toHaveBeenCalled();
  });

  it('cùng maYeuCau nhưng amount khác bị reject', async () => {
    const { service, tx } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row());

    await expect(
      service.tao(
        ACTOR_ID,
        { maYeuCau: REQUEST_ID, nhaCungCapId: SUPPLIER_ID, soTien: 400000 },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('REQUESTED -> PROCESSING không đổi bucket', async () => {
    const { service, tx, balance } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row());
    tx.chiTraNhaCungCap.update.mockResolvedValue(row(TrangThaiChiTraNhaCungCap.PROCESSING));

    const result = await service.capNhatTrangThai(
      ACTOR_ID,
      PAYOUT_ID,
      { trangThai: TrangThaiChiTraNhaCungCap.PROCESSING },
      { ip: null, userAgent: null },
    );

    expect(result.trangThai).toBe(TrangThaiChiTraNhaCungCap.PROCESSING);
    expect(balance.xacNhanChiTraThanhCongTrongGiaoDich).not.toHaveBeenCalled();
    expect(balance.hoanTraChiTraThatBaiTrongGiaoDich).not.toHaveBeenCalled();
  });

  it('PROCESSING -> PAID chuyển withheld -> paid', async () => {
    const { service, tx, balance } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row(TrangThaiChiTraNhaCungCap.PROCESSING));
    tx.chiTraNhaCungCap.update.mockResolvedValue(row(TrangThaiChiTraNhaCungCap.PAID));

    const result = await service.capNhatTrangThai(
      ACTOR_ID,
      PAYOUT_ID,
      { trangThai: TrangThaiChiTraNhaCungCap.PAID },
      { ip: null, userAgent: null },
    );

    expect(result.trangThai).toBe(TrangThaiChiTraNhaCungCap.PAID);
    expect(balance.xacNhanChiTraThanhCongTrongGiaoDich).toHaveBeenCalledWith(
      tx,
      SUPPLIER_ID,
      500000,
    );
  });

  it('PROCESSING -> FAILED trả withheld -> available', async () => {
    const { service, tx, balance } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row(TrangThaiChiTraNhaCungCap.PROCESSING));
    tx.chiTraNhaCungCap.update.mockResolvedValue(row(TrangThaiChiTraNhaCungCap.FAILED));

    const result = await service.capNhatTrangThai(
      ACTOR_ID,
      PAYOUT_ID,
      { trangThai: TrangThaiChiTraNhaCungCap.FAILED, lyDoThatBai: 'Ngân hàng từ chối' },
      { ip: null, userAgent: null },
    );

    expect(result.trangThai).toBe(TrangThaiChiTraNhaCungCap.FAILED);
    expect(balance.hoanTraChiTraThatBaiTrongGiaoDich).toHaveBeenCalledWith(tx, SUPPLIER_ID, 500000);
  });

  it('không cho REQUESTED -> PAID bỏ qua PROCESSING', async () => {
    const { service, tx } = taoHarness();
    tx.chiTraNhaCungCap.findUnique.mockResolvedValue(row());

    await expect(
      service.capNhatTrangThai(
        ACTOR_ID,
        PAYOUT_ID,
        { trangThai: TrangThaiChiTraNhaCungCap.PAID },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('FAILED thiếu lý do bị reject trước transaction', async () => {
    const { service } = taoHarness();
    await expect(
      service.capNhatTrangThai(
        ACTOR_ID,
        PAYOUT_ID,
        { trangThai: TrangThaiChiTraNhaCungCap.FAILED },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
