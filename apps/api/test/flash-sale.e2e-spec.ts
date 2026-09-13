import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';

const THOI_GIAN_E2E_MS = 120_000;
const NGAY_MS = 24 * 60 * 60_000;

describe('Flash sale thật (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-FlashSale-120';
  const emailKhach = `fs-khach-${suffix}@example.com`;
  const emailNhanVien = `fs-nhanvien-${suffix}@example.com`;
  const emailAdmin = `fs-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';

  let variantId = '';
  let variantGiaGoc = 0;
  let variantPhuId = '';
  let sanPhamId = '';

  const campaignIds: string[] = [];
  const domainIds = {
    supplier: '',
    farm: '',
    category: '',
    season: '',
    harvest: '',
    batch: '',
    warehouse: '',
    inventory: '',
    product: '',
    variant: '',
    variantPhu: '',
  };

  const taoChienDich = async (
    token: string,
    payload: Record<string, unknown>,
    expected = 201,
  ) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/flash-sale')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(expected);
    if (expected === 201) campaignIds.push(res.body.id as string);
    return res.body as { id: string };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Flash Sale E2E' })
        .expect(201);
    }

    const [khach, nhanVien, admin, roleNhanVien, roleAdmin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNhanVien } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;
    await prisma.nguoiDungVaiTro.createMany({
      data: [
        { nguoiDungId: nhanVienId, vaiTroId: roleNhanVien.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
        { nguoiDungId: adminId, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
      ],
    });

    const login = async (email: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'WEB' })
        .expect(200);
      return response.body.accessToken as string;
    };
    [tokenKhach, tokenNhanVien, tokenAdmin] = await Promise.all([
      login(emailKhach),
      login(emailNhanVien),
      login(emailAdmin),
    ]);

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-FS-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp Flash Sale' },
    });
    domainIds.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-FS-${suffix}`.slice(0, 50),
        ten: 'Trang trại Flash Sale',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    domainIds.farm = farm.id;

    const slug = `fs-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 191);
    const category = await prisma.danhMucSanPham.create({
      data: { ten: 'Danh mục Flash Sale', slug },
    });
    domainIds.category = category.id;

    const product = await prisma.sanPham.create({
      data: { ten: 'Sản phẩm Flash Sale', trangTraiId: farm.id, danhMucSanPhamId: category.id },
    });
    sanPhamId = product.id;
    domainIds.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `FS-P120-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1000,
        gia: 50000,
        donVi: 'g',
      },
    });
    variantId = variant.id;
    variantGiaGoc = Number(variant.gia);
    domainIds.variant = variant.id;

    const variantPhu = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `FS-P120-PHU-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 30000,
        donVi: 'g',
      },
    });
    variantPhuId = variantPhu.id;
    domainIds.variantPhu = variantPhu.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Flash Sale',
        giong: 'FS120',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 200,
      },
    });
    domainIds.season = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 200,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    domainIds.harvest = harvest.id;

    const expiry = new Date(Date.now() + 30 * NGAY_MS);
    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-FS-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    domainIds.batch = batch.id;

    const warehouse = await prisma.kho.create({
      data: { maKho: `KHO-FS-${suffix}`.slice(0, 50), ten: 'Kho Flash Sale', diaChi: 'Lâm Đồng' },
    });
    domainIds.warehouse = warehouse.id;

    // onHand 10 - reserved 3 - blocked 2 = khả dụng 5.
    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 10,
        reserved: 3,
        blocked: 2,
      },
    });
    domainIds.inventory = inventory.id;

    const inventoryPhu = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variantPhu.id,
        onHand: 20,
        reserved: 0,
        blocked: 0,
      },
    });
    void inventoryPhu;
  }, THOI_GIAN_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (campaignIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: { in: campaignIds } } });
        await prisma.mucFlashSale.deleteMany({ where: { chienDichId: { in: campaignIds } } });
        await prisma.chienDichFlashSale.deleteMany({ where: { id: { in: campaignIds } } });
      }
      if (domainIds.inventory) await prisma.tonKhoLo.deleteMany({ where: { khoId: domainIds.warehouse } });
      if (domainIds.batch) await prisma.loSanPham.deleteMany({ where: { id: domainIds.batch } });
      if (domainIds.harvest) await prisma.thuHoach.deleteMany({ where: { id: domainIds.harvest } });
      if (domainIds.season) await prisma.muaVu.deleteMany({ where: { id: domainIds.season } });
      if (domainIds.variant) await prisma.bienTheSanPham.deleteMany({ where: { sanPhamId: sanPhamId } });
      if (domainIds.product) await prisma.sanPham.deleteMany({ where: { id: domainIds.product } });
      if (domainIds.category) await prisma.danhMucSanPham.deleteMany({ where: { id: domainIds.category } });
      if (domainIds.warehouse) await prisma.kho.deleteMany({ where: { id: domainIds.warehouse } });
      if (domainIds.farm) await prisma.trangTrai.deleteMany({ where: { id: domainIds.farm } });
      if (domainIds.supplier) await prisma.nhaCungCap.deleteMany({ where: { id: domainIds.supplier } });
      const userIds = [khachId, nhanVienId, adminId].filter(Boolean);
      if (userIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { tacNhanId: { in: userIds } } });
        await prisma.nguoiDungVaiTro.deleteMany({ where: { nguoiDungId: { in: userIds } } });
        await prisma.khachHang.deleteMany({ where: { nguoiDungId: { in: userIds } } });
        await prisma.nguoiDung.deleteMany({ where: { id: { in: userIds } } });
      }
    }
    if (app) await app.close();
  }, THOI_GIAN_E2E_MS);

  it('khách hàng không được mở API quản trị flash sale', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/flash-sale')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('từ chối chiến dịch có thời gian kết thúc không sau bắt đầu', async () => {
    const now = Date.now();
    await taoChienDich(
      tokenAdmin,
      {
        ten: `Chiến dịch sai lịch ${suffix}`,
        batDauLuc: new Date(now + NGAY_MS).toISOString(),
        ketThucLuc: new Date(now + NGAY_MS).toISOString(),
      },
      400,
    );
  });

  it('chiến dịch đang diễn ra xuất hiện ở public active với giá tính server-side', async () => {
    const now = Date.now();
    const campaign = await taoChienDich(tokenNhanVien, {
      ten: `Flash sale đang chạy ${suffix}`,
      moTa: 'Chiến dịch e2e đang diễn ra',
      batDauLuc: new Date(now - 60_000).toISOString(),
      ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
    });

    const giaFlash = 40000;
    const chiTiet = await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ bienTheSanPhamId: variantId, giaFlash })
      .expect(201);
    expect(
      (chiTiet.body.muc as Array<{ bienTheSanPhamId: string }>).some(
        (m) => m.bienTheSanPhamId === variantId,
      ),
    ).toBe(true);

    const active = await request(app.getHttpServer())
      .get('/api/v1/flash-sale-cong-khai/active')
      .expect(200);
    expect(Array.isArray(active.body)).toBe(true);

    const found = (active.body as Array<{ id: string; muc: Array<Record<string, unknown>> }>).find(
      (c) => c.id === campaign.id,
    );
    expect(found).toBeDefined();
    const item = (found?.muc ?? []).find((m) => m['bienTheSanPhamId'] === variantId) as
      | {
          giaGoc: number;
          giaFlash: number;
          phanTramGiam: number;
          soLuongKhaDung: number;
          sanPhamId: string;
        }
      | undefined;
    expect(item).toBeDefined();
    // Giá gốc lấy từ backend, phần trăm suy ra server-side, tồn từ inventory thật.
    expect(item?.giaGoc).toBe(variantGiaGoc);
    expect(item?.giaFlash).toBe(giaFlash);
    expect(item?.phanTramGiam).toBe(Math.round(((variantGiaGoc - giaFlash) / variantGiaGoc) * 100));
    expect(item?.soLuongKhaDung).toBe(5);
    expect(item?.sanPhamId).toBe(sanPhamId);
  });

  it('từ chối giá flash không hợp lệ và mục trùng trong cùng chiến dịch', async () => {
    const now = Date.now();
    const campaign = await taoChienDich(tokenAdmin, {
      ten: `Flash sale validate giá ${suffix}`,
      batDauLuc: new Date(now - 60_000).toISOString(),
      ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
    });

    // Giá flash bằng giá gốc.
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantPhuId, giaFlash: 30000 })
      .expect(400);

    // Giá flash cao hơn giá gốc.
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantPhuId, giaFlash: 35000 })
      .expect(400);

    // Thêm hợp lệ một lần.
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantPhuId, giaFlash: 25000 })
      .expect(201);

    // Trùng biến thể trong cùng chiến dịch.
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantPhuId, giaFlash: 24000 })
      .expect(409);
  });

  it('từ chối biến thể đã có flash sale khác trùng thời gian', async () => {
    const now = Date.now();
    const campaign = await taoChienDich(tokenAdmin, {
      ten: `Flash sale trùng lịch ${suffix}`,
      batDauLuc: new Date(now - 60_000).toISOString(),
      ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
    });

    // variantId đã nằm trong chiến dịch đang chạy ở test trước (trùng thời gian).
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantId, giaFlash: 39000 })
      .expect(409);
  });

  it('chiến dịch chưa tới và đã kết thúc không xuất hiện ở public active', async () => {
    const now = Date.now();
    // Biến thể riêng để tránh rule chống trùng lịch với các chiến dịch đang chạy ở test trước.
    const variantRieng = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId,
        sku: `FS-P120-RIENG-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 750,
        gia: 40000,
        donVi: 'g',
      },
    });
    await prisma.tonKhoLo.create({
      data: {
        khoId: domainIds.warehouse,
        loSanPhamId: domainIds.batch,
        bienTheSanPhamId: variantRieng.id,
        onHand: 8,
        reserved: 0,
        blocked: 0,
      },
    });

    const tuongLai = await taoChienDich(tokenAdmin, {
      ten: `Flash sale tương lai ${suffix}`,
      batDauLuc: new Date(now + 30 * NGAY_MS).toISOString(),
      ketThucLuc: new Date(now + 37 * NGAY_MS).toISOString(),
    });
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${tuongLai.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantRieng.id, giaFlash: 30000 })
      .expect(201);

    const quaKhu = await taoChienDich(tokenAdmin, {
      ten: `Flash sale quá khứ ${suffix}`,
      batDauLuc: new Date(now - 8 * NGAY_MS).toISOString(),
      ketThucLuc: new Date(now - NGAY_MS).toISOString(),
    });
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${quaKhu.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantPhuId, giaFlash: 20000 })
      .expect(201);

    const active = await request(app.getHttpServer())
      .get('/api/v1/flash-sale-cong-khai/active')
      .expect(200);
    const idsActive = (active.body as Array<{ id: string }>).map((c) => c.id);
    expect(idsActive).not.toContain(tuongLai.id);
    expect(idsActive).not.toContain(quaKhu.id);
  });

  it('tạm dừng chiến dịch thì biến mất khỏi public active', async () => {
    const now = Date.now();
    const campaign = await taoChienDich(tokenAdmin, {
      ten: `Flash sale tạm dừng ${suffix}`,
      batDauLuc: new Date(now - 60_000).toISOString(),
      ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
    });

    // Dùng variantPhu nhưng ở khung giờ KHÔNG trùng các chiến dịch trên thì bị 409;
    // ở đây khung giờ trùng nên cần biến thể chưa dùng ở khung này -> tạo biến thể mới.
    const variantMoi = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId,
        sku: `FS-P120-MOI-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 250,
        gia: 20000,
        donVi: 'g',
      },
    });
    await prisma.tonKhoLo.create({
      data: {
        khoId: domainIds.warehouse,
        loSanPhamId: domainIds.batch,
        bienTheSanPhamId: variantMoi.id,
        onHand: 5,
        reserved: 0,
        blocked: 0,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaign.id}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantMoi.id, giaFlash: 15000 })
      .expect(201);

    const truocKhiDung = await request(app.getHttpServer())
      .get('/api/v1/flash-sale-cong-khai/active')
      .expect(200);
    expect(
      (truocKhiDung.body as Array<{ id: string }>).some((c) => c.id === campaign.id),
    ).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaign.id}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(200);

    const sauKhiDung = await request(app.getHttpServer())
      .get('/api/v1/flash-sale-cong-khai/active')
      .expect(200);
    expect(
      (sauKhiDung.body as Array<{ id: string }>).some((c) => c.id === campaign.id),
    ).toBe(false);
  });
});
