import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiSuKienTruyXuat,
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiMuaVu,
} from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Sự kiện truy xuất (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Trace-026';

  const emailKhach = `trace-khach-${suffix}@example.com`;
  const emailNhanVien = `trace-nv-${suffix}@example.com`;
  const emailAdmin = `trace-admin-${suffix}@example.com`;

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
  let loSanPhamId = '';
  const suKienIds: string[] = [];

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
          hoTen: 'Trace Events E2E PHIEN 026',
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
        ma: `NCC-TRACE-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Trace E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-TRACE-${suffix}`.slice(0, 50),
        ten: 'Trang trại Trace E2E',
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
        ngayTrong: new Date('2026-01-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        sanLuongDuKienKg: 3000,
        trangThai: TrangThaiMuaVu.CHO_THU_HOACH,
      },
    });

    muaVuId = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId,
        ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        soLuong: 900,
        donVi: 'KG',
        phanLoai: 'Loại A',
        ghiChu: 'Nguồn Trace PHIEN-026.',
      },
    });

    thuHoachId = harvest.id;

    const lot = await prisma.loSanPham.create({
      data: {
        maLo: `TRACE-${suffix}`.slice(0, 100),
        thuHoachId,
        soLuong: 500,
        conLai: 500,
        phanHangChatLuong: 'Hạng A',
        ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });

    loSanPhamId = lot.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const batDau = Date.now();

    const logDonDep = (text: string) =>
      console.log(`[TRACE E2E cleanup +${Date.now() - batDau}ms] ${text}`);

    logDonDep('Bắt đầu cleanup.');

    if (prisma) {
      if (suKienIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'su_kien_truy_xuat',
            thucTheId: {
              in: suKienIds,
            },
          },
        });

        await prisma.suKienTruyXuat.deleteMany({
          where: {
            id: {
              in: suKienIds,
            },
          },
        });
      }

      if (loSanPhamId) {
        await prisma.loSanPham.deleteMany({
          where: {
            id: loSanPhamId,
          },
        });
      }

      if (thuHoachId) {
        await prisma.thuHoach.deleteMany({
          where: {
            id: thuHoachId,
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

      logDonDep('Cleanup dữ liệu MySQL hoàn tất.');
    }

    if (app) {
      logDonDep('Bắt đầu app.close().');

      await app.close();

      logDonDep('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('seed đúng 2 quyền Trace Events cho Nhân viên/Admin', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'su_kien_truy_xuat.',
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
      'ADMIN:su_kien_truy_xuat.tao',
      'ADMIN:su_kien_truy_xuat.xem',
      'NHAN_VIEN:su_kien_truy_xuat.tao',
      'NHAN_VIEN:su_kien_truy_xuat.xem',
    ]);
  });

  it('KHACH_HANG không quản trị Trace Events -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/su-kien-truy-xuat')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('không cho sự kiện ở tương lai -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        loai: 'DONG_GOI',
        thoiGian: '2099-01-01T00:00:00.000Z',
        diaDiem: 'Kho tương lai',
      })
      .expect(400);
  });

  it('CANH_TAC trước ngày trồng -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        loai: 'CANH_TAC',
        thoiGian: '2025-12-31T08:00:00.000Z',
        diaDiem: 'Trang trại Trace E2E',
      })
      .expect(400);
  });

  it('THU_HOACH sai ngày nguồn -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        loai: 'THU_HOACH',
        thoiGian: '2026-08-19T08:00:00.000Z',
        diaDiem: 'Trang trại Trace E2E',
      })
      .expect(400);
  });

  it('KIEM_DINH trước ngày Thu hoạch -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        loai: 'KIEM_DINH',
        thoiGian: '2026-08-19T10:00:00.000Z',
        diaDiem: 'Phòng kiểm định',
      })
      .expect(400);
  });

  it('metadata lớn hơn 8 KiB -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        loai: 'DONG_GOI',
        thoiGian: '2026-08-22T08:00:00.000Z',
        diaDiem: 'Nhà đóng gói',
        metadata: {
          duLieu: 'x'.repeat(9 * 1024),
        },
      })
      .expect(400);
  });

  it('ghi đủ 7 loại event master plan theo ledger append-only', async () => {
    const specs = [
      {
        loai: 'CANH_TAC',
        thoiGian: '2026-08-10T08:00:00.000Z',
        diaDiem: 'Trang trại Trace E2E',
        congKhai: true,
        metadata: {
          congViec: 'Tưới nhỏ giọt',
        },
      },
      {
        loai: 'THU_HOACH',
        thoiGian: '2026-08-20T06:00:00.000Z',
        diaDiem: 'Khu thu hoạch A',
        congKhai: true,
        metadata: {
          phanLoai: 'Loại A',
        },
      },
      {
        loai: 'KIEM_DINH',
        thoiGian: '2026-08-21T09:00:00.000Z',
        diaDiem: 'Phòng kiểm định',
        congKhai: true,
        metadata: {
          ketQua: 'PASSED',
        },
      },
      {
        loai: 'DONG_GOI',
        thoiGian: '2026-08-22T07:30:00.000Z',
        diaDiem: 'Nhà đóng gói',
        metadata: {
          quyCach: 'Thùng 10kg',
        },
      },
      {
        loai: 'NHAP_KHO',
        thoiGian: '2026-08-23T07:00:00.000Z',
        diaDiem: 'Kho lạnh A',
        congKhai: false,
        metadata: {
          nhietDo: '5C',
        },
      },
      {
        loai: 'XUAT_KHO',
        thoiGian: '2026-08-24T06:30:00.000Z',
        diaDiem: 'Kho lạnh A',
        congKhai: false,
        metadata: {
          maPhieu: 'PXK-TRACE',
        },
      },
      {
        loai: 'GIAO_HANG',
        thoiGian: '2026-08-25T10:00:00.000Z',
        diaDiem: 'Điểm giao nhận',
        congKhai: true,
        metadata: {
          trangThai: 'DA_GIAO',
        },
      },
    ] as const;

    for (const [index, spec] of specs.entries()) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/su-kien-truy-xuat/lo/${loSanPhamId}`)
        .set('Authorization', `Bearer ${index % 2 === 0 ? tokenNhanVien : tokenAdmin}`)
        .set('User-Agent', 'AgriMarket-Trace-E2E')
        .send(spec)
        .expect(201);

      suKienIds.push(response.body.id as string);

      expect(response.body.loai).toBe(spec.loai);

      expect(response.body.diaDiem).toBe(spec.diaDiem);
    }

    const dongGoi = await prisma.suKienTruyXuat.findFirstOrThrow({
      where: {
        loSanPhamId,
        loai: LoaiSuKienTruyXuat.DONG_GOI,
      },
    });

    expect(dongGoi.congKhai).toBe(false);

    expect(suKienIds).toHaveLength(7);
  });

  it('list mặc định theo timeline tăng dần và đủ 7 loại', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/su-kien-truy-xuat')
      .query({
        loSanPhamId,
        trang: 1,
        gioiHan: 20,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(response.body.tong).toBe(7);

    expect(response.body.duLieu.map((item: { loai: string }) => item.loai)).toEqual([
      'CANH_TAC',
      'THU_HOACH',
      'KIEM_DINH',
      'DONG_GOI',
      'NHAP_KHO',
      'XUAT_KHO',
      'GIAO_HANG',
    ]);
  });

  it('filter theo Lô + loại + public trả đúng event', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/su-kien-truy-xuat')
      .query({
        loSanPhamId,
        loai: 'KIEM_DINH',
        congKhai: true,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].loai).toBe('KIEM_DINH');
  });

  it('search địa điểm + detail trả metadata đúng', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/su-kien-truy-xuat')
      .query({
        timKiem: 'Nhà đóng gói',
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(list.body.tong).toBe(1);

    const id = list.body.duLieu[0].id as string;

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/su-kien-truy-xuat/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(detail.body.metadata).toEqual({
      quyCach: 'Thùng 10kg',
    });
  });

  it('event là append-only, không có PATCH/DELETE', async () => {
    const id = suKienIds[0];

    expect(id).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/api/v1/su-kien-truy-xuat/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        congKhai: false,
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/su-kien-truy-xuat/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);
  });

  it('Audit ghi SU_KIEN_TRUY_XUAT_TAO cho mỗi event', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'su_kien_truy_xuat',
        thucTheId: {
          in: suKienIds,
        },
        hanhDong: 'SU_KIEN_TRUY_XUAT_TAO',
      },
    });

    expect(logs).toHaveLength(7);

    expect(logs.map((item) => item.tacNhanId)).toEqual(
      expect.arrayContaining([nhanVienId, adminId]),
    );
  });

  it('PHIEN-026 chưa mở public trace API', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/truy-xuat/AGM-CHUA-CO-PUBLIC-TRACE')
      .expect(404);
  });
});
