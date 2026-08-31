import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { TepTinService } from '../src/modules/tep-tin/tep-tin.service';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Ảnh sản phẩm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tepTinService: TepTinService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-Product-Image-032';
  const emailKhach = `image-khach-${suffix}@example.com`;
  const emailNhanVien = `image-nv-${suffix}@example.com`;
  const emailAdmin = `image-admin-${suffix}@example.com`;
  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let danhMucId = '';
  let sanPhamId = '';
  const tepOwners = new Map<string, string>();
  let tep1 = '';
  let tep2 = '';
  let tep3 = '';
  let anh1 = '';
  let anh2 = '';
  let anh3 = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);
    tepTinService = app.get(TepTinService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Ảnh sản phẩm E2E PHIEN 032' })
        .expect(201);
    }

    const [khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailNhanVien } }),
      prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } }),
    ]);
    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'NHAN_VIEN' } }),
      prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } }),
    ]);
    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVienId,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        { nguoiDungId: adminId, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
      ],
    });

    const login = async (email: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'MOBILE' })
        .expect(200);
      return response.body.accessToken as string;
    };
    [tokenKhach, tokenNhanVien, tokenAdmin] = await Promise.all([
      login(emailKhach),
      login(emailNhanVien),
      login(emailAdmin),
    ]);

    const supplier = await prisma.nhaCungCap.create({
      data: { ma: `NCC-I32-${suffix}`.slice(0, 50), ten: 'Nhà cung cấp Image E2E' },
    });
    nhaCungCapId = supplier.id;
    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-I32-${suffix}`.slice(0, 50),
        ten: 'Trang trại Image E2E',
        diaChi: 'Lâm Đồng',
        nhaCungCapId,
      },
    });
    trangTraiId = farm.id;
    const category = await prisma.danhMucSanPham.create({
      data: {
        ten: 'Danh mục Image E2E',
        slug: `image-${suffix}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 191),
      },
    });
    danhMucId = category.id;
    const product = await prisma.sanPham.create({
      data: { ten: 'Sản phẩm có ảnh', trangTraiId, danhMucSanPhamId: danhMucId },
    });
    sanPhamId = product.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();
    const log = (text: string) =>
      console.log(`[PRODUCT IMAGE E2E cleanup +${Date.now() - start}ms] ${text}`);
    log('Bắt đầu cleanup.');

    if (prisma) {
      await prisma.sanPhamAnh.deleteMany({ where: { sanPhamId } });
      for (const [tepId, ownerId] of tepOwners) {
        try {
          await tepTinService.xoa(tepId, ownerId, {
            ip: null,
            userAgent: 'ProductImageE2ECleanup',
          });
        } catch {
          // File có thể đã inactive; tiếp tục cleanup DB test.
        }
      }
      const tepIds = [...tepOwners.keys()];
      await prisma.nhatKyKiemToan.deleteMany({
        where: {
          OR: [
            { thucThe: { in: ['san_pham_anh', 'tep_tin', 'san_pham'] } },
            { tacNhanId: { in: [khachId, nhanVienId, adminId].filter(Boolean) } },
          ],
        },
      });
      if (tepIds.length) await prisma.tepTin.deleteMany({ where: { id: { in: tepIds } } });
      if (sanPhamId) await prisma.sanPham.deleteMany({ where: { id: sanPhamId } });
      if (danhMucId) await prisma.danhMucSanPham.deleteMany({ where: { id: danhMucId } });
      if (trangTraiId) await prisma.trangTrai.deleteMany({ where: { id: trangTraiId } });
      if (nhaCungCapId) await prisma.nhaCungCap.deleteMany({ where: { id: nhaCungCapId } });
      const actorIds = [khachId, nhanVienId, adminId].filter(Boolean);
      if (actorIds.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: actorIds } } });
      log('Cleanup MySQL/MinIO hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };
      httpServer.closeIdleConnections?.();
      httpServer.closeAllConnections?.();
      log('Đã đóng HTTP connections.');
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
      log('Đã đóng BullMQ workers/queues trước app.close().');
      await app.close();
      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  const taoNoiDungTep = (mime: string): Buffer => {
    if (mime === 'image/jpeg') {
      return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    }
    if (mime === 'image/png') {
      return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    }
    if (mime === 'image/webp') {
      return Buffer.from('RIFF0000WEBP', 'ascii');
    }
    if (mime === 'application/pdf') {
      return Buffer.from('%PDF-1.4\\n', 'ascii');
    }
    throw new Error(`MIME test không hỗ trợ: ${mime}`);
  };

  const taiTep = async (
    token: string,
    ownerId: string,
    name: string,
    mime: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${token}`)
      .attach('tep', taoNoiDungTep(mime), { filename: name, contentType: mime })
      .expect(201);
    const id = response.body.id as string;
    tepOwners.set(id, ownerId);
    return id;
  };

  it('RBAC: GET ảnh cần auth; KHACH_HANG xem được nhưng không sửa', async () => {
    await request(app.getHttpServer()).get(`/api/v1/san-pham/${sanPhamId}/anh`).expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ tepTinIds: ['00000000-0000-4000-8000-000000000001'] })
      .expect(403);
  });

  it('multiple upload: gắn 3 JPEG/PNG/WebP và tự chọn ảnh đầu làm cover', async () => {
    tep1 = await taiTep(tokenNhanVien, nhanVienId, 'product-1.jpg', 'image/jpeg');
    tep2 = await taiTep(tokenNhanVien, nhanVienId, 'product-2.png', 'image/png');
    tep3 = await taiTep(tokenNhanVien, nhanVienId, 'product-3.webp', 'image/webp');
    const response = await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ tepTinIds: [tep1, tep2, tep3] })
      .expect(201);
    expect(response.body.tong).toBe(3);
    expect(
      response.body.duLieu.filter((item: { laAnhBia: boolean }) => item.laAnhBia),
    ).toHaveLength(1);
    const byTep = new Map(
      response.body.duLieu.map((item: { id: string; tepTinId: string }) => [
        item.tepTinId,
        item.id,
      ]),
    );
    anh1 = byTep.get(tep1) as string;
    anh2 = byTep.get(tep2) as string;
    anh3 = byTep.get(tep3) as string;
    expect(
      response.body.duLieu.find((item: { tepTinId: string }) => item.tepTinId === tep1).laAnhBia,
    ).toBe(true);
  });

  it('chặn PDF và chặn chiếm file private do actor khác upload', async () => {
    const pdf = await taiTep(tokenNhanVien, nhanVienId, 'khong-phai-anh.pdf', 'application/pdf');
    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ tepTinIds: [pdf] })
      .expect(400);

    const anhKhach = await taiTep(tokenKhach, khachId, 'khach.png', 'image/png');
    await request(app.getHttpServer())
      .post(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ tepTinIds: [anhKhach] })
      .expect(400);
  });

  it('list trả signed URL và đúng 3 ảnh', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(response.body.tong).toBe(3);
    for (const item of response.body.duLieu as Array<{ url: string; mimeType: string }>) {
      expect(item.url).toContain('http');
      expect(item.mimeType.startsWith('image/')).toBe(true);
    }
  });

  it('đặt ảnh bìa đảm bảo đúng một cover', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/anh/${anh3}/anh-bia`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    expect(
      response.body.duLieu.filter((item: { laAnhBia: boolean }) => item.laAnhBia),
    ).toHaveLength(1);
    expect(response.body.duLieu.find((item: { id: string }) => item.id === anh3).laAnhBia).toBe(
      true,
    );
  });

  it('sort order cập nhật thuTu theo toàn bộ danh sách', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/anh/sap-xep`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ anhIds: [anh2, anh3, anh1] })
      .expect(200);
    const rows = await prisma.sanPhamAnh.findMany({
      where: { sanPhamId },
      orderBy: { thuTu: 'asc' },
    });
    expect(rows.map((item) => item.id)).toEqual([anh2, anh3, anh1]);
    expect(rows.map((item) => item.thuTu)).toEqual([0, 1, 2]);
  });

  it('sort order phải chứa đúng toàn bộ ảnh hiện tại', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/san-pham/${sanPhamId}/anh/sap-xep`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({ anhIds: [anh1, anh2] })
      .expect(400);
  });

  it('DELETE cover tự chuyển cover sang ảnh còn lại và không xóa TepTin resource', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/san-pham/${sanPhamId}/anh/${anh3}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);
    const list = await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/anh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    expect(list.body.tong).toBe(2);
    expect(list.body.duLieu.filter((item: { laAnhBia: boolean }) => item.laAnhBia)).toHaveLength(1);
    const tep = await prisma.tepTin.findUniqueOrThrow({ where: { id: tep3 } });
    expect(tep.trangThai).toBe(TrangThaiBanGhi.HOAT_DONG);
  });

  it('Audit có add/cover/sort/delete', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: { hanhDong: { startsWith: 'SAN_PHAM_ANH_' } },
      orderBy: { createdAt: 'asc' },
    });
    const actions = logs.map((item) => item.hanhDong);
    expect(actions.filter((item) => item === 'SAN_PHAM_ANH_THEM')).toHaveLength(3);
    expect(actions).toContain('SAN_PHAM_ANH_DAT_BIA');
    expect(actions).toContain('SAN_PHAM_ANH_SAP_XEP');
    expect(actions).toContain('SAN_PHAM_ANH_XOA');
  });

  it('PHIEN-032 không mở public Product và không làm mất Variant PHIEN-031', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/san-pham/${sanPhamId}/bien-the`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
    await request(app.getHttpServer()).get('/api/v1/san-pham-cong-khai').expect(404);
  });
});
