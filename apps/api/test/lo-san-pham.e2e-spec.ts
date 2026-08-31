import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiMuaVu } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 60_000;

describe('Lô sản phẩm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Batch-023';

  const emailKhach = `batch-khach-${suffix}@example.com`;
  const emailNhanVien = `batch-nv-${suffix}@example.com`;
  const emailAdmin = `batch-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let muaVuId = '';
  let thuHoachId = '';
  let thuHoachDongThoiId = '';
  let loChinhId = '';
  let loThuHaiId = '';

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
          hoTen: 'Lô sản phẩm E2E PHIEN 023',
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
        ma: `NCC-BATCH-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Lô E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-BATCH-${suffix}`.slice(0, 50),
        ten: 'Trang trại Lô E2E',
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
        ngayTrong: new Date('2026-01-10T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-15T00:00:00.000Z'),
        sanLuongDuKienKg: 8000,
        trangThai: TrangThaiMuaVu.CHO_THU_HOACH,
      },
    });

    muaVuId = season.id;

    const [harvest, harvestConcurrency] = await Promise.all([
      prisma.thuHoach.create({
        data: {
          muaVuId,
          ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
          soLuong: 1000,
          donVi: 'KG',
          phanLoai: 'Loại A',
          ghiChu: 'Nguồn tạo Lô E2E.',
        },
      }),
      prisma.thuHoach.create({
        data: {
          muaVuId,
          ngayThuHoach: new Date('2026-08-21T00:00:00.000Z'),
          soLuong: 1000,
          donVi: 'KG',
          phanLoai: 'Loại B',
          ghiChu: 'Nguồn test khóa đồng thời.',
        },
      }),
    ]);

    thuHoachId = harvest.id;

    thuHoachDongThoiId = harvestConcurrency.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const harvestIds = [thuHoachId, thuHoachDongThoiId].filter(Boolean);

      const lotIds = (
        await prisma.loSanPham.findMany({
          where: {
            thuHoachId: {
              in: harvestIds,
            },
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      if (lotIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'lo_san_pham',
            thucTheId: {
              in: lotIds,
            },
          },
        });

        await prisma.loSanPham.deleteMany({
          where: {
            id: {
              in: lotIds,
            },
          },
        });
      }

      if (harvestIds.length) {
        await prisma.thuHoach.deleteMany({
          where: {
            id: {
              in: harvestIds,
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

  it('seed permission Lô đúng 3 quyền cho Nhân viên và 4 quyền cho Admin', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'lo_san_pham.',
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
      'ADMIN:lo_san_pham.sua',
      'ADMIN:lo_san_pham.tao',
      'ADMIN:lo_san_pham.thu_hoi',
      'ADMIN:lo_san_pham.xem',
      'NHAN_VIEN:lo_san_pham.sua',
      'NHAN_VIEN:lo_san_pham.tao',
      'NHAN_VIEN:lo_san_pham.xem',
    ]);
  });

  it('KHACH_HANG không quản trị Lô -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/lo-san-pham')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('không có endpoint tạo Lô trực tiếp -> 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/lo-san-pham')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: 'KHONG-DUOC-TAO',
        soLuong: 1,
        ngayHetHan: '2026-09-01',
      })
      .expect(404);
  });

  it('Thu hoạch không tồn tại -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/lo-san-pham/tu-thu-hoach/00000000-0000-7000-8000-000000000001')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-NO-HARVEST-${suffix}`.slice(0, 100),
        soLuong: 10,
        ngayHetHan: '2026-09-01',
      })
      .expect(400);
  });

  it('ngày hết hạn trước ngày Thu hoạch -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-BAD-DATE-${suffix}`.slice(0, 100),
        soLuong: 10,
        ngayHetHan: '2026-08-19',
      })
      .expect(400);
  });

  it('không cho quantity Lô vượt số lượng Thu hoạch', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-TOO-MUCH-${suffix}`.slice(0, 100),
        soLuong: 1000.001,
        ngayHetHan: '2026-09-15',
      })
      .expect(400);
  });

  it('NHAN_VIEN tạo Lô từ Thu hoạch, remaining = quantity và qualityGrade null', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Batch-E2E')
      .send({
        maLo: `LOT-A-${suffix}`.slice(0, 100),
        soLuong: 600,
        ngayHetHan: '2026-09-15',
      })
      .expect(201);

    loChinhId = first.body.id as string;

    expect(first.body.soLuong).toBe(600);

    expect(first.body.conLai).toBe(600);

    expect(first.body.phanHangChatLuong).toBeNull();

    expect(first.body.trangThai).toBe('MOI_TAO');

    expect(first.body.thuHoach.id).toBe(thuHoachId);

    expect(first.body.thuHoach.donVi).toBe('KG');
  });

  it('trùng maLo -> 409', async () => {
    const existing = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loChinhId,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: existing.maLo,
        soLuong: 10,
        ngayHetHan: '2026-09-15',
      })
      .expect(409);
  });

  it('một Thu hoạch tách được nhiều Lô nhưng tổng không vượt nguồn', async () => {
    const second = await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-B-${suffix}`.slice(0, 100),
        soLuong: 400,
        ngayHetHan: '2026-09-20',
      })
      .expect(201);

    loThuHaiId = second.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-C-${suffix}`.slice(0, 100),
        soLuong: 0.001,
        ngayHetHan: '2026-09-20',
      })
      .expect(400);

    const aggregate = await prisma.loSanPham.aggregate({
      where: {
        thuHoachId,
      },
      _sum: {
        soLuong: true,
      },
    });

    expect(Number(aggregate._sum.soLuong)).toBe(1000);
  });

  it('FOR UPDATE ngăn hai request đồng thời vượt quantity Thu hoạch', async () => {
    const makeRequest = (maLo: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachDongThoiId}`)
        .set('Authorization', `Bearer ${tokenNhanVien}`)
        .send({
          maLo,
          soLuong: 600,
          ngayHetHan: '2026-09-25',
        });

    const [one, two] = await Promise.all([
      makeRequest(`LOT-CON-A-${suffix}`.slice(0, 100)),
      makeRequest(`LOT-CON-B-${suffix}`.slice(0, 100)),
    ]);

    expect([one.status, two.status].sort()).toEqual([201, 400]);

    const aggregate = await prisma.loSanPham.aggregate({
      where: {
        thuHoachId: thuHoachDongThoiId,
      },
      _sum: {
        soLuong: true,
      },
    });

    expect(Number(aggregate._sum.soLuong)).toBe(600);
  });

  it('sửa Lô MOI_TAO cập nhật remaining theo quantity', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Batch-Update-E2E')
      .send({
        maLo: `LOT-A-EDIT-${suffix}`.slice(0, 100),
        soLuong: 500,
        ngayHetHan: '2026-09-18',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.soLuong).toBe(500);

        expect(body.conLai).toBe(500);

        expect(body.trangThai).toBe('MOI_TAO');
      });
  });

  it('sau khi giảm quantity có thể tạo phần Lô còn thiếu', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/tu-thu-hoach/${thuHoachId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        maLo: `LOT-C-${suffix}`.slice(0, 100),
        soLuong: 100,
        ngayHetHan: '2026-09-21',
      })
      .expect(201);
  });

  it('search/status filter trả đúng Lô', async () => {
    const existing = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loChinhId,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/lo-san-pham')
      .query({
        timKiem: existing.maLo,
        thuHoachId,
        trangThai: 'MOI_TAO',
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].id).toBe(loChinhId);
  });

  it('gửi kiểm định chuyển MOI_TAO -> CHO_KIEM_DINH và khóa sửa', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}/gui-kiem-dinh`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Batch-Submit-E2E')
      .expect(200)
      .expect(({ body }) => {
        expect(body.trangThai).toBe('CHO_KIEM_DINH');

        expect(body.phanHangChatLuong).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        soLuong: 450,
      })
      .expect(400);
  });

  it('Audit tạo/sửa/gửi kiểm định Lô được ghi', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'lo_san_pham',
        thucTheId: loChinhId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining([
        'LO_SAN_PHAM_TAO_TU_THU_HOACH',
        'LO_SAN_PHAM_SUA',
        'LO_SAN_PHAM_GUI_KIEM_DINH',
      ]),
    );

    const submitLog = logs.find((item) => item.hanhDong === 'LO_SAN_PHAM_GUI_KIEM_DINH');

    expect(submitLog?.tacNhanId).toBe(nhanVienId);

    expect(submitLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Batch-Submit-E2E',
      }),
    );
  });

  it('Lô thứ hai vẫn giữ MOI_TAO để PHIEN-024 kiểm định sau', async () => {
    const second = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loThuHaiId,
      },
    });

    expect(second.trangThai).toBe('MOI_TAO');

    expect(second.phanHangChatLuong).toBeNull();
  });
});
