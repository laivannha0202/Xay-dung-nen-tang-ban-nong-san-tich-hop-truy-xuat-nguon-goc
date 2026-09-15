import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';

const ACCESS_SECRET_MAC_DINH = 'agrimarket-local-access-secret-change-before-production-012';

type CommuneRow = {
  id: string;
  name: string;
  full_name: string;
  type: 'xa' | 'phuong';
  normalized_name: string;
  active: boolean;
};

describe('Dia ban Hung Yen 104 xa/phuong (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Seed idempotent 104 xa/phuong tu dataset chinh thuc.
    const duLieu = JSON.parse(
      readFileSync(resolve(__dirname, '../prisma/seed-data/hung-yen-communes-2026.json'), 'utf-8'),
    ) as { communes: CommuneRow[] };
    for (const item of duLieu.communes) {
      await prisma.xaPhuongHungYen.upsert({
        where: { ma: item.id },
        update: {
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'xa' ? 'XA' : 'PHUONG',
          hoatDong: true,
        },
        create: {
          ma: item.id,
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'xa' ? 'XA' : 'PHUONG',
          hoatDong: true,
        },
      });
    }

    // Thon/TDP mau that (khong phai dataset toan tinh): 2 thon thuoc HY-C079.
    await prisma.thonToDanPho.upsert({
      where: { ma: 'HY-C079-V01' },
      update: { xaPhuongMa: 'HY-C079', hoatDong: true },
      create: {
        ma: 'HY-C079-V01',
        xaPhuongMa: 'HY-C079',
        ten: 'Tán Thuật',
        tenDayDu: 'Thôn Tán Thuật',
        tenChuanHoa: 'tan thuat',
        loai: 'THON',
        hoatDong: true,
      },
    });
    await prisma.thonToDanPho.upsert({
      where: { ma: 'HY-C079-V02' },
      update: { xaPhuongMa: 'HY-C079', hoatDong: true },
      create: {
        ma: 'HY-C079-V02',
        xaPhuongMa: 'HY-C079',
        ten: 'Thanh Nê',
        tenDayDu: 'Thôn Thanh Nê',
        tenChuanHoa: 'thanh ne',
        loai: 'THON',
        hoatDong: true,
      },
    });

    const user = await prisma.nguoiDung.create({
      data: {
        email: `diaban-${suffix}@example.com`,
        matKhauHash: 'hash-diaban',
        hoTen: 'Khách Địa Bàn',
      },
    });
    await prisma.khachHang.create({ data: { nguoiDungId: user.id } });
    const jwt = app.get(JwtService);
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? ACCESS_SECRET_MAC_DINH;
    token = await jwt.signAsync({ sub: user.id, loai: 'access' }, { secret: accessSecret });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET xa-phuong tra du 104 (93 xa + 11 phuong)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/dia-ban-hung-yen/xa-phuong').expect(200);
    expect(res.body).toHaveLength(104);
    expect(res.body.filter((item: { loai: string }) => item.loai === 'XA')).toHaveLength(93);
    expect(res.body.filter((item: { loai: string }) => item.loai === 'PHUONG')).toHaveLength(11);
    for (const item of res.body) {
      expect(item.ma).toMatch(/^HY-C\d{3}$/);
      expect(item.ten?.trim().length).toBeGreaterThan(0);
    }
  });

  it('tim kiem khong dau: "kien xuong" thay "Kiến Xương"', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dia-ban-hung-yen/xa-phuong')
      .query({ tuKhoa: 'kien xuong' })
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).toMatch(/Kiến Xương/);
  });

  it('thon/TDP theo xa: HY-C079 co du lieu that, xa chua cong bo tra ve rong', async () => {
    const coDulieu = await request(app.getHttpServer())
      .get('/api/v1/dia-ban-hung-yen/xa-phuong/HY-C079/thon-to-dan-pho')
      .expect(200);
    expect(coDulieu.body.length).toBeGreaterThanOrEqual(2);

    const rong = await request(app.getHttpServer())
      .get('/api/v1/dia-ban-hung-yen/xa-phuong/HY-C001/thon-to-dan-pho')
      .expect(200);
    expect(rong.body).toEqual([]);

    await request(app.getHttpServer())
      .get('/api/v1/dia-ban-hung-yen/xa-phuong/HY-KHONG-TON-TAI/thon-to-dan-pho')
      .expect(404);
  });

  it('tao dia chi moi voi xa/phuong Hung Yen hop le', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn Văn A',
        soDienThoai: '0912345678',
        dongDiaChi: 'Số 1 đường Lê Lợi',
        xaPhuongMa: 'HY-C079',
        thonToDanPhoMa: 'HY-C079-V01',
      })
      .expect(201);
    expect(res.body.tinhThanh).toBe('Hưng Yên');
    expect(res.body.xaPhuongMa).toBe('HY-C079');
    expect(res.body.thonToDanPhoMa).toBe('HY-C079-V01');
    expect(res.body.quanHuyen).toBeNull();
    expect(res.body.maBuuChinh).toBeNull();
  });

  it('tu choi thon khong thuoc xa + tu choi tinh ngoai Hung Yen + tu choi quan/huyen', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn Văn A',
        soDienThoai: '0912345678',
        dongDiaChi: 'Số 1 đường Lê Lợi',
        xaPhuongMa: 'HY-C001',
        thonToDanPhoMa: 'HY-C079-V01',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn Văn A',
        soDienThoai: '0912345678',
        dongDiaChi: 'Số 1 đường Lê Lợi',
        tinhThanh: 'Hà Nội',
        xaPhuongMa: 'HY-C079',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn Văn A',
        soDienThoai: '0912345678',
        dongDiaChi: 'Số 1 đường Lê Lợi',
        xaPhuongMa: 'HY-C079',
        quanHuyen: 'Huyện Kiến Xương',
      })
      .expect(400);
  });

  it('doi xa tu dong clear thon cu (backend)', async () => {
    const tao = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenNguoiNhan: 'Nguyễn Văn A',
        soDienThoai: '0912345678',
        dongDiaChi: 'Số 1 đường Lê Lợi',
        xaPhuongMa: 'HY-C079',
        thonToDanPhoMa: 'HY-C079-V01',
      })
      .expect(201);

    const capNhat = await request(app.getHttpServer())
      .patch(`/api/v1/khach-hang/dia-chi/${tao.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ xaPhuongMa: 'HY-C001' })
      .expect(200);
    expect(capNhat.body.xaPhuongMa).toBe('HY-C001');
    expect(capNhat.body.thonToDanPhoMa).toBeNull();

    const stored = await prisma.diaChi.findUniqueOrThrow({ where: { id: tao.body.id } });
    expect(stored.trangThai).toBe(TrangThaiBanGhi.HOAT_DONG);
  });
});
