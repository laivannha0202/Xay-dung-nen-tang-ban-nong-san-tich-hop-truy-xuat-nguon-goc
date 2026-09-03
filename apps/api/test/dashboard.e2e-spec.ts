import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiBanGhi, TrangThaiThanhToan } from '../src/generated/prisma/client';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { CanhBaoHetHanTonKhoService } from '../src/modules/hang-doi/canh-bao-het-han-ton-kho.service';

describe('PHIEN-087 DashboardService', () => {
  const prisma = {
    thanhToan: { aggregate: jest.fn() },
    giaoDichThanhToan: { aggregate: jest.fn() },
    donHang: { count: jest.fn() },
    khachHang: { count: jest.fn() },
    sanPham: { count: jest.fn() },
    khieuNai: { count: jest.fn() },
  };
  const canhBao = { layCanhBao: jest.fn() };
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(
      prisma as unknown as PrismaService,
      canhBao as unknown as CanhBaoHetHanTonKhoService,
    );
  });

  it('trả đúng 6 KPI và revenue đã trừ successful refunds', async () => {
    prisma.thanhToan.aggregate.mockResolvedValue({ _sum: { soTien: 1_250_000 } });
    prisma.giaoDichThanhToan.aggregate.mockResolvedValue({ _sum: { soTien: 150_000 } });
    prisma.donHang.count.mockResolvedValue(32);
    prisma.khachHang.count.mockResolvedValue(18);
    prisma.sanPham.count.mockResolvedValue(9);
    prisma.khieuNai.count.mockResolvedValue(4);
    canhBao.layCanhBao.mockResolvedValue({ tongSapHetHan: 5, tongHetHan: 3 });

    const result = await service.layDashboard();

    expect(result.doanhThu).toBe(1_100_000);
    expect(result.donHang).toBe(32);
    expect(result.khachHang).toBe(18);
    expect(result.sanPham).toBe(9);
    expect(result.canhBaoTonKho).toEqual({ tong: 8, sapHetHan: 5, hetHan: 3 });
    expect(result.khieuNai).toBe(4);
    expect(Number.isNaN(new Date(result.capNhatLuc).getTime())).toBe(false);

    expect(prisma.thanhToan.aggregate).toHaveBeenCalledWith({
      where: {
        trangThai: {
          in: [
            TrangThaiThanhToan.PAID,
            TrangThaiThanhToan.PARTIALLY_REFUNDED,
            TrangThaiThanhToan.REFUNDED,
          ],
        },
      },
      _sum: { soTien: true },
    });
    expect(prisma.giaoDichThanhToan.aggregate).toHaveBeenCalledWith({
      where: {
        maGiaoDich: { startsWith: 'REFUND-' },
        trangThai: {
          in: [TrangThaiThanhToan.PARTIALLY_REFUNDED, TrangThaiThanhToan.REFUNDED],
        },
      },
      _sum: { soTien: true },
    });
    expect(prisma.khachHang.count).toHaveBeenCalledWith({
      where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    expect(prisma.sanPham.count).toHaveBeenCalledWith({
      where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    expect(canhBao.layCanhBao).toHaveBeenCalledWith({ gioiHan: 1 });
  });

  it('coi aggregate null là 0 và không bịa complaint lifecycle', async () => {
    prisma.thanhToan.aggregate.mockResolvedValue({ _sum: { soTien: null } });
    prisma.giaoDichThanhToan.aggregate.mockResolvedValue({ _sum: { soTien: null } });
    prisma.donHang.count.mockResolvedValue(0);
    prisma.khachHang.count.mockResolvedValue(0);
    prisma.sanPham.count.mockResolvedValue(0);
    prisma.khieuNai.count.mockResolvedValue(0);
    canhBao.layCanhBao.mockResolvedValue({ tongSapHetHan: 0, tongHetHan: 0 });

    const result = await service.layDashboard();

    expect(result.doanhThu).toBe(0);
    expect(result.khieuNai).toBe(0);
    expect(prisma.khieuNai.count).toHaveBeenCalledWith();
  });
});
