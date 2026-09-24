import { ConflictException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDoiSoatNhaCungCap, TrangThaiDonHang } from '../src/generated/prisma/client';
import { TrangThaiChiTraNhaCungCap } from '../src/generated/prisma/client';
import { CauHinhHeThongService } from '../src/modules/cau-hinh-he-thong/cau-hinh-he-thong.service';
import { ChiTraNhaCungCapService } from '../src/modules/chi-tra-nha-cung-cap/chi-tra-nha-cung-cap.service';
import { DoiSoatService } from '../src/modules/doi-soat/doi-soat.service';
import { SoDuNhaCungCapService } from '../src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service';

const SUPPLIER_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';
const SETTLEMENT_ID = '44444444-4444-4444-8444-444444444444';

function settlement(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-09-20T00:00:00.000Z');
  return {
    id: SETTLEMENT_ID,
    nhaCungCapId: SUPPLIER_ID,
    batDauLuc: new Date('2026-09-01T00:00:00.000Z'),
    ketThucLuc: new Date('2026-09-10T00:00:00.000Z'),
    doanhThu: 1000,
    hoaHong: 100,
    hoanTien: 0,
    dieuChinh: 0,
    phaiTra: 900,
    trangThai: TrangThaiDoiSoatNhaCungCap.DANG_CHO,
    duDieuKienLuc: new Date('2026-09-09T00:00:00.000Z'),
    giaiPhongLuc: null,
    createdAt: now,
    updatedAt: now,
    nhaCungCap: { id: SUPPLIER_ID, ma: 'NCC-001', ten: 'NCC 1' },
    ...overrides,
  };
}

function supplierOrder() {
  return {
    id: 'sub-1',
    maDon: 'SUP-001',
    tamTinh: 1000,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    muc: [
      {
        soLuong: 1,
        donGiaSnapshot: 1000,
        danhMucSanPhamIdSnapshot: CATEGORY_ID,
      },
    ],
    vanChuyen: [
      {
        suKien: [{ thoiGian: new Date('2026-09-02T00:00:00.000Z') }],
      },
    ],
  };
}

function harness() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: SUPPLIER_ID }]),
    doiSoatNhaCungCap: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    donHangNhaCungCap: {
      findMany: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(0),
    },
    quyTacHoaHong: { findMany: jest.fn() },
    khieuNai: { count: jest.fn().mockResolvedValue(0) },
    giaoDichThanhToan: { count: jest.fn().mockResolvedValue(0) },
    nhatKyKiemToan: { create: jest.fn().mockResolvedValue({ id: 'audit' }) },
  };
  const prisma = {
    nguoiDung: {
      findUnique: jest.fn().mockResolvedValue({ id: ACTOR_ID, email: 'admin@example.com' }),
    },
    doiSoatNhaCungCap: {
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
    congDangChoTrongGiaoDich: jest.fn().mockResolvedValue(undefined),
    chuyenDangChoSangKhaDungTrongGiaoDich: jest.fn().mockResolvedValue(undefined),
  };
  const settings = {
    layThoiHanKhieuNaiNgay: jest.fn().mockResolvedValue(7),
  };
  const service = new DoiSoatService(
    prisma as unknown as PrismaService,
    balance as unknown as SoDuNhaCungCapService,
    settings as unknown as CauHinhHeThongService,
    {
      taoTuDoiSoat: jest.fn().mockResolvedValue({
        id: 'payout-1',
        maYeuCau: 'PAYOUT-SETTLEMENT-44444444-4444-4444-8444-444444444444',
        nhaCungCapId: SUPPLIER_ID,
        doiSoatId: SETTLEMENT_ID,
        soTien: 900,
        trangThai: TrangThaiChiTraNhaCungCap.PROCESSING,
      }),
    } as unknown as ChiTraNhaCungCapService,
  );
  return { service, tx, balance };
}

describe('V8A Settlement Escrow', () => {
  it('tạo settlement theo DELIVERED, link supplier-order và cộng pending', async () => {
    const { service, tx, balance } = harness();
    tx.donHangNhaCungCap.findMany.mockResolvedValue([supplierOrder()]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([
      {
        danhMucSanPhamId: CATEGORY_ID,
        tyLe: 10,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    tx.doiSoatNhaCungCap.create.mockImplementation(async ({ data }) => settlement({ ...data }));

    const result = await service.tao(
      ACTOR_ID,
      {
        nhaCungCapId: SUPPLIER_ID,
        batDauLuc: '2026-09-01T00:00:00.000Z',
        ketThucLuc: '2026-09-10T00:00:00.000Z',
        hoanTien: 0,
        dieuChinh: 0,
      },
      { ip: null, userAgent: null },
    );

    expect(result.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.DANG_CHO);
    expect(result.duDieuKienLuc).toBe('2026-09-09T00:00:00.000Z');
    expect(balance.congDangChoTrongGiaoDich).toHaveBeenCalledWith(tx, SUPPLIER_ID, 900);
    expect(tx.donHangNhaCungCap.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { doiSoatId: SETTLEMENT_ID } }),
    );
    expect(tx.donHangNhaCungCap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          doiSoatId: null,
          trangThai: TrangThaiDonHang.HOAN_THANH,
          vanChuyen: expect.any(Object),
        }),
      }),
    );
  });

  it('race khi link supplier-order bị chặn', async () => {
    const { service, tx } = harness();
    tx.donHangNhaCungCap.findMany.mockResolvedValue([supplierOrder()]);
    tx.quyTacHoaHong.findMany.mockResolvedValue([
      {
        danhMucSanPhamId: CATEGORY_ID,
        tyLe: 10,
        hieuLucTu: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    tx.doiSoatNhaCungCap.create.mockResolvedValue(settlement());
    tx.donHangNhaCungCap.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.tao(
        ACTOR_ID,
        {
          nhaCungCapId: SUPPLIER_ID,
          batDauLuc: '2026-09-01T00:00:00.000Z',
          ketThucLuc: '2026-09-10T00:00:00.000Z',
          hoanTien: 0,
          dieuChinh: 0,
        },
        { ip: null, userAgent: null },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('chặn release trước eligible_at', async () => {
    const { service, tx } = harness();
    tx.doiSoatNhaCungCap.findUnique.mockResolvedValue(
      settlement({ duDieuKienLuc: new Date(Date.now() + 86_400_000) }),
    );
    await expect(
      service.giaiPhong(ACTOR_ID, SETTLEMENT_ID, { ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('chặn release khi complaint đang mở', async () => {
    const { service, tx } = harness();
    tx.doiSoatNhaCungCap.findUnique.mockResolvedValue(
      settlement({ duDieuKienLuc: new Date(Date.now() - 86_400_000) }),
    );
    tx.khieuNai.count.mockResolvedValue(1);
    await expect(
      service.giaiPhong(ACTOR_ID, SETTLEMENT_ID, { ip: null, userAgent: null }),
    ).rejects.toThrow('khiếu nại');
  });

  it('chặn release khi refund request CREATED', async () => {
    const { service, tx } = harness();
    tx.doiSoatNhaCungCap.findUnique.mockResolvedValue(
      settlement({ duDieuKienLuc: new Date(Date.now() - 86_400_000) }),
    );
    tx.giaoDichThanhToan.count.mockResolvedValue(1);
    await expect(
      service.giaiPhong(ACTOR_ID, SETTLEMENT_ID, { ip: null, userAgent: null }),
    ).rejects.toThrow('refund');
  });

  it('release hợp lệ chuyển pending -> available đúng một lần', async () => {
    const { service, tx, balance } = harness();
    tx.doiSoatNhaCungCap.findUnique.mockResolvedValue(
      settlement({ duDieuKienLuc: new Date(Date.now() - 86_400_000) }),
    );
    tx.doiSoatNhaCungCap.update.mockImplementation(async ({ data }) =>
      settlement({ ...data, trangThai: TrangThaiDoiSoatNhaCungCap.KHA_DUNG }),
    );

    const result = await service.giaiPhong(ACTOR_ID, SETTLEMENT_ID, {
      ip: null,
      userAgent: null,
    });

    expect(result.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.KHA_DUNG);
    expect(balance.chuyenDangChoSangKhaDungTrongGiaoDich).toHaveBeenCalledWith(
      tx,
      SUPPLIER_ID,
      900,
    );
  });

  it('release KHA_DUNG là idempotent', async () => {
    const { service, tx, balance } = harness();
    tx.doiSoatNhaCungCap.findUnique.mockResolvedValue(
      settlement({
        trangThai: TrangThaiDoiSoatNhaCungCap.KHA_DUNG,
        giaiPhongLuc: new Date(),
      }),
    );

    await service.giaiPhong(ACTOR_ID, SETTLEMENT_ID, { ip: null, userAgent: null });
    expect(balance.chuyenDangChoSangKhaDungTrongGiaoDich).not.toHaveBeenCalled();
  });
});
