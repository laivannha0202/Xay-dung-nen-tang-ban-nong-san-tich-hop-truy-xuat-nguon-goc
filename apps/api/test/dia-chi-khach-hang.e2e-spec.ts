import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const ACCESS_SECRET = 'agrimarket-local-access-secret-change-before-production-012';

describe('Address Book PHIEN-072 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let userId = '';
  let otherUserId = '';
  let token = '';
  let otherToken = '';
  let addressA = '';
  let addressB = '';
  let otherAddress = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const user = await prisma.nguoiDung.create({
      data: {
        email: `address-p72-${suffix}@example.com`,
        matKhauHash: 'hash-p72',
        hoTen: 'Khách Address 072',
      },
    });
    userId = user.id;
    await prisma.khachHang.create({ data: { nguoiDungId: user.id } });

    const other = await prisma.nguoiDung.create({
      data: {
        email: `address-other-p72-${suffix}@example.com`,
        matKhauHash: 'hash-other-p72',
        hoTen: 'Khách Khác 072',
      },
    });
    otherUserId = other.id;
    await prisma.khachHang.create({ data: { nguoiDungId: other.id } });
    const storedOther = await prisma.diaChi.create({
      data: {
        nguoiDungId: other.id,
        tenNguoiNhan: 'Khách Khác',
        soDienThoai: '0911111111',
        dongDiaChi: 'Địa chỉ người khác',
        tinhThanh: 'Hà Nội',
      },
    });
    otherAddress = storedOther.id;

    token = await jwt.signAsync({ sub: userId, loai: 'access' }, { secret: ACCESS_SECRET });
    otherToken = await jwt.signAsync(
      { sub: otherUserId, loai: 'access' },
      { secret: ACCESS_SECRET },
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('bắt buộc JWT', async () => {
    await request(app.getHttpServer()).get('/api/v1/khach-hang/dia-chi').expect(401);
  });

  it('CRUD create/list/update hoạt động trên địa chỉ thuộc customer', async () => {
    const a = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn A',
        soDienThoai: '0900000001',
        dongDiaChi: '12 Nguyễn Trãi',
        phuongXa: 'Thanh Xuân Trung',
        quanHuyen: 'Thanh Xuân',
        tinhThanh: 'Hà Nội',
        maBuuChinh: '100000',
        macDinh: true,
      })
      .expect(201);
    addressA = a.body.id;
    expect(a.body.macDinh).toBe(true);

    const b = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn B',
        soDienThoai: '0900000002',
        dongDiaChi: '34 Lê Lợi',
        tinhThanh: 'Đà Nẵng',
      })
      .expect(201);
    addressB = b.body.id;
    expect(b.body.macDinh).toBe(false);

    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body.filter((item: { macDinh: boolean }) => item.macDinh)).toHaveLength(1);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/khach-hang/dia-chi/${addressB}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tenNguoiNhan: 'Nguyễn B Updated', phuongXa: 'Hải Châu' })
      .expect(200);
    expect(updated.body.tenNguoiNhan).toBe('Nguyễn B Updated');
  });

  it('đặt default mới unset default cũ và chỉ còn đúng một default', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/dia-chi/${addressB}/mac-dinh`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const stored = await prisma.diaChi.findMany({
      where: { nguoiDungId: userId, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    expect(stored.filter((item) => item.macDinh)).toHaveLength(1);
    expect(stored.find((item) => item.id === addressB)?.macDinh).toBe(true);
    expect(stored.find((item) => item.id === addressA)?.macDinh).toBe(false);
  });

  it('ownership guard không cho sửa/xóa địa chỉ của user khác', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/khach-hang/dia-chi/${otherAddress}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tenNguoiNhan: 'Chiếm quyền' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/dia-chi/${otherAddress}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const other = await prisma.diaChi.findUniqueOrThrow({ where: { id: otherAddress } });
    expect(other.nguoiDungId).toBe(otherUserId);
    expect(other.trangThai).toBe(TrangThaiBanGhi.HOAT_DONG);
  });

  it('DELETE soft-delete và ẩn khỏi danh sách; không tự promote default khác', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/khach-hang/dia-chi/${addressB}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const deleted = await prisma.diaChi.findUniqueOrThrow({ where: { id: addressB } });
    expect(deleted.trangThai).toBe(TrangThaiBanGhi.NGUNG_HOAT_DONG);
    expect(deleted.macDinh).toBe(false);

    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.map((item: { id: string }) => item.id)).not.toContain(addressB);
    expect(list.body.filter((item: { macDinh: boolean }) => item.macDinh)).toHaveLength(0);
  });

  it('user khác chỉ thấy sổ địa chỉ của chính họ', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(otherAddress);
  });
});
