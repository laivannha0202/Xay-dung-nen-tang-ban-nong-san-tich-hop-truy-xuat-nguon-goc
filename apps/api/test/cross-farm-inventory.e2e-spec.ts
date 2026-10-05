/**
 * AGRIMARKET-TRACEABILITY: cross-farm inventory (e2e, true-db trên TEST_DATABASE_URL).
 *
 * Invariant truy xuất nguồn gốc:
 *   inventoryLot.variant.product.farm === inventoryLot.batch.harvest.season.farm
 *
 * Test chứng minh HAI lớp phòng vệ:
 * 1. WRITE GUARD — nhập kho chặn ghép lô của Trang trại B với biến thể của Trang trại A.
 * 2. READ/FEFO GUARD — TonKhoLo cross-farm tồn tại sẵn (legacy DB) KHÔNG bao giờ
 *    được FEFO chọn, kể cả khi hết hạn sớm hơn lô hợp lệ.
 *
 * Test chạy trên TEST_DATABASE_URL (PrismaService + run-jest-vm.mjs fail-fast nếu
 * thiếu hoặc trùng DATABASE_URL dev). Không dùng DB dev.
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
  TrangThaiBanGhi,
  TrangThaiDonHang,
  TrangThaiLoSanPham,
} from '../src/generated/prisma/client';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { EmailWorker } from '../src/modules/hang-doi/workers/email.worker';
import { HeThongWorker } from '../src/modules/hang-doi/workers/he-thong.worker';
import { ThongBaoWorker } from '../src/modules/hang-doi/workers/thong-bao.worker';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';
import { TonKhoService } from '../src/modules/ton-kho/ton-kho.service';
import { taoDonDepFixture } from './test-database';

const THOI_GIAN_KHOI_TAO_E2E_MS = 90_000;
const THOI_GIAN_DON_DEP_E2E_MS = 180_000;

function ngayTuHomNay(offset: number): Date {
  const bayGio = new Date();
  return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate() + offset));
}

describe('Cross-farm inventory guard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tonKho: TonKhoService;
  let datCho: DatChoTonKhoService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const matKhau = 'MatKhau-CrossFarm-039';
  const emailAdmin = `cross-farm-admin-${suffix}@example.com`;

  let tokenAdmin = '';
  let donDep: ReturnType<typeof taoDonDepFixture>;

  const ids = {
    nhaCungCapA: '',
    nhaCungCapB: '',
    trangTraiA: '',
    trangTraiB: '',
    danhMuc: '',
    sanPhamA: '',
    bienTheA: '',
    muaVuA: '',
    thuHoachA: '',
    muaVuB: '',
    thuHoachB: '',
    loA: '',
    loB: '',
    kho: '',
  };

  let lotHopLeId = '';
  let lotCrossFarmId = '';
  let nhapKhoHopLeId = '';

  /** Số inventory_lot đang vi phạm invariant farm (đọc trực tiếp SQL). */
  async function demTonKhoCrossFarm(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ so: number }>>(`
      SELECT COUNT(*) AS so
      FROM inventory_lot il
      INNER JOIN bien_the_san_pham btsp ON btsp.id = il.bien_the_san_pham_id
      INNER JOIN san_pham sp ON sp.id = btsp.san_pham_id
      INNER JOIN lo_san_pham lsp ON lsp.id = il.lo_san_pham_id
      INNER JOIN thu_hoach th ON th.id = lsp.thu_hoach_id
      INNER JOIN mua_vu mv ON mv.id = th.mua_vu_id
      WHERE sp.trang_trai_id <> mv.trang_trai_id
    `);
    return Number(rows[0]?.so ?? 0);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();

    prisma = app.get(PrismaService);
    tonKho = app.get(TonKhoService);
    datCho = app.get(DatChoTonKhoService);
    donDep = taoDonDepFixture(prisma);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({ email: emailAdmin, matKhau, hoTen: 'Cross Farm E2E' })
      .expect(201);

    const admin = await prisma.nguoiDung.findUniqueOrThrow({ where: { email: emailAdmin } });
    const roleAdmin = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: admin.id, vaiTroId: roleAdmin.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });

    const dangNhap = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email: emailAdmin, matKhau, nenTang: 'WEB' })
      .expect(200);
    tokenAdmin = dangNhap.body.accessToken as string;

    const [nccA, nccB] = await Promise.all([
      prisma.nhaCungCap.create({
        data: { ma: `NCC-XF-A-${suffix}`.slice(0, 50), ten: 'NCC Cross-farm A' },
      }),
      prisma.nhaCungCap.create({
        data: { ma: `NCC-XF-B-${suffix}`.slice(0, 50), ten: 'NCC Cross-farm B' },
      }),
    ]);
    ids.nhaCungCapA = nccA.id;
    ids.nhaCungCapB = nccB.id;
    donDep.theoNhaCungCap(nccA.id);
    donDep.theoNhaCungCap(nccB.id);

    const [farmA, farmB] = await Promise.all([
      prisma.trangTrai.create({
        data: {
          ma: `FARM-XF-A-${suffix}`.slice(0, 50),
          ten: 'Trang trại A (cross-farm E2E)',
          diaChi: 'Hưng Yên',
          nhaCungCapId: nccA.id,
        },
      }),
      prisma.trangTrai.create({
        data: {
          ma: `FARM-XF-B-${suffix}`.slice(0, 50),
          ten: 'Trang trại B (cross-farm E2E)',
          diaChi: 'Hưng Yên',
          nhaCungCapId: nccB.id,
        },
      }),
    ]);
    ids.trangTraiA = farmA.id;
    ids.trangTraiB = farmB.id;
    donDep.theoTrangTrai(farmA.id);
    donDep.theoTrangTrai(farmB.id);

    const danhMuc = await prisma.danhMucSanPham.create({
      data: {
        ten: `Danh mục cross-farm ${suffix}`,
        slug: `cross-farm-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 191),
      },
    });
    ids.danhMuc = danhMuc.id;
    donDep.theoDanhMuc(danhMuc.id);

    const sanPhamA = await prisma.sanPham.create({
      data: { ten: 'Sản phẩm A (cross-farm E2E)', trangTraiId: farmA.id, danhMucSanPhamId: danhMuc.id },
    });
    ids.sanPhamA = sanPhamA.id;
    donDep.theoSanPham(sanPhamA.id);

    const bienTheA = await prisma.bienTheSanPham.create({
      data: {
        sanPhamId: sanPhamA.id,
        sku: `XF-A-${suffix}`.slice(0, 100).toUpperCase(),
        khoiLuong: 1,
        gia: 25000,
        donVi: 'kg',
      },
    });
    ids.bienTheA = bienTheA.id;
    donDep.theoBienThe(bienTheA.id);

    const [muaVuA, muaVuB] = await Promise.all([
      prisma.muaVu.create({
        data: {
          trangTraiId: farmA.id,
          cayTrong: 'Rau A',
          giong: 'XF-A',
          ngayTrong: ngayTuHomNay(-60),
          ngayDuKienThuHoach: ngayTuHomNay(-10),
          sanLuongDuKienKg: 500,
        },
      }),
      prisma.muaVu.create({
        data: {
          trangTraiId: farmB.id,
          cayTrong: 'Rau B',
          giong: 'XF-B',
          ngayTrong: ngayTuHomNay(-60),
          ngayDuKienThuHoach: ngayTuHomNay(-10),
          sanLuongDuKienKg: 500,
        },
      }),
    ]);
    ids.muaVuA = muaVuA.id;
    ids.muaVuB = muaVuB.id;

    const [thuHoachA, thuHoachB] = await Promise.all([
      prisma.thuHoach.create({
        data: {
          muaVuId: muaVuA.id,
          ngayThuHoach: ngayTuHomNay(-10),
          soLuong: 500,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
      prisma.thuHoach.create({
        data: {
          muaVuId: muaVuB.id,
          ngayThuHoach: ngayTuHomNay(-10),
          soLuong: 500,
          donVi: 'kg',
          phanLoai: 'Loại 1',
        },
      }),
    ]);
    ids.thuHoachA = thuHoachA.id;
    ids.thuHoachB = thuHoachB.id;

    // Batch B (Farm B) hết hạn SỚM hơn Batch A (Farm A): nếu FEFO không chặn
    // cross-farm thì B sẽ được chọn trước và test sẽ fail.
    const [loA, loB] = await Promise.all([
      prisma.loSanPham.create({
        data: {
          maLo: `LO-XF-A-${suffix}`.slice(0, 100),
          thuHoachId: thuHoachA.id,
          soLuong: 200,
          conLai: 200,
          ngayHetHan: ngayTuHomNay(20),
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
      prisma.loSanPham.create({
        data: {
          maLo: `LO-XF-B-${suffix}`.slice(0, 100),
          thuHoachId: thuHoachB.id,
          soLuong: 200,
          conLai: 200,
          ngayHetHan: ngayTuHomNay(5),
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        },
      }),
    ]);
    ids.loA = loA.id;
    ids.loB = loB.id;
    donDep.theoLoSanPham(loA.id);
    donDep.theoLoSanPham(loB.id);

    const kho = await prisma.kho.create({
      data: { maKho: `KHO-XF-${suffix}`.slice(0, 50), ten: 'Kho cross-farm E2E', diaChi: 'Hưng Yên' },
    });
    ids.kho = kho.id;
    donDep.theoKho(kho.id);
  }, THOI_GIAN_KHOI_TAO_E2E_MS);

  afterAll(async () => {
    if (prisma) {
      // Phiếu kho sinh ra từ nhập kho không gắn donHangId nên dọn theo kho fixture.
      // Cascade xuống warehouse_document_line và warehouse_document_transaction.
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

  it('nhập kho CÙNG trang trại (Biến thể A + Lô A) được chấp nhận', async () => {
    const ketQua = await tonKho.nhapKho(
      { khoId: ids.kho, loSanPhamId: ids.loA, bienTheSanPhamId: ids.bienTheA, soLuong: 10 },
      undefined,
    );

    expect(ketQua.tonKho.onHand).toBe(10);
    expect(ketQua.tonKho.loSanPham.id).toBe(ids.loA);
    expect(ketQua.tonKho.bienThe.id).toBe(ids.bienTheA);
    nhapKhoHopLeId = ketQua.tonKho.id;
    lotHopLeId = ketQua.tonKho.id;

    const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lotHopLeId } });
    expect(lot.loSanPhamId).toBe(ids.loA);
    expect(lot.bienTheSanPhamId).toBe(ids.bienTheA);
  });

  it('nhập kho CROSS-FARM (Biến thể A + Lô B) bị BadRequest và không ghi TonKhoLo', async () => {
    const truocKhi = await demTonKhoCrossFarm();

    const goiHttp = await request(app.getHttpServer())
      .post('/api/v1/ton-kho/nhap')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ khoId: ids.kho, loSanPhamId: ids.loB, bienTheSanPhamId: ids.bienTheA, soLuong: 5 });

    expect(goiHttp.status).toBe(400);
    expect(String(goiHttp.body.message)).toContain(
      'lô thu hoạch và sản phẩm thuộc hai trang trại khác nhau',
    );

    await expect(
      tonKho.nhapKho(
        { khoId: ids.kho, loSanPhamId: ids.loB, bienTheSanPhamId: ids.bienTheA, soLuong: 5 },
        undefined,
      ),
    ).rejects.toThrow('lô thu hoạch và sản phẩm thuộc hai trang trại khác nhau');

    // Không chỉ kiểm message: phải chứng minh DB không có lô cross-farm mới.
    await expect(
      prisma.tonKhoLo.findFirst({
        where: { khoId: ids.kho, loSanPhamId: ids.loB, bienTheSanPhamId: ids.bienTheA },
      }),
    ).resolves.toBeNull();
    expect(await demTonKhoCrossFarm()).toBe(truocKhi);

    // Lô hợp lệ phải giữ nguyên onHand (không bị tăng/giảm âm thầm).
    const lotHopLe = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lotHopLeId } });
    expect(Number(lotHopLe.onHand)).toBe(10);
  });

  it('FEFO bỏ qua TonKhoLo cross-farm legacy dù hết hạn sớm hơn lô hợp lệ', async () => {
    // Fixture legacy: insert TRỰC TIẾP qua Prisma, KHÔNG đi qua TonKhoService
    // (service mới đã chặn ở Phase 1). Mô phỏng DB cũ/dữ liệu lỗi.
    const legacy = await prisma.tonKhoLo.create({
      data: {
        khoId: ids.kho,
        loSanPhamId: ids.loB,
        bienTheSanPhamId: ids.bienTheA,
        onHand: 50,
        reserved: 0,
        blocked: 0,
      },
    });
    lotCrossFarmId = legacy.id;

    // Lô hợp lệ chỉ còn 3 đơn vị; lô cross-farm có 50 và hết hạn sớm hơn.
    await prisma.tonKhoLo.update({ where: { id: lotHopLeId }, data: { onHand: 3 } });

    const datChonDu = await prisma.loSanPham.findUniqueOrThrow({ where: { id: ids.loB } });
    const datChonHopLe = await prisma.loSanPham.findUniqueOrThrow({ where: { id: ids.loA } });
    expect(datChonDu.ngayHetHan.getTime()).toBeLessThan(datChonHopLe.ngayHetHan.getTime());

    const reservation = await datCho.datCho({
      maThamChieu: `XF-FEFO-${suffix}`,
      items: [{ bienTheSanPhamId: ids.bienTheA, soLuong: 2 }],
      ttlMs: 60_000,
    });

    expect(reservation.phanBo.map((item) => item.tonKhoLoId)).toEqual([lotHopLeId]);
    expect(reservation.phanBo.map((item) => item.loSanPhamId)).toEqual([ids.loA]);
    expect(reservation.phanBo.map((item) => item.soLuong)).toEqual([2]);

    // Tuyệt đối không có allocation nào chạm lô cross-farm.
    const lotSau = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lotCrossFarmId } });
    expect(Number(lotSau.reserved)).toBe(0);
    expect(Number(lotSau.onHand)).toBe(50);
    await expect(
      prisma.giaoDichTonKho.count({ where: { tonKhoLoId: lotCrossFarmId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.mucDatChoTonKho.count({ where: { tonKhoLoId: lotCrossFarmId } }),
    ).resolves.toBe(0);

    await datCho.giaiPhong(reservation.id);
  });

  it('chỉ còn tồn cross-farm legacy thì datCho fail, không reserve để đủ số lượng', async () => {
    // Dật tắt hết tồn hợp lệ của Farm A: chỉ còn lô cross-farm legacy.
    await prisma.tonKhoLo.update({ where: { id: lotHopLeId }, data: { onHand: 0 } });

    await expect(
      datCho.datCho({
        maThamChieu: `XF-ONLY-INVALID-${suffix}`,
        items: [{ bienTheSanPhamId: ids.bienTheA, soLuong: 1 }],
        ttlMs: 60_000,
      }),
    ).rejects.toThrow('Không có tồn kho hợp lệ để giữ hàng.');

    await expect(
      prisma.datChoTonKho.findUnique({ where: { maThamChieu: `XF-ONLY-INVALID-${suffix}` } }),
    ).resolves.toBeNull();

    const lotSau = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lotCrossFarmId } });
    expect(Number(lotSau.reserved)).toBe(0);
  });

  it('chuỗi truy xuất nguồn gốc Farm A → ... → OrderItem là một nguồn duy nhất', async () => {
    const lot = await prisma.tonKhoLo.findUniqueOrThrow({ where: { id: lotHopLeId } });

    const chuoi = await prisma.$queryRawUnsafe<
      Array<{
        trangTraiLo: string;
        trangTraiSanPham: string;
        maLo: string;
        sku: string;
      }>
    >(
      `
      SELECT
        ft_lo.ten AS trangTraiLo,
        ft_sp.ten AS trangTraiSanPham,
        lsp.ma_lo AS maLo,
        btsp.sku AS sku
      FROM inventory_lot il
      INNER JOIN lo_san_pham lsp ON lsp.id = il.lo_san_pham_id
      INNER JOIN thu_hoach th ON th.id = lsp.thu_hoach_id
      INNER JOIN mua_vu mv ON mv.id = th.mua_vu_id
      INNER JOIN trang_trai ft_lo ON ft_lo.id = mv.trang_trai_id
      INNER JOIN bien_the_san_pham btsp ON btsp.id = il.bien_the_san_pham_id
      INNER JOIN san_pham sp ON sp.id = btsp.san_pham_id
      INNER JOIN trang_trai ft_sp ON ft_sp.id = sp.trang_trai_id
      WHERE il.id = ?
    `,
      lot.id,
    );

    expect(chuoi).toHaveLength(1);
    expect(chuoi[0]?.trangTraiLo).toBe('Trang trại A (cross-farm E2E)');
    expect(chuoi[0]?.trangTraiSanPham).toBe('Trang trại A (cross-farm E2E)');
    expect(chuoi[0]?.trangTraiLo).toBe(chuoi[0]?.trangTraiSanPham);
    expect(chuoi[0]?.maLo).toBe(`LO-XF-A-${suffix}`);

    // OrderItem của chuỗi này cũng phải trỏ về cùng trang trại.
    const nguoiDung = await prisma.nguoiDung.create({
      data: {
        email: `cross-farm-kh-${suffix}@example.com`,
        matKhauHash: 'hash-cross-farm',
        hoTen: 'Khách cross-farm E2E',
      },
    });
    donDep.theoNguoiDung(nguoiDung.id);
    const khachHang = await prisma.khachHang.create({
      data: { maKhachHang: `KH-XF-${randomUUID().slice(0, 8).toUpperCase()}`, nguoiDungId: nguoiDung.id },
    });
    donDep.theoKhachHang(khachHang.id);

    const donHang = await prisma.donHang.create({
      data: {
        maYeuCau: randomUUID(),
        maDonHang: `XF-ORDER-${suffix}`.slice(0, 100),
        khachHangId: khachHang.id,
        trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        tongTien: 25000,
      },
    });
    donDep.theoDonHang(donHang.id);

    const donNhaCungCap = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `XF-SUB-${suffix}`.slice(0, 100),
        donHangId: donHang.id,
        nhaCungCapId: ids.nhaCungCapA,
        trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        tamTinh: 25000,
      },
    });

    const muc = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: donNhaCungCap.id,
        sanPhamId: ids.sanPhamA,
        danhMucSanPhamIdSnapshot: ids.danhMuc,
        bienTheSanPhamId: ids.bienTheA,
        trangTraiId: ids.trangTraiA,
        soLuong: 1,
        donGiaSnapshot: 25000,
        tenSanPhamSnapshot: 'Sản phẩm A (cross-farm E2E)',
        skuBienTheSnapshot: `XF-A-${suffix}`.toUpperCase(),
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: `FARM-XF-A-${suffix}`.slice(0, 50),
        tenTrangTraiSnapshot: 'Trang trại A (cross-farm E2E)',
      },
    });

    await prisma.phanBoDonHang.create({
      data: { mucDonHangId: muc.id, tonKhoLoId: lot.id, soLuong: 1 },
    });

    const chuoiDonHang = await prisma.$queryRawUnsafe<
      Array<{ trangTraiLo: string; trangTraiItem: string; trangTraiSanPham: string }>
    >(
      `
      SELECT
        ft_lo.ten AS trangTraiLo,
        ft_item.ten AS trangTraiItem,
        ft_sp.ten AS trangTraiSanPham
      FROM order_allocation phanbo
      INNER JOIN inventory_lot il ON il.id = phanbo.ton_kho_lo_id
      INNER JOIN lo_san_pham lsp ON lsp.id = il.lo_san_pham_id
      INNER JOIN thu_hoach th ON th.id = lsp.thu_hoach_id
      INNER JOIN mua_vu mv ON mv.id = th.mua_vu_id
      INNER JOIN trang_trai ft_lo ON ft_lo.id = mv.trang_trai_id
      INNER JOIN order_item item ON item.id = phanbo.muc_don_hang_id
      INNER JOIN trang_trai ft_item ON ft_item.id = item.trang_trai_id
      INNER JOIN bien_the_san_pham btsp ON btsp.id = item.bien_the_san_pham_id
      INNER JOIN san_pham sp ON sp.id = btsp.san_pham_id
      INNER JOIN trang_trai ft_sp ON ft_sp.id = sp.trang_trai_id
      WHERE phanbo.muc_don_hang_id = ?
    `,
      muc.id,
    );

    expect(chuoiDonHang).toHaveLength(1);
    expect(chuoiDonHang[0]?.trangTraiLo).toBe('Trang trại A (cross-farm E2E)');
    expect(chuoiDonHang[0]?.trangTraiItem).toBe('Trang trại A (cross-farm E2E)');
    expect(chuoiDonHang[0]?.trangTraiSanPham).toBe('Trang trại A (cross-farm E2E)');

    expect(nhapKhoHopLeId).toBe(lotHopLeId);
  });
});
