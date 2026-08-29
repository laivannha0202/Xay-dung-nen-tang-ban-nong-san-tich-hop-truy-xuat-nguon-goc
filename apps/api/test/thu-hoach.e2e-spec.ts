import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiMuaVu } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 45_000;

describe('Thu hoạch (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Harvest-022';

  const emailKhach = `harvest-khach-${suffix}@example.com`;
  const emailNhanVien = `harvest-nv-${suffix}@example.com`;
  const emailAdmin = `harvest-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let muaVuId = '';
  let muaVuHuyId = '';
  let thuHoachChinhId = '';

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
          hoTen: 'Thu hoạch E2E PHIEN 022',
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
        ma: `NCC-HARV-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Thu hoạch E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-HARV-${suffix}`.slice(0, 50),
        ten: 'Trang trại Thu hoạch E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const [season, seasonHuy] = await Promise.all([
      prisma.muaVu.create({
        data: {
          trangTraiId,
          cayTrong: 'Cà chua',
          giong: 'Cà chua bi',
          ngayTrong: new Date('2026-01-10T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-08-15T00:00:00.000Z'),
          sanLuongDuKienKg: 5000,
          trangThai: TrangThaiMuaVu.DANG_CANH_TAC,
        },
      }),
      prisma.muaVu.create({
        data: {
          trangTraiId,
          cayTrong: 'Xà lách',
          giong: 'Xà lách xoăn',
          ngayTrong: new Date('2026-01-01T00:00:00.000Z'),
          ngayDuKienThuHoach: new Date('2026-03-01T00:00:00.000Z'),
          sanLuongDuKienKg: 1000,
          trangThai: TrangThaiMuaVu.HUY,
        },
      }),
    ]);

    muaVuId = season.id;

    muaVuHuyId = seasonHuy.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const harvestIds = (
        await prisma.thuHoach.findMany({
          where: {
            muaVuId: {
              in: [muaVuId, muaVuHuyId],
            },
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      if (harvestIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'thu_hoach',
            thucTheId: {
              in: harvestIds,
            },
          },
        });

        await prisma.thuHoach.deleteMany({
          where: {
            id: {
              in: harvestIds,
            },
          },
        });
      }

      if (muaVuId || muaVuHuyId) {
        await prisma.muaVu.deleteMany({
          where: {
            id: {
              in: [muaVuId, muaVuHuyId].filter(Boolean),
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
            startsWith: 'thu_hoach.',
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
      'ADMIN:thu_hoach.sua',
      'ADMIN:thu_hoach.tao',
      'ADMIN:thu_hoach.xem',
      'NHAN_VIEN:thu_hoach.sua',
      'NHAN_VIEN:thu_hoach.tao',
      'NHAN_VIEN:thu_hoach.xem',
    ]);
  });

  it('KHACH_HANG không quản trị thu hoạch -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('Mùa vụ không tồn tại -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId: '00000000-0000-7000-8000-000000000001',
        ngayThuHoach: '2026-08-20',
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại A',
      })
      .expect(400);
  });

  it('số lượng phải dương -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId,
        ngayThuHoach: '2026-08-20',
        soLuong: 0,
        donVi: 'KG',
        phanLoai: 'Loại A',
      })
      .expect(400);
  });

  it('ngày thu hoạch trước ngày trồng -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId,
        ngayThuHoach: '2026-01-09',
        soLuong: 100,
        donVi: 'KG',
        phanLoai: 'Loại A',
      })
      .expect(400);
  });

  it('mùa vụ HUY không được ghi thu hoạch -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId: muaVuHuyId,
        ngayThuHoach: '2026-02-01',
        soLuong: 100,
        donVi: 'KG',
        phanLoai: 'Loại A',
      })
      .expect(400);
  });

  it('NHAN_VIEN ghi được nhiều lần thu hoạch cùng mùa vụ', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Harvest-E2E')
      .send({
        muaVuId,
        ngayThuHoach: '2026-08-20',
        soLuong: 1250.5,
        donVi: 'kg',
        phanLoai: 'Loại A',
        ghiChu: 'Đợt thu hoạch đầu tiên.',
      })
      .expect(201);

    thuHoachChinhId = first.body.id as string;

    expect(first.body.donVi).toBe('KG');

    expect(first.body.soLuong).toBe(1250.5);

    expect(first.body.muaVu.id).toBe(muaVuId);

    await request(app.getHttpServer())
      .post('/api/v1/thu-hoach')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId,
        ngayThuHoach: '2026-08-21',
        soLuong: 980.25,
        donVi: 'KG',
        phanLoai: 'Loại B',
        ghiChu: 'Đợt thu hoạch thứ hai.',
      })
      .expect(201);

    const count = await prisma.thuHoach.count({
      where: {
        muaVuId,
      },
    });

    expect(count).toBe(2);
  });

  it('search + filter mùa vụ/phân loại/đơn vị trả đúng thu hoạch', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/thu-hoach')
      .query({
        timKiem: 'Cà chua',
        muaVuId,
        donVi: 'kg',
        phanLoai: 'Loại A',
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].id).toBe(thuHoachChinhId);
  });

  it('NHAN_VIEN cập nhật số lượng/phân loại/ghi chú', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/thu-hoach/${thuHoachChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Harvest-Update-E2E')
      .send({
        soLuong: 1300.75,
        phanLoai: 'Loại A+',
        ghiChu: 'Đã cân xác nhận lại.',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.soLuong).toBe(1300.75);

        expect(body.phanLoai).toBe('Loại A+');

        expect(body.ghiChu).toContain('cân xác nhận');
      });
  });

  it('Audit tạo/sửa Thu hoạch có actor và snapshot', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'thu_hoach',
        thucTheId: thuHoachChinhId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['THU_HOACH_TAO', 'THU_HOACH_SUA']),
    );

    const updateLog = logs.find((item) => item.hanhDong === 'THU_HOACH_SUA');

    expect(updateLog?.tacNhanId).toBe(nhanVienId);

    expect(updateLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Harvest-Update-E2E',
      }),
    );

    expect(updateLog?.sau).toEqual(
      expect.objectContaining({
        soLuong: 1300.75,
        phanLoai: 'Loại A+',
      }),
    );
  });
});
