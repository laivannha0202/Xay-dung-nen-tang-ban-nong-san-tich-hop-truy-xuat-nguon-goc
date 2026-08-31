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

describe('Biến thể và giá sản phẩm (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Variant-031';

  const emailKhach = `variant-khach-${suffix}@example.com`;

  const emailNhanVien = `variant-nv-${suffix}@example.com`;

  const emailAdmin = `variant-admin-${suffix}@example.com`;

  let khachId = '';

  let nhanVienId = '';

  let adminId = '';

  let tokenKhach = '';

  let tokenNhanVien = '';

  let tokenAdmin = '';

  let nhaCungCapId = '';

  let trangTraiId = '';

  let danhMucId = '';

  let sanPhamId = '';

  let sanPhamKhacId = '';

  const bienTheIds: string[] = [];

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
          hoTen: 'Biến thể E2E PHIEN 031',
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
        ma: `NCC-V31-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Variant E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-V31-${suffix}`.slice(0, 50),
        ten: 'Trang trại Variant E2E',
        diaChi: 'Đà Lạt',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Rau củ Variant E2E',
        slug: `variant-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });

    danhMucId = category.id;

    const [product, productKhac] = await Promise.all([
      prisma.sanPham.create({
        data: {
          ten: 'Cà rốt Variant E2E',
          trangTraiId,
          danhMucSanPhamId: danhMucId,
        },
      }),
      prisma.sanPham.create({
        data: {
          ten: 'Khoai tây Variant E2E',
          trangTraiId,
          danhMucSanPhamId: danhMucId,
        },
      }),
    ]);

    sanPhamId = product.id;

    sanPhamKhacId = productKhac.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();

    const log = (text: string) => {
      console.log(`[VARIANT E2E cleanup +${Date.now() - start}ms] ${text}`);
    };

    log('Bắt đầu cleanup.');

    if (prisma) {
      await prisma.nhatKyKiemToan.deleteMany({
        where: {
          OR: [
            {
              thucThe: 'bien_the_san_pham',
            },
            {
              tacNhanId: {
                in: [adminId, nhanVienId].filter(Boolean),
              },
            },
          ],
        },
      });

      if (bienTheIds.length) {
        await prisma.bienTheSanPham.deleteMany({
          where: {
            id: {
              in: bienTheIds,
            },
          },
        });
      }

      const productIds = [sanPhamId, sanPhamKhacId].filter(Boolean);

      if (productIds.length) {
        await prisma.bienTheSanPham.deleteMany({
          where: {
            sanPhamId: {
              in: productIds,
            },
          },
        });

        await prisma.sanPham.deleteMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });
      }

      if (danhMucId) {
        await prisma.danhMucSanPham.deleteMany({
          where: {
            id: danhMucId,
          },
        });
      }

      if (trangTraiId) {
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

  it('giữ RBAC Product: KHACH_HANG xem, NHAN_VIEN tạo/sửa, không permission Variant riêng', async () => {
    const variantPermissions = await prisma.quyen.count({
      where: {
        ma: {
          startsWith: 'bien_the_san_pham.',
        },
      },
    });

    expect(variantPermissions).toBe(0);

    await request(app.getHttpServer()).get(`/api/v1/san-pham/${sanPhamId}/bien-the`).expect(401);

    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        sku: 'KHACH-500G',
        khoiLuong: 500,
        gia: 10000,
        donVi: 'g',
      })
      .expect(403);
  });

  it('NHAN_VIEN tạo đủ biến thể 500g / 1kg / 2kg với giá hiện tại', async () => {
    const inputs = [
      {
        sku: ' carrot-500g ',
        khoiLuong: 500,
        gia: 35000,
        donVi: ' G ',
      },
      {
        sku: 'carrot-1kg',
        khoiLuong: 1,
        gia: 65000,
        donVi: 'kg',
      },
      {
        sku: 'carrot-2kg',
        khoiLuong: 2,
        gia: 120000,
        donVi: 'kg',
      },
    ];

    for (const input of inputs) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/san-pham/${sanPhamId}/bien-the`)
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .send(input)
        .expect(201);

      bienTheIds.push(response.body.id as string);
    }

    expect(bienTheIds).toHaveLength(3);

    const first = await prisma.bienTheSanPham.findUniqueOrThrow({
      where: {
        id: bienTheIds[0],
      },
    });

    expect(first.sku).toBe('CARROT-500G');

    expect(first.donVi).toBe('g');
  });

  it('chặn duplicate SKU toàn hệ thống và duplicate quy cách trong cùng Product', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamKhacId}/bien-the`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        sku: 'carrot-500g',
        khoiLuong: 250,
        gia: 22000,
        donVi: 'g',
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        sku: 'CARROT-500G-OTHER',
        khoiLuong: 500,
        gia: 36000,
        donVi: 'g',
      })
      .expect(409);
  });

  it('khối lượng và giá phải > 0', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        sku: 'BAD-WEIGHT',
        khoiLuong: 0,
        gia: 10000,
        donVi: 'g',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        sku: 'BAD-PRICE',
        khoiLuong: 250,
        gia: -1,
        donVi: 'g',
      })
      .expect(400);
  });

  it('list trả đúng 3 biến thể và giá catalog hiện tại', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(3);

    const skus = response.body.duLieu.map((item: { sku: string }) => item.sku).sort();

    expect(skus).toEqual(['CARROT-1KG', 'CARROT-2KG', 'CARROT-500G']);
  });

  it('NHAN_VIEN sửa SKU/quy cách/giá và Audit lưu giá trước/sau', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/bien-the/${bienTheIds[0]}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Variant-E2E')
      .send({
        sku: 'carrot-450g',
        khoiLuong: 450,
        gia: 33000,
        donVi: 'g',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      sku: 'CARROT-450G',
      khoiLuong: 450,
      gia: 33000,
      donVi: 'g',
    });

    const audit = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: {
        thucThe: 'bien_the_san_pham',
        thucTheId: bienTheIds[0],
        hanhDong: 'BIEN_THE_SAN_PHAM_SUA',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(audit.metadata).toMatchObject({
      sanPhamId,
      giaTruoc: 35000,
      giaSau: 33000,
    });
  });

  it('variant ID không được cập nhật qua Product khác', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamKhacId}/bien-the/${bienTheIds[0]}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        gia: 31000,
      })
      .expect(404);
  });

  it('Audit đúng 3 create + 1 update', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'bien_the_san_pham',
        thucTheId: {
          in: bienTheIds,
        },
      },
    });

    expect(logs.map((item) => item.hanhDong).sort()).toEqual([
      'BIEN_THE_SAN_PHAM_SUA',
      'BIEN_THE_SAN_PHAM_TAO',
      'BIEN_THE_SAN_PHAM_TAO',
      'BIEN_THE_SAN_PHAM_TAO',
    ]);
  });

  it('không có DELETE Variant; ảnh/public Product vẫn chưa mở', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/san-pham/${sanPhamId}/bien-the/${bienTheIds[0]}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    await request(app.getHttpServer()).get('/api/v1/san-pham-cong-khai').expect(404);
  });

  it('PHIEN-031 chỉ lưu giá catalog hiện tại; chưa tạo Order sớm', async () => {
    const variant = await prisma.bienTheSanPham.findUniqueOrThrow({
      where: {
        id: bienTheIds[0],
      },
    });

    expect(Number(variant.gia)).toBe(33000);

    await request(app.getHttpServer())
      .post('/api/v1/don-hang')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(404);
  });
});
