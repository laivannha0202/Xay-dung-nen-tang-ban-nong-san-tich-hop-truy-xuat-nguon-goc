/**
 * AGRIMARKET-DELIVERY-FAILURE: lý do giao thất bại có cấu trúc (e2e, TEST_DATABASE_URL).
 *
 * Luồng nghiệp vụ được chứng minh:
 *   OUT_FOR_DELIVERY --FAILED + KHONG_LIEN_LAC_DUOC--> FAILED (hàng CHƯA về kho)
 *   FAILED           --RETURNED--------------------->  RETURN_IN + blocked (cách ly)
 *
 * Ràng buộc quan trọng: "không liên lạc được / khách không nghe máy" KHÔNG được
 * tự động hoàn hàng. Chỉ khi operator xác nhận RETURNED mới nhập hàng hoàn cách ly.
 */

import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  LyDoGiaoThatBai,
  TrangThaiBanGhi,
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiLoSanPham,
  TrangThaiVanChuyen,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { taoDonDepFixture } from './test-database';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

function ngayTuHomNay(offset: number): Date {
  const bayGio = new Date();
  return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate() + offset));
}

type TonKhoSnapshot = { onHand: number; reserved: number; blocked: number; available: number };

async function docTonKho(prisma: PrismaService, id: string): Promise<TonKhoSnapshot> {
  const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id } });
  const onHand = Number(lot.onHand);
  const reserved = Number(lot.reserved);
  const blocked = Number(lot.blocked);
  return {
    onHand,
    reserved,
    blocked,
    available: Number((onHand - reserved - blocked).toFixed(3)),
  };
}

describe('Delivery failure reason (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let donDep: ReturnType<typeof taoDonDepFixture>;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-GiaoThatBai-039';
  const emailAdmin = `giao-that-bai-admin-${suffix}@example.com`;
  const emailKhach = `giao-that-bai-kh-${suffix}@example.com`;
  const emailKhachKhac = `giao-that-bai-kh2-${suffix}@example.com`;

  let tokenAdmin = '';
  let tokenKhach = '';
  let tokenKhachKhac = '';

  const ids = {
    nhaCungCap: '',
    trangTrai: '',
    danhMuc: '',
    sanPham: '',
    bienThe: '',
    lo: '',
    kho: '',
    donHang: '',
    donNhaCungCap: '',
    mucDonHang: '',
    lot: '',
  };

  let vanChuyenId = '';
  let maVanDon = '';

  function capNhat(token: string, shipmentId: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .patch(`/api/v1/quan-tri/giao-hang/${shipmentId}/trang-thai`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    donDep = taoDonDepFixture(prisma);

    for (const email of [emailAdmin, emailKhach, emailKhachKhac]) {
      await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-ky')
        .send({ email, matKhau, hoTen: 'Delivery failure E2E' })
        .expect(201);
    }

    const admin = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } });
    donDep.theoNguoiDung(admin.id);
    const roleAdmin = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });

    const dangNhap = async (email: string): Promise<string> => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/xac-thuc/dang-nhap')
        .send({ email, matKhau, nenTang: 'WEB' })
        .expect(200);
      return res.body.accessToken as string;
    };
    [tokenAdmin, tokenKhach, tokenKhachKhac] = await Promise.all([
      dangNhap(emailAdmin),
      dangNhap(emailKhach),
      dangNhap(emailKhachKhac),
    ]);

    const ncc = await prisma.nhaCungCap.create({
      data: { ma: `NCC-DL-FAIL-${suffix}`.slice(0, 50), ten: 'NCC delivery failure E2E' },
    });
    ids.nhaCungCap = ncc.id;
    donDep.theoNhaCungCap(ncc.id);

    const farm = await prisma.trangTrai.create({
      data: {
        ma: `FARM-DL-FAIL-${suffix}`.slice(0, 50),
        ten: 'Trang trại delivery failure E2E',
        diaChi: 'Hưng Yên',
        nhaCungCapId: ncc.id,
      },
    });
    ids.trangTrai = farm.id;
    donDep.theoTrangTrai(farm.id);

    const danhMuc = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục delivery failure ${suffix}`,
        slug: `delivery-failure-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 191),
      },
    });
    ids.danhMuc = danhMuc.id;
    donDep.theoDanhMuc(danhMuc.id);

    const sanPham = await prisma.sanPham.create({
      data: { ten: 'Sản phẩm delivery failure E2E', trangTraiId: farm.id, danhMucSanPhamId: danhMuc.id },
    });
    ids.sanPham = sanPham.id;
    donDep.theoSanPham(sanPham.id);

    const bienThe = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: sanPham.id,
        sku: `DL-FAIL-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 25000,
        donVi: 'kg',
      },
    });
    ids.bienThe = bienThe.id;
    donDep.theoBienThe(bienThe.id);

    const muaVu = await prisma.muaVu.create({
      data: {
        trangTraiId: farm.id,
        cayTrong: 'Rau giao hàng',
        giong: 'DL-FAIL',
        ngayTrong: ngayTuHomNay(-60),
        ngayDuKienThuHoach: ngayTuHomNay(-10),
        sanLuongDuKienKg: 200,
      },
    });
    const thuHoach = await prisma.thuHoach.create({
      data: {
        muaVuId: muaVu.id,
        ngayThuHoach: ngayTuHomNay(-10),
        soLuong: 200,
        donVi: 'kg',
        phanLoai: 'Loại 1',
      },
    });
    const lo = await prisma.loSanPham.create({
      data: {
        maLo: `LO-DL-FAIL-${suffix}`.slice(0, 100),
        thuHoachId: thuHoach.id,
        soLuong: 100,
        conLai: 100,
        ngayHetHan: ngayTuHomNay(15),
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
      },
    });
    ids.lo = lo.id;
    donDep.theoLoSanPham(lo.id);

    const kho = await prisma.kho.create({
      data: { maKho: `KHO-DL-FAIL-${suffix}`.slice(0, 50), ten: 'Kho delivery failure E2E', diaChi: 'Hưng Yên' },
    });
    ids.kho = kho.id;
    donDep.theoKho(kho.id);

    const lot = await prisma.tonKhoLo.create({
      data: { khoId: kho.id, loSanPhamId: lo.id, bienTheSanPhamId: bienThe.id, onHand: 10, reserved: 0, blocked: 0 },
    });
    ids.lot = lot.id;

    // --- Đơn hàng + allocation (dùng chuỗi truy xuất nguồn gốc cùng farm) ---
    const khach = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhach } });
    donDep.theoNguoiDung(khach.id);
    const khachKhac = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailKhachKhac } });
    donDep.theoNguoiDung(khachKhac.id);
    // Đăng ký đã tự tạo KhachHang theo nguoiDungId (uk_khach_hang_nguoi_dung).
    const khachHang = await prisma.khachHang.findUniqueOrThrow({
      where: { nguoiDungId: khach.id },
    });
    donDep.theoKhachHang(khachHang.id);

    const donHang = await prisma.donHang.create({
      data: {
        maYeuCau: randomUUID(),
        maDonHang: `DLF-ORDER-${suffix}`.slice(0, 100),
        khachHangId: khachHang.id,
        trangThai: TrangThaiDonHang.DA_DONG_GOI,
        tongTien: 50000,
      },
    });
    ids.donHang = donHang.id;
    donDep.theoDonHang(donHang.id);

    const donNhaCungCap = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `DLF-SUB-${suffix}`.slice(0, 100),
        donHangId: donHang.id,
        nhaCungCapId: ncc.id,
        trangThai: TrangThaiDonHang.DA_DONG_GOI,
        tamTinh: 50000,
      },
    });
    ids.donNhaCungCap = donNhaCungCap.id;

    const muc = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: donNhaCungCap.id,
        sanPhamId: sanPham.id,
        danhMucSanPhamIdSnapshot: danhMuc.id,
        bienTheSanPhamId: bienThe.id,
        trangTraiId: farm.id,
        soLuong: 2,
        donGiaSnapshot: 25000,
        tenSanPhamSnapshot: 'Sản phẩm delivery failure E2E',
        skuBienTheSnapshot: `DL-FAIL-${suffix}`.toUpperCase(),
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: `FARM-DL-FAIL-${suffix}`.slice(0, 50),
        tenTrangTraiSnapshot: 'Trang trại delivery failure E2E',
      },
    });
    ids.mucDonHang = muc.id;

    await prisma.phanBoDonHang.create({
      data: { mucDonHangId: muc.id, tonKhoLoId: lot.id, soLuong: 2 },
    });

    // Reservation đã commit tồn (DA_BAN) — payment commit boundary.
    const reservation = await prisma.datChoTonKho.create({
      data: {
        maThamChieu: `ORDER:${donHang.maDonHang}`,
        trangThai: TrangThaiDatChoTonKho.DA_BAN,
        hetHanLuc: new Date(Date.now() + 3_600_000),
        ketThucLuc: new Date(),
      },
    });
    await prisma.mucDatChoTonKho.create({
      data: { datChoTonKhoId: reservation.id, tonKhoLoId: lot.id, soLuong: 2, thuTu: 0 },
    });
    await prisma.tonKhoLo.update({ where: { id: lot.id }, data: { reserved: 2 } });

    const shipment = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: donNhaCungCap.id,
        maVanDon: `DLF-TRACK-${suffix}`.slice(0, 191),
      },
    });
    vanChuyenId = shipment.id;
    maVanDon = shipment.maVanDon;
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      if (ids.kho) {
        await prisma.phieuKho.deleteMany({
          where: { OR: [{ khoNguonId: ids.kho }, { khoDichId: ids.kho }] },
        });
      }
      await donDep.donDep();
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
    }
  }, THOI_GIAN_DON_DEP_E2E_MS);

  async function duaVaoOutForDelivery(): Promise<void> {
    await capNhat(tokenAdmin, vanChuyenId, { trangThai: TrangThaiVanChuyen.PICKED_UP, viTri: 'Kho E2E' }).expect(200);
    await capNhat(tokenAdmin, vanChuyenId, { trangThai: TrangThaiVanChuyen.IN_TRANSIT }).expect(200);
    await capNhat(tokenAdmin, vanChuyenId, { trangThai: TrangThaiVanChuyen.OUT_FOR_DELIVERY }).expect(200);
  }

  it('OUT_FOR_DELIVERY → FAILED không có lý do bị từ chối (HTTP + service)', async () => {
    await duaVaoOutForDelivery();

    const truocKhi = await docTonKho(prisma, ids.lot);
    const soSuKienTruoc = await prisma.suKienTheoDoiVanChuyen.count({
      where: { vanChuyenId, trangThai: TrangThaiVanChuyen.FAILED },
    });

    const res = await capNhat(tokenAdmin, vanChuyenId, { trangThai: TrangThaiVanChuyen.FAILED });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.message)).toContain('lý do giao thất bại');

    const shipment = await prisma.vanChuyen.findUniqueOrThrow({ where: { id: vanChuyenId } });
    expect(shipment.trangThai).toBe(TrangThaiVanChuyen.OUT_FOR_DELIVERY);
    await expect(
      prisma.suKienTheoDoiVanChuyen.count({
        where: { vanChuyenId, trangThai: TrangThaiVanChuyen.FAILED },
      }),
    ).resolves.toBe(soSuKienTruoc);
    expect(await docTonKho(prisma, ids.lot)).toEqual(truocKhi);
  });

  it('DELIVERED kèm lý do giao thất bại bị từ chối (sai ngữ nghĩa)', async () => {
    const res = await capNhat(tokenAdmin, vanChuyenId, {
      trangThai: TrangThaiVanChuyen.DELIVERED,
      lyDoGiaoThatBai: LyDoGiaoThatBai.KHONG_LIEN_LAC_DUOC,
    });
    expect(res.status).toBe(400);

    const shipment = await prisma.vanChuyen.findUniqueOrThrow({ where: { id: vanChuyenId } });
    expect(shipment.trangThai).toBe(TrangThaiVanChuyen.OUT_FOR_DELIVERY);
  });

  it('OUT_FOR_DELIVERY → FAILED + KHONG_LIEN_LAC_DUOC được chấp nhận và persist lý do', async () => {
    const truocKhi = await docTonKho(prisma, ids.lot);

    const res = await capNhat(tokenAdmin, vanChuyenId, {
      trangThai: TrangThaiVanChuyen.FAILED,
      lyDoGiaoThatBai: LyDoGiaoThatBai.KHONG_LIEN_LAC_DUOC,
    });
    expect(res.status).toBe(200);
    expect(res.body.trangThai).toBe(TrangThaiVanChuyen.FAILED);

    const suKien = await prisma.suKienTheoDoiVanChuyen.findFirstOrThrow({
      where: { vanChuyenId, trangThai: TrangThaiVanChuyen.FAILED },
      orderBy: { createdAt: 'desc' },
    });
    expect(suKien.lyDoGiaoThatBai).toBe(LyDoGiaoThatBai.KHONG_LIEN_LAC_DUOC);
    expect(suKien.moTa).toBe('Không liên lạc được với người nhận.');
    expect(suKien.viTri).toBeNull();
    expect(suKien.thoiGian).toBeInstanceOf(Date);

    // FAILED KHÔNG tự hoàn hàng: tồn kho giữ nguyên, không có RETURN_IN.
    const shipment = await prisma.vanChuyen.findUniqueOrThrow({ where: { id: vanChuyenId } });
    expect(shipment.trangThai).toBe(TrangThaiVanChuyen.FAILED);
    expect(await docTonKho(prisma, ids.lot)).toEqual(truocKhi);
    await expect(
      prisma.giaoDichTonKho.count({
        where: { tonKhoLoId: ids.lot, loai: LoaiGiaoDichTonKho.RETURN_IN },
      }),
    ).resolves.toBe(0);
  });

  it('mô tả mặc định không suy diễn động cơ của khách', async () => {
    const suKien = await prisma.suKienTheoDoiVanChuyen.findFirstOrThrow({
      where: { vanChuyenId, trangThai: TrangThaiVanChuyen.FAILED },
      orderBy: { createdAt: 'desc' },
    });

    const moTa = suKien.moTa ?? '';
    expect(moTa).toBe('Không liên lạc được với người nhận.');
    expect(moTa).not.toMatch(/cố tình/i);
    expect(moTa).not.toMatch(/khách hàng cố/i);
  });

  it('customer tracking thấy event FAILED kèm lý do, đúng ownership', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/giao-hang/don-hang/${ids.donHang}`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .expect(200);

    expect(res.body.maDonHang).toContain('DLF-ORDER-');
    const vanChuyen = (res.body.vanChuyen as Array<{ id: string; suKien: Array<Record<string, unknown>> }>).find(
      (item) => item.id === vanChuyenId,
    );
    expect(vanChuyen).toBeDefined();

    const suKienThatBai = vanChuyen!.suKien.find((item) => item.trangThai === TrangThaiVanChuyen.FAILED);
    expect(suKienThatBai).toBeDefined();
    expect(suKienThatBai?.lyDoGiaoThatBai).toBe(LyDoGiaoThatBai.KHONG_LIEN_LAC_DUOC);
    expect(suKienThatBai?.moTa).toBe('Không liên lạc được với người nhận.');

    // Khách khác không được thấy đơn này.
    await request(app.getHttpServer())
      .get(`/api/v1/giao-hang/don-hang/${ids.donHang}`)
      .set('Authorization', `Bearer ${tokenKhachKhac}`)
      .expect(404);
  });

  it('FAILED → RETURNED chạy quarantine: onHand tăng, blocked tăng, available không tăng', async () => {
    const truocKhi = await docTonKho(prisma, ids.lot);

    const res = await capNhat(tokenAdmin, vanChuyenId, { trangThai: TrangThaiVanChuyen.RETURNED });
    expect(res.status).toBe(200);
    expect(res.body.trangThai).toBe(TrangThaiVanChuyen.RETURNED);

    const sauKhi = await docTonKho(prisma, ids.lot);
    expect(sauKhi.onHand).toBe(truocKhi.onHand + 2);
    expect(sauKhi.blocked).toBe(truocKhi.blocked + 2);
    expect(sauKhi.available).toBe(truocKhi.available);

    const ledgerHoan = await prisma.giaoDichTonKho.findFirstOrThrow({
      where: { tonKhoLoId: ids.lot, loai: LoaiGiaoDichTonKho.RETURN_IN },
      orderBy: { createdAt: 'desc' },
    });
    expect(Number(ledgerHoan.soLuong)).toBe(2);

    await expect(
      prisma.phieuKho.findFirst({ where: { maThamChieu: `RETURN:${vanChuyenId}` } }),
    ).resolves.not.toBeNull();
  });

  it('enum LyDoGiaoThatBai có KHONG_LIEN_LAC_DUOC và các lý do chuẩn', () => {
    expect(Object.values(LyDoGiaoThatBai)).toEqual(
      expect.arrayContaining([
        'KHONG_LIEN_LAC_DUOC',
        'KHACH_HEN_LAI',
        'KHACH_TU_CHOI_NHAN',
        'SAI_DIA_CHI',
        'LY_DO_KHAC',
      ]),
    );
  });

  it('shipment giữ maVanDon ổn định sau toàn bộ luồng FAILED → RETURNED', async () => {
    const shipment = await prisma.vanChuyen.findUniqueOrThrow({ where: { id: vanChuyenId } });
    expect(shipment.maVanDon).toBe(maVanDon);
    expect(shipment.trangThai).toBe(TrangThaiVanChuyen.RETURNED);
  });
});
