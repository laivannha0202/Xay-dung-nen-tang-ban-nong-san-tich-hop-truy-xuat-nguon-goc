import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { PhamViKhuyenMai } from '../src/generated/prisma/client';
import { KhuyenMaiService } from '../src/modules/khuyen-mai/khuyen-mai.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Promotion usage transaction (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: KhuyenMaiService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ma = `V8B-USAGE-${suffix}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    service = app.get(KhuyenMaiService);

    const now = Date.now();
    await prisma.khuyenMai.create({
      data: {
        ma,
        ten: 'V8B usage lock fixture',
        phamVi: PhamViKhuyenMai.PLATFORM,
        donHangToiThieu: 100_000,
        giaTriGiam: 20_000,
        batDauLuc: new Date(now - 60_000),
        ketThucLuc: new Date(now + 3_600_000),
        gioiHanSuDung: 1,
      },
    });
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) await prisma.khuyenMai.deleteMany({ where: { ma } });
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('consume tăng usage dưới row lock, chặn vượt limit và rollback usage khi hủy', async () => {
    const context = {
      tongTienDonHang: 250_000,
      danhMucIds: [] as string[],
      sanPhamIds: [] as string[],
    };

    const lan1 = await prisma.$transaction((tx) =>
      service.danhGiaVaGhiNhanTheoMaTrongTransaction(tx, ma, context),
    );
    expect(lan1).toMatchObject({ hopLe: true, giaTriGiam: 20_000 });

    const sauLan1 = await prisma.khuyenMai.findUniqueOrThrow({ where: { ma } });
    expect(sauLan1.soLanDaSuDung).toBe(1);

    const lan2 = await prisma.$transaction((tx) =>
      service.danhGiaVaGhiNhanTheoMaTrongTransaction(tx, ma, context),
    );
    expect(lan2).toMatchObject({
      hopLe: false,
      lyDo: 'Rule đã đạt giới hạn sử dụng.',
    });
    expect((await prisma.khuyenMai.findUniqueOrThrow({ where: { ma } })).soLanDaSuDung).toBe(1);

    const hoan = await prisma.$transaction((tx) =>
      service.hoanTacSuDungTheoMaTrongTransaction(tx, ma),
    );
    expect(hoan).toBe(true);
    expect((await prisma.khuyenMai.findUniqueOrThrow({ where: { ma } })).soLanDaSuDung).toBe(0);

    const hoanLan2 = await prisma.$transaction((tx) =>
      service.hoanTacSuDungTheoMaTrongTransaction(tx, ma),
    );
    expect(hoanLan2).toBe(false);
    expect((await prisma.khuyenMai.findUniqueOrThrow({ where: { ma } })).soLanDaSuDung).toBe(0);
  });
});
