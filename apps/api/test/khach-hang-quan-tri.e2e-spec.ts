import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiNguoiDung } from '../src/generated/prisma/client';

jest.setTimeout(120_000);

describe('PHIEN-077 Khách hàng quản trị (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminId = '';
  let customerUserId = '';
  let customerId = '';
  let orderId = '';
  let sessionId = '';
  let adminToken = '';
  let customerToken = '';
  let adminRoleId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const quyenQuanLy = await prisma.quyen.findFirst({
      where: { ma: 'phan_quyen.quan_ly' },
      select: { id: true },
    });
    if (!quyenQuanLy) throw new Error('Thiếu quyền phan_quyen.quan_ly từ RBAC foundation.');
    const adminRole = await prisma.vaiTro.create({
      data: { ma: `P77_ADMIN_${suffix}`.slice(0, 50), ten: 'Admin E2E PHIEN 077' },
    });
    adminRoleId = adminRole.id;
    await prisma.vaiTroQuyen.create({ data: { vaiTroId: adminRole.id, quyenId: quyenQuanLy.id } });

    const admin = await prisma.nguoiDung.create({
      data: {
        email: `admin-p77-${suffix}@test.local`,
        matKhauHash: 'unused',
        hoTen: 'Admin PHIEN 077',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    adminId = admin.id;
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: adminRole.id },
    });

    const user = await prisma.nguoiDung.create({
      data: {
        email: `customer-p77-${suffix}@test.local`,
        soDienThoai: `09${String(Date.now()).slice(-8)}`,
        matKhauHash: 'unused',
        hoTen: 'Khách hàng PHIEN 077',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });
    customerUserId = user.id;
    const customer = await prisma.khachHang.create({ data: { nguoiDungId: user.id } });
    customerId = customer.id;

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORDER-P77-${suffix}`.slice(0, 100),
        khachHangId: customer.id,
        tongTien: 125000,
      },
    });
    orderId = order.id;
    const session = await prisma.phienDangNhap.create({
      data: {
        nguoiDungId: user.id,
        refreshTokenHash: 'unused',
        hetHanLuc: new Date(Date.now() + 86_400_000),
      },
    });
    sessionId = session.id;

    const secret =
      process.env.JWT_ACCESS_SECRET ||
      'agrimarket-local-access-secret-change-before-production-012';
    adminToken = await jwt.signAsync({ sub: admin.id, loai: 'access' }, { secret });
    customerToken = await jwt.signAsync({ sub: user.id, loai: 'access' }, { secret });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.nhatKyKiemToan.deleteMany({
        where: { thucThe: 'khach_hang', thucTheId: customerId },
      });
      if (orderId) await prisma.donHang.deleteMany({ where: { id: orderId } });
      if (sessionId) await prisma.phienDangNhap.deleteMany({ where: { id: sessionId } });
      await prisma.nguoiDung.deleteMany({
        where: { id: { in: [adminId, customerUserId].filter(Boolean) } },
      });
      if (adminRoleId) await prisma.vaiTro.deleteMany({ where: { id: adminRoleId } });
    }
    if (app) await app.close();
  });

  it('yêu cầu JWT và quyền quản lý', async () => {
    await request(app.getHttpServer()).get('/api/v1/quan-tri/khach-hang').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/quan-tri/khach-hang')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('list/search + detail trả đúng customer và order count', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/khach-hang?timKiem=PHIEN%20077')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.items.some((item: { id: string }) => item.id === customerId)).toBe(true);
    const mine = list.body.items.find((item: { id: string }) => item.id === customerId);
    expect(mine).toMatchObject({
      hoTen: 'Khách hàng PHIEN 077',
      tongDonHang: 1,
      tongKhieuNai: 0,
      trangThai: 'HOAT_DONG',
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khach-hang/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: customerId,
      nguoiDungId: customerUserId,
      tongDonHang: 1,
    });
  });

  it('orders + complaints thuộc đúng customer', async () => {
    const orders = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khach-hang/${customerId}/don-hang`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(orders.body.tong).toBe(1);
    expect(orders.body.items[0]).toMatchObject({ id: orderId, tongTien: 125000 });

    const complaints = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khach-hang/${customerId}/khieu-nai`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(complaints.body).toEqual({ items: [], tong: 0 });
  });

  it('lock idempotent, revoke refresh session và ghi audit', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/khach-hang/${customerId}/khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect({ id: customerId, nguoiDungId: customerUserId, trangThai: 'TAM_KHOA' });
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/khach-hang/${customerId}/khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const [user, session, audits] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { id: customerUserId } }),
      prisma.phienDangNhap.findUniqueOrThrow({ where: { id: sessionId } }),
      prisma.nhatKyKiemToan.count({
        where: { thucThe: 'khach_hang', thucTheId: customerId, hanhDong: 'KHACH_HANG_KHOA' },
      }),
    ]);
    expect(user.trangThai).toBe(TrangThaiNguoiDung.TAM_KHOA);
    expect(session.thuHoiLuc).not.toBeNull();
    expect(audits).toBe(1);
  });

  it('unlock idempotent và trả tài khoản về HOAT_DONG', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/khach-hang/${customerId}/mo-khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect({ id: customerId, nguoiDungId: customerUserId, trangThai: 'HOAT_DONG' });
    await request(app.getHttpServer())
      .put(`/api/v1/quan-tri/khach-hang/${customerId}/mo-khoa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (await prisma.nguoiDung.findUniqueOrThrow({ where: { id: customerUserId } })).trangThai,
    ).toBe(TrangThaiNguoiDung.HOAT_DONG);
    expect(
      await prisma.nhatKyKiemToan.count({
        where: { thucThe: 'khach_hang', thucTheId: customerId, hanhDong: 'KHACH_HANG_MO_KHOA' },
      }),
    ).toBe(1);
  });
});
