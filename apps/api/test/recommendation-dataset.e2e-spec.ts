import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import {
  BoDuLieuRecommendationBuilder,
  phanChiaRecommendationTheoThoiGian,
} from '../src/ai/recommendation/bo-du-lieu-recommendation';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiDonHang,
  TrangThaiLoSanPham,
  TrangThaiNguoiDung,
} from '../src/generated/prisma/client';

const E2E_TIMEOUT = 30_000;

describe('Recommendation Dataset PHIEN-114 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let khachHangChinhId = '';
  let khachHangColdStartId = '';
  let sanPhamAId = '';
  let sanPhamBId = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const t1 = new Date('2026-09-01T08:00:00.000Z');
  const t2 = new Date('2026-09-02T08:00:00.000Z');
  const t3 = new Date('2026-09-03T08:00:00.000Z');
  const t4 = new Date('2026-09-04T08:00:00.000Z');
  const thoiDiemChot = new Date('2026-09-06T00:00:00.000Z');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const [nguoiDungChinh, nguoiDungCold] = await Promise.all([
      prisma.nguoiDung.create({
        data: {
          email: `p114-main-${suffix}@example.test`,
          matKhauHash: 'p114-test-hash',
          hoTen: 'Khách hàng AI 114',
          trangThai: TrangThaiNguoiDung.HOAT_DONG,
        },
      }),
      prisma.nguoiDung.create({
        data: {
          email: `p114-cold-${suffix}@example.test`,
          matKhauHash: 'p114-test-hash',
          hoTen: 'Khách hàng Cold Start 114',
          trangThai: TrangThaiNguoiDung.HOAT_DONG,
        },
      }),
    ]);

    const [khachHangChinh, khachHangCold] = await Promise.all([
      prisma.khachHang.create({
        data: {
          nguoiDungId: nguoiDungChinh.id,
        },
      }),
      prisma.khachHang.create({
        data: {
          nguoiDungId: nguoiDungCold.id,
        },
      }),
    ]);

    khachHangChinhId = khachHangChinh.id;
    khachHangColdStartId = khachHangCold.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P114-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Dataset 114',
      },
    });

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P114-${suffix}`.slice(0, 50),
        ten: 'Trang trại Dataset 114',
        diaChi: 'TP Hồ Chí Minh',
        viDo: 10.762622,
        kinhDo: 106.660172,
        nhaCungCapId: supplier.id,
      },
    });

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Recommendation Dataset 114',
        slug: `recommendation-dataset-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });

    const [sanPhamA, sanPhamB] = await Promise.all([
      prisma.sanPham.create({
        data: {
          ten: 'Cà chua AI 114',
          trangTraiId: farm.id,
          danhMucSanPhamId: category.id,
          createdAt: t1,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Dưa leo AI 114',
          trangTraiId: farm.id,
          danhMucSanPhamId: category.id,
          createdAt: t1,
        },
      }),
    ]);

    sanPhamAId = sanPhamA.id;
    sanPhamBId = sanPhamB.id;

    const [variantA, _variantB] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: sanPhamA.id,
          sku: `P114-A-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: sanPhamB.id,
          sku: `P114-B-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 45000,
          donVi: 'g',
        },
      }),
    ]);

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Cà chua',
        giong: 'Dataset 114',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: t1,
        sanLuongDuKienKg: 100,
      },
    });

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: t1,
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });

    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-P114-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date('2027-09-01T00:00:00.000Z'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P114-${suffix}`.slice(0, 50),
        ten: 'Kho Dataset 114',
        diaChi: 'TP Hồ Chí Minh',
      },
    });

    await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variantA.id,
        onHand: 10,
        reserved: 2,
        blocked: 1,
      },
    });

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-P114-${suffix}`.slice(0, 100),
        khachHangId: khachHangChinh.id,
        trangThai: TrangThaiDonHang.HOAN_THANH,
        tongTien: 35000,
        createdAt: t1,
      },
    });

    const supplierOrder = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SO-P114-${suffix}`.slice(0, 100),
        donHangId: order.id,
        nhaCungCapId: supplier.id,
        trangThai: TrangThaiDonHang.HOAN_THANH,
        tamTinh: 35000,
        createdAt: t1,
      },
    });

    const item = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: supplierOrder.id,
        sanPhamId: sanPhamA.id,
        danhMucSanPhamIdSnapshot: category.id,
        bienTheSanPhamId: variantA.id,
        trangTraiId: farm.id,
        soLuong: 2,
        donGiaSnapshot: 35000,
        tenSanPhamSnapshot: sanPhamA.ten,
        skuBienTheSnapshot: variantA.sku,
        khoiLuongBienTheSnapshot: variantA.khoiLuong,
        donViBienTheSnapshot: variantA.donVi,
        maTrangTraiSnapshot: farm.ma,
        tenTrangTraiSnapshot: farm.ten,
        createdAt: t1,
      },
    });

    await Promise.all([
      prisma.sanPhamYeuThich.create({
        data: {
          khachHangId: khachHangChinh.id,
          sanPhamId: sanPhamB.id,
          createdAt: t2,
        },
      }),
      prisma.sanPhamYeuThich.create({
        data: {
          khachHangId: khachHangCold.id,
          sanPhamId: sanPhamA.id,
          createdAt: t2,
        },
      }),
      prisma.danhGia.create({
        data: {
          mucDonHangId: item.id,
          diem: 5,
          binhLuan: 'Dữ liệu rating cho PHIEN-114',
          createdAt: t3,
        },
      }),
      prisma.theoDoiTrangTrai.create({
        data: {
          khachHangId: khachHangChinh.id,
          trangTraiId: farm.id,
          createdAt: t4,
        },
      }),
    ]);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, E2E_TIMEOUT);

  it('materialize đúng 4 loại interaction và không đưa PII vào dataset', async () => {
    const builder = new BoDuLieuRecommendationBuilder(prisma);

    const dataset = await builder.tao(thoiDiemChot);

    expect(dataset.thongKe.tongTuongTac).toBe(5);
    expect(dataset.thongKe.theoLoai).toEqual({
      PURCHASE: 1,
      WISHLIST: 2,
      RATING: 1,
      FOLLOW_FARM: 1,
    });

    const purchase = dataset.tuongTac.find((item) => item.loai === 'PURCHASE');

    expect(purchase).toMatchObject({
      khachHangId: khachHangChinhId,
      sanPhamId: sanPhamAId,
      giaTri: 2,
    });

    const follow = dataset.tuongTac.find((item) => item.loai === 'FOLLOW_FARM');

    expect(follow?.sanPhamId).toBeNull();
    expect(JSON.stringify(dataset)).not.toContain('@example.test');
    expect(JSON.stringify(dataset)).not.toContain('Khách hàng AI 114');
  });

  it('product features giữ đúng public availability semantics', async () => {
    const dataset = await new BoDuLieuRecommendationBuilder(prisma).tao(thoiDiemChot);

    const productA = dataset.sanPham.find((item) => item.sanPhamId === sanPhamAId);
    const productB = dataset.sanPham.find((item) => item.sanPhamId === sanPhamBId);

    expect(productA).toMatchObject({
      congKhai: true,
      khaDung: true,
      soLuongKhaDung: 7,
      giaMin: 35000,
      giaMax: 35000,
    });

    expect(productB).toMatchObject({
      congKhai: true,
      khaDung: false,
      soLuongKhaDung: 0,
      giaMin: 45000,
      giaMax: 45000,
    });
  });

  it('chronological split: >=3 direct events mới vào personalized evaluation', async () => {
    const dataset = await new BoDuLieuRecommendationBuilder(prisma).tao(thoiDiemChot);

    expect(dataset.phanChia.train).toHaveLength(1);
    expect(dataset.phanChia.validation).toHaveLength(1);
    expect(dataset.phanChia.test).toHaveLength(1);
    expect(dataset.phanChia.coldStart).toHaveLength(1);
    expect(dataset.phanChia.auxiliary).toHaveLength(1);

    expect(dataset.phanChia.train[0]?.loai).toBe('PURCHASE');
    expect(dataset.phanChia.validation[0]?.loai).toBe('WISHLIST');
    expect(dataset.phanChia.test[0]?.loai).toBe('RATING');
    expect(dataset.phanChia.coldStart[0]?.khachHangId).toBe(khachHangColdStartId);
    expect(dataset.phanChia.auxiliary[0]?.loai).toBe('FOLLOW_FARM');

    expect(dataset.thongKe.soKhachHangDuDieuKienDanhGia).toBe(1);
    expect(dataset.thongKe.soKhachHangColdStart).toBe(1);
  });

  it('builder deterministic tại cùng thoiDiemChot', async () => {
    const builder = new BoDuLieuRecommendationBuilder(prisma);

    const first = await builder.tao(thoiDiemChot);
    const second = await builder.tao(thoiDiemChot);

    expect(second).toEqual(first);
  });

  it('split helper không biến FOLLOW_FARM thành product target', () => {
    const split = phanChiaRecommendationTheoThoiGian([
      {
        nguonId: 'farm-follow',
        khachHangId: 'customer-1',
        sanPhamId: null,
        loai: 'FOLLOW_FARM',
        giaTri: 1,
        thoiGian: t1,
        danhMucSanPhamId: null,
        trangTraiId: 'farm-1',
      },
    ]);

    expect(split.train).toHaveLength(0);
    expect(split.validation).toHaveLength(0);
    expect(split.test).toHaveLength(0);
    expect(split.coldStart).toHaveLength(0);
    expect(split.auxiliary).toHaveLength(1);
  });
});
