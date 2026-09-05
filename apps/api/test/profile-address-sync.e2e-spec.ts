import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';
import { DiaChiKhachHangController } from '../src/modules/dia-chi-khach-hang/dia-chi-khach-hang.controller';
import { DiaChiKhachHangService } from '../src/modules/dia-chi-khach-hang/dia-chi-khach-hang.service';
import { HoSoKhachHangController } from '../src/modules/ho-so-khach-hang/ho-so-khach-hang.controller';
import { HoSoKhachHangService } from '../src/modules/ho-so-khach-hang/ho-so-khach-hang.service';
import { JwtAccessGuard } from '../src/modules/xac-thuc/jwt-access.guard';

const E2E_TIMEOUT = 30_000;
const JWT_SECRET = 'agrimarket-local-access-secret-change-before-production-012';

describe('Profile Address Sync PHIEN-109 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mobileToken = '';
  let webToken = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `profile-address-sync-p109-${suffix}@example.com`;
  const ids = { user: '', customer: '', addressA: '', addressB: '' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: ['.env', '../../.env'] }),
        PrismaModule,
        JwtModule.register({}),
      ],
      controllers: [HoSoKhachHangController, DiaChiKhachHangController],
      providers: [HoSoKhachHangService, DiaChiKhachHangService, JwtAccessGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    const jwt = app.get(JwtService);

    const user = await prisma.nguoiDung.create({
      data: {
        email,
        matKhauHash: 'khong-dung-trong-profile-address-sync-test',
        hoTen: 'Khách Profile Address Sync 109',
        soDienThoai: '+84901111090',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
        khachHang: { create: { trangThai: TrangThaiBanGhi.HOAT_DONG } },
      },
      include: { khachHang: true },
    });

    ids.user = user.id;
    ids.customer = user.khachHang!.id;
    const secret = process.env.JWT_ACCESS_SECRET ?? JWT_SECRET;

    mobileToken = await jwt.signAsync(
      { sub: user.id, loai: 'access', nenTang: 'MOBILE', jti: `mobile-${suffix}` },
      { secret, expiresIn: 3600 },
    );
    webToken = await jwt.signAsync(
      { sub: user.id, loai: 'access', nenTang: 'WEB', jti: `web-${suffix}` },
      { secret, expiresIn: 3600 },
    );

    expect(mobileToken).toEqual(expect.any(String));
    expect(webToken).toEqual(expect.any(String));
    expect(webToken).not.toBe(mobileToken);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (app) await app.close();
  }, E2E_TIMEOUT);

  it('profile mobile update → web sees → web update → mobile sees', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${mobileToken}`)
      .send({ hoTen: 'Hồ sơ Mobile 109', soDienThoai: '+84901111109', ngaySinh: '2001-02-03' })
      .expect(200);

    const webRead = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${webToken}`)
      .expect(200);

    expect(webRead.body).toMatchObject({
      khachHangId: ids.customer,
      nguoiDungId: ids.user,
      email,
      hoTen: 'Hồ sơ Mobile 109',
      soDienThoai: '+84901111109',
      ngaySinh: '2001-02-03',
    });

    await request(app.getHttpServer())
      .patch('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${webToken}`)
      .send({ hoTen: 'Hồ sơ Web 109', soDienThoai: '+84902222109', ngaySinh: '2002-03-04' })
      .expect(200);

    const mobileRead = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);

    expect(mobileRead.body).toMatchObject({
      khachHangId: ids.customer,
      nguoiDungId: ids.user,
      email,
      hoTen: 'Hồ sơ Web 109',
      soDienThoai: '+84902222109',
      ngaySinh: '2002-03-04',
    });
  });

  it('address mobile create → web sees/update/default → mobile sees', async () => {
    const createdA = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${mobileToken}`)
      .send({
        tenNguoiNhan: 'Người nhận Mobile 109',
        soDienThoai: '+84903333109',
        dongDiaChi: '109 Đường Mobile',
        phuongXa: 'Phường 1',
        quanHuyen: 'Quận 1',
        tinhThanh: 'TP Hồ Chí Minh',
        maBuuChinh: '700000',
        macDinh: true,
      })
      .expect(201);
    ids.addressA = createdA.body.id as string;

    const webList = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${webToken}`)
      .expect(200);
    expect(webList.body.find((item: { id: string }) => item.id === ids.addressA)).toMatchObject({
      id: ids.addressA,
      tenNguoiNhan: 'Người nhận Mobile 109',
      macDinh: true,
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/khach-hang/dia-chi/${ids.addressA}`)
      .set('Authorization', `Bearer ${webToken}`)
      .send({
        tenNguoiNhan: 'Người nhận Web 109',
        dongDiaChi: '109 Đường Web cập nhật',
        phuongXa: 'Phường 2',
        quanHuyen: 'Quận 2',
        tinhThanh: 'Hà Nội',
        maBuuChinh: '100000',
      })
      .expect(200);

    const createdB = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${webToken}`)
      .send({
        tenNguoiNhan: 'Địa chỉ thứ hai 109',
        soDienThoai: '+84904444109',
        dongDiaChi: '110 Đường Đồng Bộ',
        phuongXa: 'Phường 3',
        quanHuyen: 'Quận 3',
        tinhThanh: 'Đà Nẵng',
        maBuuChinh: '550000',
        macDinh: false,
      })
      .expect(201);
    ids.addressB = createdB.body.id as string;

    await request(app.getHttpServer())
      .put(`/api/v1/khach-hang/dia-chi/${ids.addressB}/mac-dinh`)
      .set('Authorization', `Bearer ${webToken}`)
      .expect(200);

    const mobileList = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);

    expect(mobileList.body.find((item: { id: string }) => item.id === ids.addressA)).toMatchObject({
      id: ids.addressA,
      tenNguoiNhan: 'Người nhận Web 109',
      dongDiaChi: '109 Đường Web cập nhật',
      tinhThanh: 'Hà Nội',
      macDinh: false,
    });
    expect(mobileList.body.find((item: { id: string }) => item.id === ids.addressB)).toMatchObject({
      id: ids.addressB,
      tenNguoiNhan: 'Địa chỉ thứ hai 109',
      macDinh: true,
    });
    expect(mobileList.body).toHaveLength(2);

    await expect(
      prisma.diaChi.count({
        where: { nguoiDungId: ids.user, trangThai: TrangThaiBanGhi.HOAT_DONG },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.diaChi.count({
        where: { nguoiDungId: ids.user, trangThai: TrangThaiBanGhi.HOAT_DONG, macDinh: true },
      }),
    ).resolves.toBe(1);
  });
});
