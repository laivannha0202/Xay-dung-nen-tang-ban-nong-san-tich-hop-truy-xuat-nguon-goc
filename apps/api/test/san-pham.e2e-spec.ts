import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Sản phẩm (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Product-030';

  const emailKhach = `product-khach-${suffix}@example.com`;

  const emailNhanVien = `product-nv-${suffix}@example.com`;

  const emailAdmin = `product-admin-${suffix}@example.com`;

  let khachId = '';

  let nhanVienId = '';

  let adminId = '';

  let tokenKhach = '';

  let tokenNhanVien = '';

  let tokenAdmin = '';

  let nhaCungCapId = '';

  let trangTraiId = '';

  let trangTraiKhoaId = '';

  let danhMucId = '';

  let danhMucKhoaId = '';

  let sanPhamId = '';

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
          hoTen: 'Sản phẩm E2E PHIEN 030',
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
        ma: `NCC-P30-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Product E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const [activeFarm, inactiveFarm] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P30-${suffix}`.slice(0, 50),
          ten: 'Trang trại hoạt động Product E2E',
          diaChi: 'Đà Lạt',
          nhaCungCapId,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P30-OFF-${suffix}`.slice(0, 50),
          ten: 'Trang trại ngừng hoạt động Product E2E',
          diaChi: 'Lâm Đồng',
          nhaCungCapId,
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);

    trangTraiId = activeFarm.id;

    trangTraiKhoaId = inactiveFarm.id;

    const [activeCategory, inactiveCategory] = await Promise.all([
      prisma.danhMucSanPham.create({
        data: {
          ten: 'Rau củ Product E2E',
          slug: `rau-cu-product-${suffix}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .slice(0, 191),
        },
      }),
      prisma.danhMucSanPham.create({
        data: {
          ten: 'Danh mục khóa Product E2E',
          slug: `category-off-${suffix}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .slice(0, 191),
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);

    danhMucId = activeCategory.id;

    danhMucKhoaId = inactiveCategory.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();

    const log = (text: string) => {
      console.log(`[PRODUCT E2E cleanup +${Date.now() - start}ms] ${text}`);
    };

    log('Bắt đầu cleanup.');

    if (prisma) {
      if (sanPhamId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            OR: [
              {
                thucThe: 'san_pham',
                thucTheId: sanPhamId,
              },
              {
                tacNhanId: {
                  in: [adminId, nhanVienId].filter(Boolean),
                },
              },
            ],
          },
        });

        await prisma.sanPham.deleteMany({
          where: {
            id: sanPhamId,
          },
        });
      }

      const categoryIds = [danhMucId, danhMucKhoaId].filter(Boolean);

      if (categoryIds.length) {
        await prisma.danhMucSanPham.deleteMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
        });
      }

      const farmIds = [trangTraiId, trangTraiKhoaId].filter(Boolean);

      if (farmIds.length) {
        await prisma.trangTrai.deleteMany({
          where: {
            id: {
              in: farmIds,
            },
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

      const workers = [
        app.get(EmailWorker, {
          strict: false,
        }),
        app.get(ThongBaoWorker, {
          strict: false,
        }),
        app.get(HeThongWorker, {
          strict: false,
        }),
      ];

      await Promise.all(
        workers.map(async (worker) => {
          await worker.worker.close(true);
        }),
      );

      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), {
          strict: false,
        }),
      ];

      await Promise.all(
        queues.map(async (queue) => {
          await queue.close();
        }),
      );

      log('Đã đóng BullMQ workers/queues trước app.close().');

      await app.close();

      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('RBAC Sản phẩm = KHACH_HANG 1, NHAN_VIEN 3, ADMIN 4 quyền', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'san_pham.',
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

    expect(mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort()).toEqual([
      'ADMIN:san_pham.khoa',
      'ADMIN:san_pham.sua',
      'ADMIN:san_pham.tao',
      'ADMIN:san_pham.xem',
      'KHACH_HANG:san_pham.xem',
      'NHAN_VIEN:san_pham.sua',
      'NHAN_VIEN:san_pham.tao',
      'NHAN_VIEN:san_pham.xem',
    ]);
  });

  it('PHIEN-013 giữ KHACH_HANG san_pham.xem nhưng Product chưa public unauthenticated', async () => {
    await request(app.getHttpServer()).get('/api/v1/san-pham').expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        ten: 'Khách hàng không được tạo',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
      })
      .expect(403);
  });

  it('không tạo sản phẩm với farm/category ngừng hoạt động', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Sản phẩm farm khóa',
        trangTraiId: trangTraiKhoaId,
        danhMucSanPhamId: danhMucId,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Sản phẩm category khóa',
        trangTraiId,
        danhMucSanPhamId: danhMucKhoaId,
      })
      .expect(400);
  });

  it('NHAN_VIEN tạo sản phẩm catalog đúng model PHIEN-030', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Product-E2E')
      .send({
        ten: 'Cà rốt hữu cơ',
        moTa: '  Cà rốt trồng tại trang trại thử nghiệm.  ',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
      })
      .expect(201);

    sanPhamId = response.body.id as string;

    expect(response.body).toMatchObject({
      ten: 'Cà rốt hữu cơ',
      moTa: 'Cà rốt trồng tại trang trại thử nghiệm.',
      trangTraiId,
      danhMucSanPhamId: danhMucId,
      trangThai: 'HOAT_DONG',
    });

    expect(response.body.trangTrai.id).toBe(trangTraiId);

    expect(response.body.danhMucSanPham.id).toBe(danhMucId);

    for (const forbidden of ['sku', 'gia', 'donVi', 'anh', 'loSanPham', 'loSanPhamId']) {
      expect(response.body).not.toHaveProperty(forbidden);
    }
  });

  it('list/search/filter farm/category/status trả đúng sản phẩm', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/san-pham')
      .query({
        timKiem: 'Cà rốt',
        trangTraiId,
        danhMucSanPhamId: danhMucId,
        trangThai: 'HOAT_DONG',
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].id).toBe(sanPhamId);
  });

  it('NHAN_VIEN cập nhật tên/mô tả; không chuyển sang reference khóa', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Cà rốt hữu cơ loại 1',
        moTa: '',
      })
      .expect(200);

    expect(response.body.ten).toBe('Cà rốt hữu cơ loại 1');

    expect(response.body.moTa).toBeNull();

    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId: trangTraiKhoaId,
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        danhMucSanPhamId: danhMucKhoaId,
      })
      .expect(400);
  });

  it('NHAN_VIEN không khóa; ADMIN khóa/mở sản phẩm', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(403);

    const locked = await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(200);

    expect(locked.body.trangThai).toBe('NGUNG_HOAT_DONG');

    const opened = await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'HOAT_DONG',
      })
      .expect(200);

    expect(opened.body.trangThai).toBe('HOAT_DONG');
  });

  it('Audit create/update/status được ghi', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'san_pham',
        thucTheId: sanPhamId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual([
      'SAN_PHAM_TAO',
      'SAN_PHAM_SUA',
      'SAN_PHAM_DOI_TRANG_THAI',
      'SAN_PHAM_DOI_TRANG_THAI',
    ]);
  });

  it('PHIEN-033 mở public Product; protected Product/Variant/Ảnh vẫn giữ boundary', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/san-pham/${sanPhamId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    await request(app.getHttpServer()).get('/api/v1/san-pham-cong-khai').expect(200);
  });

  it('Product ≠ Batch: schema runtime không có relation product trên Lô', async () => {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        soCot: number;
      }>
    >(
      `
SELECT COUNT(*) AS soCot
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lo_san_pham'
  AND COLUMN_NAME IN (
    'san_pham_id',
    'product_id'
  )
`,
    );

    expect(Number(rows[0]?.soCot ?? 0)).toBe(0);
  });
});
