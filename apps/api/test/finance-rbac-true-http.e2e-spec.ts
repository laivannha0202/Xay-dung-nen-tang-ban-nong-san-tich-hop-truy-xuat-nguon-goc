import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

describe('True HTTP Finance RBAC Negative & Positive Tests (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let tokenAdmin = '';
  let tokenKhach = '';
  let tokenNhanVienKhongQuyen = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    // 1. Tạo Admin
    const emailAdmin = `admin-rbac-${suffix}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailAdmin, matKhau: 'Admin@123456', hoTen: 'Admin RBAC' })
      .expect(201);
    const adminUser = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } });
    const adminRole = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: adminUser.id, vaiTroId: adminRole.id },
    });
    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailAdmin, matKhau: 'Admin@123456' })
      .expect(200);
    tokenAdmin = loginAdmin.body.accessToken;

    // 2. Tạo Khách Hàng
    const emailKhach = `khach-rbac-${suffix}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailKhach, matKhau: 'Khach@123456', hoTen: 'Khach RBAC' })
      .expect(201);
    const loginKhach = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailKhach, matKhau: 'Khach@123456' })
      .expect(200);
    tokenKhach = loginKhach.body.accessToken;

    // 3. Tạo Nhân Viên không có quyền tài chính
    const emailNV = `nv-no-finance-${suffix}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailNV, matKhau: 'NhanVien@123', hoTen: 'NV No Finance' })
      .expect(201);
    const nvUser = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNV } });
    const nvRole = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: nvUser.id, vaiTroId: nvRole.id },
    });
    const loginNV = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailNV, matKhau: 'NhanVien@123' })
      .expect(200);
    tokenNhanVienKhongQuyen = loginNV.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };
      httpServer.closeIdleConnections?.();
      httpServer.closeAllConnections?.();

      const workers = [
        app.get(EmailWorker, { strict: false }),
        app.get(ThongBaoWorker, { strict: false }),
        app.get(HeThongWorker, { strict: false }),
      ];
      await Promise.all(workers.map(async (worker) => worker.worker.close(true)));

      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), { strict: false }),
      ];
      await Promise.all(queues.map(async (queue) => queue.close()));

      await app.close();
    }
  });

  it('1. Unauthenticated request -> 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/doi-soat')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/chi-tra-nha-cung-cap')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/so-du-nha-cung-cap')
      .expect(401);
  });

  it('2. Khách hàng gọi API tài chính -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/doi-soat')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/chi-tra-nha-cung-cap')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('3. Nhân viên không có quyền tài chính -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/doi-soat')
      .set('Authorization', `Bearer ${tokenNhanVienKhongQuyen}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/chi-tra-nha-cung-cap')
      .set('Authorization', `Bearer ${tokenNhanVienKhongQuyen}`)
      .expect(403);
  });

  it('4. Admin có đầy đủ quyền tài chính -> 200 OK', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/doi-soat')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/chi-tra-nha-cung-cap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/so-du-nha-cung-cap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });
});
