import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiXacMinhChungNhan } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { TepTinService } from '../src/modules/tep-tin/tep-tin.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('API public sản phẩm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tepTinService: TepTinService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Public-Product-033';
  const email = `public-product-${suffix}@example.com`;
  let userId = '';
  let token = '';
  let nhaCungCapId = '';
  let farm1Id = '';
  let farm2Id = '';
  let farmKhoaId = '';
  let category1Id = '';
  let category2Id = '';
  let categoryKhoaId = '';
  let sanPhamChinhId = '';
  let sanPhamCungDanhMucId = '';
  let sanPhamCungFarmId = '';
  let sanPhamKhoaId = '';
  let sanPhamKhongVariantId = '';
  let sanPhamFarmKhoaId = '';
  let sanPhamDanhMucKhoaId = '';
  let muaVuId = '';
  let thuHoachId = '';
  let tepAnhId = '';
  let tepPdfId = '';
  const productIds: string[] = [];
  const fileIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    tepTinService = app.get(TepTinService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email, matKhau, hoTen: 'Public Product E2E PHIEN 033' })
      .expect(201);
    const user = await prisma.nguoiDung.findUniqueOrThrow({ where: { email } });
    userId = user.id;
    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau, nenTang: 'MOBILE' })
      .expect(200);
    token = login.body.accessToken as string;

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-P33-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp Public Product' },
    });
    nhaCungCapId = supplier.id;

    const [farm1, farm2, farmKhoa] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P33-A-${suffix}`.slice(0, 50),
          ten: 'Trang trại Public A',
          diaChi: 'Lâm Đồng',
          nhaCungCapId,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P33-B-${suffix}`.slice(0, 50),
          ten: 'Trang trại Public B',
          diaChi: 'Đà Lạt',
          nhaCungCapId,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-P33-X-${suffix}`.slice(0, 50),
          ten: 'Trang trại bị khóa',
          diaChi: 'Ẩn',
          nhaCungCapId,
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);
    farm1Id = farm1.id;
    farm2Id = farm2.id;
    farmKhoaId = farmKhoa.id;

    const slug1 = `rau-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);
    const slug2 = `cu-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);
    const slugKhoa = `khoa-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 191);
    const [category1, category2, categoryKhoa] = await Promise.all([
      prisma.danhMucSanPham.create({ data: { ten: 'Rau công khai', slug: slug1 } }),
      prisma.danhMucSanPham.create({ data: { ten: 'Củ công khai', slug: slug2 } }),
      prisma.danhMucSanPham.create({
        data: {
          ten: 'Danh mục khóa',
          slug: slugKhoa,
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        },
      }),
    ]);
    category1Id = category1.id;
    category2Id = category2.id;
    categoryKhoaId = categoryKhoa.id;

    const taoProduct = async (
      ten: string,
      trangTraiId: string,
      danhMucSanPhamId: string,
      trangThai: TrangThaiBanGhi = TrangThaiBanGhi.HOAT_DONG,
    ) => {
      const item = await prisma.sanPham.create({
        data: { ten, moTa: `Mô tả ${ten}`, trangTraiId, danhMucSanPhamId, trangThai },
      });
      productIds.push(item.id);
      return item;
    };

    const main = await taoProduct('Cà chua Public 033', farm1Id, category1Id);
    const sameCategory = await taoProduct('Rau liên quan cùng danh mục', farm2Id, category1Id);
    const sameFarm = await taoProduct('Củ liên quan cùng farm', farm1Id, category2Id);
    const locked = await taoProduct(
      'Product bị khóa',
      farm1Id,
      category1Id,
      TrangThaiBanGhi.NGUNG_HOAT_DONG,
    );
    const noVariant = await taoProduct('Product chưa có giá', farm1Id, category1Id);
    const lockedFarm = await taoProduct('Product farm khóa', farmKhoaId, category1Id);
    const lockedCategory = await taoProduct('Product category khóa', farm1Id, categoryKhoaId);
    sanPhamChinhId = main.id;
    sanPhamCungDanhMucId = sameCategory.id;
    sanPhamCungFarmId = sameFarm.id;
    sanPhamKhoaId = locked.id;
    sanPhamKhongVariantId = noVariant.id;
    sanPhamFarmKhoaId = lockedFarm.id;
    sanPhamDanhMucKhoaId = lockedCategory.id;

    await prisma.bienTheSanPham.createMany({
      data: [
        {
          sanPhamId: main.id,
          sku: `P33-MAIN-500-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 35000,
          donVi: 'g',
        },
        {
          sanPhamId: main.id,
          sku: `P33-MAIN-1000-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 1000,
          gia: 62000,
          donVi: 'g',
        },
        {
          sanPhamId: sameCategory.id,
          sku: `P33-CAT-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 28000,
          donVi: 'g',
        },
        {
          sanPhamId: sameFarm.id,
          sku: `P33-FARM-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 30000,
          donVi: 'g',
        },
        {
          sanPhamId: locked.id,
          sku: `P33-LOCK-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 1,
          donVi: 'g',
        },
        {
          sanPhamId: lockedFarm.id,
          sku: `P33-LF-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 1,
          donVi: 'g',
        },
        {
          sanPhamId: lockedCategory.id,
          sku: `P33-LC-${suffix}`.slice(0, 100).toUpperCase(),
          khoiLuong: 500,
          gia: 1,
          donVi: 'g',
        },
      ],
    });

    const upload = async (name: string, mime: string, buffer: Buffer): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tep-tin/tai-len')
        .set('Authorization', `Bearer ${token}`)
        .attach('tep', buffer, { filename: name, contentType: mime })
        .expect(201);
      const id = response.body.id as string;
      fileIds.push(id);
      return id;
    };
    tepAnhId = await upload(
      'public-product.png',
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    );
    tepPdfId = await upload(
      'certificate.pdf',
      'application/pdf',
      Buffer.from('%PDF-1.4\n', 'ascii'),
    );
    await prisma.sanPhamAnh.create({
      data: { sanPhamId: main.id, tepTinId: tepAnhId, laAnhBia: true, thuTu: 0 },
    });

    const now = new Date();
    const future = new Date(now);
    future.setUTCFullYear(future.getUTCFullYear() + 1);
    const past = new Date(now);
    past.setUTCDate(past.getUTCDate() - 1);
    await prisma.chungNhan.createMany({
      data: [
        {
          trangTraiId: farm1Id,
          loai: 'VietGAP',
          ma: `VG-P33-${suffix}`.slice(0, 100),
          donViCap: 'Đơn vị VietGAP',
          ngayCap: now,
          ngayHetHan: future,
          tepTinId: tepPdfId,
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
          xacMinhLuc: now,
        },
        {
          trangTraiId: farm1Id,
          loai: 'Hết hạn',
          ma: `EXP-P33-${suffix}`.slice(0, 100),
          donViCap: 'Đơn vị cũ',
          ngayCap: past,
          ngayHetHan: past,
          tepTinId: tepPdfId,
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
          xacMinhLuc: past,
        },
        {
          trangTraiId: farm1Id,
          loai: 'Chờ xác minh',
          ma: `WAIT-P33-${suffix}`.slice(0, 100),
          donViCap: 'Đơn vị chờ',
          ngayCap: now,
          ngayHetHan: future,
          tepTinId: tepPdfId,
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.CHO_XAC_MINH,
        },
      ],
    });

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId: farm1Id,
        cayTrong: 'Cà chua',
        giong: 'Ruby',
        ngayTrong: new Date('2026-06-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        sanLuongDuKienKg: 1000,
      },
    });
    muaVuId = season.id;
    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId,
        ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        soLuong: 200,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    thuHoachId = harvest.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();
    const log = (text: string) =>
      console.log(`[PUBLIC PRODUCT E2E cleanup +${Date.now() - start}ms] ${text}`);
    log('Bắt đầu cleanup.');

    if (prisma) {
      await prisma.sanPhamAnh.deleteMany({ where: { sanPhamId: { in: productIds } } });
      await prisma.bienTheSanPham.deleteMany({ where: { sanPhamId: { in: productIds } } });
      await prisma.sanPham.deleteMany({ where: { id: { in: productIds } } });
      await prisma.chungNhan.deleteMany({
        where: { trangTraiId: { in: [farm1Id, farm2Id, farmKhoaId].filter(Boolean) } },
      });
      if (thuHoachId) await prisma.thuHoach.deleteMany({ where: { id: thuHoachId } });
      if (muaVuId) await prisma.muaVu.deleteMany({ where: { id: muaVuId } });

      for (const tepId of fileIds) {
        try {
          await tepTinService.xoa(tepId, userId, {
            ip: null,
            userAgent: 'PublicProductE2ECleanup',
          });
        } catch {
          // Tiếp tục cleanup metadata test.
        }
      }
      await prisma.nhatKyKiemToan.deleteMany({
        where: { OR: [{ tacNhanId: userId }, { thucTheId: { in: fileIds } }] },
      });
      if (fileIds.length) await prisma.tepTin.deleteMany({ where: { id: { in: fileIds } } });
      await prisma.danhMucSanPham.deleteMany({
        where: { id: { in: [category1Id, category2Id, categoryKhoaId].filter(Boolean) } },
      });
      await prisma.trangTrai.deleteMany({
        where: { id: { in: [farm1Id, farm2Id, farmKhoaId].filter(Boolean) } },
      });
      if (nhaCungCapId) await prisma.nhaCungCap.deleteMany({ where: { id: nhaCungCapId } });
      if (userId) await prisma.nguoiDung.deleteMany({ where: { id: userId } });
      log('Cleanup MySQL/MinIO hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };
      httpServer.closeIdleConnections?.();
      httpServer.closeAllConnections?.();
      const workers = [
        app.get(EmailWorker, { strict: false }),
        app.get(ThongBaoWorker, { strict: false }),
        app.get(HeThongWorker, { strict: false }),
      ];
      await Promise.all(workers.map(async (worker) => worker.worker.close(true)));
      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), { strict: false }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), { strict: false }),
      ];
      await Promise.all(queues.map(async (queue) => queue.close()));
      await app.close();
      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('list public không cần Authorization và chỉ trả Product đủ điều kiện public', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai')
      .expect(200);
    const ids = (response.body.duLieu as Array<{ id: string }>).map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([sanPhamChinhId, sanPhamCungDanhMucId, sanPhamCungFarmId]),
    );
    expect(ids).not.toContain(sanPhamKhoaId);
    expect(ids).not.toContain(sanPhamKhongVariantId);
    expect(ids).not.toContain(sanPhamFarmKhoaId);
    expect(ids).not.toContain(sanPhamDanhMucKhoaId);
  });

  it('list trả price/farm/certificate badges/availability và signed cover URL', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/san-pham-cong-khai?timKiem=Cà%20chua%20Public%20033')
      .expect(200);
    expect(response.body.tong).toBe(1);
    const item = response.body.duLieu[0];
    expect(item.id).toBe(sanPhamChinhId);
    expect(item.gia).toEqual({ tu: 35000, den: 62000, tienTe: 'VND' });
    expect(item.trangTrai.id).toBe(farm1Id);
    expect(item.anhBiaUrl).toContain('http');
    expect(item.chungNhan).toHaveLength(1);
    expect(item.chungNhan[0].loai).toBe('VietGAP');
    expect(item.khaDung).toEqual({
      coGia: true,
      soLuongKhaDung: null,
      coTheDatHang: false,
      lyDo: 'Chưa có dữ liệu tồn kho để xác nhận khả năng đặt hàng.',
    });
  });

  it('detail public trả variants/images và harvest info đúng scope trang trại', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/${sanPhamChinhId}`)
      .expect(200);
    expect(response.body.bienThe).toHaveLength(2);
    expect(response.body.bienThe.map((item: { gia: number }) => item.gia)).toEqual([35000, 62000]);
    expect(response.body.anh).toHaveLength(1);
    expect(response.body.anh[0].url).toContain('http');
    expect(response.body.anh[0]).not.toHaveProperty('tepTinId');
    expect(response.body.thuHoachGanNhatTaiTrangTrai).toEqual({
      ngayThuHoach: '2026-08-20',
      cayTrong: 'Cà chua',
      giong: 'Ruby',
      phanLoai: 'Loại 1',
    });
  });

  it('category endpoint lọc exact danh mục active', async () => {
    const category = await prisma.danhMucSanPham.findUniqueOrThrow({ where: { id: category1Id } });
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/danh-muc/${category.slug}`)
      .expect(200);
    const ids = response.body.duLieu.map((item: { id: string }) => item.id);
    expect(ids).toEqual(expect.arrayContaining([sanPhamChinhId, sanPhamCungDanhMucId]));
    expect(ids).not.toContain(sanPhamCungFarmId);
  });

  it('farm endpoint lọc exact trang trại active', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/trang-trai/${farm1Id}`)
      .expect(200);
    const ids = response.body.duLieu.map((item: { id: string }) => item.id);
    expect(ids).toEqual(expect.arrayContaining([sanPhamChinhId, sanPhamCungFarmId]));
    expect(ids).not.toContain(sanPhamCungDanhMucId);
  });

  it('related ưu tiên cùng category/farm, loại chính nó và item không public', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/${sanPhamChinhId}/lien-quan`)
      .expect(200);
    const ids = response.body.duLieu.map((item: { id: string }) => item.id);
    expect(ids[0]).toBe(sanPhamCungDanhMucId);
    expect(ids).toContain(sanPhamCungFarmId);
    expect(ids).not.toContain(sanPhamChinhId);
    expect(ids).not.toContain(sanPhamKhoaId);
  });

  it('Product bị khóa/không variant/farm khóa/category khóa không có public detail', async () => {
    for (const id of [
      sanPhamKhoaId,
      sanPhamKhongVariantId,
      sanPhamFarmKhoaId,
      sanPhamDanhMucKhoaId,
    ]) {
      await request(app.getHttpServer()).get(`/api/v1/san-pham-cong-khai/${id}`).expect(404);
    }
  });

  it('category/farm khóa trả 404 thay vì lộ catalog private', async () => {
    const category = await prisma.danhMucSanPham.findUniqueOrThrow({
      where: { id: categoryKhoaId },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/danh-muc/${category.slug}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/trang-trai/${farmKhoaId}`)
      .expect(404);
  });

  it('certificate badge không lộ file/private metadata và bỏ expired/pending', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/${sanPhamChinhId}`)
      .expect(200);
    expect(response.body.chungNhan).toHaveLength(1);
    expect(response.body.chungNhan[0]).not.toHaveProperty('tepTinId');
    expect(response.body.chungNhan[0]).not.toHaveProperty('lyDoTuChoi');
    expect(response.body).not.toHaveProperty('trangThai');
  });

  it('protected Product API vẫn yêu cầu auth; public API không cần auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/san-pham').expect(401);
    await request(app.getHttpServer()).get('/api/v1/san-pham-cong-khai').expect(200);
  });

  it('PHIEN-034 có Kho nhưng chưa InventoryLot; Product ≠ Batch và availability chưa bịa tồn kho', async () => {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ soCot: number; soKho: number; phaseSau: number }>
    >(`
SELECT
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lo_san_pham'
      AND COLUMN_NAME IN ('san_pham_id','product_id')) AS soCot,
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kho') AS soKho,
  (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('inventory_lot','don_hang','gio_hang')) AS phaseSau
`);
    expect(Number(rows[0]?.soCot ?? -1)).toBe(0);
    expect(Number(rows[0]?.soKho ?? -1)).toBe(1);
    expect(Number(rows[0]?.phaseSau ?? -1)).toBe(0);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham-cong-khai/${sanPhamChinhId}`)
      .expect(200);
    expect(response.body.khaDung.soLuongKhaDung).toBeNull();
    expect(response.body.khaDung.coTheDatHang).toBe(false);
  });
});
