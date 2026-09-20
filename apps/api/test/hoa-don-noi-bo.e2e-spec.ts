import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiBanGhi,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';

describe('Hóa đơn bán hàng nội bộ V16 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin = '';
  let buyerCustomerId = '';
  let supplierId = '';
  let farmId = '';
  let categoryId = '';
  let productId = '';
  let variantId = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-V16-HoaDon';
  const emailAdmin = `v16-hd-admin-${suffix}@example.com`;
  const emailBuyer = `v16-hd-buyer-${suffix}@example.com`;
  const buyerName = `Khách V16 ${suffix}`.slice(0, 140);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const [email, hoTen] of [
      [emailAdmin, 'Admin V16 Hóa đơn'],
      [emailBuyer, buyerName],
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen })
        .expect(201);
    }
    const admin = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } });
    const buyer = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailBuyer } });
    const customer = await prisma.khachHang.findUniqueOrThrow({ where: { nguoiDungId: buyer.id } });
    buyerCustomerId = customer.id;
    const roleAdmin = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailAdmin, matKhau, nenTang: 'MOBILE' })
      .expect(200);
    tokenAdmin = login.body.accessToken as string;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-V16-HD-${suffix}`.slice(0, 50), ten: 'NCC V16 Hóa đơn' },
    });
    supplierId = supplier.id;
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-V16-HD-${suffix}`.slice(0, 50),
        ten: 'Trang trại V16 Hóa đơn',
        diaChi: 'Hưng Yên',
        nhaCungCapId: supplier.id,
      },
    });
    farmId = farm.id;
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục V16 HD ${suffix}`.slice(0, 150),
        slug: `v16-hd-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    categoryId = category.id;
    const product = await prisma.sanPham.create({
      data: { ten: 'Nông sản V16 hóa đơn', trangTraiId: farm.id, danhMucSanPhamId: category.id },
    });
    productId = product.id;
    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `V16-HD-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 50000,
        donVi: 'kg',
      },
    });
    variantId = variant.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  async function taoOrder(trangThai: TrangThaiDonHang, withItems = true) {
    const code = randomUUID().replaceAll('-', '').toUpperCase();
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-V16-${code}`.slice(0, 100),
        maYeuCau: randomUUID(),
        khachHangId: buyerCustomerId,
        trangThai,
        tongTien: 95000,
        tamTinhHangHoa: 100000,
        phiVanChuyen: 5000,
        giamKhuyenMai: 10000,
        diemDaDung: 0,
        giaTriDiemDaDung: 0,
        tenNguoiNhanSnapshot: buyerName,
        soDienThoaiSnapshot: '0912345678',
        diaChiGiaoHangSnapshot: 'Hưng Yên',
      },
    });
    if (withItems) {
      const sub = await prisma.donHangNhaCungCap.create({
        data: {
          maDon: `${order.maDonHang}-S1`.slice(0, 100),
          donHangId: order.id,
          nhaCungCapId: supplierId,
          trangThai,
          tamTinh: 100000,
        },
      });
      await prisma.mucDonHang.create({
        data: {
          donHangNhaCungCapId: sub.id,
          sanPhamId: productId,
          danhMucSanPhamIdSnapshot: categoryId,
          bienTheSanPhamId: variantId,
          trangTraiId: farmId,
          soLuong: 2,
          donGiaSnapshot: 50000,
          tenSanPhamSnapshot: 'Nông sản V16 hóa đơn',
          skuBienTheSnapshot: `V16-HD-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuongBienTheSnapshot: 1,
          donViBienTheSnapshot: 'kg',
          maTrangTraiSnapshot: `FARM-V16-HD-${suffix}`.slice(0, 50),
          tenTrangTraiSnapshot: 'Trang trại V16 Hóa đơn',
        },
      });
      await prisma.thanhToan.create({
        data: {
          donHangId: order.id,
          soTien: 95000,
          phuongThuc: 'MOCK',
          trangThai: TrangThaiThanhToan.PAID,
        },
      });
    }
    return order;
  }

  it('phát hành idempotent, snapshot đúng và chỉ có một hóa đơn/đơn', async () => {
    const order = await taoOrder(TrangThaiDonHang.DA_XAC_NHAN);
    const first = await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/hoa-don-noi-bo/don-hang/${order.id}/phat-hanh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post(`/api/v1/quan-tri/hoa-don-noi-bo/don-hang/${order.id}/phat-hanh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(first.body.maDonHang).toBe(order.maDonHang);
    expect(first.body.tenNguoiMua).toBe(buyerName);
    expect(first.body.tongThanhToan).toBe(95000);
    expect(first.body.trangThaiThanhToan).toBe('PAID');
    expect(first.body.dong).toHaveLength(1);
    expect(first.body.canhBaoPhapLy).toContain('không phải hóa đơn điện tử/VAT');
    await expect(prisma.hoaDonBanHangNoiBo.count({ where: { donHangId: order.id } })).resolves.toBe(
      1,
    );

    const list = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/hoa-don-noi-bo')
      .query({ timKiem: order.maDonHang })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(list.body.tong).toBe(1);

    await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/hoa-don-noi-bo/${first.body.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });

  it('search đơn quản trị tìm được theo tên khách hàng để UI không cần UUID thô', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/quan-tri/don-hang')
      .query({ timKiem: buyerName, trang: 1, gioiHan: 20 })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(
      result.body.duLieu.some(
        (item: { khachHang: { hoTen: string } }) => item.khachHang.hoTen === buyerName,
      ),
    ).toBe(true);
  });

  it('không phát hành đơn CHO_THANH_TOAN hoặc DA_HUY', async () => {
    for (const state of [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DA_HUY]) {
      const order = await taoOrder(state, false);
      await request(app.getHttpServer())
        .post(`/api/v1/quan-tri/hoa-don-noi-bo/don-hang/${order.id}/phat-hanh`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(400);
    }
  });

  it('API hóa đơn nội bộ bắt buộc auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/quan-tri/hoa-don-noi-bo').expect(401);
  });
});
