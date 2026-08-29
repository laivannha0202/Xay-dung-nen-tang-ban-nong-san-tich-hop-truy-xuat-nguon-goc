import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';

const THOI_GIAN_CHO_E2E_MS = 20_000;

describe('API sức khỏe (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('Prisma kết nối MySQL thật', async () => {
    const prismaService = app.get(PrismaService);

    await expect(prismaService.kiemTraKetNoi()).resolves.toBe(true);
  });

  it('GET /api/v1/suc-khoe trả trạng thái ok', async () => {
    await request(app.getHttpServer()).get('/api/v1/suc-khoe').expect(200).expect({
      trangThai: 'ok',
      dichVu: 'agrimarket-api',
    });
  });

  it('GET /docs mở được Swagger UI', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);
  });

  it('GET /openapi-json có endpoint sức khỏe', async () => {
    const response = await request(app.getHttpServer()).get('/openapi-json').expect(200);

    expect(response.body.paths).toHaveProperty('/api/v1/suc-khoe');
  });
});
