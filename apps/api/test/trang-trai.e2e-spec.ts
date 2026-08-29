import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 45_000;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' +
    'CAQAAAC1HAwCAAAAC0lEQVR42mP8' +
    '/x8AAusB9Y9Z7z8AAAAASUVORK5CYII=',
  'base64',
);

describe('Trang trại (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let s3: S3Client;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Farm-018';
  const emailKhach = `farm-khach-${suffix}@example.com`;
  const emailNhanVien = `farm-nv-${suffix}@example.com`;
  const emailAdmin = `farm-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let tepId = '';

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

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'Farm E2E PHIEN 018',
        })
        .expect(201);
    }

    const [khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailKhach,
        },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailNhanVien,
        },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailAdmin,
        },
      }),
    ]);

    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({
        where: {
          ma: 'NHAN_VIEN',
        },
      }),
      prisma.vaiTro.findUniqueOrThrow({
        where: {
          ma: 'ADMIN',
        },
      }),
    ]);

    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVienId,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        {
          nguoiDungId: adminId,
          vaiTroId: roleAdmin.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      ],
    });

    const login = async (email: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email,
          matKhau,
          nenTang: 'MOBILE',
        })
        .expect(200);

      return response.body.accessToken as string;
    };

    [tokenKhach, tokenNhanVien, tokenAdmin] = await Promise.all([
      login(emailKhach),
      login(emailNhanVien),
      login(emailAdmin),
    ]);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-FARM-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Farm E2E',
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    nhaCungCapId = supplier.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const tep = tepId
        ? await prisma.tepTin.findUnique({
            where: { id: tepId },
          })
        : null;

      if (tep) {
        try {
          await s3?.send(
            new DeleteObjectCommand({
              Bucket: tep.bucket,
              Key: tep.objectKey,
            }),
          );
        } catch {
          // Cleanup best-effort.
        }
      }

      if (trangTraiId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'trang_trai',
            thucTheId: trangTraiId,
          },
        });

        await prisma.trangTrai.deleteMany({
          where: {
            id: trangTraiId,
          },
        });
      }

      if (nhaCungCapId) {
        await prisma.nhaCungCap.deleteMany({
          where: {
            id: nhaCungCapId,
          },
        });
      }

      const actorIds = [khachId, nhanVienId, adminId].filter(Boolean);

      if (actorIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            tacNhanId: {
              in: actorIds,
            },
          },
        });
      }

      if (tepId) {
        await prisma.tepTin.deleteMany({
          where: {
            id: tepId,
          },
        });
      }

      if (actorIds.length) {
        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: actorIds,
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

  it('seed permission đúng least privilege', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'trang_trai.',
          },
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: {
            ma: true,
          },
        },
        quyen: {
          select: {
            ma: true,
          },
        },
      },
    });

    const pairs = mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort();

    expect(pairs).toEqual([
      'ADMIN:trang_trai.khoa',
      'ADMIN:trang_trai.sua',
      'ADMIN:trang_trai.tao',
      'ADMIN:trang_trai.xem',
      'NHAN_VIEN:trang_trai.sua',
      'NHAN_VIEN:trang_trai.tao',
      'NHAN_VIEN:trang_trai.xem',
    ]);
  });

  it('KHACH_HANG không quản trị trang trại -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/trang-trai')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('GPS thiếu một tọa độ -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/trang-trai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma: `GPS-${suffix}`.slice(0, 50),
        ten: 'Farm GPS sai',
        diaChi: 'Địa chỉ thử nghiệm',
        viDo: 11.94,
        nhaCungCapId,
      })
      .expect(400);
  });

  it('NHAN_VIEN upload ảnh thật rồi tạo trang trại', async () => {
    const upload = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .attach('tep', PNG_1X1, {
        filename: 'farm-phien018.png',
        contentType: 'image/png',
      })
      .expect(201);

    tepId = upload.body.id as string;

    const ma = `FARM-${suffix}`.slice(0, 50);

    const create = await request(app.getHttpServer())
      .post('/api/v1/trang-trai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Farm-E2E')
      .send({
        ma,
        ten: 'Trang trại Đà Lạt',
        diaChi: 'Đà Lạt, Lâm Đồng',
        viDo: 11.9404,
        kinhDo: 108.4583,
        dienTichHa: 12.5,
        nhaCungCapId,
        anhIds: [tepId],
      })
      .expect(201);

    trangTraiId = create.body.id as string;

    expect(create.body.ma).toBe(ma);
    expect(create.body.nhaCungCap.id).toBe(nhaCungCapId);
    expect(create.body.soAnh).toBe(1);
    expect(create.body.anh).toHaveLength(1);
    expect(create.body.anh[0].tepTinId).toBe(tepId);
    expect(create.body.anh[0].url).toContain('X-Amz-Signature=');
  });

  it('public farm detail không cần token và signed URL đọc được ảnh MinIO', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/cong-khai/trang-trai/${trangTraiId}`)
      .expect(200);

    expect(response.body.id).toBe(trangTraiId);
    expect(response.body.trangThai).toBe('HOAT_DONG');
    expect(response.body.anh).toHaveLength(1);

    const imageResponse = await fetch(response.body.anh[0].url as string);

    expect(imageResponse.status).toBe(200);
    expect(Buffer.from(await imageResponse.arrayBuffer())).toEqual(PNG_1X1);
  });

  it('search + supplier filter trả đúng trang trại', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/trang-trai')
      .query({
        timKiem: 'Đà Lạt',
        nhaCungCapId,
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0].id).toBe(trangTraiId);
  });

  it('trùng mã -> 409', async () => {
    const existing = await prisma.trangTrai.findUniqueOrThrow({
      where: {
        id: trangTraiId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/trang-trai')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma: existing.ma,
        ten: 'Trang trại trùng mã',
        diaChi: 'Địa chỉ khác',
        nhaCungCapId,
      })
      .expect(409);
  });

  it('NHAN_VIEN sửa được nhưng không khóa được', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/trang-trai/${trangTraiId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        diaChi: 'Đà Lạt, Lâm Đồng - đã cập nhật',
        dienTichHa: 13.25,
        anhIds: [tepId],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.dienTichHa).toBe(13.25);
        expect(body.soAnh).toBe(1);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/trang-trai/${trangTraiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(403);
  });

  it('ADMIN khóa thì public 404, mở lại thì public 200', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/trang-trai/${trangTraiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('User-Agent', 'AgriMarket-Farm-Admin-E2E')
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/cong-khai/trang-trai/${trangTraiId}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/trang-trai/${trangTraiId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'HOAT_DONG',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/cong-khai/trang-trai/${trangTraiId}`)
      .expect(200);
  });

  it('mutation Trang trại có Audit snapshot', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'trang_trai',
        thucTheId: trangTraiId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['TRANG_TRAI_TAO', 'TRANG_TRAI_SUA', 'TRANG_TRAI_DOI_TRANG_THAI']),
    );

    const stateLog = logs.find((item) => item.hanhDong === 'TRANG_TRAI_DOI_TRANG_THAI');

    expect(stateLog?.tacNhanId).toBe(adminId);
    expect(stateLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Farm-Admin-E2E',
      }),
    );
  });
});
