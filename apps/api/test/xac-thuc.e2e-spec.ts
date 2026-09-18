import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { ThuDienXacThucService } from '../src/modules/xac-thuc/thu-dien-xac-thuc.service';

const THOI_GIAN_CHO_E2E_MS = 30_000;

describe('Xác thực (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let maDatLaiMatKhauE2E = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `auth-${suffix}@example.com`;
  const matKhau1 = 'MatKhau-012-ban-dau';
  const matKhau2 = 'MatKhau-012-doi-lan-2';
  const matKhau3 = 'MatKhau-012-reset-lan-3';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThuDienXacThucService)
      .useValue({
        guiMaDatLaiMatKhau: jest.fn(async (_email: string, maDatLai: string) => {
          maDatLaiMatKhauE2E = maDatLai;
        }),
      })
      .compile();

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

  it('WEB ghiNho=true tạo persistent HttpOnly refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'WEB',
        ghiNho: true,
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toBeUndefined();

    const setCookie = response.headers['set-cookie'];
    const cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(
      (cookie): cookie is string => typeof cookie === 'string',
    );
    const refresh = cookies.find((cookie) => cookie.includes('agrimarket_refresh='));

    expect(refresh).toBeTruthy();
    expect(refresh).toContain('HttpOnly');
    expect(refresh).toContain('Path=/api/v1/xac-thuc');
    // Persistent: có Max-Age tương ứng JWT_REFRESH_TTL_SECONDS.
    expect(refresh).toMatch(/Max-Age=\d+/);
  });

  it('WEB ghiNho=false tạo session HttpOnly refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: matKhau1,
        nenTang: 'WEB',
        ghiNho: false,
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toBeUndefined();

    const setCookie = response.headers['set-cookie'];
    const cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(
      (cookie): cookie is string => typeof cookie === 'string',
    );
    const refresh = cookies.find((cookie) => cookie.includes('agrimarket_refresh='));

    expect(refresh).toBeTruthy();
    expect(refresh).toContain('HttpOnly');
    expect(refresh).toContain('Path=/api/v1/xac-thuc');
    // Session cookie: tuyệt đối không có Max-Age/Expires persistent.
    expect(refresh).not.toMatch(/Max-Age=/i);
    expect(refresh).not.toMatch(/Expires=/i);
  });

  it('WEB refresh bằng cookie rotate token và giữ nguyên session/persistent', async () => {
    const layRefreshCookie = (setCookie: unknown): string => {
      const cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(
        (cookie): cookie is string => typeof cookie === 'string',
      );
      const refresh = cookies.find((cookie) => cookie.includes('agrimarket_refresh='));
      expect(refresh).toBeTruthy();
      return (refresh as string).split(';')[0] as string;
    };

    // Phiên persistent: refresh xong vẫn persistent.
    const loginNho = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau: matKhau1, nenTang: 'WEB', ghiNho: true })
      .expect(200);
    const cookieNho = layRefreshCookie(loginNho.headers['set-cookie']);

    const moiNho = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .set('Cookie', cookieNho)
      .send({ nenTang: 'WEB' })
      .expect(200);

    expect(moiNho.body.accessToken).toEqual(expect.any(String));
    expect(moiNho.body.accessToken).not.toBe(loginNho.body.accessToken);
    const setCookieMoiNho = layRefreshCookie(moiNho.headers['set-cookie']);
    expect(setCookieMoiNho).toBeTruthy();
    expect(
      (
        (Array.isArray(moiNho.headers['set-cookie'])
          ? moiNho.headers['set-cookie']
          : [moiNho.headers['set-cookie']]) as string[]
      ).find((c) => c.includes('agrimarket_refresh=')),
    ).toMatch(/Max-Age=\d+/);

    // Cookie cũ đã bị rotate: dùng lại phải 401.
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .set('Cookie', cookieNho)
      .send({ nenTang: 'WEB' })
      .expect(401);

    // Phiên session: refresh xong vẫn là session cookie.
    const loginTam = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau: matKhau1, nenTang: 'WEB', ghiNho: false })
      .expect(200);
    const cookieTam = layRefreshCookie(loginTam.headers['set-cookie']);

    const moiTam = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .set('Cookie', cookieTam)
      .send({ nenTang: 'WEB' })
      .expect(200);

    expect(moiTam.body.accessToken).toEqual(expect.any(String));
    const refreshMoiTam = (
      (Array.isArray(moiTam.headers['set-cookie'])
        ? moiTam.headers['set-cookie']
        : [moiTam.headers['set-cookie']]) as string[]
    ).find((c) => typeof c === 'string' && c.includes('agrimarket_refresh='));
    expect(refreshMoiTam).toBeTruthy();
    expect(refreshMoiTam).not.toMatch(/Max-Age=/i);
    expect(refreshMoiTam).not.toMatch(/Expires=/i);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .set('Cookie', cookieTam)
      .send({ nenTang: 'WEB' })
      .expect(401);
  });

  it('WEB logout clear cookie và thu hồi refresh session', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau: matKhau1, nenTang: 'WEB', ghiNho: true })
      .expect(200);

    const setCookie = login.headers['set-cookie'];
    const cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(
      (cookie): cookie is string => typeof cookie === 'string',
    );
    const cookie = (cookies.find((c) => c.includes('agrimarket_refresh=')) as string).split(
      ';',
    )[0] as string;

    const logout = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-xuat')
      .set('Cookie', cookie)
      .send({ nenTang: 'WEB' })
      .expect(200);

    // Clear cookie đúng path.
    const cleared = (
      (Array.isArray(logout.headers['set-cookie'])
        ? logout.headers['set-cookie']
        : [logout.headers['set-cookie']]) as unknown[]
    ).filter((c): c is string => typeof c === 'string');
    const xoa = cleared.find((c) => c.includes('agrimarket_refresh='));
    expect(xoa).toBeTruthy();
    expect(xoa).toContain('Path=/api/v1/xac-thuc');

    // Refresh session đã bị thu hồi.
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/lam-moi')
      .set('Cookie', cookie)
      .send({ nenTang: 'WEB' })
      .expect(401);
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
    'quên mật khẩu sinh mã và mã chỉ dùng một lần',
    async () => {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/quen-mat-khau')
        .send({ email })
        .expect(200);

      expect(maDatLaiMatKhauE2E).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      const maDatLai = maDatLaiMatKhauE2E;

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
