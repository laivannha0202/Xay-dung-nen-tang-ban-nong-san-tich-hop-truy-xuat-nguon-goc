import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 30_000;

describe('Nhật ký kiểm toán (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const emailAdmin = `audit-admin-${suffix}@example.com`;
  const emailMucTieu = `audit-target-${suffix}@example.com`;
  const matKhau = 'MatKhau-Audit-014';
  let adminId = '';
  let mucTieuId = '';
  let accessTokenAdmin = '';
  let accessTokenKhachHang = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of [emailAdmin, emailMucTieu]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Audit E2E PHIEN 014' })
        .expect(201);
    }

    const [admin, mucTieu] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailMucTieu } }),
    ]);
    adminId = admin.id;
    mucTieuId = mucTieu.id;

    const adminRole = await prisma.vaiTro.findUniqueOrThrow({
      where: { ma: 'ADMIN' },
      select: { id: true },
    });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: adminId, vaiTroId: adminRole.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailAdmin, matKhau, nenTang: 'MOBILE' })
      .expect(200);
    const loginKhach = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailMucTieu, matKhau, nenTang: 'MOBILE' })
      .expect(200);
    accessTokenAdmin = loginAdmin.body.accessToken as string;
    accessTokenKhachHang = loginKhach.body.accessToken as string;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (adminId) await prisma.nhatKyKiemToan.deleteMany({ where: { tacNhanId: adminId } });
      const ids = [adminId, mucTieuId].filter(Boolean);
      if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  }, THOI_GIAN_CHO_E2E_MS);

  it('KHACH_HANG xem audit nhận 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-kiem-toan')
      .set('Authorization', `Bearer ${accessTokenKhachHang}`)
      .expect(403);
  });

  it('gán role tạo audit snapshot + metadata, không chứa secret', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/phan-quyen/gan-vai-tro')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .set('User-Agent', 'AgriMarket-Audit-E2E')
      .send({ nguoiDungId: mucTieuId, maVaiTro: 'NHAN_VIEN' })
      .expect(201);

    const log = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: { tacNhanId: adminId, hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO' },
      orderBy: { createdAt: 'desc' },
    });

    expect(log.tacNhan).toBe(emailAdmin);
    expect(log.thucThe).toBe('nguoi_dung_vai_tro');
    expect(log.truoc).toEqual({ maVaiTro: 'NHAN_VIEN', trangThai: null });
    expect(log.sau).toEqual({ maVaiTro: 'NHAN_VIEN', trangThai: 'HOAT_DONG' });
    expect(log.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Audit-E2E',
        nguoiDungId: mucTieuId,
        maVaiTro: 'NHAN_VIEN',
      }),
    );

    const serialized = JSON.stringify(log).toLowerCase();
    for (const secretField of [
      'matkhau',
      'refreshtoken',
      'tokenhash',
      'mat_khau_hash',
      'refresh_token_hash',
    ]) {
      expect(serialized).not.toContain(secretField);
    }
  });

  it('ADMIN filter actor/action/entity/date được', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-kiem-toan')
      .query({
        tacNhan: emailAdmin,
        hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO',
        thucThe: 'nguoi_dung_vai_tro',
        tuNgay: '2020-01-01T00:00:00.000Z',
        denNgay: '2100-01-01T00:00:00.000Z',
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBeGreaterThanOrEqual(1);
    expect(response.body.duLieu[0]).toEqual(
      expect.objectContaining({
        tacNhanId: adminId,
        tacNhan: emailAdmin,
        hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO',
        thucThe: 'nguoi_dung_vai_tro',
      }),
    );

    const ngoaiKhoang = await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-kiem-toan')
      .query({
        tacNhan: emailAdmin,
        hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO',
        thucThe: 'nguoi_dung_vai_tro',
        denNgay: '2000-01-01T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .expect(200);

    expect(ngoaiKhoang.body.tong).toBe(0);
  });

  it('Audit API là read-only', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/nhat-ky-kiem-toan')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .delete('/api/v1/nhat-ky-kiem-toan/x')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .expect(404);
  });
});
