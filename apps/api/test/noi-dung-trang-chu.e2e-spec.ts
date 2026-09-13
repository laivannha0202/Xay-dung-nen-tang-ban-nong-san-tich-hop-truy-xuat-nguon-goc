import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_E2E_MS = 90_000;

describe('Nội dung trang chủ (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-NoiDung-120';
  const emailKhach = `ndtc-khach-${suffix}@example.com`;
  const emailNhanVien = `ndtc-nhanvien-${suffix}@example.com`;
  const emailAdmin = `ndtc-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';

  const ids: string[] = [];

  const taoNoiDung = async (payload: Record<string, unknown>) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(payload)
      .expect(201);
    ids.push(res.body.id as string);
    return res.body as { id: string; thuTu: number; tieuDe: string };
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
        .send({ email, matKhau, hoTen: 'Noi Dung Trang Chu E2E' })
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
  }, THOI_GIAN_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (ids.length) {
        await prisma.nhatKyKiemToan.deleteMany({ where: { thucTheId: { in: ids } } });
        await prisma.noiDungTrangChu.deleteMany({ where: { id: { in: ids } } });
      }
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

  it('public API không cần auth và chỉ trả nội dung đang hiển thị, đúng thứ tự', async () => {
    const bannerSau = await taoNoiDung({
      loai: 'BANNER',
      tieuDe: `Banner sau ${suffix}`,
      viTri: 'HERO',
      thuTu: 5,
      hienThi: true,
      anhUrl: '/banners/sau.png',
      duongDan: '/san-pham',
    });
    const bannerTruoc = await taoNoiDung({
      loai: 'BANNER',
      tieuDe: `Banner trước ${suffix}`,
      viTri: 'RIGHT_TOP',
      thuTu: 0,
      hienThi: true,
      anhUrl: '/banners/truoc.png',
      duongDan: '/san-pham',
    });
    const kienThuc = await taoNoiDung({
      loai: 'KIEN_THUC',
      tieuDe: `Kiến thức ${suffix}`,
      nhan: 'Dinh dưỡng',
      moTa: 'Mô tả ngắn kiến thức nông sản.',
      thuTu: 0,
      hienThi: true,
      duongDan: '/kien-thuc/rau-sach',
    });
    void kienThuc;

    // Nội dung bị ẩn: public không được thấy.
    await taoNoiDung({
      loai: 'BANNER',
      tieuDe: `Banner ẩn ${suffix}`,
      thuTu: 0,
      hienThi: false,
    });
    // Nội dung lên lịch tương lai: public không được thấy.
    await taoNoiDung({
      loai: 'KIEN_THUC',
      tieuDe: `Kiến thức tương lai ${suffix}`,
      thuTu: 0,
      hienThi: true,
      batDauLuc: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    });
    // Nội dung đã hết hạn: public không được thấy.
    await taoNoiDung({
      loai: 'CAU_CHUYEN_TRANG_TRAI',
      tieuDe: `Câu chuyện hết hạn ${suffix}`,
      thuTu: 0,
      hienThi: true,
      ketThucLuc: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/noi-dung-trang-chu-cong-khai')
      .expect(200);

    expect(Array.isArray(res.body.banners)).toBe(true);
    expect(Array.isArray(res.body.kienThuc)).toBe(true);
    expect(Array.isArray(res.body.cauChuyenTrangTrai)).toBe(true);

    const tieuDeBanners = (res.body.banners as Array<{ tieuDe: string }>).map((b) => b.tieuDe);
    expect(tieuDeBanners).toContain(`Banner trước ${suffix}`);
    expect(tieuDeBanners).toContain(`Banner sau ${suffix}`);
    expect(tieuDeBanners).not.toContain(`Banner ẩn ${suffix}`);
    // Sắp xếp theo thuTu tăng dần.
    expect(tieuDeBanners.indexOf(`Banner trước ${suffix}`)).toBeLessThan(
      tieuDeBanners.indexOf(`Banner sau ${suffix}`),
    );

    const tieuDeKienThuc = (res.body.kienThuc as Array<{ tieuDe: string }>).map((k) => k.tieuDe);
    expect(tieuDeKienThuc).toContain(`Kiến thức ${suffix}`);
    expect(tieuDeKienThuc).not.toContain(`Kiến thức tương lai ${suffix}`);

    const tieuDeCauChuyen = (res.body.cauChuyenTrangTrai as Array<{ tieuDe: string }>).map(
      (c) => c.tieuDe,
    );
    expect(tieuDeCauChuyen).not.toContain(`Câu chuyện hết hạn ${suffix}`);

    void bannerSau;
    void bannerTruoc;
  });

  it('public API hỗ trợ lọc theo loại nội dung', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/noi-dung-trang-chu-cong-khai')
      .query({ loai: 'BANNER' })
      .expect(200);
    expect((res.body.banners as unknown[]).length).toBeGreaterThan(0);
    expect(res.body.kienThuc).toEqual([]);
    expect(res.body.cauChuyenTrangTrai).toEqual([]);
  });

  it('khách hàng không được mở API quản trị nội dung', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('nhân viên được tạo/sửa nhưng không được ẩn-hiện', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        loai: 'CAU_CHUYEN_TRANG_TRAI',
        tieuDe: `Câu chuyện nhân viên ${suffix}`,
        thuTu: 1,
        hienThi: true,
      })
      .expect(201);
    ids.push(created.body.id as string);

    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/noi-dung-trang-chu/${created.body.id as string}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        loai: 'CAU_CHUYEN_TRANG_TRAI',
        tieuDe: `Câu chuyện nhân viên đã sửa ${suffix}`,
        thuTu: 2,
        hienThi: true,
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/noi-dung-trang-chu/${created.body.id as string}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ hienThi: false })
      .expect(403);
  });

  it('admin ẩn/hiện được và public phản ánh đúng', async () => {
    const created = await taoNoiDung({
      loai: 'KIEN_THUC',
      tieuDe: `Kiến thức ẩn-hiện ${suffix}`,
      thuTu: 0,
      hienThi: true,
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/noi-dung-trang-chu/${created.id}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ hienThi: false })
      .expect(200);

    const afterHide = await request(app.getHttpServer())
      .get('/api/v1/noi-dung-trang-chu-cong-khai')
      .query({ loai: 'KIEN_THUC' })
      .expect(200);
    const titlesHidden = (afterHide.body.kienThuc as Array<{ tieuDe: string }>).map(
      (k) => k.tieuDe,
    );
    expect(titlesHidden).not.toContain(`Kiến thức ẩn-hiện ${suffix}`);

    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/noi-dung-trang-chu/${created.id}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ hienThi: true })
      .expect(200);

    const afterShow = await request(app.getHttpServer())
      .get('/api/v1/noi-dung-trang-chu-cong-khai')
      .query({ loai: 'KIEN_THUC' })
      .expect(200);
    const titlesShown = (afterShow.body.kienThuc as Array<{ tieuDe: string }>).map(
      (k) => k.tieuDe,
    );
    expect(titlesShown).toContain(`Kiến thức ẩn-hiện ${suffix}`);
  });

  it('validation: từ chối tiêu đề ngắn, URL lạ, lịch ngược, vị trí banner sai', async () => {
    const base = {
      loai: 'BANNER',
      tieuDe: `Banner hợp lệ ${suffix}`,
      viTri: 'HERO',
      thuTu: 0,
      hienThi: true,
    };

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...base, tieuDe: 'A' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...base, anhUrl: 'ftp://example.com/a.png' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ...base,
        batDauLuc: new Date(Date.now() + 48 * 60 * 60_000).toISOString(),
        ketThucLuc: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/noi-dung-trang-chu')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...base, viTri: 'SIDEBAR' })
      .expect(400);
  });
});
