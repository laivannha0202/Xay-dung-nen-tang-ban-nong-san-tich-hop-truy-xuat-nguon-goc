import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';
import { ThuHoachService } from '../src/modules/thu-hoach/thu-hoach.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 90_000;

describe('Follow Farm PHIEN-074 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let thuHoachService: ThuHoachService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Follow-074';
  const email = `follow-${suffix}@example.com`;
  const emailKhac = `follow-khac-${suffix}@example.com`;
  let token = '';
  let tokenKhac = '';
  let nguoiDungId = '';
  let nguoiDungKhacId = '';
  let khachHangId = '';
  let khachHangKhacId = '';
  let nhaCungCapId = '';
  let nhaCungCapKhoaId = '';
  let trangTraiId = '';
  let trangTraiKhoaId = '';
  let trangTraiSupplierKhoaId = '';
  let muaVuId = '';
  const thuHoachIds: string[] = [];

  const dangKyDangNhap = async (emailInput: string, hoTen: string) => {
    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailInput, matKhau, hoTen })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailInput, matKhau, nenTang: 'MOBILE' })
      .expect(200);

    const user = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailInput } });
    const customer = await prisma.khachHang.findUniqueOrThrow({ where: { nguoiDungId: user.id } });
    return { token: login.body.accessToken as string, userId: user.id, customerId: customer.id };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    thuHoachService = app.get(ThuHoachService);

    const user = await dangKyDangNhap(email, 'Follow Farm E2E 074');
    token = user.token;
    nguoiDungId = user.userId;
    khachHangId = user.customerId;

    const other = await dangKyDangNhap(emailKhac, 'Follow Farm E2E khác');
    tokenKhac = other.token;
    nguoiDungKhacId = other.userId;
    khachHangKhacId = other.customerId;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-F74-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp Follow 074' },
    });
    nhaCungCapId = supplier.id;

    const supplierLocked = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-F74-X-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp khóa Follow 074',
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
      },
    });
    nhaCungCapKhoaId = supplierLocked.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-F74-${suffix}`.slice(0, 50),
        ten: 'Trang trại Follow 074',
        diaChi: 'Lâm Đồng',
        nhaCungCapId,
      },
    });
    trangTraiId = farm.id;

    const farmLocked = await prisma.trangTrai.create({
      data: {
        ma: `FARM-F74-X-${suffix}`.slice(0, 50),
        ten: 'Trang trại khóa Follow 074',
        diaChi: 'Ẩn',
        nhaCungCapId,
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
      },
    });
    trangTraiKhoaId = farmLocked.id;

    const farmSupplierLocked = await prisma.trangTrai.create({
      data: {
        ma: `FARM-F74-NCCX-${suffix}`.slice(0, 50),
        ten: 'Trang trại supplier khóa Follow 074',
        diaChi: 'Ẩn',
        nhaCungCapId: nhaCungCapKhoaId,
      },
    });
    trangTraiSupplierKhoaId = farmSupplierLocked.id;

    const today = new Date();
    const planted = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 10),
    );
    const expected = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 10),
    );
    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Dâu tây',
        giong: 'Ruby 074',
        ngayTrong: planted,
        ngayDuKienThuHoach: expected,
        sanLuongDuKienKg: 120,
      },
    });
    muaVuId = season.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      await prisma.thongBaoThuHoach.deleteMany({
        where: { thuHoachId: { in: thuHoachIds.filter(Boolean) } },
      });
      await prisma.theoDoiTrangTrai.deleteMany({
        where: {
          OR: [
            { khachHangId: { in: [khachHangId, khachHangKhacId].filter(Boolean) } },
            {
              trangTraiId: {
                in: [trangTraiId, trangTraiKhoaId, trangTraiSupplierKhoaId].filter(Boolean),
              },
            },
          ],
        },
      });
      if (thuHoachIds.length > 0) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: { thucThe: 'thu_hoach', thucTheId: { in: thuHoachIds } },
        });
        await prisma.thuHoach.deleteMany({ where: { id: { in: thuHoachIds } } });
      }
      if (muaVuId) await prisma.muaVu.deleteMany({ where: { id: muaVuId } });
      await prisma.trangTrai.deleteMany({
        where: {
          id: { in: [trangTraiId, trangTraiKhoaId, trangTraiSupplierKhoaId].filter(Boolean) },
        },
      });
      await prisma.nhaCungCap.deleteMany({
        where: { id: { in: [nhaCungCapId, nhaCungCapKhoaId].filter(Boolean) } },
      });
      await prisma.nguoiDung.deleteMany({
        where: { id: { in: [nguoiDungId, nguoiDungKhacId].filter(Boolean) } },
      });
    }
    if (app) await app.close();
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('yêu cầu access token cho follow list và notification list', async () => {
    await request(app.getHttpServer()).get('/api/v1/khach-hang/theo-doi-trang-trai').expect(401);
    await request(app.getHttpServer()).get('/api/v1/khach-hang/thong-bao-thu-hoach').expect(401);
  });

  it('trạng thái ban đầu false và follow list rỗng', async () => {
    const status = await request(app.getHttpServer())
      .get(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiId}/trang-thai`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(status.body).toEqual({ trangTraiId, dangTheoDoi: false });

    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/theo-doi-trang-trai')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body).toEqual({ duLieu: [], tong: 0 });
  });

  it('PUT follow idempotent và unique theo customer + farm', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ trangTraiId, dangTheoDoi: true });

    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ trangTraiId, dangTheoDoi: true });

    expect(await prisma.theoDoiTrangTrai.count({ where: { khachHangId, trangTraiId } })).toBe(1);
  });

  it('không follow farm khóa hoặc farm thuộc supplier khóa', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiKhoaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiSupplierKhoaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('follow ownership tách biệt giữa hai customer', async () => {
    const mine = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/theo-doi-trang-trai')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(mine.body.tong).toBe(1);
    expect(mine.body.duLieu[0]).toMatchObject({ trangTraiId, ten: 'Trang trại Follow 074' });

    const other = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/theo-doi-trang-trai')
      .set('Authorization', `Bearer ${tokenKhac}`)
      .expect(200);
    expect(other.body).toEqual({ duLieu: [], tong: 0 });
  });

  it('tạo harvest mới sinh notification đúng follower trong flow ThuHoachService.tao', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const harvest = await thuHoachService.tao(
      nguoiDungId,
      {
        muaVuId,
        ngayThuHoach: today,
        soLuong: 42,
        donVi: 'kg',
        phanLoai: 'Loại 1',
        ghiChu: 'Harvest notification PHIEN-074',
      },
      { ip: '127.0.0.1', userAgent: 'FollowFarmE2E' },
    );
    thuHoachIds.push(harvest.id);

    expect(
      await prisma.thongBaoThuHoach.count({ where: { khachHangId, thuHoachId: harvest.id } }),
    ).toBe(1);
    expect(
      await prisma.thongBaoThuHoach.count({
        where: { khachHangId: khachHangKhacId, thuHoachId: harvest.id },
      }),
    ).toBe(0);

    const notifications = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/thong-bao-thu-hoach')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(notifications.body.tong).toBe(1);
    expect(notifications.body.duLieu[0]).toMatchObject({
      thuHoachId: harvest.id,
      trangTraiId,
      tenTrangTrai: 'Trang trại Follow 074',
      cayTrong: 'Dâu tây',
      giong: 'Ruby 074',
      ngayThuHoach: today,
      soLuong: 42,
      donVi: 'KG',
      phanLoai: 'Loại 1',
    });
  });

  it('DELETE unfollow idempotent; lịch sử giữ nguyên; harvest sau unfollow không notify', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ trangTraiId, dangTheoDoi: false });

    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/theo-doi-trang-trai/${trangTraiId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ trangTraiId, dangTheoDoi: false });

    const today = new Date().toISOString().slice(0, 10);
    const harvest = await thuHoachService.tao(
      nguoiDungId,
      { muaVuId, ngayThuHoach: today, soLuong: 18, donVi: 'kg', phanLoai: 'Loại 2' },
      { ip: '127.0.0.1', userAgent: 'FollowFarmE2E' },
    );
    thuHoachIds.push(harvest.id);

    expect(
      await prisma.thongBaoThuHoach.count({ where: { khachHangId, thuHoachId: harvest.id } }),
    ).toBe(0);

    const notifications = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/thong-bao-thu-hoach')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(notifications.body.tong).toBe(1);
  });
});
