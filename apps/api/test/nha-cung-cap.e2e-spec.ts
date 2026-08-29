import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const THOI_GIAN_CHO_E2E_MS = 30_000;

describe('Nhà cung cấp (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-NCC-017';
  const emailKhach = `ncc-khach-${suffix}@example.com`;
  const emailNhanVien = `ncc-nv-${suffix}@example.com`;
  const emailAdmin = `ncc-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';

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
          hoTen: 'NCC E2E PHIEN 017',
        })
        .expect(201);
    }

    const [khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailKhach },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailNhanVien,
        },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: { email: emailAdmin },
      }),
    ]);

    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({
        where: { ma: 'NHAN_VIEN' },
      }),
      prisma.vaiTro.findUniqueOrThrow({
        where: { ma: 'ADMIN' },
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
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (nhaCungCapId) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'nha_cung_cap',
            thucTheId: nhaCungCapId,
          },
        });

        await prisma.nhaCungCap.deleteMany({
          where: {
            id: nhaCungCapId,
          },
        });
      }

      const ids = [khachId, nhanVienId, adminId].filter(Boolean);

      if (ids.length) {
        await prisma.nguoiDung.deleteMany({
          where: {
            id: { in: ids },
          },
        });
      }
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('seed permission đúng least privilege', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'nha_cung_cap.',
          },
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: { ma: true },
        },
        quyen: {
          select: { ma: true },
        },
      },
    });

    const pairs = mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort();

    expect(pairs).toEqual([
      'ADMIN:nha_cung_cap.khoa',
      'ADMIN:nha_cung_cap.sua',
      'ADMIN:nha_cung_cap.tao',
      'ADMIN:nha_cung_cap.xem',
      'NHAN_VIEN:nha_cung_cap.sua',
      'NHAN_VIEN:nha_cung_cap.tao',
      'NHAN_VIEN:nha_cung_cap.xem',
    ]);
  });

  it('KHACH_HANG không xem được -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/nha-cung-cap')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('NHAN_VIEN tạo/xem/sửa được', async () => {
    const ma = `NCC-${suffix}`.slice(0, 50);

    const create = await request(app.getHttpServer())
      .post('/api/v1/nha-cung-cap')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-NCC-E2E')
      .send({
        ma,
        ten: 'Nhà cung cấp thử nghiệm',
        nguoiDaiDien: 'Nguyễn Văn A',
        soDienThoai: '0900000000',
        email: `ncc-${suffix}@example.com`,
        diaChi: 'Hà Nội',
        ghiChu: 'PHIEN-017',
      })
      .expect(201);

    nhaCungCapId = create.body.id as string;

    expect(create.body.ma).toBe(ma);
    expect(create.body.trangThai).toBe('HOAT_DONG');

    const list = await request(app.getHttpServer())
      .get('/api/v1/nha-cung-cap')
      .query({
        timKiem: ma,
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(list.body.tong).toBe(1);
    expect(list.body.duLieu[0].id).toBe(nhaCungCapId);

    await request(app.getHttpServer())
      .patch(`/api/v1/nha-cung-cap/${nhaCungCapId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ten: 'Nhà cung cấp đã cập nhật',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.ten).toBe('Nhà cung cấp đã cập nhật');
      });
  });

  it('trùng mã -> 409', async () => {
    const existing = await prisma.nhaCungCap.findUniqueOrThrow({
      where: {
        id: nhaCungCapId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/nha-cung-cap')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ma: existing.ma,
        ten: 'Trùng mã',
      })
      .expect(409);
  });

  it('NHAN_VIEN không khóa được -> 403', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/nha-cung-cap/${nhaCungCapId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(403);
  });

  it('ADMIN khóa/mở được và mutation có Audit', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/nha-cung-cap/${nhaCungCapId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('User-Agent', 'AgriMarket-NCC-Admin-E2E')
      .send({
        trangThai: 'NGUNG_HOAT_DONG',
      })
      .expect(200);

    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'nha_cung_cap',
        thucTheId: nhaCungCapId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining([
        'NHA_CUNG_CAP_TAO',
        'NHA_CUNG_CAP_SUA',
        'NHA_CUNG_CAP_DOI_TRANG_THAI',
      ]),
    );

    const stateLog = logs.find((item) => item.hanhDong === 'NHA_CUNG_CAP_DOI_TRANG_THAI');

    expect(stateLog?.tacNhanId).toBe(adminId);
    expect(stateLog?.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-NCC-Admin-E2E',
      }),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/nha-cung-cap/${nhaCungCapId}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'HOAT_DONG',
      })
      .expect(200);
  });
});
