import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiLoSanPham } from '../src/generated/prisma/client';

describe('Checkout Preview PHIEN-049 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken = '';

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `checkout-p49-${suffix}@example.com`;
  const password = 'MatKhau-049-Checkout';
  const ids = {
    user: '',
    customer: '',
    supplier: '',
    farm: '',
    category: '',
    product: '',
    variant: '',
    season: '',
    harvest: '',
    batch: '',
    warehouse: '',
    inventory: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: password,
        hoTen: 'Khách Checkout PHIEN 049',
        soDienThoai: `07${Date.now().toString().slice(-8)}`,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({
        email,
        matKhau: password,
        nenTang: 'MOBILE',
      })
      .expect(200);
    accessToken = login.body.accessToken as string;

    const user = await prisma.nguoiDung.findUniqueOrThrow({
      where: { email },
      include: { khachHang: true },
    });
    ids.user = user.id;
    ids.customer = user.khachHang!.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-P49-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Checkout 049',
      },
    });
    ids.supplier = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-P49-${suffix}`.slice(0, 50),
        ten: 'Trang trại Checkout 049',
        diaChi: 'Đà Lạt',
        nhaCungCapId: supplier.id,
      },
    });
    ids.farm = farm.id;

    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Checkout 049',
        slug: `checkout-p49-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    ids.category = category.id;

    const product = await prisma.sanPham.create({
      data: {
        ten: 'Sản phẩm Checkout 049',
        trangTraiId: farm.id,
        danhMucSanPhamId: category.id,
      },
    });
    ids.product = product.id;

    const variant = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: product.id,
        sku: `CHECKOUT-P49-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 500,
        gia: 32000,
        donVi: 'g',
      },
    });
    ids.variant = variant.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau Checkout',
        giong: 'P49',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        sanLuongDuKienKg: 100,
      },
    });
    ids.season = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId: season.id,
        ngayThuHoach: new Date('2026-08-01T00:00:00.000Z'),
        soLuong: 100,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    ids.harvest = harvest.id;

    const expiry = new Date();
    expiry.setUTCDate(expiry.getUTCDate() + 30);

    const batch = await prisma.loSanPham.create({
      data: {
        maLo: `LO-P49-${suffix}`.slice(0, 100),
        thuHoachId: harvest.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: expiry,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    ids.batch = batch.id;

    const warehouse = await prisma.kho.create({
      data: {
        maKho: `KHO-P49-${suffix}`.slice(0, 50),
        ten: 'Kho Checkout 049',
        diaChi: 'Đà Lạt',
      },
    });
    ids.warehouse = warehouse.id;

    const inventory = await prisma.tonKhoLo.create({
      data: {
        khoId: warehouse.id,
        loSanPhamId: batch.id,
        bienTheSanPhamId: variant.id,
        onHand: 10,
        reserved: 3,
        blocked: 2,
      },
    });
    ids.inventory = inventory.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (ids.user) {
        await prisma.nguoiDung.deleteMany({
          where: { id: ids.user },
        });
      }
      if (ids.inventory) {
        await prisma.tonKhoLo.deleteMany({
          where: { id: ids.inventory },
        });
      }
      if (ids.batch) {
        await prisma.loSanPham.deleteMany({
          where: { id: ids.batch },
        });
      }
      if (ids.harvest) {
        await prisma.thuHoach.deleteMany({
          where: { id: ids.harvest },
        });
      }
      if (ids.season) {
        await prisma.muaVu.deleteMany({
          where: { id: ids.season },
        });
      }
      if (ids.variant) {
        await prisma.bienTheSanPham.deleteMany({
          where: { id: ids.variant },
        });
      }
      if (ids.product) {
        await prisma.sanPham.deleteMany({
          where: { id: ids.product },
        });
      }
      if (ids.category) {
        await prisma.danhMucSanPham.deleteMany({
          where: { id: ids.category },
        });
      }
      if (ids.warehouse) {
        await prisma.kho.deleteMany({
          where: { id: ids.warehouse },
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

  it('bắt buộc đăng nhập', async () => {
    await request(app.getHttpServer()).get('/api/v1/gio-hang/checkout-preview').expect(401);
  });

  it('cart rỗng vẫn trả đủ master fields nhưng không fake total', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(result.body.items).toEqual([]);
    expect(result.body.price).toEqual({
      tamTinhHangHoa: 0,
      tienTe: 'VND',
    });
    expect(result.body.promotion.giaTri).toBeNull();
    expect(result.body.shipping.giaTri).toBeNull();
    expect(result.body.points.giaTri).toBeNull();
    expect(result.body.total.tongThanhToan).toBeNull();
    expect(result.body.total.coTheXacNhan).toBe(false);
    expect(result.body.total.lyDoKhongTheXacNhan).toContain('Giỏ hàng đang trống.');
  });

  it('Backend tính items/price bằng current price, không snapshot cart', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bienTheSanPhamId: ids.variant,
        soLuong: 2,
      })
      .expect(201);

    const first = await request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(first.body.items).toHaveLength(1);
    expect(first.body.items[0].donGia).toBe(32000);
    expect(first.body.items[0].thanhTien).toBe(64000);
    expect(first.body.items[0].nhaCungCap.id).toBe(ids.supplier);
    expect(first.body.price.tamTinhHangHoa).toBe(64000);

    await prisma.bienTheSanPham.update({
      where: { id: ids.variant },
      data: { gia: 35000 },
    });

    const second = await request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(second.body.items[0].donGia).toBe(35000);
    expect(second.body.items[0].thanhTien).toBe(70000);
    expect(second.body.price.tamTinhHangHoa).toBe(70000);
  });

  it('promotion/shipping/points unresolved rõ ràng, total không bị giả', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    for (const key of ['promotion', 'shipping', 'points'] as const) {
      expect(result.body[key].trangThai).toBe('CHUA_CO_NGUON_SU_THAT');
      expect(result.body[key].giaTri).toBeNull();
      expect(result.body[key].lyDo).toBeTruthy();
    }

    expect(result.body.total.tamTinhDaBiet).toBe(70000);
    expect(result.body.total.tongThanhToan).toBeNull();
    expect(result.body.total.coTheXacNhan).toBe(false);
  });

  it('preview phản ánh thiếu tồn nhưng không reserve/mutate inventory', async () => {
    await prisma.tonKhoLo.update({
      where: { id: ids.inventory },
      data: {
        reserved: 9,
        blocked: 0,
      },
    });

    const before = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });

    const result = await request(app.getHttpServer())
      .get('/api/v1/gio-hang/checkout-preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(result.body.items[0].soLuongKhaDung).toBe(1);
    expect(result.body.items[0].coTheDatHang).toBe(false);
    expect(result.body.total.lyDoKhongTheXacNhan).toContain(
      'Có sản phẩm không đủ tồn khả dụng hiện tại.',
    );

    const after = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventory },
    });

    expect(Number(after.onHand)).toBe(Number(before.onHand));
    expect(Number(after.reserved)).toBe(Number(before.reserved));
    expect(Number(after.blocked)).toBe(Number(before.blocked));
  });
});
