import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiMuaVu,
} from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('Thu hồi Lô sản phẩm (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Recall-028';

  const emailKhach = `recall-khach-${suffix}@example.com`;

  const emailNhanVien = `recall-nv-${suffix}@example.com`;

  const emailAdmin = `recall-admin-${suffix}@example.com`;

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

  let loConcurrencyId = '';

  let loLegacyId = '';

  const maTruyXuatChinh = 'AGM-11111111111111111111111111111111';

  const maTruyXuatLegacy = 'AGM-22222222222222222222222222222222';

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
          hoTen: 'Thu hồi Lô E2E PHIEN 028',
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
        ma: `NCC-RECALL-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Recall E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-RECALL-${suffix}`.slice(0, 50),
        ten: 'Trang trại Recall E2E',
        diaChi: 'Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Xà lách',
        giong: 'Xà lách xanh',
        ngayTrong: new Date('2026-01-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        sanLuongDuKienKg: 2000,
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
      },
    });

    thuHoachId = harvest.id;

    const [loChinh, loConcurrency, loLegacy] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `RECALL-MAIN-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 200,
          conLai: 200,
          phanHangChatLuong: 'Hạng A',
          ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
          maTruyXuat: maTruyXuatChinh,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `RECALL-CON-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 200,
          conLai: 200,
          phanHangChatLuong: 'Hạng A',
          ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `RECALL-LEGACY-${suffix}`.slice(0, 100),
          thuHoachId,
          soLuong: 100,
          conLai: 0,
          phanHangChatLuong: 'Hạng A',
          ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
          trangThai: TrangThaiLoSanPham.THU_HOI,
          maTruyXuat: maTruyXuatLegacy,
        },
      }),
    ]);

    loChinhId = loChinh.id;

    loConcurrencyId = loConcurrency.id;

    loLegacyId = loLegacy.id;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();

    const log = (text: string) => {
      console.log(`[RECALL E2E cleanup +${Date.now() - start}ms] ${text}`);
    };

    log('Bắt đầu cleanup.');

    if (prisma) {
      const lotIds = [loChinhId, loConcurrencyId, loLegacyId].filter(Boolean);

      if (lotIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            OR: [
              {
                thucThe: 'lo_san_pham',
                thucTheId: {
                  in: lotIds,
                },
              },
              {
                tacNhanId: {
                  in: [adminId, nhanVienId, khachId].filter(Boolean),
                },
              },
            ],
          },
        });

        await prisma.thuHoiLoSanPham.deleteMany({
          where: {
            loSanPhamId: {
              in: lotIds,
            },
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
        await prisma.nguoiDung.deleteMany({
          where: {
            id: {
              in: actorIds,
            },
          },
        });
      }

      log('Cleanup MySQL hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };

      httpServer.closeIdleConnections?.();

      httpServer.closeAllConnections?.();

      log('Đã đóng HTTP connections.');

      await app.close();

      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('permission Thu hồi chỉ map ADMIN', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: 'lo_san_pham.thu_hoi',
        },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: {
            ma: true,
          },
        },
      },
    });

    expect(mappings.map((item) => item.vaiTro.ma).sort()).toEqual(['ADMIN']);
  });

  it('KHACH_HANG và NHAN_VIEN không được thu hồi -> 403', async () => {
    const body = {
      lyDo: 'Lý do nội bộ thử quyền.',
      thongBaoKhachHang: 'Thông báo an toàn.',
    };

    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send(body)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send(body)
      .expect(403);
  });

  it('lý do/thông báo khách hàng bắt buộc -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        lyDo: '   ',
        thongBaoKhachHang: '   ',
      })
      .expect(400);
  });

  it('ADMIN thu hồi atomic: tạo ledger + THU_HOI + admin detail', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('User-Agent', 'AgriMarket-Recall-E2E')
      .send({
        lyDo: 'Phát hiện nguy cơ an toàn thực phẩm nội bộ.',
        thongBaoKhachHang:
          'Lô sản phẩm này đã được thu hồi. Vui lòng ngừng sử dụng và liên hệ AgriMarket.',
      })
      .expect(201);

    expect(response.body.trangThai).toBe('THU_HOI');

    expect(response.body.thuHoi.lyDo).toBe('Phát hiện nguy cơ an toàn thực phẩm nội bộ.');

    expect(response.body.thuHoi.nguoiThuHoi.id).toBe(adminId);

    const record = await prisma.thuHoiLoSanPham.findUniqueOrThrow({
      where: {
        loSanPhamId: loChinhId,
      },
    });

    expect(record.nguoiThuHoiId).toBe(adminId);

    expect(
      await prisma.thuHoiLoSanPham.count({
        where: {
          loSanPhamId: loChinhId,
        },
      }),
    ).toBe(1);
  });

  it('public trace hiển thị recall alert nhưng không lộ lý do nội bộ/actor', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${maTruyXuatChinh}`)
      .expect(200);

    expect(response.body.lo.trangThai).toBe('THU_HOI');

    expect(response.body.thuHoi.thongBaoKhachHang).toContain('đã được thu hồi');

    expect(response.body.thuHoi.thuHoiLuc).toEqual(expect.any(String));

    const serialized = JSON.stringify(response.body);

    expect(serialized).not.toContain('Phát hiện nguy cơ an toàn thực phẩm nội bộ.');

    expect(serialized).not.toContain(emailAdmin);

    expect(serialized).not.toContain(adminId);

    expect(Object.keys(response.body.thuHoi).sort()).toEqual(
      ['thongBaoKhachHang', 'thuHoiLuc'].sort(),
    );
  });

  it('thu hồi là terminal: không sửa/gửi kiểm định và không recall lần hai', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        maLo: `SHOULD-NOT-CHANGE-${suffix}`,
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}/gui-kiem-dinh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        lyDo: 'Thu hồi lần hai.',
        thongBaoKhachHang: 'Không được tạo lần hai.',
      })
      .expect(409);
  });

  it('hai recall đồng thời chỉ một request thắng và một ledger', async () => {
    const taoRequest = (suffixRequest: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/lo-san-pham/${loConcurrencyId}/thu-hoi`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          lyDo: `Concurrency ${suffixRequest}`,
          thongBaoKhachHang: 'Lô đã được thu hồi do kiểm tra đồng thời.',
        });

    const [one, two] = await Promise.all([taoRequest('A'), taoRequest('B')]);

    expect([one.status, two.status].sort()).toEqual([201, 409]);

    expect(
      await prisma.thuHoiLoSanPham.count({
        where: {
          loSanPhamId: loConcurrencyId,
        },
      }),
    ).toBe(1);

    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loConcurrencyId,
      },
    });

    expect(lot.trangThai).toBe(TrangThaiLoSanPham.THU_HOI);
  });

  it('legacy THU_HOI chưa có ledger vẫn có public warning an toàn', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${maTruyXuatLegacy}`)
      .expect(200);

    expect(response.body.thuHoi.thuHoiLuc).toBeNull();

    expect(response.body.thuHoi.thongBaoKhachHang).toContain('đã được thu hồi');
  });

  it('Audit recall ghi chặn bán/phân bổ và trạng thái integration hiện tại', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        hanhDong: 'LO_SAN_PHAM_THU_HOI',
        thucThe: 'lo_san_pham',
        thucTheId: {
          in: [loChinhId, loConcurrencyId],
        },
      },
    });

    expect(logs).toHaveLength(2);

    for (const log of logs) {
      const metadata = log.metadata as {
        nganBan?: boolean;
        nganPhanBo?: boolean;
        modulePhanBo?: string;
        moduleDonHang?: string;
        thongBaoKhachHangQuaTrace?: boolean;
      };

      expect(metadata.nganBan).toBe(true);

      expect(metadata.nganPhanBo).toBe(true);

      expect(metadata.modulePhanBo).toBe('CHUA_CO_PHIEN_050');

      expect(metadata.moduleDonHang).toBe('CHUA_CO_PHIEN_051_052');

      expect(metadata.thongBaoKhachHangQuaTrace).toBe(true);
    }
  });

  it('không có API hoàn tác/xóa recall', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/lo-san-pham/${loChinhId}/thu-hoi`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThai: 'CO_THE_BAN',
      })
      .expect(404);
  });
});
