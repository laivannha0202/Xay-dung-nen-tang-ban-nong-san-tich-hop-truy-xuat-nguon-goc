import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';

jest.setTimeout(120_000);

describe('PHIEN-078 Nhân viên quản trị (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminId = '';
  let outsiderId = '';
  let adminRoleId = '';
  let adminToken = '';
  let outsiderToken = '';
  let employeeId = '';
  let employeeUserId = '';
  let suffix = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const quyenQuanLy = await prisma.quyen.findFirst({
      where: { ma: 'phan_quyen.quan_ly' },
      select: { id: true },
    });
    if (!quyenQuanLy) throw new Error('Thiếu quyền phan_quyen.quan_ly.');

    for (const ma of ['NHAN_VIEN', 'ADMIN']) {
      const role = await prisma.vaiTro.findFirst({
        where: { ma, trangThai: TrangThaiBanGhi.HOAT_DONG },
        select: { id: true },
      });
      if (!role) throw new Error(`Thiếu role nền tảng ${ma}.`);
    }

    const adminRole = await prisma.vaiTro.create({
      data: { ma: `P78_ADMIN_${suffix}`.slice(0, 50), ten: 'Admin E2E PHIEN 078' },
    });
    adminRoleId = adminRole.id;
    await prisma.vaiTroQuyen.create({
      data: { vaiTroId: adminRole.id, quyenId: quyenQuanLy.id },
    });

    const admin = await prisma.nguoiDung.create({
      data: {
        email: `admin-p78-${suffix}@test.local`,
        matKhauHash: 'unused',
        hoTen: 'Admin PHIEN 078',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    adminId = admin.id;
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: adminRole.id },
    });

    const outsider = await prisma.nguoiDung.create({
      data: {
        email: `outside-p78-${suffix}@test.local`,
        matKhauHash: 'unused',
        hoTen: 'Outside PHIEN 078',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    outsiderId = outsider.id;

    const secret =
      process.env.JWT_ACCESS_SECRET ||
      'agrimarket-local-access-secret-change-before-production-012';
    adminToken = await jwt.signAsync({ sub: admin.id, loai: 'access' }, { secret });
    outsiderToken = await jwt.signAsync({ sub: outsider.id, loai: 'access' }, { secret });
  });

  afterAll(async () => {
    if (prisma) {
      if (employeeId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: { thucThe: 'nhan_vien', thucTheId: employeeId },
        });
      }
      await prisma.nguoiDung.deleteMany({
        where: { id: { in: [adminId, outsiderId, employeeUserId].filter(Boolean) } },
      });
      if (adminRoleId) await prisma.vaiTro.deleteMany({ where: { id: adminRoleId } });
    }
    if (app) await app.close();
  });

  it('yêu cầu JWT + phan_quyen.quan_ly', async () => {
    await request(app.getHttpServer()).get('/api/v1/quan-tri/nhan-vien').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/nhan-vien')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('create tự gán NHAN_VIEN, list/search + detail hoạt động', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/quan-tri/nhan-vien')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `staff-p78-${suffix}@test.local`,
        matKhau: 'MatKhauP78!123',
        hoTen: 'Nhân viên PHIEN 078',
        soDienThoai: `08${String(Date.now()).slice(-8)}`,
        maNhanVien: `NV78-${suffix}`.slice(0, 50),
        chucDanh: 'Vận hành',
      })
      .expect(201);
    employeeId = created.body.id;
    employeeUserId = created.body.nguoiDungId;
    expect(created.body.vaiTro).toContain('NHAN_VIEN');

    const list = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/nhan-vien?timKiem=PHIEN%20078')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.items.some((item: { id: string }) => item.id === employeeId)).toBe(true);

    await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/nhan-vien/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('edit cập nhật thông tin và ghi audit', async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/nhan-vien/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hoTen: 'Nhân viên PHIEN 078 Updated', chucDanh: 'Điều phối' })
      .expect(200);
    expect(updated.body).toMatchObject({
      hoTen: 'Nhân viên PHIEN 078 Updated',
      chucDanh: 'Điều phối',
    });
    expect(
      await prisma.nhatKyKiemToan.count({
        where: {
          thucThe: 'nhan_vien',
          thucTheId: employeeId,
          hanhDong: 'NHAN_VIEN_CAP_NHAT',
        },
      }),
    ).toBe(1);
  });

  it('role assignment dùng role hiện có', async () => {
    const options = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/nhan-vien/vai-tro-kha-dung')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(options.body.items.map((item: { ma: string }) => item.ma)).toEqual(
      expect.arrayContaining(['NHAN_VIEN', 'ADMIN']),
    );
    expect(options.body.items.map((item: { ma: string }) => item.ma)).not.toContain('KHACH_HANG');

    const result = await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/nhan-vien/${employeeId}/vai-tro`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maVaiTro: ['NHAN_VIEN', 'ADMIN'] })
      .expect(200);
    expect(result.body.vaiTro).toEqual(['ADMIN', 'NHAN_VIEN']);
  });

  it('reset password Argon2id + revoke session + invalidate reset token', async () => {
    const session = await prisma.phienDangNhap.create({
      data: {
        nguoiDungId: employeeUserId,
        refreshTokenHash: 'unused',
        hetHanLuc: new Date(Date.now() + 86_400_000),
      },
    });
    const reset = await prisma.yeuCauDatLaiMatKhau.create({
      data: {
        nguoiDungId: employeeUserId,
        tokenHash: `p78-${suffix}`,
        hetHanLuc: new Date(Date.now() + 3_600_000),
      },
    });
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/nhan-vien/${employeeId}/dat-lai-mat-khau`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ matKhauMoi: 'MatKhauMoiP78!456' })
      .expect(200);

    const [user, sessionAfter, resetAfter] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { id: employeeUserId } }),
      prisma.phienDangNhap.findUniqueOrThrow({ where: { id: session.id } }),
      prisma.yeuCauDatLaiMatKhau.findUniqueOrThrow({ where: { id: reset.id } }),
    ]);
    expect(await argon2.verify(user.matKhauHash, 'MatKhauMoiP78!456')).toBe(true);
    expect(sessionAfter.thuHoiLuc).not.toBeNull();
    expect(resetAfter.daDungLuc).not.toBeNull();
  });

  it('lock idempotent, TAM_KHOA + revoke session + audit', async () => {
    const session = await prisma.phienDangNhap.create({
      data: {
        nguoiDungId: employeeUserId,
        refreshTokenHash: 'unused-after-reset',
        hetHanLuc: new Date(Date.now() + 86_400_000),
      },
    });
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/nhan-vien/${employeeId}/khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/nhan-vien/${employeeId}/khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const [user, sessionAfter, audits] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { id: employeeUserId } }),
      prisma.phienDangNhap.findUniqueOrThrow({ where: { id: session.id } }),
      prisma.nhatKyKiemToan.count({
        where: {
          thucThe: 'nhan_vien',
          thucTheId: employeeId,
          hanhDong: 'NHAN_VIEN_KHOA',
        },
      }),
    ]);
    expect(user.trangThai).toBe(TrangThaiNguoiDung.TAM_KHOA);
    expect(sessionAfter.thuHoiLuc).not.toBeNull();
    expect(audits).toBe(1);
  });
});
