/**
 * Regression: sau khi chạy e2e/true-db test, catalog demo KHÔNG được còn fixture.
 *
 * Test này chạy trên TEST_DATABASE_URL (fail-fast nếu thiếu), dựng một fixture
 * đúng hình dạng "San Pham AL / Cat AL <timestamp> / F-AL-<suffix>" rồi dọn
 * bằng `taoDonDepFixture`, và kiểm chứng:
 *   1. Trước khi dọn: fixture CÓ mặt trong truy vấn công khai (tức đúng nguyên nhân
 *      gốc — test tạo dữ liệu `HOAT_DONG` nên public API trả về).
 *   2. Sau khi dọn: KHÔNG còn bất kỳ bản ghi nào.
 *   3. Chạy `donDep()` lần hai = 0 thay đổi (idempotent).
 */

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { taoDonDepFixture } from './test-database';

describe('Fixture e2e không lọt vào catalog demo (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const donDep: { fn: null | (() => Promise<void>); thongKe?: () => Record<string, number> } = { fn: null };

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  // Tên có run token để mỗi lần chạy đều độc lập — không bị rác từ lần chạy
  // trước làm sai kết quả khẳng định.
  const TEN_DANH_MUC = `Cat AL ${suffix}`;
  const TEN_SAN_PHAM = `San Pham AL ${suffix}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const donDepFixture = taoDonDepFixture(prisma);
    donDep.fn = () => donDepFixture.donDep();
    donDep.thongKe = () => donDepFixture.thongKe();

    // Dựng fixture đúng hình dạng gây lỗi: danh mục + trang trại + sản phẩm
    // đều mặc định trang_thai = HOAT_DONG nên sẽ xuất hiện trong catalog.
    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-AL-${suffix}`.slice(0, 30),
        ten: 'NCC Allocation Test',
        soDienThoai: '0988776655',
        email: `ncc-al-${suffix}@example.com`,
        diaChi: 'HN',
      },
    });
    donDepFixture.theoNhaCungCap(supplier.id);

    const farm = await prisma.trangTrai.create({
      data: {
        nhaCungCapId: supplier.id,
        ma: `F-AL-${suffix}`.slice(0, 30),
        ten: 'Farm Allocation',
        diaChi: 'HN',
      },
    });
    donDepFixture.theoTrangTrai(farm.id);

    const category = await prisma.danhMucSanPham.create({
      data: { ten: TEN_DANH_MUC, slug: `cat-al-${suffix}` },
    });
    donDepFixture.theoDanhMuc(category.id);

    const product = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: category.id, ten: TEN_SAN_PHAM },
    });
    donDepFixture.theoSanPham(product.id);

    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku: `SKU-AL-${suffix}`.slice(0, 30), khoiLuong: 1, gia: 100001, donVi: 'kg' },
    });
    donDepFixture.theoBienThe(variant.id);
  });

  afterAll(async () => {
    if (app) await app.close();
  }, 120_000);

  it('fixture tạo ra ban đầu xuất hiện trong danh sách công khai', async () => {
    const danhMuc = await prisma.danhMucSanPham.findFirst({ where: { ten: TEN_DANH_MUC } });
    expect(danhMuc).not.toBeNull();
    expect(danhMuc?.trangThai).toBe('HOAT_DONG');

    const sanPham = await prisma.sanPham.findFirst({ where: { ten: TEN_SAN_PHAM } });
    expect(sanPham).not.toBeNull();
    expect(sanPham?.trangThai).toBe('HOAT_DONG');
  });

  it('sau khi dọn, không còn bất kỳ bản ghi fixture nào', async () => {
    await donDep.fn?.();

    expect(await prisma.danhMucSanPham.count({ where: { ten: TEN_DANH_MUC } })).toBe(0);
    expect(await prisma.sanPham.count({ where: { ten: TEN_SAN_PHAM } })).toBe(0);
    expect(await prisma.bienTheSanPham.count({ where: { sku: `SKU-AL-${suffix}`.slice(0, 30) } })).toBe(0);
    expect(await prisma.trangTrai.count({ where: { ma: `F-AL-${suffix}`.slice(0, 30) } })).toBe(0);
    expect(await prisma.nhaCungCap.count({ where: { ma: `NCC-AL-${suffix}`.slice(0, 30) } })).toBe(0);
  }, 180_000);

  it('chạy dọn lần hai không thay đổi gì thêm (idempotent)', async () => {
    // Lần gọi thứ 2 và thứ 3 phải xóa 0 bản ghi.
    const thongKeLau2 = donDep.thongKe?.();
    await donDep.fn?.();
    const lan2 = donDep.thongKe?.();

    await donDep.fn?.();
    const lan3 = donDep.thongKe?.();

    const tongCua = (t?: Record<string, number>) =>
      t ? Object.values(t).reduce((a, b) => a + b, 0) : 0;

    expect(tongCua(thongKeLau2)).toBe(tongCua(lan2));
    expect(tongCua(lan2)).toBe(tongCua(lan3));

    expect(await prisma.danhMucSanPham.count({ where: { ten: TEN_DANH_MUC } })).toBe(0);
    expect(await prisma.sanPham.count({ where: { ten: TEN_SAN_PHAM } })).toBe(0);
  }, 180_000);
});
