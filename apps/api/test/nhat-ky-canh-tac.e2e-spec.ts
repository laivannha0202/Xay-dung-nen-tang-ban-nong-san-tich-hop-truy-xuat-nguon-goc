import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiMuaVu } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 45_000;

describe('Nhật ký canh tác (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Cultivation-021';
  const emailKhach = `cult-khach-${suffix}@example.com`;
  const emailNhanVien = `cult-nv-${suffix}@example.com`;
  const emailAdmin = `cult-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let muaVuId = '';
  let nhatKyChinhId = '';

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
          hoTen: 'Nhật ký canh tác E2E PHIEN 021',
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
        ma: `NCC-CULT-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Nhật ký E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-CULT-${suffix}`.slice(0, 50),
        ten: 'Trang trại Nhật ký E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Cà chua bi',
        ngayTrong: new Date('2026-09-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-12-15T00:00:00.000Z'),
        sanLuongDuKienKg: 12500.5,
        trangThai: TrangThaiMuaVu.DANG_CANH_TAC,
      },
    });

    muaVuId = season.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const entryIds = (
        await prisma.nhatKyCanhTac.findMany({
          where: {
            muaVuId,
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      if (entryIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'nhat_ky_canh_tac',
            thucTheId: {
              in: entryIds,
            },
          },
        });

        await prisma.nhatKyCanhTac.deleteMany({
          where: {
            id: {
              in: entryIds,
            },
          },
        });
      }

      if (muaVuId) {
        await prisma.muaVu.deleteMany({
          where: {
            id: muaVuId,
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
            startsWith: 'nhat_ky_canh_tac.',
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
      'ADMIN:nhat_ky_canh_tac.sua',
      'ADMIN:nhat_ky_canh_tac.tao',
      'ADMIN:nhat_ky_canh_tac.xem',
      'NHAN_VIEN:nhat_ky_canh_tac.sua',
      'NHAN_VIEN:nhat_ky_canh_tac.tao',
      'NHAN_VIEN:nhat_ky_canh_tac.xem',
    ]);
  });

  it('KHACH_HANG không quản trị nhật ký -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-canh-tac')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('Mùa vụ không tồn tại -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/nhat-ky-canh-tac')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        muaVuId: '00000000-0000-7000-8000-000000000001',
        loaiSuKien: 'KIEM_TRA',
        thoiGian: '2026-09-02T08:00:00.000Z',
        noiDung: 'Kiểm tra thử mùa vụ không tồn tại.',
      })
      .expect(400);
  });

  it('NHAN_VIEN tạo đủ 6 loại sự kiện và public flag mặc định false', async () => {
    const events = [
      {
        loaiSuKien: 'TUOI',
        noiDung: 'Tưới nhỏ giọt khu A trong 45 phút.',
        hienThiCongKhai: undefined,
      },
      {
        loaiSuKien: 'BON_PHAN',
        noiDung: 'Bón phân hữu cơ đợt 1.',
        hienThiCongKhai: false,
      },
      {
        loaiSuKien: 'SAU_BENH',
        noiDung: 'Phát hiện dấu hiệu sâu bệnh nhẹ.',
        hienThiCongKhai: false,
      },
      {
        loaiSuKien: 'KIEM_TRA',
        noiDung: 'Kiểm tra sinh trưởng định kỳ.',
        hienThiCongKhai: false,
      },
      {
        loaiSuKien: 'THOI_TIET',
        noiDung: 'Mưa nhẹ, nhiệt độ trung bình 22 độ C.',
        hienThiCongKhai: true,
      },
      {
        loaiSuKien: 'KHAC',
        noiDung: 'Vệ sinh khu vực canh tác.',
        hienThiCongKhai: false,
      },
    ] as const;

    for (const [index, event] of events.entries()) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/nhat-ky-canh-tac')
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .set('User-Agent', 'AgriMarket-Cultivation-E2E')
        .send({
          muaVuId,
          loaiSuKien: event.loaiSuKien,
          thoiGian: `2026-09-${String(index + 2).padStart(2, '0')}T08:00:00.000Z`,
          noiDung: event.noiDung,
          hienThiCongKhai: event.hienThiCongKhai,
        })
        .expect(201);

      if (index === 0) {
        nhatKyChinhId = response.body.id as string;

        expect(response.body.hienThiCongKhai).toBe(false);
      }

      expect(response.body.loaiSuKien).toBe(event.loaiSuKien);
    }
  });

  it('lọc public=true chỉ trả event được đánh dấu công khai', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-canh-tac')
      .query({
        muaVuId,
        hienThiCongKhai: 'true',
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].loaiSuKien).toBe('THOI_TIET');

    expect(response.body.duLieu[0].hienThiCongKhai).toBe(true);
  });

  it('search + season + loại sự kiện trả đúng entry', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/nhat-ky-canh-tac')
      .query({
        timKiem: 'nhỏ giọt',
        muaVuId,
        loaiSuKien: 'TUOI',
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].id).toBe(nhatKyChinhId);
  });

  it('NHAN_VIEN sửa nội dung và bật công khai', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/nhat-ky-canh-tac/${nhatKyChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Cultivation-Update-E2E')
      .send({
        noiDung: 'Tưới nhỏ giọt khu A trong 50 phút.',
        hienThiCongKhai: true,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.hienThiCongKhai).toBe(true);

        expect(body.noiDung).toContain('50 phút');
      });
  });

  it('Audit tạo/sửa Nhật ký canh tác có actor và snapshot public flag', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'nhat_ky_canh_tac',
        thucTheId: nhatKyChinhId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['NHAT_KY_CANH_TAC_TAO', 'NHAT_KY_CANH_TAC_SUA']),
    );

    const updateLog = logs.find((item) => item.hanhDong === 'NHAT_KY_CANH_TAC_SUA');

    expect(updateLog?.tacNhanId).toBe(nhanVienId);

    expect(updateLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Cultivation-Update-E2E',
      }),
    );

    expect(updateLog?.sau).toEqual(
      expect.objectContaining({
        hienThiCongKhai: true,
      }),
    );
  });
});
