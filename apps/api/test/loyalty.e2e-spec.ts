import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';
import { DiemThuongService } from '../src/modules/diem-thuong/diem-thuong.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Loyalty models (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: DiemThuongService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `loyalty-p75-${suffix}@example.com`;
  let nguoiDungId = '';
  let khachHangId = '';
  let taiKhoanId = '';
  let giaTriQuyDoiCu: number | null = null;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    service = app.get(DiemThuongService);

    const cauHinh = await prisma.cauHinhHeThong.findUnique({
      where: { id: 1 },
      select: { giaTriQuyDoiMoiDiem: true },
    });
    giaTriQuyDoiCu = cauHinh ? Number(cauHinh.giaTriQuyDoiMoiDiem) : null;
    await prisma.cauHinhHeThong.upsert({
      where: { id: 1 },
      create: { id: 1, giaTriQuyDoiMoiDiem: 1000 },
      update: { giaTriQuyDoiMoiDiem: 1000 },
    });

    const user = await prisma.nguoiDung.create({
      data: {
        email,
        matKhauHash: 'PHIEN075-LOYALTY-NOT-USED',
        hoTen: 'Loyalty PHIEN 075',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    nguoiDungId = user.id;

    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });
    khachHangId = customer.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma && nguoiDungId) {
      await prisma.nguoiDung.deleteMany({ where: { id: nguoiDungId } });
      if (giaTriQuyDoiCu !== null) {
        await prisma.cauHinhHeThong.update({
          where: { id: 1 },
          data: { giaTriQuyDoiMoiDiem: giaTriQuyDoiCu },
        });
      }
    }
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('loyalty_account là 1:1 với customer và balance mặc định bằng 0', async () => {
    const account = await prisma.taiKhoanLoyalty.create({
      data: { khachHangId },
    });
    taiKhoanId = account.id;

    expect(account.diem).toBe(0);

    await expect(
      prisma.taiKhoanLoyalty.create({
        data: { khachHangId },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('loyalty_transaction lưu delta và balance snapshot theo account', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.giaoDichLoyalty.create({
        data: {
          loyaltyAccountId: taiKhoanId,
          bienDongDiem: 120,
          soDuSau: 120,
          lyDo: 'fixture credit',
        },
      });
      await tx.taiKhoanLoyalty.update({
        where: { id: taiKhoanId },
        data: { diem: 120 },
      });

      await tx.giaoDichLoyalty.create({
        data: {
          loyaltyAccountId: taiKhoanId,
          bienDongDiem: -20,
          soDuSau: 100,
          lyDo: 'fixture debit',
        },
      });
      await tx.taiKhoanLoyalty.update({
        where: { id: taiKhoanId },
        data: { diem: 100 },
      });
    });

    const account = await prisma.taiKhoanLoyalty.findUniqueOrThrow({
      where: { id: taiKhoanId },
      include: { giaoDich: { orderBy: { createdAt: 'asc' } } },
    });

    expect(account.diem).toBe(100);
    expect(account.giaoDich.map((item) => item.bienDongDiem)).toEqual([120, -20]);
    expect(account.giaoDich.map((item) => item.soDuSau)).toEqual([120, 100]);
  });

  it('redeem + refund khóa balance, ghi ledger và refund idempotent', async () => {
    const maDonHang = `LOYALTY-${suffix}`;

    const debit = await prisma.$transaction((tx) =>
      service.suDungTrongTransaction(tx, {
        khachHangId,
        diemSuDung: 25,
        giaTriToiDa: 30_000,
        maDonHang,
      }),
    );
    expect(debit).toEqual({
      diemSuDung: 25,
      giaTriDiemDaDung: 25_000,
      soDuSau: 75,
    });

    const sauDebit = await prisma.taiKhoanLoyalty.findUniqueOrThrow({ where: { id: taiKhoanId } });
    expect(sauDebit.diem).toBe(75);

    const refundLan1 = await prisma.$transaction((tx) =>
      service.hoanTrongTransaction(tx, {
        khachHangId,
        diemDaDung: 25,
        maDonHang,
      }),
    );
    const refundLan2 = await prisma.$transaction((tx) =>
      service.hoanTrongTransaction(tx, {
        khachHangId,
        diemDaDung: 25,
        maDonHang,
      }),
    );
    expect(refundLan1).toBe(true);
    expect(refundLan2).toBe(false);

    const account = await prisma.taiKhoanLoyalty.findUniqueOrThrow({
      where: { id: taiKhoanId },
      include: {
        giaoDich: {
          where: { maThamChieu: { startsWith: `ORDER:${maDonHang}:LOYALTY_` } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(account.diem).toBe(100);
    expect(account.giaoDich.map((item) => item.bienDongDiem)).toEqual([-25, 25]);
    expect(account.giaoDich.map((item) => item.soDuSau)).toEqual([75, 100]);
  });

  it('redeem từ chối khi vượt số dư hoặc vượt giá trị hàng còn lại', async () => {
    await expect(
      prisma.$transaction((tx) =>
        service.suDungTrongTransaction(tx, {
          khachHangId,
          diemSuDung: 101,
          giaTriToiDa: 200_000,
          maDonHang: `OVER-BALANCE-${suffix}`,
        }),
      ),
    ).rejects.toThrow('Số dư điểm không đủ');

    await expect(
      prisma.$transaction((tx) =>
        service.suDungTrongTransaction(tx, {
          khachHangId,
          diemSuDung: 20,
          giaTriToiDa: 19_999,
          maDonHang: `OVER-VALUE-${suffix}`,
        }),
      ),
    ).rejects.toThrow('Giá trị điểm thưởng vượt tiền hàng còn lại');
  });

  it('DB chặn balance âm và transaction delta bằng 0', async () => {
    await expect(
      prisma.taiKhoanLoyalty.update({
        where: { id: taiKhoanId },
        data: { diem: -1 },
      }),
    ).rejects.toBeDefined();

    await expect(
      prisma.giaoDichLoyalty.create({
        data: {
          loyaltyAccountId: taiKhoanId,
          bienDongDiem: 0,
          soDuSau: 100,
          lyDo: 'invalid zero delta',
        },
      }),
    ).rejects.toBeDefined();

    const account = await prisma.taiKhoanLoyalty.findUniqueOrThrow({ where: { id: taiKhoanId } });
    expect(account.diem).toBe(100);
  });
});
