import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { SanPhamCongKhaiController } from '../src/modules/san-pham/san-pham-cong-khai.controller';
import { SanPhamCongKhaiService } from '../src/modules/san-pham/san-pham-cong-khai.service';
import {
  tinhDiemXepHangSanPham,
  TRONG_SO_XEP_HANG_SAN_PHAM,
} from '../src/modules/san-pham/xep-hang-san-pham';
import { TepTinService } from '../src/modules/tep-tin/tep-tin.service';

const E2E_TIMEOUT = 30_000;

describe('Search Ranking PHIEN-112 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bestId = '';
  let otherId = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
      controllers: [SanPhamCongKhaiController],
      providers: [
        SanPhamCongKhaiService,
        {
          provide: TepTinService,
          useValue: {
            taoSignedUrlAnhNoiBo: async () => 'https://example.invalid/image',
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P112-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Search Ranking 112',
      },
    });

    const [farmNear, farmFar] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P112-N-${suffix}`.slice(0, 50),
          ten: 'Trang trại gần',
          diaChi: 'TP Hồ Chí Minh',
          viDo: 10.762622,
          kinhDo: 106.660172,
          nhaCungCapId: supplier.id,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P112-F-${suffix}`.slice(0, 50),
          ten: 'Trang trại xa',
          diaChi: 'Hà Nội',
          viDo: 21.027763,
          kinhDo: 105.83416,
          nhaCungCapId: supplier.id,
        },
      }),
    ]);

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Search Ranking 112',
        slug: `search-ranking-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });

    const [best, other] = await Promise.all([
      prisma.sanPham.create({
        data: {
          ten: 'Cà chua',
          trangTraiId: farmNear.id,
          danhMucSanPhamId: category.id,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Cà chua hữu cơ',
          trangTraiId: farmFar.id,
          danhMucSanPhamId: category.id,
        },
      }),
    ]);
    bestId = best.id;
    otherId = other.id;

    const [variantBest, variantOther] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: best.id,
          sku: `P112-BEST-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: other.id,
          sku: `P112-OTHER-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
      }),
    ]);

    const now = new Date();
    const old = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000);

    const [seasonFresh, seasonOld] = await Promise.all([
      prisma.muaVu.create({
        data: {
          trangTraiId: farmNear.id,
          cayTrong: 'Cà chua',
          giong: 'Ranking Fresh',
          ngayTrong: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          ngayDuKienThuHoach: now,
          sanLuongDuKienKg: 100,
        },
      }),
      prisma.muaVu.create({
        data: {
          trangTraiId: farmFar.id,
          cayTrong: 'Cà chua',
          giong: 'Ranking Old',
          ngayTrong: new Date(old.getTime() - 90 * 24 * 60 * 60 * 1000),
          ngayDuKienThuHoach: old,
          sanLuongDuKienKg: 100,
        },
      }),
    ]);

    const [harvestFresh, harvestOld] = await Promise.all([
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonFresh.id,
          ngayThuHoach: now,
          soLuong: 100,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonOld.id,
          ngayThuHoach: old,
          soLuong: 100,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
    ]);

    const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const [batchFresh, batchOld] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `LO-P112-F-${suffix}`.slice(0, 100),
          thuHoachId: harvestFresh.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: expiry,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-P112-O-${suffix}`.slice(0, 100),
          thuHoachId: harvestOld.id,
          soLuong: 100,
          conLai: 100,
          ngayHetHan: expiry,
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
    ]);

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P112-${suffix}`.slice(0, 50),
        ten: 'Kho Search Ranking 112',
        diaChi: 'TP Hồ Chí Minh',
      },
    });

    await Promise.all([
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchFresh.id,
          bienTheSanPhamId: variantBest.id,
          onHand: 20,
          reserved: 0,
          blocked: 0,
        },
      }),
      prisma.tonKhoLo.create({
        data: {
          khoId: warehouse.id,
          loSanPhamId: batchOld.id,
          bienTheSanPhamId: variantOther.id,
          onHand: 1,
          reserved: 0,
          blocked: 0,
        },
      }),
    ]);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (app) await app.close();
  }, E2E_TIMEOUT);

  it('khóa đúng 5 factor và tổng trọng số = 1', () => {
    expect(TRONG_SO_XEP_HANG_SAN_PHAM).toEqual({
      text: 0.4,
      stock: 0.2,
      freshness: 0.15,
      rating: 0.15,
      distance: 0.1,
    });
    const total = Object.values(TRONG_SO_XEP_HANG_SAN_PHAM).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('rating factor tăng score khi các factor khác bằng nhau', () => {
    const common = {
      ten: 'Cà chua',
      tuKhoa: 'Cà chua',
      soLuongKhaDung: 10,
      ngayThuHoachGanNhat: new Date('2026-09-01T00:00:00.000Z'),
      viTriTrangTrai: null,
      viTriNguoiDung: null,
      bayGio: new Date('2026-09-05T00:00:00.000Z'),
    };
    const low = tinhDiemXepHangSanPham({
      ...common,
      diemDanhGiaTrungBinh: 1,
    });
    const high = tinhDiemXepHangSanPham({
      ...common,
      diemDanhGiaTrungBinh: 5,
    });
    expect(low.rating).toBe(0.2);
    expect(high.rating).toBe(1);
    expect(high.tong).toBeGreaterThan(low.tong);
  });

  it('distance factor dùng Haversine khi request có tọa độ', () => {
    const common = {
      ten: 'Cà chua',
      tuKhoa: 'Cà chua',
      soLuongKhaDung: 10,
      ngayThuHoachGanNhat: null,
      diemDanhGiaTrungBinh: null,
      viTriNguoiDung: {
        viDo: 10.762622,
        kinhDo: 106.660172,
      },
    };
    const near = tinhDiemXepHangSanPham({
      ...common,
      viTriTrangTrai: {
        viDo: 10.762622,
        kinhDo: 106.660172,
      },
    });
    const far = tinhDiemXepHangSanPham({
      ...common,
      viTriTrangTrai: {
        viDo: 21.027763,
        kinhDo: 105.83416,
      },
    });
    expect(near.distance).toBe(1);
    expect(far.distance).toBeLessThan(near.distance);
    expect(near.tong).toBeGreaterThan(far.tong);
  });

  it('PHU_HOP xếp exact text + stock + freshness + distance tốt hơn lên trước', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({
        timKiem: 'Cà chua',
        sapXep: 'PHU_HOP',
        viDoNguoiDung: 10.762622,
        kinhDoNguoiDung: 106.660172,
        trang: 1,
        gioiHan: 20,
      })
      .expect(200);

    expect(response.body.tong).toBe(2);
    expect(response.body.duLieu).toHaveLength(2);
    expect(response.body.duLieu[0].id).toBe(bestId);
    expect(response.body.duLieu[1].id).toBe(otherId);
  });
});
