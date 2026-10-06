import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang } from '../src/generated/prisma/client';

/**
 * Production flow DA_GIAO -> HOAN_THANH trên DB thật:
 * khách xác nhận đã nhận hàng qua POST /api/v1/don-hang/:id/xac-nhan-da-nhan.
 * Cùng API cho Customer Web và Mobile; Admin đọc lại trạng thái cuối.
 */
describe('Xac nhan da nhan don hang (e2e, true DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken = '';
  let customerId = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ids = {
    supplier: '',
    orderDaGiao: '',
    orderDangGiao: '',
    orderHuy: '',
    orderForeign: '',
  };

  const taoDonVoiTrangThai = async (
    label: string,
    khachHangId: string,
    trangThai: TrangThaiDonHang,
  ) => {
    const order = await prisma.donHang.create({
      data: {
        maYeuCau: randomUUID(),
        maDonHang: `PHT-${label}-${suffix}`.slice(0, 100),
        khachHangId,
        tongTien: 50000,
        trangThai,
      },
    });
    await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `${order.maDonHang}-01`,
        donHangId: order.id,
        nhaCungCapId: ids.supplier,
        tamTinh: 50000,
        trangThai,
      },
    });
    return order.id;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);

    const password = 'MatKhau-PHT-HoanThanh';

    const dangKyVaDangNhap = async (email: string) => {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau: password,
          hoTen: 'Khách Hoàn Thành',
          soDienThoai: `09${Date.now().toString().slice(-8)}`,
        })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau: password, nenTang: 'MOBILE' })
        .expect(200);
      const user = await prisma.nguoiDung.findUniqueOrThrow({
        where: { email },
        include: { khachHang: true },
      });
      return { token: login.body.accessToken as string, khachHangId: user.khachHang!.id };
    };

    const chinh = await dangKyVaDangNhap(`hoan-thanh-pht-${suffix}@example.com`);
    accessToken = chinh.token;
    customerId = chinh.khachHangId;
    const khach = await dangKyVaDangNhap(`hoan-thanh-pht-khach-${suffix}@example.com`);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-PHT-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Hoàn Thành PHT',
      },
    });
    ids.supplier = supplier.id;

    ids.orderDaGiao = await taoDonVoiTrangThai('DA-GIAO', customerId, TrangThaiDonHang.DA_GIAO);
    ids.orderDangGiao = await taoDonVoiTrangThai(
      'DANG-GIAO',
      customerId,
      TrangThaiDonHang.DANG_GIAO,
    );
    ids.orderHuy = await taoDonVoiTrangThai('DA-HUY', customerId, TrangThaiDonHang.DA_HUY);
    ids.orderForeign = await taoDonVoiTrangThai(
      'FOREIGN',
      khach.khachHangId,
      TrangThaiDonHang.DA_GIAO,
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
      console.log('[HOAN THANH E2E cleanup] app.close() hoàn tất.');
    }
  });

  it('bắt buộc đăng nhập', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderDaGiao}/xac-nhan-da-nhan`)
      .expect(401);
  });

  it('DA_GIAO -> HOAN_THANH thành công, Admin/Customer cùng đọc HOAN_THANH', async () => {
    const result = await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderDaGiao}/xac-nhan-da-nhan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(result.body.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);

    const persisted = await prisma.donHang.findUniqueOrThrow({
      where: { id: ids.orderDaGiao },
      include: { donNhaCungCap: true },
    });
    expect(persisted.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);
    expect(persisted.donNhaCungCap).toHaveLength(1);
    expect(persisted.donNhaCungCap[0]!.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);

    // Cùng API mà Customer Web và Mobile dùng để đọc chi tiết.
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/don-hang/${ids.orderDaGiao}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(detail.body.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);
    expect(
      detail.body.tienTrinh.find(
        (moc: { trangThai: string }) => moc.trangThai === TrangThaiDonHang.HOAN_THANH,
      ),
    ).toEqual({ trangThai: TrangThaiDonHang.HOAN_THANH, daDat: true, hienTai: true });
  });

  it('gọi xác nhận lần 2 idempotent, không side-effect', async () => {
    const before = await prisma.donHang.findUniqueOrThrow({
      where: { id: ids.orderDaGiao },
    });
    const retry = await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderDaGiao}/xac-nhan-da-nhan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(retry.body.trangThai).toBe(TrangThaiDonHang.HOAN_THANH);
    const after = await prisma.donHang.findUniqueOrThrow({
      where: { id: ids.orderDaGiao },
    });
    expect(after.trangThai).toBe(before.trangThai);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it('DANG_GIAO -> HOAN_THANH bị từ chối', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderDangGiao}/xac-nhan-da-nhan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
    const persisted = await prisma.donHang.findUniqueOrThrow({
      where: { id: ids.orderDangGiao },
    });
    expect(persisted.trangThai).toBe(TrangThaiDonHang.DANG_GIAO);
  });

  it('DA_HUY -> HOAN_THANH bị từ chối', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderHuy}/xac-nhan-da-nhan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });

  it('user khác không xác nhận được đơn (404)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/don-hang/${ids.orderForeign}/xac-nhan-da-nhan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
    const persisted = await prisma.donHang.findUniqueOrThrow({
      where: { id: ids.orderForeign },
    });
    expect(persisted.trangThai).toBe(TrangThaiDonHang.DA_GIAO);
  });
});
