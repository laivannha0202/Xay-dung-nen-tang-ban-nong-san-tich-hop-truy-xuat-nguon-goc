import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiLoSanPham, TrangThaiXacMinhChungNhan } from '../src/generated/prisma/client';

describe('Public Product Search/List/Filter PHIEN-043 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    supplier: '',
    farmA: '',
    farmB: '',
    categoryA: '',
    categoryB: '',
    productA: '',
    productB: '',
    variantA: '',
    variantB: '',
    seasonA: '',
    seasonB: '',
    harvestA: '',
    harvestB: '',
    batchA: '',
    warehouse: '',
    inventoryA: '',
    certificateFile: '',
  };

  let slugA = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P43-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Search Filter 043',
      },
    });
    ids.supplier = supplier.id;

    const [farmA, farmB] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P43-A-${suffix}`.slice(0, 50),
          ten: 'Trang trại Organic Sài Gòn',
          diaChi: 'Thành phố Hồ Chí Minh',
          nhaCungCapId: supplier.id,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P43-B-${suffix}`.slice(0, 50),
          ten: 'Trang trại Đà Lạt',
          diaChi: 'Lâm Đồng',
          nhaCungCapId: supplier.id,
        },
      }),
    ]);
    ids.farmA = farmA.id;
    ids.farmB = farmB.id;

    slugA = `rau-p43-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);
    const slugB = `cu-p43-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);

    const [categoryA, categoryB] = await Promise.all([
      prisma.danhMucSanPham.create({
        data: { ten: 'Rau PHIEN 043', slug: slugA },
      }),
      prisma.danhMucSanPham.create({
        data: { ten: 'Củ PHIEN 043', slug: slugB },
      }),
    ]);
    ids.categoryA = categoryA.id;
    ids.categoryB = categoryB.id;

    const [productA, productB] = await Promise.all([
      prisma.sanPham.create({
        data: {
          ten: 'Bí xanh Organic Search 043',
          moTa: 'Sản phẩm A',
          trangTraiId: farmA.id,
          danhMucSanPhamId: categoryA.id,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Khoai tây Search 043',
          moTa: 'Sản phẩm B',
          trangTraiId: farmB.id,
          danhMucSanPhamId: categoryB.id,
        },
      }),
    ]);
    ids.productA = productA.id;
    ids.productB = productB.id;

    const [variantA, variantB] = await Promise.all([
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: productA.id,
          sku: `P43-A-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 25000,
          donVi: 'g',
        },
      }),
      prisma.bienTheSanPham.create({
        data: {
          sanPhamId: productB.id,
          sku: `P43-B-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1000,
          gia: 55000,
          donVi: 'g',
        },
      }),
    ]);
    ids.variantA = variantA.id;
    ids.variantB = variantB.id;

    const now = new Date();
    const future = new Date(now);
    future.setUTCFullYear(future.getUTCFullYear() + 1);

    const certificateFile = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket-test',
        objectKey: `phien043/certificate-${suffix}.pdf`,
        tenGoc: 'organic-certificate.pdf',
        mimeType: 'application/pdf',
        kichThuoc: BigInt(1),
        sha256: '0'.repeat(64),
        nguoiTaiLenId: '00000000-0000-7000-8000-000000000043',
        nguoiTaiLen: 'phien043-fixture@example.com',
      },
    });
    ids.certificateFile = certificateFile.id;

    await prisma.chungNhan.create({
      data: {
        trangTraiId: farmA.id,
        loai: 'Organic',
        ma: `ORG-P43-${suffix}`.slice(0, 100),
        donViCap: 'Organic Authority',
        tepTinId: certificateFile.id,
        ngayCap: now,
        ngayHetHan: future,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: now,
      },
    });

    const [seasonA, seasonB] = await Promise.all([
      prisma.muaVu.create({
        data: {
          trangTraiId: farmA.id,
          cayTrong: 'Bí xanh',
          giong: 'A',
          ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
          sanLuongDuKienKg: 100,
        },
      }),
      prisma.muaVu.create({
        data: {
          trangTraiId: farmB.id,
          cayTrong: 'Khoai tây',
          giong: 'B',
          ngayTrong: new Date('2026-05-01T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-07-10T00:00:00.000Z'),
          sanLuongDuKienKg: 100,
        },
      }),
    ]);
    ids.seasonA = seasonA.id;
    ids.seasonB = seasonB.id;

    const [harvestA, harvestB] = await Promise.all([
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonA.id,
          ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
          soLuong: 80,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
      prisma.thuHoach.create({
        data: {
          muaVuId: seasonB.id,
          ngayThuHoach: new Date('2026-07-10T00:00:00.000Z'),
          soLuong: 80,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
    ]);
    ids.harvestA = harvestA.id;
    ids.harvestB = harvestB.id;

    const ngayHomNay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const expiry = new Date(ngayHomNay);
    expiry.setUTCDate(expiry.getUTCDate() + 30);

    const batchA = await prisma.loSanPham.create({
      data: {
        maLo: `LO-P43-A-${suffix}`.slice(0, 100),
        thuHoachId: harvestA.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    ids.batchA = batchA.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P43-${suffix}`.slice(0, 50),
        ten: 'Kho Search Filter 043',
        diaChi: 'TP Hồ Chí Minh',
      },
    });
    ids.warehouse = warehouse.id;

    const inventoryA = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batchA.id,
        bienTheSanPhamId: variantA.id,
        onHand: 10,
        reserved: 3,
        blocked: 2,
      },
    });
    ids.inventoryA = inventoryA.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (ids.inventoryA) {
        await prisma.tonKhoLo.deleteMany({
          where: { id: ids.inventoryA },
        });
      }
      if (ids.batchA) {
        await prisma.loSanPham.deleteMany({
          where: { id: ids.batchA },
        });
      }
      await prisma.chungNhan.deleteMany({
        where: { trangTraiId: { in: [ids.farmA, ids.farmB] } },
      });
      if (ids.certificateFile) {
        await prisma.tepTin.deleteMany({
          where: { id: ids.certificateFile },
        });
      }
      await prisma.thuHoach.deleteMany({
        where: { id: { in: [ids.harvestA, ids.harvestB] } },
      });
      await prisma.muaVu.deleteMany({
        where: { id: { in: [ids.seasonA, ids.seasonB] } },
      });
      await prisma.bienTheSanPham.deleteMany({
        where: { id: { in: [ids.variantA, ids.variantB] } },
      });
      await prisma.sanPham.deleteMany({
        where: { id: { in: [ids.productA, ids.productB] } },
      });
      await prisma.danhMucSanPham.deleteMany({
        where: { id: { in: [ids.categoryA, ids.categoryB] } },
      });
      if (ids.warehouse) {
        await prisma.kho.deleteMany({
          where: { id: ids.warehouse },
        });
      }
      await prisma.trangTrai.deleteMany({
        where: { id: { in: [ids.farmA, ids.farmB] } },
      });
      if (ids.supplier) {
        await prisma.nhaCungCap.deleteMany({
          where: { id: ids.supplier },
        });
      }
    }
    if (app) await app.close();
  });

  it('lọc server-side theo keyword/category/farm/province/certificate/price/harvest date', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({
        timKiem: 'Organic Search 043',
        danhMuc: slugA,
        trangTraiId: ids.farmA,
        tinhThanh: 'Hồ Chí Minh',
        chungNhan: 'Organic',
        giaTu: 20000,
        giaDen: 30000,
        thuHoachTu: '2026-08-01',
        thuHoachDen: '2026-08-31',
      })
      .expect(200);

    expect(response.body.tong).toBe(1);
    expect(response.body.duLieu).toHaveLength(1);
    expect(response.body.duLieu[0]).toEqual(
      expect.objectContaining({
        id: ids.productA,
        ten: 'Bí xanh Organic Search 043',
      }),
    );
  });

  it('availability dùng available thực, không chỉ onHand', async () => {
    const conHang = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({ khaDung: 'CON_HANG', gioiHan: 100 })
      .expect(200);

    expect(conHang.body.duLieu.some((item: { id: string }) => item.id === ids.productA)).toBe(true);
    expect(conHang.body.duLieu.some((item: { id: string }) => item.id === ids.productB)).toBe(
      false,
    );

    const hetHang = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({ khaDung: 'HET_HANG', gioiHan: 100 })
      .expect(200);

    expect(hetHang.body.duLieu.some((item: { id: string }) => item.id === ids.productB)).toBe(true);
  });

  it('sort giá trước pagination nên page order deterministic', async () => {
    const page1 = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({
        timKiem: 'Search 043',
        sapXep: 'GIA_GIAM',
        trang: 1,
        gioiHan: 1,
      })
      .expect(200);

    expect(page1.body.tong).toBe(2);
    expect(page1.body.duLieu[0].id).toBe(ids.productB);

    const page2 = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({
        timKiem: 'Search 043',
        sapXep: 'GIA_GIAM',
        trang: 2,
        gioiHan: 1,
      })
      .expect(200);

    expect(page2.body.tong).toBe(2);
    expect(page2.body.duLieu[0].id).toBe(ids.productA);
  });

  it('range và enum sai trả 400', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({ giaTu: 50000, giaDen: 10000 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({
        thuHoachTu: '2026-09-01',
        thuHoachDen: '2026-08-01',
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({ khaDung: 'SAI' })
      .expect(400);
  });
});
