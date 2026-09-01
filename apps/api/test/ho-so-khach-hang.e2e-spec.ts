import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';

const ACCESS_SECRET = 'agrimarket-local-access-secret-change-before-production-012';

describe('Customer Profile PHIEN-071 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let customerUserId = '';
  let otherUserId = '';
  let nonCustomerUserId = '';
  let customerToken = '';
  let nonCustomerToken = '';
  const otherPhone = `09${String(Date.now()).slice(-8)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const customerUser = await prisma.nguoiDung.create({
      data: {
        email: `profile-p71-${suffix}@example.com`,
        matKhauHash: 'hash-profile-071',
        hoTen: 'Khách Profile 071',
      },
    });
    customerUserId = customerUser.id;
    await prisma.khachHang.create({ data: { nguoiDungId: customerUser.id } });

    const otherUser = await prisma.nguoiDung.create({
      data: {
        email: `profile-other-p71-${suffix}@example.com`,
        matKhauHash: 'hash-profile-other-071',
        hoTen: 'Khách Khác 071',
        soDienThoai: otherPhone,
      },
    });
    otherUserId = otherUser.id;
    await prisma.khachHang.create({ data: { nguoiDungId: otherUser.id } });

    const nonCustomer = await prisma.nguoiDung.create({
      data: {
        email: `profile-staff-p71-${suffix}@example.com`,
        matKhauHash: 'hash-profile-staff-071',
        hoTen: 'Không phải khách 071',
      },
    });
    nonCustomerUserId = nonCustomer.id;

    customerToken = await jwt.signAsync(
      { sub: customerUserId, loai: 'access' },
      { secret: ACCESS_SECRET },
    );
    nonCustomerToken = await jwt.signAsync(
      { sub: nonCustomerUserId, loai: 'access' },
      { secret: ACCESS_SECRET },
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET profile bắt buộc access token', async () => {
    await request(app.getHttpServer()).get('/api/v1/khach-hang/ho-so').expect(401);
  });

  it('GET trả profile từ NguoiDung + KhachHang, không trả Address Book', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      nguoiDungId: customerUserId,
      email: `profile-p71-${suffix}@example.com`,
      hoTen: 'Khách Profile 071',
      soDienThoai: null,
      ngaySinh: null,
    });
    expect(response.body).not.toHaveProperty('diaChi');
    expect(response.body).not.toHaveProperty('diaChiMacDinh');
  });

  it('PATCH cập nhật hoTen + soDienThoai + ngaySinh và giữ email read-only', async () => {
    const emailBefore = `profile-p71-${suffix}@example.com`;
    const response = await request(app.getHttpServer())
      .patch('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        hoTen: 'Nguyễn Profile 071',
        soDienThoai: `08${String(Date.now()).slice(-8)}`,
        ngaySinh: '1998-05-20',
      })
      .expect(200);

    expect(response.body.hoTen).toBe('Nguyễn Profile 071');
    expect(response.body.ngaySinh).toBe('1998-05-20');
    expect(response.body.email).toBe(emailBefore);

    const stored = await prisma.nguoiDung.findUniqueOrThrow({ where: { id: customerUserId } });
    expect(stored.email).toBe(emailBefore);
    expect(stored.hoTen).toBe('Nguyễn Profile 071');
  });

  it('PATCH chặn số điện thoại đã thuộc tài khoản khác', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ soDienThoai: otherPhone })
      .expect(409);

    await expect(
      prisma.nguoiDung.findUniqueOrThrow({ where: { id: otherUserId } }),
    ).resolves.toMatchObject({ soDienThoai: otherPhone });
  });

  it('token người dùng không có KhachHang không truy cập được customer profile', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${nonCustomerToken}`)
      .expect(404);
  });
});
