import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../src/generated/prisma/client';

const THOI_GIAN_E2E_MS = 180_000;
const NGAY_MS = 24 * 60 * 60_000;
const GIA_GOC = 50000;
const GIA_FLASH = 40000;
const SO_LUONG = 2;

/**
 * Luồng giá hiệu lực cuối:
 * Flash Sale -> price resolver -> Cart -> Checkout -> Order snapshot.
 * - Không flash => giá thường; có flash active => giá flash ở mọi tầng.
 * - Frontend không phải source of truth: donGiaDuKien sai => 400.
 * - Voucher áp trên subtotal đã flash (stack có thứ tự, không double-discount).
 */
describe('Giá hiệu lực flash sale tới cart/checkout/order (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-GiaHieuLuc-121';
  const emailKhach = `ghl-khach-${suffix}@example.com`;
  const emailAdmin = `ghl-admin-${suffix}@example.com`;

  let tokenKhach = '';
  let tokenAdmin = '';
  let variantId = '';
  let diaChiId = '';
  let campaignId = '';
  let khuyenMaiId = '';
  // Idempotency key phải duy nhất mỗi lần chạy: DB dùng chung giữ lại order
  // theo convention, key cố định sẽ 409 ở lần chạy thứ hai trở đi.
  const maYeuCauChotGia = randomUUID();
  const maYeuCauGiaCu = randomUUID();
  const auditIds: string[] = [];

  const cart = () =>
    request(app.getHttpServer())
      .get('/api/v1/gio-hang')
      .set('Authorization', `Bearer ${tokenKhach}`);

  const preview = (query: Record<string, string> = {}) =>
    request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .query(query);

  const taoDon = (maYeuCau: string, donGiaDuKien: number, extra: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        maYeuCau,
        diaChiGiaoHangId: diaChiId,
        items: [{ bienTheSanPhamId: variantId, soLuong: SO_LUONG, donGiaDuKien }],
        ...extra,
      });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Gia Hieu Luc E2E' })
        .expect(201);
    }
    const [khach, admin, roleAdmin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    await prisma.nguoiDungVaiTro.create({
      data: {
        nguoiDungId: admin.id,
        vaiTroId: roleAdmin.id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'WEB' })
        .expect(200);
      return res.body.accessToken as string;
    };
    tokenKhach = await login(emailKhach);
    tokenAdmin = await login(emailAdmin);
    void khach;

    const diaChi = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        tenNguoiNhan: 'Khách Giá Hiệu Lực',
        soDienThoai: '0912345678',
        dongDiaChi: '12 Phố Hiến',
        phuongXa: 'Phường Phố Hiến',
        tinhThanh: 'Hưng Yên',
        macDinh: true,
      })
      .expect(201);
    diaChiId = diaChi.body.id as string;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-GHL-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp giá hiệu lực' },
    });
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-GHL-${suffix}`.slice(0, 50),
        ten: 'Trang trại giá hiệu lực',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    const slug = `ghl-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);
    const category = await prisma.danhMucSanPham.create({
      data: { ten: 'Danh mục giá hiệu lực', slug },
    });
    const product = await prisma.sanPham.create({
      data: { ten: 'Sản phẩm giá hiệu lực', trangTraiId: farm.id, danhMucSanPhamId: category.id },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `GHL-P121-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1000,
        gia: GIA_GOC,
        donVi: 'g',
      },
    });
    variantId = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau giá hiệu lực',
        giong: 'GHL121',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 200,
      },
    });
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 200,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-GHL-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: new Date(Date.now() + 30 * NGAY_MS),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-GHL-${suffix}`.slice(0, 50),
        ten: 'Kho giá hiệu lực',
        diaChi: 'Lâm Đồng',
      },
    });
    await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 50,
        reserved: 0,
        blocked: 0,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ bienTheSanPhamId: variantId, soLuong: SO_LUONG })
      .expect(201);
  }, THOI_GIAN_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (campaignId) {
        const muc = await prisma.mucFlashSale.findMany({
          where: { chienDichId: campaignId },
          select: { id: true },
        });
        const mucIds = muc.map((m) => m.id);
        if (mucIds.length) {
          await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: { in: mucIds } } });
        }
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: campaignId } });
        await prisma.mucFlashSale.deleteMany({ where: { chienDichId: campaignId } });
        await prisma.chienDichFlashSale.deleteMany({ where: { id: campaignId } });
      }
      if (khuyenMaiId) {
        await prisma.khachHangKhuyenMai.deleteMany({ where: { khuyenMaiId } });
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: khuyenMaiId } });
        await prisma.khuyenMai.deleteMany({ where: { id: khuyenMaiId } });
      }
      if (auditIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: { in: auditIds } } });
      }
    }
    // Chuỗi đơn hàng/tồn kho để lại theo convention create-order (DB validation disposable).
    if (app) await app.close();
  }, THOI_GIAN_E2E_MS);

  it('chưa có flash => cart và preview dùng giá thường', async () => {
    const res = await cart().expect(200);
    const muc = res.body.muc[0].bienThe as {
      giaHienTai: number;
      giaGoc: number;
      loaiGia: string;
    };
    expect(muc.giaHienTai).toBe(GIA_GOC);
    expect(muc.giaGoc).toBe(GIA_GOC);
    expect(muc.loaiGia).toBe('NORMAL');

    const prev = await preview({ diaChiGiaoHangId: diaChiId }).expect(200);
    expect(prev.body.items[0].donGia).toBe(GIA_GOC);
    expect(prev.body.items[0].thanhTien).toBe(GIA_GOC * SO_LUONG);
  });

  it('flash active => public active, cart, preview cùng một giá flash', async () => {
    const now = Date.now();
    const created = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/flash-sale')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ten: `Flash giá hiệu lực ${suffix}`,
        batDauLuc: new Date(now - 60_000).toISOString(),
        ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
      })
      .expect(201);
    campaignId = created.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/flash-sale/${campaignId}/muc`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ bienTheSanPhamId: variantId, giaFlash: GIA_FLASH })
      .expect(201);

    const active = await request(app.getHttpServer())
      .get('/api/v1/flash-sale-cong-khai/active')
      .expect(200);
    const item = (active.body as Array<{ id: string; muc: Array<{ bienTheSanPhamId: string }> }>)
      .find((c) => c.id === campaignId)
      ?.muc.find((m) => m.bienTheSanPhamId === variantId) as
      { giaGoc: number; giaFlash: number } | undefined;
    expect(item?.giaFlash).toBe(GIA_FLASH);
    expect(item?.giaGoc).toBe(GIA_GOC);

    const res = await cart().expect(200);
    const muc = res.body.muc[0].bienThe as {
      giaHienTai: number;
      giaGoc: number;
      loaiGia: string;
    };
    expect(muc.giaHienTai).toBe(GIA_FLASH);
    expect(muc.giaGoc).toBe(GIA_GOC);
    expect(muc.loaiGia).toBe('FLASH_SALE');

    const prev = await preview({ diaChiGiaoHangId: diaChiId }).expect(200);
    expect(prev.body.items[0].donGia).toBe(GIA_FLASH);
    expect(prev.body.items[0].giaGoc).toBe(GIA_GOC);
    expect(prev.body.items[0].thanhTien).toBe(GIA_FLASH * SO_LUONG);
    expect(prev.body.price.tamTinhHangHoa).toBe(GIA_FLASH * SO_LUONG);
  });

  it('create order snapshot đúng giá flash, không tin giá frontend', async () => {
    const created = await taoDon(maYeuCauChotGia, GIA_FLASH).expect(201);
    const suborder = created.body.donNhaCungCap[0] as {
      tamTinh: number;
      muc: Array<{ donGiaSnapshot: number; soLuong: number }>;
    };
    expect(suborder.muc[0]?.donGiaSnapshot).toBe(GIA_FLASH);
    expect(suborder.muc[0]?.soLuong).toBe(SO_LUONG);
    expect(suborder.tamTinh).toBe(GIA_FLASH * SO_LUONG);
  });

  it('donGiaDuKien theo giá cũ bị từ chối 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ bienTheSanPhamId: variantId, soLuong: SO_LUONG })
      .expect(201);

    await taoDon(maYeuCauGiaCu, GIA_GOC).expect(400);
  });

  it('voucher áp trên subtotal đã flash, không double-discount', async () => {
    const now = Date.now();
    const ma = `GHL${Date.now().toString().slice(-8)}`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ma,
        ten: 'Voucher stack sau flash',
        phamVi: 'PLATFORM',
        donHangToiThieu: 0,
        giaTriGiam: 10000,
        batDauLuc: new Date(now - 60_000).toISOString(),
        ketThucLuc: new Date(now + 7 * NGAY_MS).toISOString(),
        gioiHanSuDung: 10,
      })
      .expect(201);
    khuyenMaiId = created.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/khach-hang/khuyen-mai/${khuyenMaiId}/luu`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(201);

    const prev = await preview({ diaChiGiaoHangId: diaChiId, maKhuyenMai: ma }).expect(200);
    expect(prev.body.promotion.trangThai).toBe('DA_TINH');
    expect(prev.body.promotion.giaTri).toBe(10000);
    // Subtotal đã là giá flash; voucher trừ tiếp đúng 1 lần trên subtotal đó.
    expect(prev.body.price.tamTinhHangHoa).toBe(GIA_FLASH * SO_LUONG);
    expect(prev.body.total.tongThanhToan).toBe(
      GIA_FLASH * SO_LUONG - 10000 + prev.body.shipping.giaTri,
    );
  });

  it('tạm dừng flash => cart và preview trở lại giá thường', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/flash-sale/${campaignId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(200);

    const res = await cart().expect(200);
    const muc = res.body.muc[0].bienThe as { giaHienTai: number; loaiGia: string };
    expect(muc.giaHienTai).toBe(GIA_GOC);
    expect(muc.loaiGia).toBe('NORMAL');

    const prev = await preview({ diaChiGiaoHangId: diaChiId }).expect(200);
    expect(prev.body.items[0].donGia).toBe(GIA_GOC);
  });
});
