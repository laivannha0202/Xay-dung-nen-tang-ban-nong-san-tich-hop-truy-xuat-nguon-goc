import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Job, Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiXacMinhChungNhan } from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { HangDoiService } from '../src/modules/hang-doi/hang-doi.service';

const THOI_GIAN_CHO_E2E_MS = 45_000;

const PDF_THU = Buffer.from(
  '%PDF-1.4\n' + '1 0 obj\n' + '<< /Type /Catalog >>\n' + 'endobj\n' + '%%EOF\n',
  'utf8',
);

async function choJobHoanThanh(queue: Queue, jobId: string): Promise<Job> {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const state = await queue.getJobState(jobId);

    if (state === 'completed') {
      const completed = await queue.getJob(jobId);

      if (!completed) {
        throw new Error(`Job ${jobId} completed nhưng không fetch lại được.`);
      }

      if (!completed.finishedOn) {
        throw new Error(`Job ${jobId} completed nhưng thiếu finishedOn.`);
      }

      return completed;
    }

    if (state === 'failed') {
      const failed = await queue.getJob(jobId);

      throw new Error(`Job ${jobId} failed: ` + `${failed?.failedReason ?? 'unknown'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Job ${jobId} chưa hoàn thành sau 15s.`);
}

describe('Chứng nhận (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hangDoiService: HangDoiService;
  let heThongQueue: Queue;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const matKhau = 'MatKhau-Cert-019';
  const emailKhach = `cert-khach-${suffix}@example.com`;
  const emailNhanVien = `cert-nv-${suffix}@example.com`;
  const emailAdmin = `cert-admin-${suffix}@example.com`;

  let khachId = '';
  let nhanVienId = '';
  let adminId = '';
  let tokenKhach = '';
  let tokenNhanVien = '';
  let tokenAdmin = '';
  let nhaCungCapId = '';
  let trangTraiId = '';
  let tepTinId = '';
  let chungNhanId = '';

  const chungNhanJobIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    hangDoiService = app.get(HangDoiService);
    heThongQueue = app.get(getQueueToken(TEN_HANG_DOI.HE_THONG));

    for (const email of [emailKhach, emailNhanVien, emailAdmin]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({
          email,
          matKhau,
          hoTen: 'Certificate E2E PHIEN 019',
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
        ma: `NCC-CERT-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp Cert E2E',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-CERT-${suffix}`.slice(0, 50),
        ten: 'Trang trại Cert E2E',
        diaChi: 'Đà Lạt, Lâm Đồng',
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      const allCerts = await prisma.chungNhan.findMany({
        where: {
          trangTraiId,
        },
        select: {
          id: true,
        },
      });

      const certIds = allCerts.map((item) => item.id);

      if (certIds.length) {
        await prisma.nhatKyKiemToan.deleteMany({
          where: {
            thucThe: 'chung_nhan',
            thucTheId: {
              in: certIds,
            },
          },
        });

        await prisma.chungNhan.deleteMany({
          where: {
            id: {
              in: certIds,
            },
          },
        });
      }

      if (tepTinId && tokenNhanVien) {
        await request(app.getHttpServer())
          .delete(`/api/v1/tep-tin/${tepTinId}`)
          .set('Authorization', `Bearer ${tokenNhanVien}`)
          .expect(200);

        await prisma.tepTin.deleteMany({
          where: {
            id: tepTinId,
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

    for (const jobId of chungNhanJobIds) {
      const job = await heThongQueue?.getJob(jobId);
      await job?.remove();
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('seed permission đúng least privilege', async () => {
    const mappings = await prisma.vaiTroQuyen.findMany({
      where: {
        quyen: {
          ma: {
            startsWith: 'chung_nhan.',
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
      'ADMIN:chung_nhan.sua',
      'ADMIN:chung_nhan.tao',
      'ADMIN:chung_nhan.xac_minh',
      'ADMIN:chung_nhan.xem',
      'NHAN_VIEN:chung_nhan.sua',
      'NHAN_VIEN:chung_nhan.tao',
      'NHAN_VIEN:chung_nhan.xem',
    ]);
  });

  it('KHACH_HANG không quản trị chứng nhận -> 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/chung-nhan')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(403);
  });

  it('NHAN_VIEN upload PDF thật và tạo chứng nhận', async () => {
    const upload = await request(app.getHttpServer())
      .post('/api/v1/tep-tin/tai-len')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .attach('tep', PDF_THU, {
        filename: 'vietgap-phien019.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    tepTinId = upload.body.id as string;

    const create = await request(app.getHttpServer())
      .post('/api/v1/chung-nhan')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .set('User-Agent', 'AgriMarket-Cert-E2E')
      .send({
        trangTraiId,
        loai: 'VietGAP',
        ma: `CERT-${suffix}`.slice(0, 100),
        donViCap: 'Trung tâm Chứng nhận E2E',
        ngayCap: '2026-01-15',
        ngayHetHan: '2027-01-15',
        tepTinId,
      })
      .expect(201);

    chungNhanId = create.body.id as string;

    expect(create.body.trangThaiXacMinh).toBe('CHO_XAC_MINH');
    expect(create.body.tepTin.mimeType).toBe('application/pdf');
    expect(create.body.tepTin.url).toContain('X-Amz-Signature=');

    const fileResponse = await fetch(create.body.tepTin.url as string);

    expect(fileResponse.status).toBe(200);
    expect(Buffer.from(await fileResponse.arrayBuffer())).toEqual(PDF_THU);
  });

  it('ngày hết hạn không sau ngày cấp -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/chung-nhan')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId,
        loai: 'GlobalGAP',
        ma: `BAD-DATE-${suffix}`.slice(0, 100),
        donViCap: 'Đơn vị thử',
        ngayCap: '2026-05-01',
        ngayHetHan: '2026-05-01',
        tepTinId,
      })
      .expect(400);
  });

  it('trùng mã -> 409', async () => {
    const existing = await prisma.chungNhan.findUniqueOrThrow({
      where: {
        id: chungNhanId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/chung-nhan')
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangTraiId,
        loai: 'VietGAP',
        ma: existing.ma,
        donViCap: 'Đơn vị khác',
        ngayCap: '2026-01-01',
        ngayHetHan: '2027-01-01',
        tepTinId,
      })
      .expect(409);
  });

  it('NHAN_VIEN sửa được nhưng không xác minh được', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/chung-nhan/${chungNhanId}`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        donViCap: 'Trung tâm Chứng nhận E2E - cập nhật',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.trangThaiXacMinh).toBe('CHO_XAC_MINH');
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/chung-nhan/${chungNhanId}/xac-minh`)
      .set('Authorization', `Bearer ${tokenNhanVien}`)
      .send({
        trangThaiXacMinh: 'DA_XAC_MINH',
      })
      .expect(403);
  });

  it('ADMIN xác minh và Audit được ghi', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/chung-nhan/${chungNhanId}/xac-minh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('User-Agent', 'AgriMarket-Cert-Admin-E2E')
      .send({
        trangThaiXacMinh: 'DA_XAC_MINH',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.trangThaiXacMinh).toBe('DA_XAC_MINH');
        expect(body.xacMinhLuc).toEqual(expect.any(String));
      });

    const audit = await prisma.nhatKyKiemToan.findFirstOrThrow({
      where: {
        thucThe: 'chung_nhan',
        thucTheId: chungNhanId,
        hanhDong: 'CHUNG_NHAN_XAC_MINH',
      },
    });

    expect(audit.tacNhanId).toBe(adminId);
    expect(audit.metadata).toEqual(
      expect.objectContaining({
        userAgent: 'AgriMarket-Cert-Admin-E2E',
      }),
    );
  });

  it('job cảnh báo 30 ngày / 7 ngày / hết hạn và idempotent', async () => {
    const base = {
      trangTraiId,
      loai: 'Chứng nhận Job E2E',
      donViCap: 'Đơn vị Job E2E',
      ngayCap: new Date('2025-01-01T00:00:00.000Z'),
      tepTinId,
      trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
      xacMinhLuc: new Date(),
    };

    const rows = await Promise.all([
      prisma.chungNhan.create({
        data: {
          ...base,
          ma: `JOB30-${suffix}`.slice(0, 100),
          ngayHetHan: new Date('2026-09-18T00:00:00.000Z'),
        },
      }),
      prisma.chungNhan.create({
        data: {
          ...base,
          ma: `JOB7-${suffix}`.slice(0, 100),
          ngayHetHan: new Date('2026-09-03T00:00:00.000Z'),
        },
      }),
      prisma.chungNhan.create({
        data: {
          ...base,
          ma: `JOB0-${suffix}`.slice(0, 100),
          ngayHetHan: new Date('2026-08-28T00:00:00.000Z'),
        },
      }),
    ]);

    const jobId = await hangDoiService.themCanhBaoChungNhan({
      ngayThamChieu: '2026-08-29',
    });

    chungNhanJobIds.push(jobId);

    const job = await choJobHoanThanh(heThongQueue, jobId);

    expect(job.returnvalue).toEqual({
      canhBao30Ngay: 1,
      canhBao7Ngay: 1,
      hetHan: 1,
      ngayThamChieu: '2026-08-29',
    });

    const refreshed = await prisma.chungNhan.findMany({
      where: {
        id: {
          in: rows.map((item) => item.id),
        },
      },
    });

    expect(refreshed.find((item) => item.ma.startsWith('JOB30-'))?.canhBao30NgayLuc).not.toBeNull();

    expect(refreshed.find((item) => item.ma.startsWith('JOB7-'))?.canhBao7NgayLuc).not.toBeNull();

    expect(refreshed.find((item) => item.ma.startsWith('JOB0-'))?.canhBaoHetHanLuc).not.toBeNull();

    const jobLan2 = await hangDoiService.themCanhBaoChungNhan({
      ngayThamChieu: '2026-08-29',
    });

    chungNhanJobIds.push(jobLan2);

    const second = await choJobHoanThanh(heThongQueue, jobLan2);

    expect(second.returnvalue).toEqual({
      canhBao30Ngay: 0,
      canhBao7Ngay: 0,
      hetHan: 0,
      ngayThamChieu: '2026-08-29',
    });

    const auditHeThong = await prisma.nhatKyKiemToan.findMany({
      where: {
        thucThe: 'chung_nhan',
        thucTheId: {
          in: rows.map((item) => item.id),
        },
        tacNhan: 'HE_THONG',
      },
    });

    expect(auditHeThong.map((item) => item.hanhDong)).toEqual(
      expect.arrayContaining([
        'CHUNG_NHAN_CANH_BAO_30_NGAY',
        'CHUNG_NHAN_CANH_BAO_7_NGAY',
        'CHUNG_NHAN_CANH_BAO_HET_HAN',
      ]),
    );
  });

  it('Admin từ chối phải có lý do', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/chung-nhan/${chungNhanId}/xac-minh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThaiXacMinh: 'TU_CHOI',
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/chung-nhan/${chungNhanId}/xac-minh`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        trangThaiXacMinh: 'TU_CHOI',
        lyDoTuChoi: 'File chưa rõ dấu xác nhận.',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.trangThaiXacMinh).toBe('TU_CHOI');
        expect(body.lyDoTuChoi).toContain('chưa rõ');
      });
  });
});
