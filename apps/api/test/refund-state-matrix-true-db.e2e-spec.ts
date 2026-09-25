import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TrangThaiChiTraNhaCungCap,
  TrangThaiDoiSoatNhaCungCap,
  TrangThaiDonHang,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
} from '../src/generated/prisma/client';
import { ChiTraNhaCungCapService } from '../src/modules/chi-tra-nha-cung-cap/chi-tra-nha-cung-cap.service';
import { DoiSoatService } from '../src/modules/doi-soat/doi-soat.service';
import { ThanhToanHoanTienService } from '../src/modules/thanh-toan/thanh-toan-hoan-tien.service';

describe('True DB E2E Refund State Matrix (agrimarket_test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let doiSoatService: DoiSoatService;
  let chiTraService: ChiTraNhaCungCapService;
  let refundService: ThanhToanHoanTienService;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let adminId = '';
  let supplierId = '';
  let categoryId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    doiSoatService = app.get(DoiSoatService);
    chiTraService = app.get(ChiTraNhaCungCapService);
    refundService = app.get(ThanhToanHoanTienService);

    const admin = await prisma.nguoiDung.create({
      data: { email: `admin-matrix-${suffix}@example.com`, matKhauHash: 'hash', hoTen: 'Admin Matrix' },
    });
    adminId = admin.id;

    const supplier = await prisma.nhaCungCap.create({
      data: {
        ma: `NCC-MX-${suffix}`.slice(0, 30),
        ten: 'NCC Matrix Test',
        soDienThoai: '0977665544',
        email: `ncc-mx-${suffix}@example.com`,
        diaChi: 'HN',
      },
    });
    supplierId = supplier.id;

    await prisma.soDuNhaCungCap.create({
      data: { nhaCungCapId: supplier.id, dangCho: 0, khaDung: 0, tamGiu: 0, daThanhToan: 0 },
    });

    const category = await prisma.danhMucSanPham.create({
      data: { ten: `Cat MX ${suffix}`, slug: `cat-mx-${suffix}` },
    });
    categoryId = category.id;

    await prisma.quyTacHoaHong.create({
      data: {
        nhaCungCapId: supplier.id,
        danhMucSanPhamId: category.id,
        tyLe: 10,
        hieuLucTu: new Date('2020-01-01'),
      },
    });

    await prisma.cauHinhHeThong.upsert({
      where: { id: 1 },
      create: { id: 1, thoiHanKhieuNaiNgay: 0 },
      update: { thoiHanKhieuNaiNgay: 0 },
    });
  });

  afterAll(async () => {
    // Khôi phục cauHinhHeThong
    await prisma.cauHinhHeThong.upsert({
      where: { id: 1 },
      create: { id: 1, thoiHanKhieuNaiNgay: 7, phiVanChuyenCoBan: 0, giaTriQuyDoiMoiDiem: 0 },
      update: { thoiHanKhieuNaiNgay: 7, phiVanChuyenCoBan: 0, giaTriQuyDoiMoiDiem: 0 },
    });
    if (app) await app.close();
  });

  async function createSuborderAndPayment(subTotal: number, itemPrice: number, deliveredDaysAgo = 2) {
    const user = await prisma.nguoiDung.create({
      data: { email: `buyer-${randomUUID()}@example.com`, matKhauHash: 'hash', hoTen: 'Buyer' },
    });
    const customer = await prisma.khachHang.create({
      data: { nguoiDungId: user.id, maKhachHang: `KH-MX-${randomUUID().slice(0, 8)}` },
    });
    const farm = await prisma.trangTrai.create({
      data: { nhaCungCapId: supplierId, ma: `F-MX-${randomUUID().slice(0, 8)}`, ten: 'Farm MX', diaChi: 'HN' },
    });
    const product = await prisma.sanPham.create({
      data: { trangTraiId: farm.id, danhMucSanPhamId: categoryId, ten: 'Prod MX' },
    });
    const variant = await prisma.bienTheSanPham.create({
      data: { sanPhamId: product.id, sku: `SKU-MX-${randomUUID().slice(0, 8)}`, khoiLuong: 1, donVi: 'kg', gia: itemPrice },
    });
    const order = await prisma.donHang.create({
      data: {
        maDonHang: `ORD-MX-${randomUUID().slice(0, 12)}`,
        maYeuCau: randomUUID(),
        khachHangId: customer.id,
        trangThai: TrangThaiDonHang.HOAN_THANH,
        tongTien: subTotal,
        tamTinhHangHoa: subTotal,
      },
    });
    const suborder = await prisma.donHangNhaCungCap.create({
      data: {
        maDon: `SUB-MX-${randomUUID().slice(0, 12)}`,
        donHangId: order.id,
        nhaCungCapId: supplierId,
        trangThai: TrangThaiDonHang.HOAN_THANH,
        tamTinh: subTotal,
      },
    });
    const orderItem = await prisma.mucDonHang.create({
      data: {
        donHangNhaCungCapId: suborder.id,
        sanPhamId: product.id,
        danhMucSanPhamIdSnapshot: categoryId,
        bienTheSanPhamId: variant.id,
        trangTraiId: farm.id,
        soLuong: 1,
        donGiaSnapshot: itemPrice,
        tenSanPhamSnapshot: product.ten,
        skuBienTheSnapshot: variant.sku,
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: farm.ma,
        tenTrangTraiSnapshot: farm.ten,
        tienHangGoc: subTotal,
        tienThucTra: subTotal,
      },
    });
    const payment = await prisma.thanhToan.create({
      data: {
        donHangId: order.id,
        soTien: subTotal,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
      },
    });
    await prisma.giaoDichThanhToan.create({
      data: {
        thanhToanId: payment.id,
        maGiaoDich: `TX-${randomUUID()}`,
        soTien: subTotal,
        phuongThuc: 'MOCK',
        trangThai: TrangThaiThanhToan.PAID,
      },
    });
    const vanChuyen = await prisma.vanChuyen.create({
      data: {
        donHangNhaCungCapId: suborder.id,
        maVanDon: `SHIP-MX-${randomUUID().slice(0, 10)}`,
        trangThai: TrangThaiVanChuyen.DELIVERED,
      },
    });
    await prisma.suKienTheoDoiVanChuyen.create({
      data: {
        vanChuyenId: vanChuyen.id,
        trangThai: TrangThaiVanChuyen.DELIVERED,
        thoiGian: new Date(Date.now() - deliveredDaysAgo * 24 * 60 * 60 * 1000),
      },
    });

    return { order, suborder, orderItem, payment };
  }

  it('CASE A: refund trước settlement (CHUA_DOI_SOAT)', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000);
    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });

    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 30000,
      lyDo: 'Case A refund',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    // Balance không đổi vì đơn chưa kết chuyển vào settlement
    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.dangCho)).toBe(Number(balanceTruoc.dangCho));
    expect(Number(balanceSau.khaDung)).toBe(Number(balanceTruoc.khaDung));

    // Item tienDaHoan đã tăng 30k
    const item = await prisma.mucDonHang.findUniqueOrThrow({ where: { id: orderItem.id } });
    expect(Number(item.tienDaHoan)).toBe(30000);

    // Refund allocation ledger đã ghi
    const allocs = await prisma.phanBoHoanTien.findMany({ where: { mucDonHangId: orderItem.id } });
    expect(allocs.length).toBe(1);
    expect(Number(allocs[0]!.soTienPhanBo)).toBe(30000);
  });

  it('CASE B: refund khi settlement DANG_CHO', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000, 3);

    // Tạo settlement DANG_CHO
    const settlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });

    expect(settlement.trangThai).toBe(TrangThaiDoiSoatNhaCungCap.DANG_CHO);

    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    const dangChoTruoc = Number(balanceTruoc.dangCho);

    // Thực hiện refund 25k cho Item
    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 25000,
      lyDo: 'Case B refund',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.dangCho)).toBe(dangChoTruoc - 25000);
  });

  it('CASE C: refund khi settlement KHA_DUNG', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000, 8);

    // Tạo settlement và giải phóng sang KHA_DUNG
    const settlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });

    await doiSoatService.giaiPhong(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });

    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    const khaDungTruoc = Number(balanceTruoc.khaDung);

    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 20000,
      lyDo: 'Case C refund',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.khaDung)).toBe(khaDungTruoc - 20000);
  });

  it('CASE D: refund khi payout REQUESTED', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000, 13);

    const settlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });
    await doiSoatService.giaiPhong(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });

    // Tạo payout REQUESTED
    const payout = await chiTraService.taoTuDoiSoat(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });
    expect(payout.trangThai).toBe(TrangThaiChiTraNhaCungCap.REQUESTED);

    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    const tamGiuTruoc = Number(balanceTruoc.tamGiu);

    // Tiền đang ở tamGiu -> refund reconcile từ tamGiu, không làm âm khaDung!
    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 15000,
      lyDo: 'Case D refund',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.tamGiu)).toBe(tamGiuTruoc - 15000);
    // Payout amount cũng được giảm 15k để không trả thừa
    const updatedPayout = await prisma.chiTraNhaCungCap.findUniqueOrThrow({ where: { id: payout.id } });
    expect(Number(updatedPayout.soTien)).toBe(Number(payout.soTien) - 15000);
  });

  it('CASE E: refund khi payout PROCESSING', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000, 18);

    const settlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });
    await doiSoatService.giaiPhong(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });

    const payout = await chiTraService.taoTuDoiSoat(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });
    await chiTraService.capNhatTrangThai(adminId, payout.id, { trangThai: TrangThaiChiTraNhaCungCap.PROCESSING }, { ip: '127.0.0.1', userAgent: 'Jest' });

    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    const tamGiuTruoc = Number(balanceTruoc.tamGiu);

    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 10000,
      lyDo: 'Case E refund',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.tamGiu)).toBe(tamGiuTruoc - 10000);

    const updatedPayout = await prisma.chiTraNhaCungCap.findUniqueOrThrow({ where: { id: payout.id } });
    expect(Number(updatedPayout.soTien)).toBe(Number(payout.soTien) - 10000);
  });

  it('CASE F: refund sau payout PAID -> tạo Supplier Debt, old payout vẫn PAID, next settlement offsets đúng', async () => {
    const { orderItem, payment } = await createSuborderAndPayment(100000, 100000, 23);

    const settlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });
    await doiSoatService.giaiPhong(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });

    const payout = await chiTraService.taoTuDoiSoat(adminId, settlement.id, { ip: '127.0.0.1', userAgent: 'Jest' });
    await chiTraService.capNhatTrangThai(adminId, payout.id, { trangThai: TrangThaiChiTraNhaCungCap.PROCESSING }, { ip: '127.0.0.1', userAgent: 'Jest' });
    await chiTraService.capNhatTrangThai(adminId, payout.id, { trangThai: TrangThaiChiTraNhaCungCap.PAID }, { ip: '127.0.0.1', userAgent: 'Jest' });

    const balanceTruoc = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    const daThanhToanTruoc = Number(balanceTruoc.daThanhToan);

    // Thực hiện refund 30k SAU KHI payout đã PAID!
    await refundService.hoanTien(adminId, payment.id, {
      maYeuCau: randomUUID(),
      soTien: 30000,
      lyDo: 'Case F refund after PAID',
      mucDonHangId: orderItem.id,
    }, '127.0.0.1');

    // Old payout vẫn giữ nguyên trạng thái PAID 90k
    const oldPayout = await prisma.chiTraNhaCungCap.findUniqueOrThrow({ where: { id: payout.id } });
    expect(oldPayout.trangThai).toBe(TrangThaiChiTraNhaCungCap.PAID);
    expect(Number(oldPayout.soTien)).toBe(90000);

    // Không âm / không xóa daThanhToan
    const balanceSau = await prisma.soDuNhaCungCap.findUniqueOrThrow({ where: { nhaCungCapId: supplierId } });
    expect(Number(balanceSau.daThanhToan)).toBe(daThanhToanTruoc);

    // Đã ghi nhận bản ghi Supplier Debt 30k
    const debts = await prisma.noNhaCungCap.findMany({
      where: {
        nhaCungCapId: supplierId,
        thanhToanId: payment.id,
      },
    });
    expect(debts.length).toBe(1);
    expect(Number(debts[0]!.soTien)).toBe(30000);
    expect(debts[0]!.trangThai).toBe('OPEN');

    // Next settlement: Tạo đơn mới 100k
    await createSuborderAndPayment(100000, 100000, 28);
    // Kỳ tiếp theo
    const nextSettlement = await doiSoatService.tao(adminId, {
      nhaCungCapId: supplierId,
      batDauLuc: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ketThucLuc: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      hoanTien: 0,
      dieuChinh: 0,
    }, { ip: '127.0.0.1', userAgent: 'Jest' });

    // Doanh thu 100k, Hoa hồng 10k (10%), DieuChinh (Debt offset) = 30k => Phải trả = 60k
    expect(Number(nextSettlement.doanhThu)).toBe(100000);
    expect(Number(nextSettlement.hoaHong)).toBe(10000);
    expect(Number(nextSettlement.dieuChinh)).toBe(30000);
    expect(Number(nextSettlement.phaiTra)).toBe(60000);

    // Debt đã được chuyển sang SETTLED
    const settledDebt = await prisma.noNhaCungCap.findUniqueOrThrow({ where: { id: debts[0]!.id } });
    expect(settledDebt.trangThai).toBe('SETTLED');
    expect(settledDebt.daThuHoiLuc).not.toBeNull();
  });
});
