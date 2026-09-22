import { Prisma, TrangThaiDatChoTonKho } from '../src/generated/prisma/client';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

function taoService() {
  const writer = {
    taoTrongTransaction: jest.fn().mockResolvedValue({ id: 'doc-1', maPhieu: 'PXK-1' }),
  };
  const service = new DatChoTonKhoService({} as never, {} as never, {} as never, writer as never);
  return { service, writer };
}

function suborder() {
  return {
    id: 'sub-1',
    maDon: 'SUB-001',
    donHang: { id: 'order-1', maDonHang: 'ORDER-001' },
    muc: [{ phanBo: [{ tonKhoLoId: 'lot-1', soLuong: new Prisma.Decimal(1) }] }],
  };
}

function baseTx(reserved: number, blocked: number) {
  const updateLot = jest.fn().mockResolvedValue({});
  const createLedger = jest.fn().mockResolvedValue({ id: 'ledger-1' });

  const tx = {
    donHangNhaCungCap: { findUnique: jest.fn().mockResolvedValue(suborder()) },
    vanChuyen: {
      findFirst: jest.fn().mockResolvedValue({ id: 'ship-1' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'ship-old' }]),
    },
    datChoTonKho: {
      findUnique: jest.fn().mockResolvedValue({ trangThai: TrangThaiDatChoTonKho.DA_BAN }),
    },
    phieuKho: { count: jest.fn().mockResolvedValue(0) },
    $queryRaw: jest.fn().mockResolvedValue([
      {
        id: 'lot-1',
        khoId: 'kho-1',
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(reserved),
        blocked: new Prisma.Decimal(blocked),
      },
    ]),
    tonKhoLo: { update: updateLot },
    giaoDichTonKho: { create: createLedger },
  } as unknown as Prisma.TransactionClient;

  return { tx, updateLot, createLedger };
}

describe('V7.1 reship/returned inventory invariant', () => {
  it('PICKED_UP đầu giảm reserved + onHand và PXK theo shipment id', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot } = baseTx(1, 0);

    await service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(tx, 'sub-1', 'ship-1');

    expect(updateLot).toHaveBeenCalledWith({
      where: { id: 'lot-1' },
      data: {
        onHand: { decrement: 1 },
        reserved: { decrement: 1 },
      },
    });
    expect(writer.taoTrongTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ maThamChieu: 'SHIP:ship-1' }),
    );
  });

  it('không xuất trực tiếp hàng RETURNED còn blocked để giao lại', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot, createLedger } = baseTx(0, 1);

    await expect(
      service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(tx, 'sub-1', 'ship-2'),
    ).rejects.toThrow(
      'Hàng hoàn đang ở blocked/cách ly; phải QC và tái giữ chỗ trước khi giao lại.',
    );

    expect(updateLot).not.toHaveBeenCalled();
    expect(createLedger).not.toHaveBeenCalled();
    expect(writer.taoTrongTransaction).not.toHaveBeenCalled();
  });

  it('giao lại được khi inventory đã được QC/tái giữ chỗ và reserved đủ', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot } = baseTx(1, 0);

    await service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(tx, 'sub-1', 'ship-2');

    expect(updateLot).toHaveBeenCalledWith({
      where: { id: 'lot-1' },
      data: {
        onHand: { decrement: 1 },
        reserved: { decrement: 1 },
      },
    });
    expect(writer.taoTrongTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ maThamChieu: 'SHIP:ship-2' }),
    );
  });

  it('RETURNED nhập onHand + blocked và dùng RETURN:<shipmentId>', async () => {
    const { service, writer } = taoService();
    const updateLot = jest.fn().mockResolvedValue({});
    const tx = {
      donHangNhaCungCap: { findUnique: jest.fn().mockResolvedValue(suborder()) },
      vanChuyen: { findFirst: jest.fn().mockResolvedValue({ id: 'ship-2' }) },
      phieuKho: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'lot-1', khoId: 'kho-1' }]),
      tonKhoLo: { update: updateLot },
      giaoDichTonKho: { create: jest.fn().mockResolvedValue({ id: 'return-ledger-2' }) },
    } as unknown as Prisma.TransactionClient;

    await service.nhapHangHoanCachLyDonNhaCungCapTrongTransaction(tx, 'sub-1', 'ship-2');

    expect(updateLot).toHaveBeenCalledWith({
      where: { id: 'lot-1' },
      data: {
        onHand: { increment: 1 },
        blocked: { increment: 1 },
      },
    });
    expect(writer.taoTrongTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ maThamChieu: 'RETURN:ship-2' }),
    );
  });

  it('RETURNED nhận diện outbound legacy SHIP:<maDon> và vẫn idempotent', async () => {
    const { service } = taoService();
    const tx = {
      donHangNhaCungCap: { findUnique: jest.fn().mockResolvedValue(suborder()) },
      vanChuyen: { findFirst: jest.fn().mockResolvedValue({ id: 'ship-legacy' }) },
      phieuKho: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1),
      },
      $queryRaw: jest.fn(),
      tonKhoLo: { update: jest.fn() },
      giaoDichTonKho: { create: jest.fn() },
    } as unknown as Prisma.TransactionClient;

    const changed = await service.nhapHangHoanCachLyDonNhaCungCapTrongTransaction(
      tx,
      'sub-1',
      'ship-legacy',
    );

    expect(changed).toBe(false);
  });
});
