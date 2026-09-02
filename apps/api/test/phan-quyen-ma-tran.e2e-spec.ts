import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';

jest.setTimeout(120_000);

describe('PHIEN-079 Permission Matrix (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminId = '';
  let outsiderId = '';
  let adminRoleId = '';
  let testRoleId = '';
  let builtinAdminRoleId = '';
  let adminToken = '';
  let outsiderToken = '';
  let suffix = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const permissionManage = await prisma.quyen.findFirst({
      where: { ma: 'phan_quyen.quan_ly', trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: { id: true },
    });
    const builtinAdmin = await prisma.vaiTro.findFirst({
      where: { ma: 'ADMIN', trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: { id: true },
    });
    if (!permissionManage || !builtinAdmin) throw new Error('Thiếu RBAC foundation PHIEN-079.');
    builtinAdminRoleId = builtinAdmin.id;

    const adminRole = await prisma.vaiTro.create({
      data: { ma: `P79_ADMIN_${suffix}`.slice(0, 50), ten: 'Admin test PHIEN 079' },
    });
    adminRoleId = adminRole.id;
    await prisma.vaiTroQuyen.create({
      data: { vaiTroId: adminRole.id, quyenId: permissionManage.id },
    });

    const testRole = await prisma.vaiTro.create({
      data: { ma: `P79_ROLE_${suffix}`.slice(0, 50), ten: 'Role matrix PHIEN 079' },
    });
    testRoleId = testRole.id;

    const admin = await prisma.nguoiDung.create({
      data: {
        email: `admin-p79-${suffix}@test.local`,
        matKhauHash: 'unused',
        hoTen: 'Admin PHIEN 079',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    adminId = admin.id;
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: adminRole.id },
    });

    const outsider = await prisma.nguoiDung.create({
      data: {
        email: `outside-p79-${suffix}@test.local`,
        matKhauHash: 'unused',
        hoTen: 'Outside PHIEN 079',
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
      if (testRoleId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: { thucThe: 'vai_tro', thucTheId: testRoleId },
        });
      }
      await prisma.nguoiDung.deleteMany({
        where: { id: { in: [adminId, outsiderId].filter(Boolean) } },
      });
      await prisma.vaiTro.deleteMany({
        where: { id: { in: [adminRoleId, testRoleId].filter(Boolean) } },
      });
    }
    if (app) await app.close();
  });

  it('yêu cầu JWT + phan_quyen.quan_ly', async () => {
    await request(app.getHttpServer()).get('/api/v1/phan-quyen/ma-tran').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/phan-quyen/ma-tran')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('GET trả role + permission đang hoạt động', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/phan-quyen/ma-tran')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(response.body.vaiTro.some((item: { id: string }) => item.id === testRoleId)).toBe(true);
    expect(response.body.quyen.map((item: { ma: string }) => item.ma)).toEqual(
      expect.arrayContaining(['phan_quyen.quan_ly', 'san_pham.xem', 'don_hang.xu_ly']),
    );
  });

  it('PUT replace permission set + idempotent audit', async () => {
    const first = await request(app.getHttpServer())
      .put(`/api/v1/phan-quyen/vai-tro/${testRoleId}/quyen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maQuyen: ['san_pham.xem', 'don_hang.xu_ly'] })
      .expect(200);
    expect(first.body.maQuyen).toEqual(['don_hang.xu_ly', 'san_pham.xem']);

    await request(app.getHttpServer())
      .put(`/api/v1/phan-quyen/vai-tro/${testRoleId}/quyen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maQuyen: ['don_hang.xu_ly', 'san_pham.xem'] })
      .expect(200);

    expect(
      await prisma.nhatKyKiemToan.count({
        where: {
          thucThe: 'vai_tro',
          thucTheId: testRoleId,
          hanhDong: 'PHAN_QUYEN_CAP_NHAT_MA_TRAN',
        },
      }),
    ).toBe(1);
  });

  it('PUT subset vô hiệu hóa relation cũ', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/phan-quyen/vai-tro/${testRoleId}/quyen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maQuyen: ['san_pham.xem'] })
      .expect(200);
    expect(response.body.maQuyen).toEqual(['san_pham.xem']);

    const relations = await prisma.vaiTroQuyen.findMany({
      where: { vaiTroId: testRoleId },
      include: { quyen: true },
    });
    expect(relations.find((item) => item.quyen.ma === 'san_pham.xem')?.trangThai).toBe(
      TrangThaiBanGhi.HOAT_DONG,
    );
    expect(relations.find((item) => item.quyen.ma === 'don_hang.xu_ly')?.trangThai).toBe(
      TrangThaiBanGhi.NGUNG_HOAT_DONG,
    );
  });

  it('quyền không tồn tại fail-closed', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/phan-quyen/vai-tro/${testRoleId}/quyen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maQuyen: ['san_pham.xem', 'khong_ton_tai.p79'] })
      .expect(400);

    const active = await prisma.vaiTroQuyen.findMany({
      where: { vaiTroId: testRoleId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      include: { quyen: true },
    });
    expect(active.map((item) => item.quyen.ma)).toEqual(['san_pham.xem']);
  });

  it('ADMIN không được mất phan_quyen.quan_ly', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/phan-quyen/vai-tro/${builtinAdminRoleId}/quyen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maQuyen: [] })
      .expect(400);

    expect(
      await prisma.vaiTroQuyen.count({
        where: {
          vaiTroId: builtinAdminRoleId,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          quyen: { ma: 'phan_quyen.quan_ly', trangThai: TrangThaiBanGhi.HOAT_DONG },
        },
      }),
    ).toBeGreaterThan(0);
  });
});
