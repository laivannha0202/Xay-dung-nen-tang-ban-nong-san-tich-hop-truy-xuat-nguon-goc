import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Loyalty models (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `loyalty-p75-${suffix}@example.com`;
  let nguoiDungId = '';
  let khachHangId = '';
  let taiKhoanId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

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
