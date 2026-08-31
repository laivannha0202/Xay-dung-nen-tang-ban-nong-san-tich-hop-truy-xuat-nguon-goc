import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  KetQuaKiemDinhChatLuong,
  LoaiSuKienCanhTac,
  LoaiSuKienTruyXuat,
  TrangThaiLoSanPham,
  TrangThaiMuaVu,
  TrangThaiXacMinhChungNhan,
} from '../src/generated/prisma/client';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;

const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

describe('API truy xuất công khai (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const traceCode = 'AGM-0123456789ABCDEF0123456789ABCDEF';

  const maLo = `PUBLIC-TRACE-${suffix}`.slice(0, 100);

  let nguoiKiemDinhId = '';

  let nhanVienId = '';

  let nhaCungCapId = '';

  let trangTraiId = '';

  let muaVuId = '';

  let thuHoachId = '';

  let loSanPhamId = '';

  const tepTinIds: string[] = [];

  const chungNhanIds: string[] = [];

  const nhatKyIds: string[] = [];

  const kiemDinhIds: string[] = [];

  const suKienIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    cauHinhUngDung(app);

    await app.init();

    prisma = app.get(PrismaService);

    const inspector = await prisma.nguoiDung.create({
      data: {
        email: `internal-inspector-${suffix}@example.com`,
        matKhauHash: 'PRIVATE_PASSWORD_HASH_DO_NOT_LEAK',
        hoTen: 'Nhân viên nội bộ bí mật',
      },
    });

    nguoiKiemDinhId = inspector.id;

    const nhanVien = await prisma.nhanVien.create({
      data: {
        nguoiDungId: inspector.id,
        maNhanVien: `NV-PRIVATE-${suffix}`.slice(0, 50),
        chucDanh: 'Kiểm định viên nội bộ',
      },
    });

    nhanVienId = nhanVien.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-PUBLIC-${suffix}`.slice(0, 50),
        ten: 'Nhà cung cấp không công khai',
        nguoiDaiDien: 'Người đại diện nội bộ',
        soDienThoai: '0900000000',
        email: `supplier-private-${suffix}@example.com`,
        diaChi: 'Địa chỉ supplier private',
        ghiChu: 'Ghi chú riêng supplier tuyệt đối không lộ',
      },
    });

    nhaCungCapId = supplier.id;

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-PUBLIC-${suffix}`.slice(0, 50),
        ten: 'Trang trại Minh Bạch',
        diaChi: 'Đà Lạt, Lâm Đồng',
        viDo: 11.940419,
        kinhDo: 108.458313,
        dienTichHa: 12.5,
        nhaCungCapId,
      },
    });

    trangTraiId = farm.id;

    const tepTinVerified = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket',
        objectKey: `private/cert-${suffix}.pdf`,
        tenGoc: 'chung-nhan-private.pdf',
        mimeType: 'application/pdf',
        kichThuoc: BigInt(1234),
        sha256: 'a'.repeat(64),
        nguoiTaiLenId: inspector.id,
        nguoiTaiLen: inspector.email,
      },
    });

    tepTinIds.push(tepTinVerified.id);

    const tepTinRejected = await prisma.tepTin.create({
      data: {
        bucket: 'agrimarket',
        objectKey: `private/rejected-${suffix}.pdf`,
        tenGoc: 'rejected-private.pdf',
        mimeType: 'application/pdf',
        kichThuoc: BigInt(5678),
        sha256: 'b'.repeat(64),
        nguoiTaiLenId: inspector.id,
        nguoiTaiLen: inspector.email,
      },
    });

    tepTinIds.push(tepTinRejected.id);

    const certVerified = await prisma.chungNhan.create({
      data: {
        trangTraiId,
        loai: 'VietGAP',
        ma: `VG-${suffix}`.slice(0, 100),
        donViCap: 'Đơn vị chứng nhận',
        ngayCap: new Date('2026-01-10T00:00:00.000Z'),
        ngayHetHan: new Date('2027-01-10T00:00:00.000Z'),
        tepTinId: tepTinVerified.id,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
        xacMinhLuc: new Date('2026-01-11T00:00:00.000Z'),
      },
    });

    chungNhanIds.push(certVerified.id);

    const certRejected = await prisma.chungNhan.create({
      data: {
        trangTraiId,
        loai: 'GLOBALGAP-PRIVATE',
        ma: `REJECTED-${suffix}`.slice(0, 100),
        donViCap: 'Đơn vị private',
        ngayCap: new Date('2026-01-01T00:00:00.000Z'),
        ngayHetHan: new Date('2027-01-01T00:00:00.000Z'),
        tepTinId: tepTinRejected.id,
        trangThaiXacMinh: TrangThaiXacMinhChungNhan.TU_CHOI,
        lyDoTuChoi: 'Ghi chú riêng chứng nhận bị từ chối',
      },
    });

    chungNhanIds.push(certRejected.id);

    const season = await prisma.muaVu.create({
      data: {
        trangTraiId,
        cayTrong: 'Cà chua',
        giong: 'Cà chua bi',
        ngayTrong: new Date('2026-01-01T00:00:00.000Z'),
        ngayDuKienThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        sanLuongDuKienKg: 9999,
        trangThai: TrangThaiMuaVu.CHO_THU_HOACH,
      },
    });

    muaVuId = season.id;

    const publicJournal = await prisma.nhatKyCanhTac.create({
      data: {
        muaVuId,
        loaiSuKien: LoaiSuKienCanhTac.TUOI,
        thoiGian: new Date('2026-08-10T08:00:00.000Z'),
        noiDung: 'Tưới nhỏ giọt tiết kiệm nước',
        hienThiCongKhai: true,
      },
    });

    nhatKyIds.push(publicJournal.id);

    const privateJournal = await prisma.nhatKyCanhTac.create({
      data: {
        muaVuId,
        loaiSuKien: LoaiSuKienCanhTac.KHAC,
        thoiGian: new Date('2026-08-11T08:00:00.000Z'),
        noiDung: 'Ghi chú riêng canh tác INTERNAL_ONLY',
        hienThiCongKhai: false,
      },
    });

    nhatKyIds.push(privateJournal.id);

    const harvest = await prisma.thuHoach.create({
      data: {
        muaVuId,
        ngayThuHoach: new Date('2026-08-20T00:00:00.000Z'),
        soLuong: 2500,
        donVi: 'KG',
        phanLoai: 'Loại A',
        ghiChu: 'Ghi chú riêng thu hoạch không được public',
      },
    });

    thuHoachId = harvest.id;

    const lot = await prisma.loSanPham.create({
      data: {
        maLo,
        thuHoachId,
        soLuong: 1000,
        conLai: 850,
        phanHangChatLuong: 'Hạng A',
        ngayHetHan: new Date('2026-09-30T00:00:00.000Z'),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        maTruyXuat: traceCode,
      },
    });

    loSanPhamId = lot.id;

    const quality = await prisma.kiemDinhChatLuong.create({
      data: {
        loSanPhamId,
        ngayKiemDinh: new Date('2026-08-21T00:00:00.000Z'),
        nguoiKiemDinhId: inspector.id,
        ketQua: KetQuaKiemDinhChatLuong.PASSED,
        phanHang: 'Hạng A',
        ghiChu: 'Ghi chú riêng kiểm định INTERNAL_QA',
      },
    });

    kiemDinhIds.push(quality.id);

    const publicEvent = await prisma.suKienTruyXuat.create({
      data: {
        loSanPhamId,
        loai: LoaiSuKienTruyXuat.DONG_GOI,
        thoiGian: new Date('2026-08-22T07:30:00.000Z'),
        diaDiem: 'Nhà đóng gói công khai',
        metadata: {
          quyCach: 'Thùng 10kg',
          cost: 'PUBLIC_EVENT_COST_SECRET_027',
          nhanVienNoiBo: 'INTERNAL_EMPLOYEE_SECRET',
          privateDocument: 's3://private/document.pdf',
        },
        congKhai: true,
      },
    });

    suKienIds.push(publicEvent.id);

    const publicDelivery = await prisma.suKienTruyXuat.create({
      data: {
        loSanPhamId,
        loai: LoaiSuKienTruyXuat.GIAO_HANG,
        thoiGian: new Date('2026-08-25T10:00:00.000Z'),
        diaDiem: 'Điểm giao nhận công khai',
        congKhai: true,
      },
    });

    suKienIds.push(publicDelivery.id);

    const privateEvent = await prisma.suKienTruyXuat.create({
      data: {
        loSanPhamId,
        loai: LoaiSuKienTruyXuat.NHAP_KHO,
        thoiGian: new Date('2026-08-23T08:00:00.000Z'),
        diaDiem: 'KHO-NOI-BO-SECRET',
        metadata: {
          cost: 'PRIVATE_EVENT_COST_SECRET_027',
          note: 'Ghi chú riêng kho',
        },
        congKhai: false,
      },
    });

    suKienIds.push(privateEvent.id);
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    const start = Date.now();

    const log = (text: string) => {
      console.log(`[PUBLIC TRACE E2E cleanup +${Date.now() - start}ms] ${text}`);
    };

    log('Bắt đầu cleanup.');

    if (prisma) {
      if (suKienIds.length) {
        await prisma.suKienTruyXuat.deleteMany({
          where: {
            id: {
              in: suKienIds,
            },
          },
        });
      }

      if (kiemDinhIds.length) {
        await prisma.kiemDinhChatLuong.deleteMany({
          where: {
            id: {
              in: kiemDinhIds,
            },
          },
        });
      }

      if (loSanPhamId) {
        await prisma.loSanPham.deleteMany({
          where: {
            id: loSanPhamId,
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

      if (nhatKyIds.length) {
        await prisma.nhatKyCanhTac.deleteMany({
          where: {
            id: {
              in: nhatKyIds,
            },
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

      if (chungNhanIds.length) {
        await prisma.chungNhan.deleteMany({
          where: {
            id: {
              in: chungNhanIds,
            },
          },
        });
      }

      if (tepTinIds.length) {
        await prisma.tepTin.deleteMany({
          where: {
            id: {
              in: tepTinIds,
            },
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

      if (nhanVienId) {
        await prisma.nhanVien.deleteMany({
          where: {
            id: nhanVienId,
          },
        });
      }

      if (nguoiKiemDinhId) {
        await prisma.nguoiDung.deleteMany({
          where: {
            id: nguoiKiemDinhId,
          },
        });
      }

      log('Cleanup dữ liệu MySQL hoàn tất.');
    }

    if (app) {
      const httpServer = app.getHttpServer() as {
        closeIdleConnections?: () => void;
        closeAllConnections?: () => void;
      };

      httpServer.closeIdleConnections?.();

      httpServer.closeAllConnections?.();

      log('Đã đóng HTTP idle/all connections.');

      await app.close();

      log('app.close() hoàn tất.');
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  it('GET public trace không cần Authorization -> 200', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    expect(response.body.maTruyXuat).toBe(traceCode);
  });

  it('trace code lowercase được normalize về stable code uppercase', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode.toLowerCase()}`)
      .expect(200);

    expect(response.body.maTruyXuat).toBe(traceCode);
  });

  it('mã sai format, mã không tồn tại và maLo đều -> 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/truy-xuat/INVALID').expect(404);

    await request(app.getHttpServer())
      .get('/api/v1/truy-xuat/AGM-FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
      .expect(404);

    await request(app.getHttpServer()).get(`/api/v1/truy-xuat/${maLo}`).expect(404);
  });

  it('response dùng exact public whitelist, không lộ internal id/quantity/GPS', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    const body = response.body;

    expect(Object.keys(body).sort()).toEqual(
      [
        'chungNhan',
        'kiemDinh',
        'lo',
        'maTruyXuat',
        'muaVu',
        'nhatKyCanhTac',
        'suKien',
        'thuHoach',
        'trangTrai',
      ].sort(),
    );

    expect(Object.keys(body.lo).sort()).toEqual(
      ['maLo', 'maTruyXuat', 'ngayHetHan', 'phanHangChatLuong', 'trangThai'].sort(),
    );

    expect(Object.keys(body.trangTrai).sort()).toEqual(['diaChi', 'ten'].sort());

    expect(Object.keys(body.muaVu).sort()).toEqual(['cayTrong', 'giong', 'ngayTrong'].sort());

    expect(Object.keys(body.thuHoach).sort()).toEqual(['ngayThuHoach', 'phanLoai'].sort());

    expect(body.lo.trangThai).toBe('CO_THE_BAN');

    expect(body.lo.phanHangChatLuong).toBe('Hạng A');
  });

  it('chỉ public cultivation journal được trả', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    expect(response.body.nhatKyCanhTac).toHaveLength(1);

    expect(response.body.nhatKyCanhTac[0]).toEqual({
      loaiSuKien: 'TUOI',
      thoiGian: '2026-08-10T08:00:00.000Z',
      noiDung: 'Tưới nhỏ giọt tiết kiệm nước',
    });
  });

  it('chỉ chứng nhận DA_XAC_MINH và không lộ file private', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    expect(response.body.chungNhan).toHaveLength(1);

    expect(response.body.chungNhan[0].loai).toBe('VietGAP');

    expect(Object.keys(response.body.chungNhan[0]).sort()).toEqual(
      ['donViCap', 'loai', 'ma', 'ngayCap', 'ngayHetHan'].sort(),
    );
  });

  it('kiểm định public không lộ nhân viên/ghi chú/ảnh', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    expect(response.body.kiemDinh).toHaveLength(1);

    expect(response.body.kiemDinh[0]).toEqual({
      ngayKiemDinh: '2026-08-21',
      ketQua: 'PASSED',
      phanHang: 'Hạng A',
    });
  });

  it('chỉ Trace Event congKhai=true và public response không trả metadata', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    expect(response.body.suKien).toEqual([
      {
        loai: 'DONG_GOI',
        thoiGian: '2026-08-22T07:30:00.000Z',
        diaDiem: 'Nhà đóng gói công khai',
      },
      {
        loai: 'GIAO_HANG',
        thoiGian: '2026-08-25T10:00:00.000Z',
        diaDiem: 'Điểm giao nhận công khai',
      },
    ]);

    for (const event of response.body.suKien) {
      expect(Object.keys(event).sort()).toEqual(['diaDiem', 'loai', 'thoiGian'].sort());
    }
  });

  it('serialized public response không chứa dữ liệu nhạy cảm đã seed', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/truy-xuat/${traceCode}`)
      .expect(200);

    const serialized = JSON.stringify(response.body);

    const forbiddenValues = [
      'PUBLIC_EVENT_COST_SECRET_027',
      'PRIVATE_EVENT_COST_SECRET_027',
      'INTERNAL_EMPLOYEE_SECRET',
      'KHO-NOI-BO-SECRET',
      'INTERNAL_ONLY',
      'INTERNAL_QA',
      'Nhân viên nội bộ bí mật',
      'Kiểm định viên nội bộ',
      'supplier-private-',
      'Ghi chú riêng',
      'private/cert-',
      'private/rejected-',
      'chung-nhan-private.pdf',
      'rejected-private.pdf',
      'PRIVATE_PASSWORD_HASH_DO_NOT_LEAK',
      'GLOBALGAP-PRIVATE',
    ];

    for (const forbidden of forbiddenValues) {
      expect(serialized).not.toContain(forbidden);
    }

    const forbiddenKeys = [
      '"metadata"',
      '"tepTinId"',
      '"objectKey"',
      '"nguoiKiemDinhId"',
      '"nguoiKiemDinh"',
      '"ghiChu"',
      '"soLuong"',
      '"conLai"',
      '"sanLuongDuKienKg"',
      '"viDo"',
      '"kinhDo"',
      '"dienTichHa"',
      '"nhaCungCapId"',
      '"id"',
    ];

    for (const forbidden of forbiddenKeys) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
