import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_E2E_MS = 90_000;

describe('Quản trị khuyến mãi V8B (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Promo-V8B';
  const emailKhach = `promo-customer-${suffix}@example.com`;
  const emailNhanVien = `promo-staff-${suffix}@example.com`;
  const emailAdmin = `promo-admin-${suffix}@example.com`;
  const ma = `V8B${Date.now().toString().slice(-8)}`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let khuyenMaiId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Promotion Admin V8B E2E' })
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
      if (khuyenMaiId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: { thucThe: 'khuyen_mai', thucTheId: khuyenMaiId },
        });
        await prisma.khuyenMai.deleteMany({ where: { id: khuyenMaiId } });
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

  it('khách hàng không được mở API quản trị khuyến mãi', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('nhân viên có thể tạo/list/sửa khuyến mãi nhưng không được khóa', async () => {
    const batDauLuc = new Date(Date.now() - 60_000).toISOString();
    const ketThucLuc = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();

    const created = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma: ma.toLowerCase(),
        ten: 'Khuyến mãi V8B E2E',
        phamVi: 'PLATFORM',
        donHangToiThieu: 100000,
        giaTriGiam: 20000,
        batDauLuc,
        ketThucLuc,
        gioiHanSuDung: 50,
      })
      .expect(201);

    khuyenMaiId = created.body.id as string;
    expect(created.body.ma).toBe(ma.toUpperCase());
    expect(created.body.phamVi).toBe('PLATFORM');
    expect(created.body.giaTriGiam).toBe(20000);

    const list = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/khuyen-mai')
      .query({ timKiem: ma, trang: 1, gioiHan: 20 })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(list.body.duLieu.some((item: { id: string }) => item.id === khuyenMaiId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/khuyen-mai/${khuyenMaiId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma,
        ten: 'Khuyến mãi V8B E2E đã sửa',
        phamVi: 'PLATFORM',
        donHangToiThieu: 150000,
        giaTriGiam: 25000,
        batDauLuc,
        ketThucLuc,
        gioiHanSuDung: 40,
      })
      .expect(200);
    expect(updated.body.giaTriGiam).toBe(25000);
    expect(updated.body.donHangToiThieu).toBe(150000);

    await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/khuyen-mai/${khuyenMaiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(403);
  });

  it('admin có thể khóa/mở và audit log được ghi', async () => {
    const disabled = await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/khuyen-mai/${khuyenMaiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'NGUNG_HOAT_DONG' })
      .expect(200);
    expect(disabled.body.trangThai).toBe('NGUNG_HOAT_DONG');

    const enabled = await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/khuyen-mai/${khuyenMaiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'HOAT_DONG' })
      .expect(200);
    expect(enabled.body.trangThai).toBe('HOAT_DONG');

    const audit = await prisma.nhatKyKiemToan.findMany({
      where: { thucThe: 'khuyen_mai', thucTheId: khuyenMaiId },
      select: { hanhDong: true },
    });
    expect(audit.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['KHUYEN_MAI_TAO', 'KHUYEN_MAI_SUA', 'KHUYEN_MAI_DOI_TRANG_THAI']),
    );
  });

  it('reject thời gian không hợp lệ và mã trùng', async () => {
    const now = new Date().toISOString();
    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ma: `${ma}-BAD-DATE`,
        ten: 'Sai thời gian',
        phamVi: 'PLATFORM',
        giaTriGiam: 1000,
        batDauLuc: now,
        ketThucLuc: now,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/quan-tri/khuyen-mai')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ma,
        ten: 'Trùng mã',
        phamVi: 'PLATFORM',
        giaTriGiam: 1000,
        batDauLuc: new Date(Date.now() - 60_000).toISOString(),
        ketThucLuc: new Date(Date.now() + 60_000).toISOString(),
      })
      .expect(409);
  });
});
