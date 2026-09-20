import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { LoaiPhieuKho, TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

describe('Phiếu kho V16 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let datChoTonKho: DatChoTonKhoService;
  let tokenAdmin = '';
  let adminId = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-V16-PhieuKho';
  const emailAdmin = `v16-phieu-kho-${suffix}@example.com`;
  const ids = {
    batch: '',
    variant: '',
    khoA: '',
    khoB: '',
    inventoryA: '',
    inventoryB: '',
  };
  let maKhoA = '';
  let maKhoB = '';
  let maLo = '';
  let sku = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    datChoTonKho = app.get(DatChoTonKhoService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailAdmin, matKhau, hoTen: 'Admin V16 Phiếu Kho' })
      .expect(201);
    const admin = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } });
    adminId = admin.id;
    const roleAdmin = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailAdmin, matKhau, nenTang: 'MOBILE' })
      .expect(200);
    tokenAdmin = login.body.accessToken as string;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-V16-PK-${suffix}`.slice(0, 50), ten: 'NCC V16 Phiếu Kho' },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-V16-PK-${suffix}`.slice(0, 50),
        ten: 'Trang trại V16 Phiếu Kho',
        diaChi: 'Hưng Yên',
        nhaCungCapId: supplier.id,
      },
    });
    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau V16',
        giong: 'V16',
        ngayTrong: new Date('2026-07-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-09-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-09-01T00:00:00.000Z'),
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const expiry = new Date();
    expiry.setUTCDate(expiry.getUTCDate() + 30);
    maLo = `LO-V16-PK-${suffix}`.slice(0, 100);
    const batch = await prisma.loSanPham.create({
      data: {
        maLo,
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    ids.batch = batch.id;
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục V16 PK ${suffix}`.slice(0, 150),
        slug: `v16-pk-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    const product = await prisma.sanPham.create({
      data: { ten: 'Rau V16 Phiếu Kho', trangTraiId: farm.id, danhMucSanPhamId: category.id },
    });
    sku = `V16-PK-${suffix}`.slice(0, 100).toUpperCase();
    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku, khoiLuong: 1, gia: 25000, donVi: 'kg' },
    });
    ids.variant = variant.id;
    maKhoA = `KHO-A-V16-${suffix}`.slice(0, 50);
    maKhoB = `KHO-B-V16-${suffix}`.slice(0, 50);
    const [khoA, khoB] = await Promise.all([
      prisma.kho.create({ data: { maKho: maKhoA, ten: 'Kho A V16', diaChi: 'Hưng Yên' } }),
      prisma.kho.create({ data: { maKho: maKhoB, ten: 'Kho B V16', diaChi: 'Hưng Yên' } }),
    ]);
    ids.khoA = khoA.id;
    ids.khoB = khoB.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('PNK/PXK/PCK/PDC đều được tạo cùng ledger', async () => {
    const nhap = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ khoId: ids.khoA, loSanPhamId: ids.batch, bienTheSanPhamId: ids.variant, soLuong: 10 })
      .expect(201);
    ids.inventoryA = nhap.body.tonKho.id as string;

    await request(app.getHttpServer())
      .post('/api/v1/ton-kho/xuat')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoId: ids.inventoryA, soLuong: 1 })
      .expect(201);

    const chuyen = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/chuyen')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tonKhoLoIdNguon: ids.inventoryA, khoDichId: ids.khoB, soLuong: 2 })
      .expect(201);
    ids.inventoryB = chuyen.body.dich.id as string;

    const current = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: ids.inventoryA } });
    await request(app.getHttpServer())
      .post(`/api/v1/ton-kho/${ids.inventoryA}/dieu-chinh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ onHandMoi: Number(current.onHand) - 1, lyDo: 'Kiểm kê V16' })
      .expect(201);

    const docs = await prisma.phieuKho.findMany({
      where: { nguoiLapId: adminId },
      select: { loai: true },
    });
    const types = new Set(docs.map((item) => item.loai));
    expect(types.has(LoaiPhieuKho.NHAP)).toBe(true);
    expect(types.has(LoaiPhieuKho.XUAT)).toBe(true);
    expect(types.has(LoaiPhieuKho.CHUYEN)).toBe(true);
    expect(types.has(LoaiPhieuKho.DIEU_CHINH)).toBe(true);
  });

  it('ORDER_SHIP nhiều kho sinh một PXK cho từng kho nguồn', async () => {
    await prisma.tonKhoLo.update({
      where: { id: ids.inventoryA },
      data: { reserved: { increment: 1 } },
    });
    await prisma.tonKhoLo.update({
      where: { id: ids.inventoryB },
      data: { reserved: { increment: 1 } },
    });

    const ref = `V16-MULTI-WH-${suffix}`;
    const reservation = await prisma.datChoTonKho.create({
      data: { maThamChieu: ref, hetHanLuc: new Date(Date.now() + 60_000) },
    });
    await prisma.mucDatChoTonKho.createMany({
      data: [
        { datChoTonKhoId: reservation.id, tonKhoLoId: ids.inventoryA, soLuong: 1, thuTu: 0 },
        { datChoTonKhoId: reservation.id, tonKhoLoId: ids.inventoryB, soLuong: 1, thuTu: 1 },
      ],
    });

    await datChoTonKho.xacNhanDaBan(reservation.id);

    const docs = await prisma.phieuKho.findMany({
      where: { maThamChieu: ref, loai: LoaiPhieuKho.XUAT },
      include: { dong: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(docs).toHaveLength(2);
    expect(new Set(docs.map((item) => item.khoNguonId))).toEqual(new Set([ids.khoA, ids.khoB]));
    for (const doc of docs) {
      expect(doc.khoNguonId).not.toBeNull();
      expect(doc.dong.length).toBeGreaterThan(0);
      expect(doc.dong.every((line) => line.khoIdSnapshot === doc.khoNguonId)).toBe(true);
    }
  });

  it('API filter kho/lô/SKU/người lập/trạng thái/số lượng/ngày và detail ledger hoạt động', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const list = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/phieu-kho')
      .query({
        maKho: maKhoA,
        maLo,
        sku,
        nguoiLap: emailAdmin,
        trangThai: 'DA_GHI_SO',
        soLuongTu: 0.5,
        soLuongDen: 100,
        tuNgay: today,
        denNgay: today,
        trang: 1,
        gioiHan: 100,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(list.body.tong).toBeGreaterThan(0);

    const id = list.body.duLieu[0].id as string;
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/phieu-kho/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(detail.body.dong.length).toBeGreaterThan(0);
    expect(detail.body.dong.some((line: { giaoDich: unknown[] }) => line.giaoDich.length > 0)).toBe(
      true,
    );
  });

  it('API phiếu kho bắt buộc auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/quan-tri/phieu-kho').expect(401);
  });
});
