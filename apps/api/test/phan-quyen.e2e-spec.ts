import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 30_000;

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const emailAdmin = `rbac-admin-${suffix}@example.com`;
  const emailNhanVien = `rbac-nv-${suffix}@example.com`;
  const matKhau = 'MatKhau-RBAC-013';

  let nguoiDungAdminId = '';
  let nguoiDungNhanVienId = '';
  let accessTokenAdmin = '';
  let accessTokenNhanVien = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const emails = [emailAdmin, emailNhanVien];

      const nguoiDung = await prisma.nguoiDung.findMany({
        where: {
          email: { in: emails },
        },
        select: { id: true },
      });

      if (nguoiDung.length) {
        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: nguoiDung.map((item) => item.id),
            },
          },
        });
      }
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('seed đúng 3 role hệ thống và permission nền tảng', async () => {
    const roles = await prisma.vaiTro.findMany({
      where: {
        ma: {
          in: ['KHACH_HANG', 'NHAN_VIEN', 'ADMIN'],
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { ma: true },
    });

    expect(roles.map((item) => item.ma).sort()).toEqual(['ADMIN', 'KHACH_HANG', 'NHAN_VIEN']);

    const permissions = await prisma.quyen.findMany({
      where: {
        ma: {
          in: [
            'phan_quyen.quan_ly',
            'san_pham.xem',
            'san_pham.tao',
            'don_hang.xu_ly',
            'ton_kho.dieu_chinh',
          ],
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { ma: true },
    });

    expect(permissions).toHaveLength(5);
  });

  it('đăng ký tự gán KHACH_HANG', async () => {
    for (const email of [emailAdmin, emailNhanVien]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'User RBAC PHIEN 013',
        })
        .expect(201);
    }

    const [adminUser, nhanVienUser] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailAdmin },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailNhanVien },
      }),
    ]);

    nguoiDungAdminId = adminUser.id;
    nguoiDungNhanVienId = nhanVienUser.id;

    for (const nguoiDungId of [nguoiDungAdminId, nguoiDungNhanVienId]) {
      const roles = await prisma.nguoiDungVaiTro.findMany({
        where: {
          nguoiDungId,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        select: {
          vaiTro: {
            select: { ma: true },
          },
        },
      });

      expect(roles.map((item) => item.vaiTro.ma)).toContain('KHACH_HANG');
    }
  });

  it('KHACH_HANG xem được quyền của mình nhưng bị 403 khi gán role', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email: emailAdmin,
        matKhau,
        nenTang: 'MOBILE',
      })
      .expect(200);

    accessTokenAdmin = login.body.accessToken as string;

    const cuaToi = await request(app.getHttpServer())
      .get('/api/v1/phan-quyen/cua-toi')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .expect(200);

    expect(cuaToi.body.vaiTro).toContain('KHACH_HANG');
    expect(cuaToi.body.quyen).toContain('san_pham.xem');
    expect(cuaToi.body.quyen).not.toContain('phan_quyen.quan_ly');

    await request(app.getHttpServer())
      .post('/api/v1/phan-quyen/gan-vai-tro')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send({
        nguoiDungId: nguoiDungNhanVienId,
        maVaiTro: 'NHAN_VIEN',
      })
      .expect(403);
  });

  it('cùng access token có quyền ngay sau khi DB gán ADMIN', async () => {
    const adminRole = await prisma.vaiTro.findUniqueOrThrow({
      where: { ma: 'ADMIN' },
      select: { id: true },
    });

    await prisma.nguoiDungVaiTro.create({
      data: {
        nguoiDungId: nguoiDungAdminId,
        vaiTroId: adminRole.id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    const cuaToi = await request(app.getHttpServer())
      .get('/api/v1/phan-quyen/cua-toi')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .expect(200);

    expect(cuaToi.body.vaiTro).toContain('ADMIN');
    expect(cuaToi.body.quyen).toContain('phan_quyen.quan_ly');

    await request(app.getHttpServer())
      .post('/api/v1/phan-quyen/gan-vai-tro')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send({
        nguoiDungId: nguoiDungNhanVienId,
        maVaiTro: 'NHAN_VIEN',
      })
      .expect(201);
  });

  it('NHAN_VIEN nhận đúng quyền nghiệp vụ nhưng không có quyền quản lý RBAC', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email: emailNhanVien,
        matKhau,
        nenTang: 'MOBILE',
      })
      .expect(200);

    accessTokenNhanVien = login.body.accessToken as string;

    const cuaToi = await request(app.getHttpServer())
      .get('/api/v1/phan-quyen/cua-toi')
      .set('Authorization', `Bearer ${accessTokenNhanVien}`)
      .expect(200);

    expect(cuaToi.body.vaiTro).toEqual(expect.arrayContaining(['KHACH_HANG', 'NHAN_VIEN']));
    expect(cuaToi.body.quyen).toEqual(expect.arrayContaining(['san_pham.xem', 'don_hang.xu_ly']));
    expect(cuaToi.body.quyen).not.toContain('phan_quyen.quan_ly');
  });

  it('thu hồi ADMIN có hiệu lực ngay với access token cũ', async () => {
    const adminRole = await prisma.vaiTro.findUniqueOrThrow({
      where: { ma: 'ADMIN' },
      select: { id: true },
    });

    await prisma.nguoiDungVaiTro.updateMany({
      where: {
        nguoiDungId: nguoiDungAdminId,
        vaiTroId: adminRole.id,
      },
      data: {
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/phan-quyen/gan-vai-tro')
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send({
        nguoiDungId: nguoiDungNhanVienId,
        maVaiTro: 'NHAN_VIEN',
      })
      .expect(403);
  });
});
