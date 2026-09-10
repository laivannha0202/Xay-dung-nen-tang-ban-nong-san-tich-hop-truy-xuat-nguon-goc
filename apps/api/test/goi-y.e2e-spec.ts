import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Gợi ý sản phẩm runtime (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `goi-y-${suffix}@example.com`;
  const matKhau = 'MatKhau-GoiY-2026';
  let token = '';
  let nguoiDungId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email, matKhau, hoTen: 'Khách hàng Gợi ý E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau, nenTang: 'MOBILE' })
      .expect(200);

    token = login.body.accessToken as string;
    nguoiDungId = (await prisma.nguoiDung.findUniqueOrThrow({ where: { email } })).id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma && nguoiDungId) {
      await prisma.nguoiDung.deleteMany({ where: { id: nguoiDungId } });
    }
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('yêu cầu access token', async () => {
    await request(app.getHttpServer()).get('/api/v1/khach-hang/goi-y').expect(401);
  });

  it('validation giới hạn fail-closed', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/khach-hang/goi-y?gioiHan=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/khach-hang/goi-y?gioiHan=21')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('trả contract recommendation an toàn cho customer mới', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/goi-y?gioiHan=8')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(['HYBRID_AFFINITY_V1', 'MOST_POPULAR_90D']).toContain(response.body.chienLuoc);
    expect(typeof response.body.caNhanHoa).toBe('boolean');
    expect(Array.isArray(response.body.duLieu)).toBe(true);
    expect(response.body.duLieu.length).toBeLessThanOrEqual(8);
    expect(response.body.tong).toBe(response.body.duLieu.length);

    for (const item of response.body.duLieu as Array<Record<string, unknown>>) {
      expect(item).toHaveProperty('sanPham');
      expect(item).toHaveProperty('diem');
      expect(item).toHaveProperty('thanhPhan');
    }
  });
});
