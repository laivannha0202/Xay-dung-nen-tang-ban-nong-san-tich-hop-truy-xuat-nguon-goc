import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { PhamViKhuyenMai, TrangThaiBanGhi } from '../src/generated/prisma/client';
import { KhuyenMaiService } from '../src/modules/khuyen-mai/khuyen-mai.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Voucher/Promotion rule engine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: KhuyenMaiService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const maPlatform = `P76-PLATFORM-${suffix}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    service = app.get(KhuyenMaiService);
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      await prisma.khuyenMai.deleteMany({ where: { ma: { startsWith: 'P76-' } } });
    }
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('platform + min order + date + usage limit được đánh giá từ DB rule', async () => {
    const now = Date.now();
    await prisma.khuyenMai.create({
      data: {
        ma: maPlatform,
        ten: 'PHIEN 076 platform rule',
        phamVi: PhamViKhuyenMai.PLATFORM,
        donHangToiThieu: 500_000,
        batDauLuc: new Date(now - 60_000),
        ketThucLuc: new Date(now + 3_600_000),
        gioiHanSuDung: 2,
      },
    });

    const hopLe = await service.danhGiaTheoMa(maPlatform, {
      tongTienDonHang: 600_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: new Date(now),
    });
    expect(hopLe.hopLe).toBe(true);

    const thieuMin = await service.danhGiaTheoMa(maPlatform, {
      tongTienDonHang: 499_999,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: new Date(now),
    });
    expect(thieuMin).toMatchObject({
      hopLe: false,
      lyDo: 'Chưa đạt giá trị đơn hàng tối thiểu.',
    });

    await prisma.khuyenMai.update({
      where: { ma: maPlatform },
      data: { soLanDaSuDung: 2 },
    });
    const hetLuot = await service.danhGiaTheoMa(maPlatform, {
      tongTienDonHang: 600_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: new Date(now),
    });
    expect(hetLuot).toMatchObject({
      hopLe: false,
      lyDo: 'Rule đã đạt giới hạn sử dụng.',
    });
  });

  it('category và product scope chỉ match đúng target trong context', () => {
    const now = new Date('2026-09-02T03:00:00.000Z');
    const common = {
      donHangToiThieu: 0,
      batDauLuc: new Date('2026-09-01T00:00:00.000Z'),
      ketThucLuc: new Date('2026-09-03T00:00:00.000Z'),
      gioiHanSuDung: null,
      soLanDaSuDung: 0,
      trangThai: TrangThaiBanGhi.HOAT_DONG,
    } as const;

    const category = service.danhGiaQuyTac(
      {
        ...common,
        id: 'category-rule',
        ma: 'P76-CATEGORY',
        phamVi: PhamViKhuyenMai.DANH_MUC,
        danhMucSanPhamId: 'category-1',
        sanPhamId: null,
      },
      {
        tongTienDonHang: 100_000,
        danhMucIds: ['category-1'],
        sanPhamIds: [],
        thoiDiem: now,
      },
    );
    expect(category.hopLe).toBe(true);

    const product = service.danhGiaQuyTac(
      {
        ...common,
        id: 'product-rule',
        ma: 'P76-PRODUCT',
        phamVi: PhamViKhuyenMai.SAN_PHAM,
        danhMucSanPhamId: null,
        sanPhamId: 'product-1',
      },
      {
        tongTienDonHang: 100_000,
        danhMucIds: [],
        sanPhamIds: ['product-khac'],
        thoiDiem: now,
      },
    );
    expect(product).toMatchObject({
      hopLe: false,
      lyDo: 'Đơn hàng không có sản phẩm được áp dụng.',
    });
  });

  it('scope/target sai cấu trúc bị fail đóng ở eligibility engine', () => {
    const result = service.danhGiaQuyTac(
      {
        id: 'invalid-scope-target',
        ma: 'P76-INVALID-SCOPE',
        phamVi: PhamViKhuyenMai.DANH_MUC,
        danhMucSanPhamId: null,
        sanPhamId: null,
        donHangToiThieu: 0,
        batDauLuc: new Date('2026-09-01T00:00:00.000Z'),
        ketThucLuc: new Date('2026-09-03T00:00:00.000Z'),
        gioiHanSuDung: null,
        soLanDaSuDung: 0,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      {
        tongTienDonHang: 100_000,
        danhMucIds: [],
        sanPhamIds: [],
        thoiDiem: new Date('2026-09-02T00:00:00.000Z'),
      },
    );

    expect(result).toMatchObject({
      hopLe: false,
      lyDo: 'Rule khuyến mại có scope/target không hợp lệ.',
    });
  });

  it('date/status gates fail đóng khi rule không hoạt động hoặc ngoài thời gian', () => {
    const base = {
      id: 'date-rule',
      ma: 'P76-DATE',
      phamVi: PhamViKhuyenMai.PLATFORM,
      danhMucSanPhamId: null,
      sanPhamId: null,
      donHangToiThieu: 0,
      batDauLuc: new Date('2026-09-03T00:00:00.000Z'),
      ketThucLuc: new Date('2026-09-04T00:00:00.000Z'),
      gioiHanSuDung: null,
      soLanDaSuDung: 0,
      trangThai: TrangThaiBanGhi.HOAT_DONG,
    };

    expect(
      service.danhGiaQuyTac(base, {
        tongTienDonHang: 1,
        danhMucIds: [],
        sanPhamIds: [],
        thoiDiem: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toMatchObject({ hopLe: false, lyDo: 'Ngoài thời gian áp dụng.' });

    expect(
      service.danhGiaQuyTac(
        { ...base, trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
        {
          tongTienDonHang: 1,
          danhMucIds: [],
          sanPhamIds: [],
          thoiDiem: new Date('2026-09-03T12:00:00.000Z'),
        },
      ),
    ).toMatchObject({ hopLe: false, lyDo: 'Rule khuyến mại không hoạt động.' });
  });

  it('DB constraints chặn min order âm, date window sai, usage limit <= 0 và usage vượt limit', async () => {
    const now = Date.now();
    const base = {
      ten: 'invalid fixture',
      phamVi: PhamViKhuyenMai.PLATFORM,
      batDauLuc: new Date(now),
      ketThucLuc: new Date(now + 60_000),
    };

    await expect(
      prisma.khuyenMai.create({
        data: { ...base, ma: `P76-NEG-${suffix}`, donHangToiThieu: -1 },
      }),
    ).rejects.toBeDefined();

    await expect(
      prisma.khuyenMai.create({
        data: {
          ...base,
          ma: `P76-DATE-${suffix}`,
          ketThucLuc: new Date(now),
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      prisma.khuyenMai.create({
        data: { ...base, ma: `P76-LIMIT-${suffix}`, gioiHanSuDung: 0 },
      }),
    ).rejects.toBeDefined();

    await expect(
      prisma.khuyenMai.create({
        data: {
          ...base,
          ma: `P76-USAGE-${suffix}`,
          gioiHanSuDung: 1,
          soLanDaSuDung: 2,
        },
      }),
    ).rejects.toBeDefined();
  });
});
