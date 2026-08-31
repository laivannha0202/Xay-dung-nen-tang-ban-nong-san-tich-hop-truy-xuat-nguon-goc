import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Danh mục sản phẩm (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Category-029';

  const emailKhach = `category-khach-${suffix}@example.com`;

  const emailNhanVien = `category-nv-${suffix}@example.com`;

  const emailAdmin = `category-admin-${suffix}@example.com`;

  let khachId = '';

  let nhanVienId = '';

  let adminId = '';

  let tokenKhach = '';

  let tokenNhanVien = '';

  let tokenAdmin = '';

  let anhHoatDongId = '';

  let pdfId = '';

  let anhDaKhoaId = '';

  let rootId = '';

  let childId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    cauHinhUngDung(app);

    await app.init();

    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'Danh mục sản phẩm E2E PHIEN 029',
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

    const activeImage = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket',
        objectKey: `category/${suffix}/active.png`,
        tenGoc: 'category.png',
        mimeType: 'image/png',
        kichThuoc: BigInt(128),
        sha256: 'c'.repeat(64),
        nguoiTaiLenId: nhanVienId,
        nguoiTaiLen: emailNhanVien,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    anhHoatDongId = activeImage.id;

    const pdf = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket',
        objectKey: `category/${suffix}/not-image.pdf`,
        tenGoc: 'not-image.pdf',
        mimeType: 'application/pdf',
        kichThuoc: BigInt(128),
        sha256: 'd'.repeat(64),
        nguoiTaiLenId: nhanVienId,
        nguoiTaiLen: emailNhanVien,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    pdfId = pdf.id;

    const inactiveImage = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket',
        objectKey: `category/${suffix}/inactive.webp`,
        tenGoc: 'inactive.webp',
        mimeType: 'image/webp',
        kichThuoc: BigInt(128),
        sha256: 'e'.repeat(64),
        nguoiTaiLenId: nhanVienId,
        nguoiTaiLen: emailNhanVien,
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        xoaLuc: new Date(),
      },
    });

    anhDaKhoaId = inactiveImage.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();

    const log = (text: string) => {
      console.log(`[CATEGORY E2E cleanup +${Date.now() - start}ms] ${text}`);
    };

    log('Bắt đầu cleanup.');

    if (prisma) {
      const categoryIds = [rootId, childId].filter(Boolean);

      if (categoryIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            OR: [
              {
                thucThe: 'danh_muc_san_pham',
                thucTheId: {
                  in: categoryIds,
                },
              },
              {
                tacNhanId: {
                  in: [adminId, nhanVienId].filter(Boolean),
                },
              },
            ],
          },
        });

        await prisma.danhMucSanPham.updateMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
          data: {
            danhMucChaId: null,
          },
        });

        await prisma.danhMucSanPham.deleteMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
        });
      }

      const fileIds = [anhHoatDongId, pdfId, anhDaKhoaId].filter(Boolean);

      if (fileIds.length) {
        await prisma.tepTin.deleteMany({
          where: {
            id: {
              in: fileIds,
            },
          },
        });
      }

      const actorIds = [khachId, nhanVienId, adminId].filter(Boolean);

      if (actorIds.length) {
        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: actorIds,
            },
          },
        });
      }

      log('Cleanup MySQL hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };

      httpServer.closeIdleConnections?.();

      httpServer.closeAllConnections?.();

      log('Đã đóng HTTP connections.');

      await app.close();

      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('RBAC Danh mục = NHAN_VIEN 3 quyền, ADMIN 4 quyền', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'danh_muc_san_pham.',
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

    const values = mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort();

    expect(values).toEqual([
      'ADMIN:danh_muc_san_pham.khoa',
      'ADMIN:danh_muc_san_pham.sua',
      'ADMIN:danh_muc_san_pham.tao',
      'ADMIN:danh_muc_san_pham.xem',
      'NHAN_VIEN:danh_muc_san_pham.sua',
      'NHAN_VIEN:danh_muc_san_pham.tao',
      'NHAN_VIEN:danh_muc_san_pham.xem',
    ]);
  });

  it('KHACH_HANG GET danh mục -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('slug sai format -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Rau Củ',
        slug: 'Rau Củ Có Dấu',
      })
      .expect(400);
  });

  it('NHAN_VIEN tạo category gốc có image -> 201 + signed image URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Rau củ hữu cơ',
        slug: `rau-cu-huu-co-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        anhId: anhHoatDongId,
      })
      .expect(201);

    rootId = response.body.id as string;

    expect(response.body.danhMucCha).toBeNull();

    expect(response.body.anh.id).toBe(anhHoatDongId);

    expect(response.body.anh.url).toEqual(expect.any(String));

    expect(response.body.trangThai).toBe('HOAT_DONG');
  });

  it('duplicate slug -> 409', async () => {
    const root = await prisma.danhMucSanPham.findUniqueOrThrow({
      where: {
        id: rootId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Trùng slug',
        slug: root.slug,
      })
      .expect(409);
  });

  it('parent không tồn tại -> 404; file PDF -> 400; image inactive -> 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Parent missing',
        slug: `parent-missing-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        danhMucChaId: '00000000-0000-4000-8000-000000000001',
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'PDF invalid',
        slug: `pdf-invalid-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        anhId: pdfId,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Inactive image',
        slug: `inactive-image-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        anhId: anhDaKhoaId,
      })
      .expect(404);
  });

  it('tạo category con + list/search/filter parent đúng', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/danh-muc-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Rau ăn lá',
        slug: `rau-an-la-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        danhMucChaId: rootId,
      })
      .expect(201);

    childId = response.body.id as string;

    expect(response.body.danhMucCha.id).toBe(rootId);

    const list = await request(app.getHttpServer())
      .get('/api/v1/danh-muc-san-pham')
      .query({
        timKiem: 'Rau ăn',
        danhMucChaId: rootId,
        trangThai: 'HOAT_DONG',
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(list.body.tong).toBe(1);

    expect(list.body.duLieu[0].id).toBe(childId);
  });

  it('cập nhật category + chặn hierarchy cycle', async () => {
    const update = await request(app.getHttpServer())
      .patch(`/api/v1/danh-muc-san-pham/${childId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Rau ăn lá xanh',
        slug: `rau-an-la-xanh-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      })
      .expect(200);

    expect(update.body.ten).toBe('Rau ăn lá xanh');

    await request(app.getHttpServer())
      .patch(`/api/v1/danh-muc-san-pham/${rootId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        danhMucChaId: childId,
      })
      .expect(400);

    const root = await prisma.danhMucSanPham.findUniqueOrThrow({
      where: {
        id: rootId,
      },
    });

    expect(root.danhMucChaId).toBeNull();
  });

  it('NHAN_VIEN không có quyền khóa; ADMIN đổi status thành công', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/danh-muc-san-pham/${childId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(403);

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/danh-muc-san-pham/${childId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(200);

    expect(response.body.trangThai).toBe('NGUNG_HOAT_DONG');
  });

  it('audit create/update/status đúng và không có DELETE API', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'danh_muc_san_pham',
        thucTheId: {
          in: [rootId, childId],
        },
      },
    });

    expect(logs.map((item) => item.hanhDong).sort()).toEqual([
      'DANH_MUC_SAN_PHAM_DOI_TRANG_THAI',
      'DANH_MUC_SAN_PHAM_SUA',
      'DANH_MUC_SAN_PHAM_TAO',
      'DANH_MUC_SAN_PHAM_TAO',
    ]);

    await request(app.getHttpServer())
      .delete(`/api/v1/danh-muc-san-pham/${childId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);
  });

  it('PHIEN-029 không mở Product API sớm', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);
  });
});
