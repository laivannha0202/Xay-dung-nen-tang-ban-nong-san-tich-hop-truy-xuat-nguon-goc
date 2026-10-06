import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiamGiaKhuyenMai,
  PhamViKhuyenMai,
  TrangThaiBanGhi,
} from '../src/generated/prisma/client';
import { KhuyenMaiService } from '../src/modules/khuyen-mai/khuyen-mai.service';

const THOI_GIAN_E2E_MS = 120_000;

describe('Khuyen mai PERCENT + farm scope + sua muc flash sale (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: KhuyenMaiService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Percent-106';
  const emailNhanVien = `pct-nhanvien-${suffix}@example.com`;
  const emailAdmin = `pct-admin-${suffix}@example.com`;
  const emailKhach = `pct-khach-${suffix}@example.com`;
  let nhanVienId = '';
  let adminId = '';
  let khachId = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let tokenKhach = '';

  let farmId = '';
  let categoryId = '';
  let productId = '';
  let variantId = '';
  let variantGiaGoc = 0;
  let campaignId = '';
  let mucId = '';

  const maCodes: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    service = app.get(KhuyenMaiService);

    for (const email of [emailNhanVien, emailAdmin, emailKhach]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Percent E2E' })
        .expect(201);
    }
    const [nhanVien, admin, khach, roleNhanVien, roleAdmin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNhanVien } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    nhanVienId = nhanVien.id;
    adminId = admin.id;
    khachId = khach.id;
    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVienId,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        { nguoiDungId: adminId, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
      ],
    });
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'WEB' })
        .expect(200);
      return res.body.accessToken as string;
    };
    tokenNhanVien = await login(emailNhanVien);
    tokenAdmin = await login(emailAdmin);
    tokenKhach = await login(emailKhach);

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-PCT-${suffix}`.slice(0, 50), ten: 'NCC Percent' },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-PCT-${suffix}`.slice(0, 50),
        ten: 'Trang trai Percent',
        diaChi: 'Hung Yen',
        nhaCungCapId: supplier.id,
      },
    });
    farmId = farm.id;
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh muc Percent',
        slug: `pct-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    categoryId = category.id;
    const product = await prisma.sanPham.create({
      data: { ten: 'San pham Percent', trangTraiId: farm.id, danhMucSanPhamId: category.id },
    });
    productId = product.id;
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `PCT-106-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1000,
        gia: 50000,
        donVi: 'g',
      },
    });
    variantId = variant.id;
    variantGiaGoc = Number(variant.gia);
  }, THOI_GIAN_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (maCodes.length) {
        await prisma.khuyenMai.deleteMany({ where: { ma: { in: maCodes } } });
      }
      if (campaignId) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: campaignId } });
        await prisma.mucFlashSale.deleteMany({ where: { chienDichId: campaignId } });
        await prisma.chienDichFlashSale.deleteMany({ where: { id: campaignId } });
      }
      if (variantId) await prisma.bienTheSanPham.deleteMany({ where: { sanPhamId: productId } });
      if (productId) await prisma.sanPham.deleteMany({ where: { id: productId } });
      if (categoryId) await prisma.danhMucSanPham.deleteMany({ where: { id: categoryId } });
      if (farmId) {
        const farm = await prisma.trangTrai.findUniqueOrThrow({ where: { id: farmId } });
        await prisma.trangTrai.deleteMany({ where: { id: farmId } });
        await prisma.nhaCungCap.deleteMany({ where: { id: farm.nhaCungCapId } });
      }
      const userIds = [nhanVienId, adminId, khachId].filter(Boolean);
      if (userIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { tacNhanId: { in: userIds } } });
        await prisma.nguoiDungVaiTro.deleteMany({ where: { nguoiDungId: { in: userIds } } });
        await prisma.khachHang.deleteMany({ where: { nguoiDungId: { in: userIds } } });
        await prisma.nguoiDung.deleteMany({ where: { id: { in: userIds } } });
      }
    }
    if (app) await app.close();
  }, THOI_GIAN_E2E_MS);

  it('percent 10% tinh dung tren subtotal, tran giam toi da hoat dong', async () => {
    const now = Date.now();
    const ma = `PCT10-${suffix}`.slice(0, 80);
    maCodes.push(ma);
    await prisma.khuyenMai.create({
      data: {
        ma,
        ten: 'Giam 10%',
        phamVi: PhamViKhuyenMai.PLATFORM,
        loaiGiam: LoaiGiamGiaKhuyenMai.PHAN_TRAM,
        donHangToiThieu: 200_000,
        giaTriGiam: 10,
        giamToiDa: 50_000,
        batDauLuc: new Date(now - 60_000),
        ketThucLuc: new Date(now + 3_600_000),
      },
    });

    const vuaDu = await service.danhGiaTheoMa(ma, {
      tongTienDonHang: 200_000,
      danhMucIds: [],
      sanPhamIds: [],
    });
    expect(vuaDu).toMatchObject({ hopLe: true, giaTriGiam: 20_000 });

    const biTran = await service.danhGiaTheoMa(ma, {
      tongTienDonHang: 600_000,
      danhMucIds: [],
      sanPhamIds: [],
    });
    // 10% cua 600k = 60k nhung tran 50k.
    expect(biTran).toMatchObject({ hopLe: true, giaTriGiam: 50_000 });
  });

  it('farm scope chi match dung trang trai', async () => {
    const now = Date.now();
    const ma = `FARM10-${suffix}`.slice(0, 80);
    maCodes.push(ma);
    await prisma.khuyenMai.create({
      data: {
        ma,
        ten: 'Uu dai trang trai',
        phamVi: PhamViKhuyenMai.TRANG_TRAI,
        trangTraiId: farmId,
        loaiGiam: LoaiGiamGiaKhuyenMai.SO_TIEN,
        giaTriGiam: 10_000,
        batDauLuc: new Date(now - 60_000),
        ketThucLuc: new Date(now + 3_600_000),
      },
    });

    const dung = await service.danhGiaTheoMa(ma, {
      tongTienDonHang: 100_000,
      danhMucIds: [],
      sanPhamIds: [productId],
      trangTraiIds: [farmId],
    });
    expect(dung).toMatchObject({ hopLe: true, giaTriGiam: 10_000 });

    const sai = await service.danhGiaTheoMa(ma, {
      tongTienDonHang: 100_000,
      danhMucIds: [],
      sanPhamIds: [productId],
      trangTraiIds: ['farm-khac'],
    });
    expect(sai).toMatchObject({ hopLe: false });
  });

  it('HTTP tao khuyen mai reject percent > 100, per-user > total, cap sai cho fixed', async () => {
    const now = Date.now();
    const base = {
      ten: 'Sai rule',
      phamVi: 'PLATFORM',
      loaiGiam: 'PHAN_TRAM',
      giaTriGiam: 101,
      batDauLuc: new Date(now).toISOString(),
      ketThucLuc: new Date(now + 3_600_000).toISOString(),
    };
    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ ...base, ma: `PCT-BAD-${suffix}`.slice(0, 80) })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ...base,
        ma: `PCT-PU-${suffix}`.slice(0, 80),
        loaiGiam: 'SO_TIEN',
        giaTriGiam: 10_000,
        gioiHanSuDung: 2,
        gioiHanMoiKhach: 3,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ...base,
        ma: `PCT-CAP-${suffix}`.slice(0, 80),
        loaiGiam: 'SO_TIEN',
        giaTriGiam: 10_000,
        giamToiDa: 5_000,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Farm ao',
        phamVi: 'TRANG_TRAI',
        loaiGiam: 'SO_TIEN',
        giaTriGiam: 5_000,
        ma: `PCT-FARM-${suffix}`.slice(0, 80),
        batDauLuc: new Date(now).toISOString(),
        ketThucLuc: new Date(now + 3_600_000).toISOString(),
        trangTraiId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);
  });

  it('HTTP tao khuyen mai percent + farm hop le, tra du field moi', async () => {
    const now = Date.now();
    const ma = `PCT-OK-${suffix}`.slice(0, 80);
    maCodes.push(ma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma,
        ten: 'Uu dai rau cu thang 10',
        phamVi: 'TRANG_TRAI',
        trangTraiId: farmId,
        loaiGiam: 'PHAN_TRAM',
        giaTriGiam: 10,
        giamToiDa: 50_000,
        donHangToiThieu: 200_000,
        gioiHanSuDung: 100,
        gioiHanMoiKhach: 2,
        batDauLuc: new Date(now - 60_000).toISOString(),
        ketThucLuc: new Date(now + 3_600_000).toISOString(),
      })
      .expect(201);
    expect(res.body).toMatchObject({
      ma: ma.toUpperCase(),
      phamVi: 'TRANG_TRAI',
      loaiGiam: 'PHAN_TRAM',
      giaTriGiam: 10,
      giamToiDa: 50_000,
      gioiHanMoiKhach: 2,
    });
  });

  it('sua muc flash sale: gia hop le, reject gia >= gia goc, reject body rong', async () => {
    const now = Date.now();
    const tao = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/flash-sale')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ten: `Chien dich sua muc ${suffix}`,
        batDauLuc: new Date(now - 60_000).toISOString(),
        ketThucLuc: new Date(now + 7 * 24 * 60 * 60_000).toISOString(),
      })
      .expect(201);
    campaignId = tao.body.id as string;

    const them = await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaignId}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantId, giaFlash: 40000, gioiHanTong: 10 })
      .expect(201);
    mucId = (() => {
      const muc = them.body.muc as Array<{ id: string }>;
      const cuoi = muc[muc.length - 1];
      if (!cuoi) throw new Error('Thieu muc flash sale trong response.');
      return cuoi.id;
    })();

    // Gia bang gia goc -> 400.
    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/muc/${mucId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ giaFlash: variantGiaGoc })
      .expect(400);

    // Body rong -> 400.
    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/muc/${mucId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(400);

    // Muc khong ton tai -> 404.
    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/muc/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ giaFlash: 30000 })
      .expect(404);

    // Hop le: doi gia + quota.
    const sua = await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/muc/${mucId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ giaFlash: 35000, gioiHanTong: 20, gioiHanMoiKhach: 2 })
      .expect(200);
    const muc = (sua.body.muc as Array<Record<string, unknown>>).find((m) => m['id'] === mucId);
    expect(muc?.['giaFlash']).toBe(35000);
    expect(muc?.['gioiHanTong']).toBe(20);
    expect(muc?.['gioiHanMoiKhach']).toBe(2);

    // Khach hang (khong quyen) khong duoc sua muc.
    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/muc/${mucId}`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ giaFlash: 30000 })
      .expect(403);
  });
});
