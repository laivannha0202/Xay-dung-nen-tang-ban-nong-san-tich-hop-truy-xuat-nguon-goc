import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';

const THOI_GIAN_CHO_E2E_MS = 30_000;

describe('Xác thực (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `auth-${suffix}@example.com`;
  const matKhau1 = 'MatKhau-012-ban-dau';
  const matKhau2 = 'MatKhau-012-doi-lan-2';
  const matKhau3 = 'MatKhau-012-reset-lan-3';

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
    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { email },
      select: { id: true },
    });

    if (nguoiDung) {
      await prisma.nguoiDung.delete({
        where: { id: nguoiDung.id },
      });
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('đăng ký khách hàng và hash mật khẩu bằng Argon2', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: matKhau1,
        hoTen: 'Khách hàng PHIEN 012',
        soDienThoai: `09${Date.now().toString().slice(-8)}`,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.nguoiDung.email).toBe(email);
        expect(body.nguoiDung.hoTen).toBe('Khách hàng PHIEN 012');
      });

    const nguoiDung = await prisma.nguoiDung.findUniqueOrThrow({
      where: { email },
    });

    expect(nguoiDung.matKhauHash).not.toBe(matKhau1);
    await expect(argon2.verify(nguoiDung.matKhauHash, matKhau1)).resolves.toBe(true);

    await expect(
      prisma.khachHang.findUnique({
        where: { nguoiDungId: nguoiDung.id },
      }),
    ).resolves.toBeTruthy();
  });

  it('không cho đăng ký trùng email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: matKhau1,
        hoTen: 'Trùng email',
      })
      .expect(409);
  });

  it('đăng nhập MOBILE, rotate refresh token và vô hiệu token cũ', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'MOBILE',
      })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.body.refreshToken).toEqual(expect.any(String));

    const refreshCu = login.body.refreshToken as string;

    const refresh = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .send({
        refreshToken: refreshCu,
        nenTang: 'MOBILE',
      })
      .expect(200);

    expect(refresh.body.refreshToken).toEqual(expect.any(String));
    expect(refresh.body.refreshToken).not.toBe(refreshCu);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .send({
        refreshToken: refreshCu,
        nenTang: 'MOBILE',
      })
      .expect(401);
  });

  it('WEB nhận refresh token bằng HttpOnly cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'WEB',
      })
      .expect(200);

    expect(response.body.refreshToken).toBeUndefined();

    const setCookie = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

    expect(
      cookies.some(
        (cookie) =>
          typeof cookie === 'string' &&
          cookie.includes('agrimarket_refresh=') &&
          cookie.includes('HttpOnly'),
      ),
    ).toBe(true);
  });

  it('đổi mật khẩu yêu cầu access token và thu hồi session cũ', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'MOBILE',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/doi-mat-khau')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        matKhauHienTai: matKhau1,
        matKhauMoi: matKhau2,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'MOBILE',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau2,
        nenTang: 'MOBILE',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .send({
        refreshToken: login.body.refreshToken,
        nenTang: 'MOBILE',
      })
      .expect(401);
  });

  it(
    'quên mật khẩu gửi Mailpit và mã chỉ dùng một lần',
    async () => {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/quen-mat-khau')
        .send({ email })
        .expect(200);

      let noiDung = '';
      const query = encodeURIComponent(`to:${email}`);
      const mailpitUrl = `http://127.0.0.1:8025/view/latest.txt?query=${query}`;
      const deadline = Date.now() + 10_000;

      while (Date.now() < deadline) {
        const response = await fetch(mailpitUrl);

        if (response.ok) {
          noiDung = await response.text();

          if (noiDung.includes('Mã đặt lại mật khẩu:')) {
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      expect(noiDung).toContain('Mã đặt lại mật khẩu:');

      const match = noiDung.match(/Mã đặt lại mật khẩu:\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);

      expect(match?.[1]).toBeTruthy();
      const maDatLai = match?.[1] as string;

      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dat-lai-mat-khau')
        .send({
          maDatLai,
          matKhauMoi: matKhau3,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dat-lai-mat-khau')
        .send({
          maDatLai,
          matKhauMoi: 'KhongDuocDungLai-012',
        })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email,
          matKhau: matKhau2,
          nenTang: 'MOBILE',
        })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email,
          matKhau: matKhau3,
          nenTang: 'MOBILE',
        })
        .expect(200);
    },
    THOI_GIAN_CHO_E2E_MS,
  );

  it('logout idempotent và refresh token bị thu hồi', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau3,
        nenTang: 'MOBILE',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-xuat')
      .send({
        refreshToken: login.body.refreshToken,
        nenTang: 'MOBILE',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .send({
        refreshToken: login.body.refreshToken,
        nenTang: 'MOBILE',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-xuat')
      .send({
        refreshToken: login.body.refreshToken,
        nenTang: 'MOBILE',
      })
      .expect(200);
  });

  it('quên mật khẩu không tiết lộ email không tồn tại', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/quen-mat-khau')
      .send({
        email: `khong-ton-tai-${suffix}@example.com`,
      })
      .expect(200);
  });
});
