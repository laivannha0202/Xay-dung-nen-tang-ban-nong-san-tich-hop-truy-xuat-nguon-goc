import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiMuaVu,
} from '../src/generated/prisma/client';

import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('QR Code Lô sản phẩm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-QR-025';

  const emailKhach = `qr-khach-${suffix}@example.com`;
  const emailNhanVien = `qr-nv-${suffix}@example.com`;
  const emailAdmin = `qr-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let muaVuId = '';
  let thuHoachId = '';
  let loChinhId = '';
  let loThuHaiId = '';
  let loDongThoiId = '';
  let maChinh = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    cauHinhUngDung(app);

    await app.init();

    prisma = app.get(PrismaService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'QR Code E2E PHIEN 025',
        })
        .expect(201);
    }

    const [khach, nhanVien, admin] = await Promise.all([
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailKhach,
        },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailNhanVien,
        },
      }),
      prisma.nguoiDung.findUniqueOrThrow({
        where: {
          email: emailAdmin,
        },
      }),
    ]);

    khachId = khach.id;
    nhanVienId = nhanVien.id;
    adminId = admin.id;

    const [roleNhanVien, roleAdmin] = await Promise.all([
      prisma.vaiTro.findUniqueOrThrow({
        where: {
          ma: 'NHAN_VIEN',
        },
      }),
      prisma.vaiTro.findUniqueOrThrow({
        where: {
          ma: 'ADMIN',
        },
      }),
    ]);

    await prisma.nguoiDungVaiTro.createMany({
      data: [
        {
          nguoiDungId: nhanVienId,
          vaiTroId: roleNhanVien.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        {
          nguoiDungId: adminId,
          vaiTroId: roleAdmin.id,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      ],
    });

    const login = async (email: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({
          email,
          matKhau,
          nenTang: 'MOBILE',
        })
        .expect(200);

      return response.body.accessToken as string;
    };

    [tokenKhach, tokenNhanVien, tokenAdmin] = await Promise.all([
      login(emailKhach),
      login(emailNhanVien),
      login(emailAdmin),
    ]);

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-QR-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp QR E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-QR-${suffix}`.slice(0, 50),
        ten: 'Trang trại QR E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Bơ',
        giong: 'Bơ 034',
        ngayTrong: new Date('2026-01-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-15T00:00:00.000Z'),
        sanLuongDuKienKg: 5000,
        trangThai: TrangThaiMuaVu.CHO_THU_HOACH,
      },
    });

    muaVuId = season.id;

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId,
        ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        soLuong: 1000,
        donVi: 'KG',
        phanLoai: 'Loại A',
        ghiChu: 'Nguồn QR PHIEN-025.',
      },
    });

    thuHoachId = harvest.id;

    const lots = await Promise.all(
      ['QR-MAIN', 'QR-SECOND', 'QR-CONCURRENT'].map((prefix, index) =>
        prisma.loSanPham.create({
          data: {
            maLo: `${prefix}-${suffix}`.slice(0, 100),
            thuHoachId,
            soLuong: 100 + index,
            conLai: 100 + index,
            phanHangChatLuong: 'Hạng A',
            ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
            trangThai: TrangThaiLoSanPham.CO_THE_BAN,
          },
        }),
      ),
    );

    const [loChinh, loThuHai, loDongThoi] = lots;

    if (!loChinh || !loThuHai || !loDongThoi) {
      throw new Error('Không tạo đủ 3 Lô phục vụ E2E QR Code.');
    }

    loChinhId = loChinh.id;
    loThuHaiId = loThuHai.id;
    loDongThoiId = loDongThoi.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const batDauDonDep = Date.now();

    const logDonDep = (noiDung: string) => {
      const elapsed = Date.now() - batDauDonDep;

      console.log(`[QR E2E cleanup +${elapsed}ms] ${noiDung}`);
    };

    logDonDep('Bắt đầu cleanup.');

    if (prisma) {
      logDonDep('Bắt đầu cleanup dữ liệu MySQL.');
      const lotIds = [loChinhId, loThuHaiId, loDongThoiId].filter(Boolean);

      if (lotIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'lo_san_pham',
            thucTheId: {
              in: lotIds,
            },
            hanhDong: 'QR_CODE_LO_TAO',
          },
        });

        await prisma.loSanPham.deleteMany({
          where: {
            id: {
              in: lotIds,
            },
          },
        });
      }

      if (thuHoachId) {
        await prisma.thuHoach.deleteMany({
          where: {
            id: thuHoachId,
          },
        });
      }

      if (muaVuId) {
        await prisma.muaVu.deleteMany({
          where: {
            id: muaVuId,
          },
        });
      }

      if (trangTraiId) {
        await prisma.trangTrai.deleteMany({
          where: {
            id: trangTraiId,
          },
        });
      }

      if (nhaCungCapId) {
        await prisma.nhaCungCap.deleteMany({
          where: {
            id: nhaCungCapId,
          },
        });
      }

      const actorIds = [khachId, nhanVienId, adminId].filter(Boolean);

      if (actorIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            tacNhanId: {
              in: actorIds,
            },
          },
        });

        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: actorIds,
            },
          },
        });
      }
      logDonDep('Cleanup dữ liệu MySQL hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };

      httpServer.closeIdleConnections?.();

      httpServer.closeAllConnections?.();

      logDonDep('Đã đóng HTTP idle/all connections.');

      const workers = [
        app.get(EmailWorker, {
          strict: false,
        }),
        app.get(ThongBaoWorker, {
          strict: false,
        }),
        app.get(HeThongWorker, {
          strict: false,
        }),
      ];

      await Promise.all(
        workers.map(async (worker) => {
          await worker.worker.close(true);
        }),
      );

      const queues = [
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.EMAIL), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.THONG_BAO), {
          strict: false,
        }),
        app.get<Queue>(getQueueToken(TEN_HANG_DOI.HE_THONG), {
          strict: false,
        }),
      ];

      await Promise.all(
        queues.map(async (queue) => {
          await queue.close();
        }),
      );

      logDonDep('Đã đóng BullMQ workers/queues trước app.close().');

      logDonDep('Bắt đầu app.close().');

      await app.close();

      logDonDep('app.close() hoàn tất.');
    }

    logDonDep('Cleanup QR E2E hoàn tất.');
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('seed đúng 2 quyền QR cho Nhân viên/Admin', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'qr_code.',
          },
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: {
            ma: true,
          },
        },
        quyen: {
          select: {
            ma: true,
          },
        },
      },
    });

    expect(mappings.map((item) => `${item.vaiTro.ma}:${item.quyen.ma}`).sort()).toEqual([
      'ADMIN:qr_code.tao',
      'ADMIN:qr_code.xem',
      'NHAN_VIEN:qr_code.tao',
      'NHAN_VIEN:qr_code.xem',
    ]);
  });

  it('KHACH_HANG không xem QR quản trị -> 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('GET trước khi generate -> 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(404);
  });

  it('generate QR tạo stable trace code, PNG và SVG', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-QR-E2E')
      .expect(201);

    maChinh = response.body.maTruyXuat as string;

    expect(maChinh).toMatch(/^AGM-[A-F0-9]{32}$/);

    expect(response.body.payload).toBe(maChinh);

    expect(response.body.payload).not.toContain(response.body.maLo as string);

    expect(response.body.pngDataUrl).toEqual(expect.stringMatching(/^data:image\/png;base64,/));

    expect(response.body.svg).toContain('<svg');

    const base64 = String(response.body.pngDataUrl).split(',')[1];

    expect(base64).toBeDefined();

    const png = Buffer.from(base64 ?? '', 'base64');

    expect(Array.from(png.subarray(0, 8))).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loChinhId,
      },
    });

    expect(lot.maTruyXuat).toBe(maChinh);
  });

  it('generate lại cùng Lô trả đúng mã cũ và chỉ audit một lần', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(201);

    expect(response.body.maTruyXuat).toBe(maChinh);

    const auditCount = await prisma.nhatKyKiemToan.count({
      where: {
        thucThe: 'lo_san_pham',
        thucTheId: loChinhId,
        hanhDong: 'QR_CODE_LO_TAO',
      },
    });

    expect(auditCount).toBe(1);
  });

  it('GET sau generate trả cùng stable trace code', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(200);

    expect(response.body.maTruyXuat).toBe(maChinh);

    expect(response.body.payload).toBe(maChinh);
  });

  it('hai Lô có stable trace code khác nhau', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/qr-code/lo/${loThuHaiId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .expect(201);

    expect(response.body.maTruyXuat).not.toBe(maChinh);
  });

  it('atomic compare-and-set giúp hai generate đồng thời nhận cùng một mã và một audit', async () => {
    const tao = (token: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/qr-code/lo/${loDongThoiId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Connection', 'close');

    const [one, two] = await Promise.all([tao(tokenNhanVien), tao(tokenAdmin)]);

    expect([one.status, two.status]).toEqual([201, 201]);

    expect(one.body.maTruyXuat).toBe(two.body.maTruyXuat);

    const auditCount = await prisma.nhatKyKiemToan.count({
      where: {
        thucThe: 'lo_san_pham',
        thucTheId: loDongThoiId,
        hanhDong: 'QR_CODE_LO_TAO',
      },
    });

    expect(auditCount).toBe(1);
  });

  it('không có API PATCH/DELETE mã QR', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        maTruyXuat: 'AGM-KHONG-DUOC-SUA',
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/qr-code/lo/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);
  });

  it('Audit stable trace code ghi đúng tác nhân và không chứa dữ liệu toàn Lô', async () => {
    const log = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: {
        thucThe: 'lo_san_pham',
        thucTheId: loChinhId,
        hanhDong: 'QR_CODE_LO_TAO',
      },
    });

    expect(log.tacNhanId).toBe(nhanVienId);

    expect(log.sau).toEqual({
      maTruyXuat: maChinh,
    });
  });
});
