import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';

const THOI_GIAN_E2E_MS = 120_000;

/**
 * Chứng minh pagination danh sách công khai:
 * - total = 12, limit = 8 => đúng 2 trang (8 + 4), không sinh trang giả.
 * - sort phổ thông (TEN_AZ/TEN_ZA/MOI_NHAT) đi qua DB orderBy + skip/take.
 * - sort giá giữ nguyên semantic (min giá biến thể) và deterministic theo trang.
 * - validation query trả 400 thay vì kết quả sai.
 */
describe('Phân trang danh sách sản phẩm công khai (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tenSanPham: string[] = [];
  const productIds: string[] = [];
  let categoryId = '';
  let categorySlug = '';
  let farmId = '';
  let supplierId = '';

  // Scope mọi assertion theo danh mục duy nhất của spec để không bị nhiễu bởi
  // fixture các spec khác để lại trên DB dùng chung.
  const layDanhSach = (query: Record<string, string | number>) =>
    request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .query({ danhMuc: categorySlug, ...query });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-PT-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp phân trang' },
    });
    supplierId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-PT-${suffix}`.slice(0, 50),
        ten: 'Trang trại phân trang',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });
    farmId = farm.id;

    const slug = `pt-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 191);
    const category = await prisma.danhMucSanPham.create({
      data: { ten: 'Danh mục phân trang', slug },
    });
    categoryId = category.id;
    categorySlug = category.slug;

    // 12 sản phẩm, tên ASCII zero-padded để thứ tự không phụ thuộc collation,
    // giá tăng dần 1000..12000 để kiểm sort giá.
    for (let i = 1; i <= 12; i += 1) {
      const ten = `SP-PT-${String(i).padStart(2, '0')}`;
      tenSanPham.push(ten);
      const product = await prisma.sanPham.create({
        data: { ten, trangTraiId: farm.id, danhMucSanPhamId: category.id },
      });
      productIds.push(product.id);
      await prisma.bienTheSanPham.create({
        data: {
          sanPhamId: product.id,
          sku: `PT-${suffix}-${i}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1000,
          gia: i * 1000,
          donVi: 'g',
        },
      });
    }
  }, THOI_GIAN_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (productIds.length) {
        await prisma.bienTheSanPham.deleteMany({ where: { sanPhamId: { in: productIds } } });
        await prisma.sanPham.deleteMany({ where: { id: { in: productIds } } });
      }
      if (categoryId) await prisma.danhMucSanPham.deleteMany({ where: { id: categoryId } });
      if (farmId) await prisma.trangTrai.deleteMany({ where: { id: farmId } });
      if (supplierId) await prisma.nhaCungCap.deleteMany({ where: { id: supplierId } });
    }
    if (app) await app.close();
  }, THOI_GIAN_E2E_MS);

  it('total=12, limit=8 => trang 1 có 8 items đầu theo TEN_AZ', async () => {
    const res = await layDanhSach({ sapXep: 'TEN_AZ', trang: 1, gioiHan: 8 }).expect(200);
    expect(res.body.tong).toBe(12);
    expect(res.body.trang).toBe(1);
    expect(res.body.gioiHan).toBe(8);
    expect(res.body.duLieu).toHaveLength(8);
    expect(res.body.duLieu.map((item: { ten: string }) => item.ten)).toEqual(
      tenSanPham.slice(0, 8),
    );
  });

  it('trang 2 có đúng 4 items còn lại, không sinh trang giả', async () => {
    const page2 = await layDanhSach({ sapXep: 'TEN_AZ', trang: 2, gioiHan: 8 }).expect(200);
    expect(page2.body.tong).toBe(12);
    expect(page2.body.duLieu).toHaveLength(4);
    expect(page2.body.duLieu.map((item: { ten: string }) => item.ten)).toEqual(
      tenSanPham.slice(8, 12),
    );

    const page3 = await layDanhSach({ sapXep: 'TEN_AZ', trang: 3, gioiHan: 8 }).expect(200);
    expect(page3.body.tong).toBe(12);
    expect(page3.body.duLieu).toEqual([]);
  });

  it('TEN_ZA đảo ngược TEN_AZ trên cùng DB pagination', async () => {
    const res = await layDanhSach({ sapXep: 'TEN_ZA', trang: 1, gioiHan: 8 }).expect(200);
    expect(res.body.tong).toBe(12);
    expect(res.body.duLieu.map((item: { ten: string }) => item.ten)).toEqual(
      [...tenSanPham].reverse().slice(0, 8),
    );
  });

  it('MOI_NHAT phân trang DB đúng total và đủ 12 items trên 2 trang', async () => {
    const page1 = await layDanhSach({ sapXep: 'MOI_NHAT', trang: 1, gioiHan: 8 }).expect(200);
    const page2 = await layDanhSach({ sapXep: 'MOI_NHAT', trang: 2, gioiHan: 8 }).expect(200);
    expect(page1.body.tong).toBe(12);
    expect(page1.body.duLieu).toHaveLength(8);
    expect(page2.body.duLieu).toHaveLength(4);
    const all = [...page1.body.duLieu, ...page2.body.duLieu].map(
      (item: { ten: string }) => item.ten,
    );
    expect([...all].sort()).toEqual([...tenSanPham].sort());
  });

  it('GIA_TANG giữ semantic min giá biến thể và deterministic theo trang', async () => {
    const page1 = await layDanhSach({ sapXep: 'GIA_TANG', trang: 1, gioiHan: 8 }).expect(200);
    const page2 = await layDanhSach({ sapXep: 'GIA_TANG', trang: 2, gioiHan: 8 }).expect(200);
    expect(page1.body.tong).toBe(12);
    const tenPage1 = page1.body.duLieu.map((item: { ten: string }) => item.ten);
    const tenPage2 = page2.body.duLieu.map((item: { ten: string }) => item.ten);
    expect(tenPage1).toEqual(tenSanPham.slice(0, 8));
    expect(tenPage2).toEqual(tenSanPham.slice(8, 12));
  });

  it('khaDung=CON_HANG loại đúng sản phẩm hết tồn (không inventory)', async () => {
    const res = await layDanhSach({ khaDung: 'CON_HANG', gioiHan: 8 }).expect(200);
    expect(res.body.tong).toBe(0);
    expect(res.body.duLieu).toEqual([]);
  });

  it('query sai trả 400 thay vì kết quả sai', async () => {
    await layDanhSach({ trang: 0 }).expect(400);
    await layDanhSach({ gioiHan: 101 }).expect(400);
    await layDanhSach({ giaTu: -1 }).expect(400);
    await layDanhSach({ giaTu: 50000, giaDen: 10000 }).expect(400);
    await layDanhSach({ sapXep: 'BAN_CHAY' }).expect(400);
  });
});
