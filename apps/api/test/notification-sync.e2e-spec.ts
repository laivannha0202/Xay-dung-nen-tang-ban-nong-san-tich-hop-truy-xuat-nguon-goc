import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../src/generated/prisma/client';
import { TheoDoiTrangTraiController } from '../src/modules/theo-doi-trang-trai/theo-doi-trang-trai.controller';
import { TheoDoiTrangTraiService } from '../src/modules/theo-doi-trang-trai/theo-doi-trang-trai.service';
import { JwtAccessGuard } from '../src/modules/xac-thuc/jwt-access.guard';

const E2E_TIMEOUT = 30_000;
const JWT_SECRET = 'agrimarket-local-access-secret-change-before-production-012';

describe('Notification Sync PHIEN-110 focused e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: TheoDoiTrangTraiService;
  let mobileToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    user: '',
    customer: '',
    supplier: '',
    farm: '',
    season: '',
    harvest: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        JwtModule.register({}),
      ],
      controllers: [TheoDoiTrangTraiController],
      providers: [TheoDoiTrangTraiService, JwtAccessGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    service = app.get(TheoDoiTrangTraiService);
    const jwt = app.get(JwtService);

    const user = await prisma.nguoiDung.create({
      data: {
        email: `notification-sync-${suffix}@example.com`,
        matKhauHash: 'khong-dung-trong-notification-sync-test',
        hoTen: 'Khách Notification Sync 110',
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
        khachHang: {
          create: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
          },
        },
      },
      include: {
        khachHang: true,
      },
    });

    ids.user = user.id;
    ids.customer = user.khachHang!.id;

    mobileToken = await jwt.signAsync(
      {
        sub: user.id,
        loai: 'access',
        nenTang: 'MOBILE',
        jti: `mobile-${suffix}`,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? JWT_SECRET,
        expiresIn: 3600,
      },
    );

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P110-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Notification Sync 110',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P110-${suffix}`.slice(0, 50),
        ten: 'Trang trại Notification Sync 110',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Dâu tây',
        giong: 'New Harvest 110',
        ngayTrong: new Date('2026-07-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-09-01T00:00:00.000Z'),
        sanLuongDuKienKg: 80,
      },
    });
    ids.season = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-09-05T00:00:00.000Z'),
        soLuong: 25,
        donVi: 'KG',
        phanLoai: 'LOAI_1',
      },
    });
    ids.harvest = harvest.id;

    await prisma.theoDoiTrangTrai.create({
      data: {
        khachHangId: ids.customer,
        trangTraiId: ids.farm,
      },
    });

    await prisma.$transaction(async (tx) => {
      const created = await service.taoThongBaoChoThuHoach(tx, ids.farm, ids.harvest);

      expect(created).toBe(1);
    });
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, E2E_TIMEOUT);

  it('in-app new harvest giữ đủ dữ liệu để đồng bộ NEW_HARVEST push payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/thong-bao-thu-hoach')
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(200);

    expect(response.body.tong).toBe(1);
    expect(response.body.duLieu).toHaveLength(1);

    const item = response.body.duLieu[0];

    expect(item).toMatchObject({
      thuHoachId: ids.harvest,
      trangTraiId: ids.farm,
      tenTrangTrai: 'Trang trại Notification Sync 110',
      cayTrong: 'Dâu tây',
      giong: 'New Harvest 110',
      ngayThuHoach: '2026-09-05',
      soLuong: 25,
      donVi: 'KG',
      phanLoai: 'LOAI_1',
    });

    const canonicalPush = {
      type: 'NEW_HARVEST',
      entityId: item.thuHoachId,
      deepLink: `/trang-trai/${item.trangTraiId}`,
    };

    expect(canonicalPush).toEqual({
      type: 'NEW_HARVEST',
      entityId: ids.harvest,
      deepLink: `/trang-trai/${ids.farm}`,
    });
  });
});
