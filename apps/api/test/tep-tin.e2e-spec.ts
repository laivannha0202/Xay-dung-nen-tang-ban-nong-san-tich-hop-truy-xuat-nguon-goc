import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';

const THOI_GIAN_CHO_E2E_MS = 30_000;
const GIOI_HAN_TEP_TIN_BYTES = 5 * 1024 * 1024;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' +
    'CAQAAAC1HAwCAAAAC0lEQVR42mP8' +
    '/x8AAusB9Y9Z7z8AAAAASUVORK5CYII=',
  'base64',
);

describe('Tệp tin MinIO/S3 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let s3: S3Client;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const emailChu = `file-owner-${suffix}@example.com`;
  const emailKhac = `file-other-${suffix}@example.com`;
  const matKhau = 'MatKhau-File-015';

  let chuId = '';
  let khacId = '';
  let tokenChu = '';
  let tokenKhac = '';
  let tepId = '';
  let signedUrlCu = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);

    s3 = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT ?? 'http://127.0.0.1:9000',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER ?? 'agrimarket',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? 'agrimarket_minio_local',
      },
    });

    for (const email of [emailChu, emailKhac]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'File E2E PHIEN 015',
        })
        .expect(201);
    }

    const [chu, khac] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailChu },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailKhac },
      }),
    ]);

    chuId = chu.id;
    khacId = khac.id;

    const [loginChu, loginKhac] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email: emailChu,
          matKhau,
          nenTang: 'MOBILE',
        })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email: emailKhac,
          matKhau,
          nenTang: 'MOBILE',
        })
        .expect(200),
    ]);

    tokenChu = loginChu.body.accessToken as string;
    tokenKhac = loginKhac.body.accessToken as string;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const tep = await prisma.tepTin.findMany({
        where: {
          nguoiTaiLenId: {
            in: [chuId, khacId].filter(Boolean),
          },
        },
      });

      for (const item of tep) {
        try {
          await s3?.send(
            new DeleteObjectCommand({
              Bucket: item.bucket,
              Key: item.objectKey,
            }),
          );
        } catch {
          // Cleanup best-effort.
        }
      }

      if (chuId || khacId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            tacNhanId: {
              in: [chuId, khacId].filter(Boolean),
            },
          },
        });

        await prisma.tepTin.deleteMany({
          where: {
            nguoiTaiLenId: {
              in: [chuId, khacId].filter(Boolean),
            },
          },
        });

        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: [chuId, khacId].filter(Boolean),
            },
          },
        });
      }
    }

    s3?.destroy();

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('không đăng nhập thì upload nhận 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .attach('tep', PNG_1X1, {
        filename: 'khong-auth.png',
        contentType: 'image/png',
      })
      .expect(401);
  });

  it('upload PNG thật, lưu metadata + audit', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenChu}`)
      .set('User-Agent', 'AgriMarket-File-E2E')
      .attach('tep', PNG_1X1, {
        filename: 'anh-thu-nghiem.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.tenGoc).toBe('anh-thu-nghiem.png');
    expect(response.body.mimeType).toBe('image/png');
    expect(response.body.kichThuoc).toBe(PNG_1X1.length);
    expect(response.body.sha256).toMatch(/^[a-f0-9]{64}$/);

    tepId = response.body.id as string;

    const db = await prisma.tepTin.findUniqueOrThrow({
      where: { id: tepId },
    });

    expect(db.objectKey).not.toContain('anh-thu-nghiem.png');
    expect(db.nguoiTaiLenId).toBe(chuId);

    const audit = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: {
        tacNhanId: chuId,
        hanhDong: 'TEP_TIN_TAI_LEN',
        thucTheId: tepId,
      },
    });

    expect(audit.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-File-E2E',
      }),
    );
  });

  it('chủ file đọc metadata được, user khác nhận 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/tep-tin/${tepId}`)
      .set('Authorization', `Bearer ${tokenChu}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(tepId);
        expect(body.mimeType).toBe('image/png');
      });

    await request(app.getHttpServer())
      .get(`/api/v1/tep-tin/${tepId}`)
      .set('Authorization', `Bearer ${tokenKhac}`)
      .expect(403);
  });

  it('signed URL xem/tải truy cập object MinIO thật', async () => {
    const view = await request(app.getHttpServer())
      .get(`/api/v1/tep-tin/${tepId}/xem-url`)
      .set('Authorization', `Bearer ${tokenChu}`)
      .expect(200);

    expect(view.body.cheDo).toBe('xem');
    expect(view.body.hetHanSauGiay).toBe(300);
    expect(view.body.url).toContain('X-Amz-Signature=');

    signedUrlCu = view.body.url as string;

    const viewResponse = await fetch(signedUrlCu);

    expect(viewResponse.status).toBe(200);
    expect(Buffer.from(await viewResponse.arrayBuffer())).toEqual(PNG_1X1);

    const download = await request(app.getHttpServer())
      .get(`/api/v1/tep-tin/${tepId}/tai-xuong-url`)
      .set('Authorization', `Bearer ${tokenChu}`)
      .expect(200);

    expect(download.body.cheDo).toBe('tai-xuong');

    const downloadResponse = await fetch(download.body.url);

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers.get('content-disposition')).toContain('attachment');
  });

  it('MIME giả mạo bị từ chối', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenChu}`)
      .attach('tep', Buffer.from('day-khong-phai-png'), {
        filename: 'gia-mao.png',
        contentType: 'image/png',
      })
      .expect(415);
  });

  it(
    'file vượt 5 MiB bị từ chối',
    async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tep-tin/tai-len')
        .set('Authorization', `Bearer ${tokenChu}`)
        .attach('tep', Buffer.alloc(GIOI_HAN_TEP_TIN_BYTES + 1, 0), {
          filename: 'qua-lon.png',
          contentType: 'image/png',
        });

      expect([400, 413]).toContain(response.status);
    },
    THOI_GIAN_CHO_E2E_MS,
  );

  it('xóa file: metadata ẩn, object MinIO bị xóa và có audit', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tep-tin/${tepId}`)
      .set('Authorization', `Bearer ${tokenChu}`)
      .set('User-Agent', 'AgriMarket-File-Delete-E2E')
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/tep-tin/${tepId}`)
      .set('Authorization', `Bearer ${tokenChu}`)
      .expect(404);

    const oldUrlResponse = await fetch(signedUrlCu);

    expect(oldUrlResponse.status).toBe(404);

    const db = await prisma.tepTin.findUniqueOrThrow({
      where: { id: tepId },
    });

    expect(db.trangThai).toBe('NGUNG_HOAT_DONG');
    expect(db.xoaLuc).toBeTruthy();

    const audit = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: {
        tacNhanId: chuId,
        hanhDong: 'TEP_TIN_XOA',
        thucTheId: tepId,
      },
    });

    expect(audit.sau).toEqual({
      trangThai: 'NGUNG_HOAT_DONG',
    });
  });
});
