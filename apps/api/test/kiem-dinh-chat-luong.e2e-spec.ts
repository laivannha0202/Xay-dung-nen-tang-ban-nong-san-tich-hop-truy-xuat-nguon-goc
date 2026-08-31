import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  KetQuaKiemDinhChatLuong,
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiMuaVu,
} from '../src/generated/prisma/client';
import { TepTinService } from '../src/modules/tep-tin/tep-tin.service';

const THOI_GIAN_CHO_E2E_MS = 90_000;

describe('Kiểm định chất lượng (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tepTinService: TepTinService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Quality-024';

  const emailKhach = `quality-khach-${suffix}@example.com`;
  const emailNhanVien = `quality-nv-${suffix}@example.com`;
  const emailAdmin = `quality-admin-${suffix}@example.com`;

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
  let loPassedId = '';
  let loFailedId = '';
  let loHoldId = '';
  let loRecallId = '';
  let loMoiTaoId = '';
  let loAnhSaiId = '';
  let loConcurrencyId = '';
  let kiemDinhPassedId = '';
  let tepAnhId = '';
  let tepPdfId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    cauHinhUngDung(app);

    await app.init();

    prisma = app.get(PrismaService);

    tepTinService = app.get(TepTinService);

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'Kiểm định E2E PHIEN 024',
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
        ma: `NCC-QUALITY-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Kiểm định E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-QUALITY-${suffix}`.slice(0, 50),
        ten: 'Trang trại Kiểm định E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Dâu tây',
        giong: 'Dâu Nhật',
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
        soLuong: 2000,
        donVi: 'KG',
        phanLoai: 'Loại A',
        ghiChu: 'Nguồn kiểm định PHIEN-024.',
      },
    });

    thuHoachId = harvest.id;

    const lotData = [
      {
        ma: `QD-PASS-${suffix}`,
        trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        grade: null,
      },
      {
        ma: `QD-FAIL-${suffix}`,
        trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        grade: null,
      },
      {
        ma: `QD-HOLD-${suffix}`,
        trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        grade: null,
      },
      {
        ma: `QD-RECALL-${suffix}`,
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        grade: 'A',
      },
      {
        ma: `QD-NEW-${suffix}`,
        trangThai: TrangThaiLoSanPham.MOI_TAO,
        grade: null,
      },
      {
        ma: `QD-BAD-IMG-${suffix}`,
        trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        grade: null,
      },
      {
        ma: `QD-CON-${suffix}`,
        trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        grade: null,
      },
    ];

    const lots = await Promise.all(
      lotData.map((item) =>
        prisma.loSanPham.create({
          data: {
            maLo: item.ma.slice(0, 100),
            thuHoachId,
            soLuong: 100,
            conLai: 100,
            phanHangChatLuong: item.grade,
            ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
            trangThai: item.trangThai,
          },
        }),
      ),
    );

    const [loPassed, loFailed, loHold, loRecall, loMoiTao, loAnhSai, loConcurrency] = lots;

    if (
      !loPassed ||
      !loFailed ||
      !loHold ||
      !loRecall ||
      !loMoiTao ||
      !loAnhSai ||
      !loConcurrency
    ) {
      throw new Error('Không tạo đủ 7 Lô phục vụ E2E Kiểm định.');
    }

    loPassedId = loPassed.id;

    loFailedId = loFailed.id;

    loHoldId = loHold.id;

    loRecallId = loRecall.id;

    loMoiTaoId = loMoiTao.id;

    loAnhSaiId = loAnhSai.id;

    loConcurrencyId = loConcurrency.id;

    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
    ]);

    const imageResponse = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .attach('tep', png, {
        filename: 'kiem-dinh.png',
        contentType: 'image/png',
      })
      .expect(201);

    tepAnhId = imageResponse.body.id as string;

    const pdfResponse = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .attach('tep', Buffer.from('%PDF-1.4\n'), {
        filename: 'khong-phai-anh.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    tepPdfId = pdfResponse.body.id as string;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const lotIds = [
        loPassedId,
        loFailedId,
        loHoldId,
        loRecallId,
        loMoiTaoId,
        loAnhSaiId,
        loConcurrencyId,
      ].filter(Boolean);

      const inspectionIds = (
        await prisma.kiemDinhChatLuong.findMany({
          where: {
            loSanPhamId: {
              in: lotIds,
            },
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id);

      if (inspectionIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            OR: [
              {
                thucThe: 'kiem_dinh_chat_luong',
                thucTheId: {
                  in: inspectionIds,
                },
              },
              {
                thucThe: 'lo_san_pham',
                thucTheId: {
                  in: lotIds,
                },
                hanhDong: 'LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG',
              },
            ],
          },
        });

        await prisma.kiemDinhChatLuong.deleteMany({
          where: {
            id: {
              in: inspectionIds,
            },
          },
        });
      }

      if (tepAnhId && nhanVienId) {
        await tepTinService.xoa(tepAnhId, nhanVienId, {
          ip: null,
          userAgent: 'AgriMarket-Quality-Cleanup',
        });
      }

      if (tepPdfId && nhanVienId) {
        await tepTinService.xoa(tepPdfId, nhanVienId, {
          ip: null,
          userAgent: 'AgriMarket-Quality-Cleanup',
        });
      }

      const fileIds = [tepAnhId, tepPdfId].filter(Boolean);

      if (fileIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'tep_tin',
            thucTheId: {
              in: fileIds,
            },
          },
        });

        await prisma.tepTin.deleteMany({
          where: {
            id: {
              in: fileIds,
            },
          },
        });
      }

      if (lotIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'lo_san_pham',
            thucTheId: {
              in: lotIds,
            },
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
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('seed đúng 2 quyền Kiểm định cho Nhân viên/Admin', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'kiem_dinh_chat_luong.',
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
      'ADMIN:kiem_dinh_chat_luong.tao',
      'ADMIN:kiem_dinh_chat_luong.xem',
      'NHAN_VIEN:kiem_dinh_chat_luong.tao',
      'NHAN_VIEN:kiem_dinh_chat_luong.xem',
    ]);
  });

  it('KHACH_HANG không quản trị kiểm định -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/kiem-dinh-chat-luong')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('không có API sửa/xóa lịch sử kiểm định', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/kiem-dinh-chat-luong/00000000-0000-7000-8000-000000000001')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ketQua: 'PASSED',
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete('/api/v1/kiem-dinh-chat-luong/00000000-0000-7000-8000-000000000001')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(404);
  });

  it('PASSED bắt buộc có phân hạng -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loPassedId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'PASSED',
      })
      .expect(400);
  });

  it('Lô MOI_TAO chưa gửi kiểm định -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loMoiTaoId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'FAILED',
        ghiChu: 'Không được kiểm định khi chưa gửi.',
      })
      .expect(400);
  });

  it('không cho gắn PDF làm ảnh kiểm định -> 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loAnhSaiId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'FAILED',
        tepTinIds: [tepPdfId],
      })
      .expect(400);
  });

  it('PASSED -> CO_THE_BAN, lưu inspector, grade và signed image', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loPassedId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Quality-PASS-E2E')
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'PASSED',
        phanHang: 'Hạng A',
        ghiChu: 'Đạt yêu cầu chất lượng.',
        tepTinIds: [tepAnhId],
      })
      .expect(201);

    kiemDinhPassedId = response.body.id as string;

    expect(response.body.nguoiKiemDinh.id).toBe(nhanVienId);

    expect(response.body.ketQua).toBe('PASSED');

    expect(response.body.phanHang).toBe('Hạng A');

    expect(response.body.anh).toHaveLength(1);

    expect(response.body.anh[0].url).toEqual(expect.any(String));

    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loPassedId,
      },
    });

    expect(lot.trangThai).toBe(TrangThaiLoSanPham.CO_THE_BAN);

    expect(lot.phanHangChatLuong).toBe('Hạng A');
  });

  it('FAILED -> KHONG_DAT và không được bán', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loFailedId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'FAILED',
        ghiChu: 'Không đạt chất lượng.',
      })
      .expect(201);

    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loFailedId,
      },
    });

    expect(lot.trangThai).toBe(TrangThaiLoSanPham.KHONG_DAT);

    expect(lot.trangThai).not.toBe(TrangThaiLoSanPham.CO_THE_BAN);
  });

  it('HOLD -> TAM_GIU, sau đó có thể kiểm định lại PASSED', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loHoldId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-28',
        ketQua: 'HOLD',
        ghiChu: 'Tạm giữ để kiểm tra lại.',
      })
      .expect(201);

    const holdLot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loHoldId,
      },
    });

    expect(holdLot.trangThai).toBe(TrangThaiLoSanPham.TAM_GIU);

    expect(holdLot.trangThai).not.toBe(TrangThaiLoSanPham.CO_THE_BAN);

    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loHoldId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'PASSED',
        phanHang: 'Hạng B',
        ghiChu: 'Kiểm định lại đạt.',
      })
      .expect(201);

    const after = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loHoldId,
      },
    });

    expect(after.trangThai).toBe(TrangThaiLoSanPham.CO_THE_BAN);

    const history = await prisma.kiemDinhChatLuong.count({
      where: {
        loSanPhamId: loHoldId,
      },
    });

    expect(history).toBe(2);
  });

  it('NHAN_VIEN có quality.tao nhưng không có quyền Thu hồi -> 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loRecallId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'RECALLED',
        ghiChu: 'Nhân viên không được tự thu hồi.',
      })
      .expect(403);
  });

  it('RECALLED từ CO_THE_BAN -> THU_HOI và không được bán', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loRecallId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'RECALLED',
        ghiChu: 'Thu hồi sau kiểm tra chất lượng.',
      })
      .expect(201);

    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loRecallId,
      },
    });

    expect(lot.trangThai).toBe(TrangThaiLoSanPham.THU_HOI);

    expect(lot.trangThai).not.toBe(TrangThaiLoSanPham.CO_THE_BAN);

    const recall = await prisma.thuHoiLoSanPham.findUnique({
      where: {
        loSanPhamId: loRecallId,
      },
    });

    if (!recall) {
      throw new Error('Thu hồi từ kiểm định phải tạo recall ledger.');
    }

    expect(recall.lyDo).toBe('Thu hồi sau kiểm tra chất lượng.');
    expect(recall.nguoiThuHoiId).toBe(adminId);
  });

  it('FOR UPDATE ngăn hai kết quả đồng thời cùng chốt một Lô', async () => {
    const pass = request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loConcurrencyId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'PASSED',
        phanHang: 'Hạng C',
      });

    const fail = request(app.getHttpServer())
      .post(`/api/v1/kiem-dinh-chat-luong/lo/${loConcurrencyId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ngayKiemDinh: '2026-08-29',
        ketQua: 'FAILED',
      });

    const [one, two] = await Promise.all([pass, fail]);

    expect([one.status, two.status].sort()).toEqual([201, 400]);

    const count = await prisma.kiemDinhChatLuong.count({
      where: {
        loSanPhamId: loConcurrencyId,
      },
    });

    expect(count).toBe(1);
  });

  it('search + result filter trả đúng lịch sử kiểm định', async () => {
    const lot = await prisma.loSanPham.findUniqueOrThrow({
      where: {
        id: loPassedId,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/kiem-dinh-chat-luong')
      .query({
        timKiem: lot.maLo,
        loSanPhamId: loPassedId,
        ketQua: 'PASSED',
        trang: 1,
        gioiHan: 10,
      })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.tong).toBe(1);

    expect(response.body.duLieu[0].id).toBe(kiemDinhPassedId);
  });

  it('Audit ghi cả kiểm định và transition chất lượng của Lô', async () => {
    const logs = await prisma.nhatKyKiemToan.findMany({
      where: {
        OR: [
          {
            thucThe: 'kiem_dinh_chat_luong',
            thucTheId: kiemDinhPassedId,
          },
          {
            thucThe: 'lo_san_pham',
            thucTheId: loPassedId,
            hanhDong: 'LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG',
          },
        ],
      },
    });

    expect(logs.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining(['KIEM_DINH_CHAT_LUONG_TAO', 'LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG']),
    );

    const qualityLog = logs.find((item) => item.hanhDong === 'LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG');

    expect(qualityLog?.tacNhanId).toBe(nhanVienId);

    expect(qualityLog?.sau).toEqual(
      expect.objectContaining({
        trangThai: 'CO_THE_BAN',
        phanHangChatLuong: 'Hạng A',
      }),
    );
  });

  it('enum kết quả giữ đúng rule master plan', () => {
    expect(Object.values(KetQuaKiemDinhChatLuong).sort()).toEqual([
      'FAILED',
      'HOLD',
      'PASSED',
      'RECALLED',
    ]);
  });
});
