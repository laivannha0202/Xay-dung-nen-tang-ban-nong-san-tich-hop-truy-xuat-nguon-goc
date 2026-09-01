import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiXacMinhChungNhan } from '../src/generated/prisma/client';

describe('Public Farm Detail PHIEN-045 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    supplier: '',
    farm: '',
    certificateFile: '',
    certificate: '',
    season: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P45-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Farm Detail 045',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P45-${suffix}`.slice(0, 50),
        ten: 'Trang trại Public Detail 045',
        diaChi: 'Lâm Đồng',
        viDo: 11.9404,
        kinhDo: 108.4583,
        dienTichHa: 12.5,
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const certificateFile = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket-test',
        objectKey: `phien045/certificate-${suffix}.pdf`,
        tenGoc: 'farm-certificate.pdf',
        mimeType: 'application/pdf',
        kichThuoc: BigInt(1),
        sha256: '4'.repeat(64),
        nguoiTaiLenId: '00000000-0000-7000-8000-000000000045',
        nguoiTaiLen: 'phien045-fixture@example.com',
      },
    });
    ids.certificateFile = certificateFile.id;

    const now = new Date();
    const expiry = new Date(now);
    expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);

    const certificate = await prisma.chungNhan.create({
      data: {
        trangTraiId: farm.id,
        loai: 'Organic PHIEN-045',
        ma: `ORG-P45-${suffix}`.slice(0, 100),
        donViCap: 'Farm Detail Authority',
        tepTinId: certificateFile.id,
        ngayCap: now,
        ngayHetHan: expiry,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: now,
      },
    });
    ids.certificate = certificate.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Dâu tây',
        giong: 'New Albion',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-09-15T00:00:00.000Z'),
        sanLuongDuKienKg: 320,
      },
    });
    ids.season = season.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (ids.certificate) {
        await prisma.chungNhan.deleteMany({
          where: { id: ids.certificate },
        });
      }
      if (ids.season) {
        await prisma.muaVu.deleteMany({
          where: { id: ids.season },
        });
      }
      if (ids.certificateFile) {
        await prisma.tepTin.deleteMany({
          where: { id: ids.certificateFile },
        });
      }
      if (ids.farm) {
        await prisma.trangTrai.deleteMany({
          where: { id: ids.farm },
        });
      }
      if (ids.supplier) {
        await prisma.nhaCungCap.deleteMany({
          where: { id: ids.supplier },
        });
      }
    }

    if (app) await app.close();
  });

  it('trả thông tin giới thiệu + chứng nhận verified + mùa vụ thật', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/cong-khai/trang-trai/${ids.farm}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: ids.farm,
        ten: 'Trang trại Public Detail 045',
        diaChi: 'Lâm Đồng',
        viDo: 11.9404,
        kinhDo: 108.4583,
        dienTichHa: 12.5,
      }),
    );

    expect(response.body.chungNhan).toEqual([
      expect.objectContaining({
        id: ids.certificate,
        loai: 'Organic PHIEN-045',
        ma: expect.any(String),
        donViCap: 'Farm Detail Authority',
      }),
    ]);

    expect(response.body.muaVu).toEqual([
      expect.objectContaining({
        id: ids.season,
        cayTrong: 'Dâu tây',
        giong: 'New Albion',
        ngayTrong: '2026-06-01',
        ngayDuKienThuHoach: '2026-09-15',
        sanLuongDuKienKg: 320,
      }),
    ]);

    expect(response.body.chungNhan[0]).not.toHaveProperty('tepTin');
    expect(response.body.chungNhan[0]).not.toHaveProperty('tepTinId');
    expect(response.body.chungNhan[0]).not.toHaveProperty('lyDoTuChoi');
  });

  it('farm không tồn tại trả 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/cong-khai/trang-trai/' + '00000000-0000-7000-8000-000000000999')
      .expect(404);
  });
});
