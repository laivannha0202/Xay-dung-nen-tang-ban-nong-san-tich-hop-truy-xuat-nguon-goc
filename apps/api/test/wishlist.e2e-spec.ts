import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Wishlist PHIEN-073 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Wishlist-073';
  const email = `wishlist-${suffix}@example.com`;
  const emailKhac = `wishlist-khac-${suffix}@example.com`;
  let token = '';
  let tokenKhac = '';
  let nguoiDungId = '';
  let nguoiDungKhacId = '';
  let khachHangId = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let danhMucId = '';
  let sanPhamId = '';
  let sanPhamKhoaId = '';

  const dangKyDangNhap = async (emailInput: string, hoTen: string) => {
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailInput, matKhau, hoTen })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailInput, matKhau, nenTang: 'MOBILE' })
      .expect(200);

    const user = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailInput } });
    return { token: login.body.accessToken as string, userId: user.id };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    const user = await dangKyDangNhap(email, 'Wishlist E2E 073');
    token = user.token;
    nguoiDungId = user.userId;
    khachHangId = (await prisma.khachHang.findUniqueOrThrow({ where: { nguoiDungId } })).id;

    const other = await dangKyDangNhap(emailKhac, 'Wishlist E2E khác');
    tokenKhac = other.token;
    nguoiDungKhacId = other.userId;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-W73-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Wishlist 073',
      },
    });
    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-W73-${suffix}`.slice(0, 50),
        ten: 'Trang trại Wishlist 073',
        diaChi: 'Lâm Đồng',
        nhaCungCapId,
      },
    });
    trangTraiId = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Wishlist 073',
        slug: `wishlist-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    danhMucId = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Cà chua Wishlist 073',
        moTa: 'Sản phẩm công khai dùng kiểm thử wishlist.',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
      },
    });
    sanPhamId = product.id;

    const locked = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm khóa Wishlist 073',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
      },
    });
    sanPhamKhoaId = locked.id;

    await prisma.bienTheSanPham.createMany({
      data: [
        {
          sanPhamId,
          sku: `W73-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
        {
          sanPhamId: sanPhamKhoaId,
          sku: `W73-X-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 1000,
          donVi: 'g',
        },
      ],
    });
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      await prisma.sanPhamYeuThich.deleteMany({
        where: { sanPhamId: { in: [sanPhamId, sanPhamKhoaId].filter(Boolean) } },
      });
      await prisma.bienTheSanPham.deleteMany({
        where: { sanPhamId: { in: [sanPhamId, sanPhamKhoaId].filter(Boolean) } },
      });
      await prisma.sanPham.deleteMany({
        where: { id: { in: [sanPhamId, sanPhamKhoaId].filter(Boolean) } },
      });
      if (danhMucId) await prisma.danhMucSanPham.deleteMany({ where: { id: danhMucId } });
      if (trangTraiId) await prisma.trangTrai.deleteMany({ where: { id: trangTraiId } });
      if (nhaCungCapId) await prisma.nhaCungCap.deleteMany({ where: { id: nhaCungCapId } });
      await prisma.nguoiDung.deleteMany({
        where: { id: { in: [nguoiDungId, nguoiDungKhacId].filter(Boolean) } },
      });
    }
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('yêu cầu access token', async () => {
    await request(app.getHttpServer()).get('/api/v1/khach-hang/yeu-thich').expect(401);
  });

  it('trạng thái ban đầu false và danh sách rỗng', async () => {
    const status = await request(app.getHttpServer())
      .get(`/api/v1/khach-hang/yeu-thich/${sanPhamId}/trang-thai`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(status.body).toMatchObject({ sanPhamId, daYeuThich: false });

    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/yeu-thich')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body).toEqual({ duLieu: [], tong: 0 });
  });

  it('PUT favorite idempotent và unique theo customer + product', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/yeu-thich/${sanPhamId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ sanPhamId, daYeuThich: true });

    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/yeu-thich/${sanPhamId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ sanPhamId, daYeuThich: true });

    expect(
      await prisma.sanPhamYeuThich.count({
        where: { khachHangId, sanPhamId },
      }),
    ).toBe(1);
  });

  it('list trả sản phẩm yêu thích của đúng customer', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/yeu-thich')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0]).toMatchObject({
      sanPhamId,
      ten: 'Cà chua Wishlist 073',
      tenTrangTrai: 'Trang trại Wishlist 073',
    });

    const other = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/yeu-thich')
      .set('Authorization', `Bearer ${tokenKhac}`)
      .expect(200);
    expect(other.body).toEqual({ duLieu: [], tong: 0 });
  });

  it('không favorite sản phẩm không còn công khai', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/yeu-thich/${sanPhamKhoaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('DELETE unfavorite idempotent và không ảnh hưởng customer khác', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/yeu-thich/${sanPhamId}`)
      .set('Authorization', `Bearer ${tokenKhac}`)
      .expect(200)
      .expect({ sanPhamId, daYeuThich: false });

    expect(
      await prisma.sanPhamYeuThich.count({
        where: { khachHangId, sanPhamId },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/yeu-thich/${sanPhamId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ sanPhamId, daYeuThich: false });

    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/yeu-thich/${sanPhamId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ sanPhamId, daYeuThich: false });

    const status = await request(app.getHttpServer())
      .get(`/api/v1/khach-hang/yeu-thich/${sanPhamId}/trang-thai`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(status.body.daYeuThich).toBe(false);
  });
});
