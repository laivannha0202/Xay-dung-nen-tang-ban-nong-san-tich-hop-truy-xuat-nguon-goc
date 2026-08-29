import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 45_000;

describe('Mùa vụ (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Season-020';
  const emailKhach = `season-khach-${suffix}@example.com`;
  const emailNhanVien = `season-nv-${suffix}@example.com`;
  const emailAdmin = `season-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let muaVuId = '';

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
          hoTen: 'Mùa vụ E2E PHIEN 020',
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
        ma: `NCC-SEASON-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Mùa vụ E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-SEASON-${suffix}`.slice(0, 50),
        ten: 'Trang trại Mùa vụ E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const seasonIds = (
        await prisma.muaVu.findMany({
          where: {
            trangTraiId,
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      if (seasonIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'mua_vu',
            thucTheId: {
              in: seasonIds,
            },
          },
        });

        await prisma.muaVu.deleteMany({
          where: {
            id: {
              in: seasonIds,
            },
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
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            tacNhanId: {
              in: actorIds,
            },
          },
        });

        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: actorIds,
            },
          },
        });
      }
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('seed permission đúng 3 quyền cho Nhân viên/Admin', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'mua_vu.',
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
      'ADMIN:mua_vu.sua',
      'ADMIN:mua_vu.tao',
      'ADMIN:mua_vu.xem',
      'NHAN_VIEN:mua_vu.sua',
      'NHAN_VIEN:mua_vu.tao',
      'NHAN_VIEN:mua_vu.xem',
    ]);
  });

  it('KHACH_HANG không quản trị mùa vụ -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/mua-vu')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('ngày dự kiến thu hoạch không sau ngày trồng -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/mua-vu')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Cà chua bi',
        ngayTrong: '2026-09-01',
        ngayDuKienThuHoach: '2026-09-01',
        sanLuongDuKienKg: 1200,
      })
      .expect(400);
  });

  it('sản lượng dự kiến phải dương -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/mua-vu')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Cà chua bi',
        ngayTrong: '2026-09-01',
        ngayDuKienThuHoach: '2026-12-15',
        sanLuongDuKienKg: 0,
      })
      .expect(400);
  });

  it('NHAN_VIEN tạo mùa vụ kế hoạch', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/mua-vu')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Season-E2E')
      .send({
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Cà chua bi',
        ngayTrong: '2026-09-01',
        ngayDuKienThuHoach: '2026-12-15',
        sanLuongDuKienKg: 12500.5,
      })
      .expect(201);

    muaVuId = create.body.id as string;

    expect(create.body.cayTrong).toBe('Cà chua');
    expect(create.body.giong).toBe('Cà chua bi');
    expect(create.body.trangThai).toBe('KE_HOACH');
    expect(create.body.sanLuongDuKienKg).toBe(12500.5);
  });

  it('search + farm/status filter trả đúng mùa vụ', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/mua-vu')
      .query({
        timKiem: 'Cà chua',
        trangTraiId,
        trangThai: 'KE_HOACH',
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0].id).toBe(muaVuId);
  });

  it('NHAN_VIEN cập nhật kế hoạch và trạng thái', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/mua-vu/${muaVuId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Season-Update-E2E')
      .send({
        sanLuongDuKienKg: 13000.75,
        trangThai: 'DANG_CANH_TAC',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.sanLuongDuKienKg).toBe(13000.75);
        expect(body.trangThai).toBe('DANG_CANH_TAC');
      });
  });

  it('không tạo mùa vụ mới cho trang trại ngừng hoạt động', async () => {
    await prisma.trangTrai.update({
      where: {
        id: trangTraiId,
      },
      data: {
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/mua-vu')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId,
        cayTrong: 'Xà lách',
        giong: 'Xà lách xoăn',
        ngayTrong: '2026-10-01',
        ngayDuKienThuHoach: '2026-11-20',
        sanLuongDuKienKg: 5000,
      })
      .expect(400);

    await prisma.trangTrai.update({
      where: {
        id: trangTraiId,
      },
      data: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });
  });

  it('Audit tạo/sửa Mùa vụ được ghi cùng tác nhân', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'mua_vu',
        thucTheId: muaVuId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['MUA_VU_TAO', 'MUA_VU_SUA']),
    );

    const updateLog = logs.find((item) => item.hanhDong === 'MUA_VU_SUA');

    expect(updateLog?.tacNhanId).toBe(nhanVienId);

    expect(updateLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Season-Update-E2E',
      }),
    );
  });
});
