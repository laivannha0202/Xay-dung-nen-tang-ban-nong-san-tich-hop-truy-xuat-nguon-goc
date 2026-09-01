import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang, TrangThaiLoSanPham } from '../src/generated/prisma/client';

describe('Order schema PHIEN-051 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Validation DB là disposable. Giữ fixture để tránh cleanup cascade
    // làm che mất invariant lịch sử/traceability của Order schema.
    if (app) {
      await app.close();
      console.log(
        '[ORDER SCHEMA E2E cleanup] app.close() hoàn tất; fixture để DB validation tự drop.',
      );
    }
  });

  it('tạo đủ order -> supplier_order -> order_item -> allocation và giữ snapshot bất biến', async () => {
    const user = await prisma.nguoiDung.create({
      data: {
        email: `order-p51-${suffix}@example.com`,
        matKhauHash: 'hash-phien051',
        hoTen: 'Khách Order PHIEN 051',
      },
    });

    const customer = await prisma.khachHang.create({
      data: {
        nguoiDungId: user.id,
      },
    });

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P51-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Snapshot 051',
      },
    });

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P51-${suffix}`.slice(0, 50),
        ten: 'Trang trại Snapshot 051',
        diaChi: 'Lâm Đồng',
        nhaCungCapId: supplier.id,
      },
    });

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Order 051',
        slug: `order-p51-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Cà chua Snapshot',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `ORDER-P51-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 32000,
        donVi: 'g',
      },
    });

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Cà chua',
        giong: 'P51',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });

    const expiry = new Date();
    expiry.setUTCDate(expiry.getUTCDate() + 30);

    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-P51-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P51-${suffix}`.slice(0, 50),
        ten: 'Kho Order 051',
        diaChi: 'Lâm Đồng',
      },
    });

    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 10,
        reserved: 2,
        blocked: 0,
      },
    });

    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORDER-${suffix}`.slice(0, 100),
        khachHangId: customer.id,
        tongTien: 64000,
      },
    });

    expect(order.trangThai).toBe(TrangThaiDonHang.CHO_THANH_TOAN);

    const supplierOrder = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SO-${suffix}`.slice(0, 100),
        donHangId: order.id,
        nhaCungCapId: supplier.id,
        tamTinh: 64000,
      },
    });

    const item = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: supplierOrder.id,
        sanPhamId: product.id,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 2,
        donGiaSnapshot: 32000,
        tenSanPhamSnapshot: product.ten,
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: variant.khoiLuong,
        donViBienTheSnapshot: variant.donVi,
        maTrangTraiSnapshot: farm.ma,
        tenTrangTraiSnapshot: farm.ten,
      },
    });

    const allocation = await prisma.phanBoDonHang.create({
      data: {
        mucDonHangId: item.id,
        tonKhoLoId: inventory.id,
        soLuong: 2,
      },
      include: {
        tonKhoLo: {
          include: {
            loSanPham: true,
          },
        },
      },
    });

    expect(allocation.tonKhoLo.loSanPham.id).toBe(batch.id);
    expect(Number(allocation.soLuong)).toBe(2);

    await prisma.bienTheSanPham.update({
      where: { id: variant.id },
      data: {
        gia: 45000,
        sku: `CHANGED-${suffix}`.slice(0, 100).toUpperCase(),
      },
    });

    await prisma.sanPham.update({
      where: { id: product.id },
      data: {
        ten: 'Tên sản phẩm đã đổi',
      },
    });

    await prisma.trangTrai.update({
      where: { id: farm.id },
      data: {
        ma: `FARM-CHANGED-${suffix}`.slice(0, 50),
        ten: 'Tên trang trại đã đổi',
      },
    });

    const snapshot = await prisma.mucDonHang.findUniqueOrThrow({
      where: { id: item.id },
    });

    expect(Number(snapshot.donGiaSnapshot)).toBe(32000);
    expect(snapshot.tenSanPhamSnapshot).toBe('Cà chua Snapshot');
    expect(snapshot.skuBienTheSnapshot).toBe(variant.sku);
    expect(Number(snapshot.khoiLuongBienTheSnapshot)).toBe(500);
    expect(snapshot.donViBienTheSnapshot).toBe('g');
    expect(snapshot.maTrangTraiSnapshot).toBe(farm.ma);
    expect(snapshot.tenTrangTraiSnapshot).toBe('Trang trại Snapshot 051');
  });

  it('một order chỉ có một supplier_order cho cùng supplier', async () => {
    const existing = await prisma.donHangNhaCungCap.findFirstOrThrow();

    await expect(
      prisma.donHangNhaCungCap.create({
        data: {
          maDon: `SO-DUP-${suffix}`.slice(0, 100),
          donHangId: existing.donHangId,
          nhaCungCapId: existing.nhaCungCapId,
          tamTinh: 0,
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('DB CHECK chặn quantity <= 0 ở order_item và allocation', async () => {
    const existing = await prisma.mucDonHang.findFirstOrThrow();

    await expect(
      prisma.$executeRawUnsafe(
        'UPDATE `order_item` SET `so_luong` = 0 WHERE `id` = ?',
        existing.id,
      ),
    ).rejects.toBeTruthy();

    const allocation = await prisma.phanBoDonHang.findFirstOrThrow();

    await expect(
      prisma.$executeRawUnsafe(
        'UPDATE `order_allocation` SET `so_luong` = 0 WHERE `id` = ?',
        allocation.id,
      ),
    ).rejects.toBeTruthy();
  });
});
