import { PrismaService } from '../src/database/prisma.service';
import { LoaiGiaoDichTonKho } from '../src/generated/prisma/client';
import { BaoCaoTonKhoService } from '../src/modules/bao-cao-ton-kho/bao-cao-ton-kho.service';
import { CauHinhHeThongService } from '../src/modules/cau-hinh-he-thong/cau-hinh-he-thong.service';

describe('PHIEN-089 BaoCaoTonKhoService', () => {
  const prisma = {
    $transaction: jest.fn(),
    tonKhoLo: { findMany: jest.fn(), count: jest.fn() },
    giaoDichTonKho: { findMany: jest.fn(), count: jest.fn() },
  };
  const cauHinh = { layNguongSapHetHanNgay: jest.fn() };
  let service: BaoCaoTonKhoService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (values: Array<Promise<unknown>>) =>
      Promise.all(values),
    );
    service = new BaoCaoTonKhoService(
      prisma as unknown as PrismaService,
      cauHinh as unknown as CauHinhHeThongService,
    );
  });

  const tonKho = (ngayHetHan: Date) => ({
    id: '01995d5b-1111-7777-8000-000000000001',
    onHand: 10,
    reserved: 2,
    blocked: 1,
    kho: { id: '01995d5b-1111-7777-8000-000000000002', maKho: 'KHO-01', ten: 'Kho 01' },
    loSanPham: {
      id: '01995d5b-1111-7777-8000-000000000003',
      maLo: 'LO-01',
      ngayHetHan,
    },
    bienTheSanPham: {
      id: '01995d5b-1111-7777-8000-000000000004',
      sku: 'SKU-01',
      sanPham: { id: '01995d5b-1111-7777-8000-000000000005', ten: 'Rau xanh' },
    },
  });

  it('stock trả snapshot onHand/reserved/blocked/available', async () => {
    prisma.tonKhoLo.findMany.mockResolvedValue([tonKho(new Date('2030-01-10T00:00:00.000Z'))]);
    prisma.tonKhoLo.count.mockResolvedValue(1);

    const result = await service.layTonKho({ trang: 1, gioiHan: 20 });

    expect(result.tong).toBe(1);
    expect(result.duLieu[0]).toMatchObject({ onHand: 10, reserved: 2, blocked: 1, available: 7 });
  });

  it('near expiry dùng đúng threshold System Settings và chỉ onHand > 0', async () => {
    cauHinh.layNguongSapHetHanNgay.mockResolvedValue(8);
    prisma.tonKhoLo.findMany.mockResolvedValue([]);
    prisma.tonKhoLo.count.mockResolvedValue(0);

    const result = await service.laySapHetHan({ trang: 1, gioiHan: 20 });

    expect(result.soNgayCanhBao).toBe(8);
    const call = prisma.tonKhoLo.findMany.mock.calls[0][0];
    expect(call.where.AND[0].onHand).toEqual({ gt: 0 });
    expect(call.where.AND[0].loSanPham.ngayHetHan.gte).toBeInstanceOf(Date);
    expect(call.where.AND[0].loSanPham.ngayHetHan.lte).toBeInstanceOf(Date);
  });

  it('expired dùng HSD trước đầu ngày UTC và còn tồn vật lý', async () => {
    cauHinh.layNguongSapHetHanNgay.mockResolvedValue(7);
    prisma.tonKhoLo.findMany.mockResolvedValue([]);
    prisma.tonKhoLo.count.mockResolvedValue(0);

    await service.layHetHan({ trang: 1, gioiHan: 20 });

    const call = prisma.tonKhoLo.findMany.mock.calls[0][0];
    expect(call.where.AND[0].onHand).toEqual({ gt: 0 });
    expect(call.where.AND[0].loSanPham.ngayHetHan.lt).toBeInstanceOf(Date);
  });

  it('waste chỉ đọc DAMAGE/EXPIRE, không nhập ADJUSTMENT vào hao hụt', async () => {
    prisma.giaoDichTonKho.findMany.mockResolvedValue([]);
    prisma.giaoDichTonKho.count.mockResolvedValue(0);

    await service.layHaoHut({ trang: 1, gioiHan: 20 });

    const call = prisma.giaoDichTonKho.findMany.mock.calls[0][0];
    expect(call.where.loai).toEqual({
      in: [LoaiGiaoDichTonKho.DAMAGE, LoaiGiaoDichTonKho.EXPIRE],
    });
    expect(call.where.loai.in).not.toContain(LoaiGiaoDichTonKho.ADJUSTMENT);
  });
});
