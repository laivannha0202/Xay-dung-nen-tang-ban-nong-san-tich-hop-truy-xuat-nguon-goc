import { Prisma, TrangThaiDatChoTonKho } from '../src/generated/prisma/client';
import { DatChoTonKhoService } from '../src/modules/ton-kho/dat-cho-ton-kho.service';

/**
 * AGRIMARKET-P0-PICKED-UP regression.
 *
 * Đường production: reservation chỉ tới DA_XAC_NHAN sau payment/COD commit
 * (không đường nào set DA_BAN trước shipment). PICKED_UP (xuất kho vật lý)
 * phải chấp nhận DA_XAC_NHAN, dispatch đúng lot FEFO rồi flip DA_XAC_NHAN
 * -> DA_BAN nguyên tử. Trước fix, xacNhanXuatKho đòi DA_BAN nên mọi đơn
 * production đều 400 "Đơn chưa có inventory commit hợp lệ".
 */

function taoService() {
  const writer = {
    taoTrongTransaction: jest.fn().mockResolvedValue({ id: 'doc-1', maPhieu: 'PXK-1' }),
  };
  const service = new DatChoTonKhoService({} as never, {} as never, {} as never, writer as never);
  return { service, writer };
}

function suborder() {
  return {
    id: 'sub-9',
    maDon: 'SUB-009',
    donHang: { id: 'order-9', maDonHang: 'ORDER-009' },
    muc: [{ phanBo: [{ tonKhoLoId: 'lot-9', soLuong: new Prisma.Decimal(2) }] }],
  };
}

function baseTx(trangThai: TrangThaiDatChoTonKho, daCoPhieu: number) {
  const updateLot = jest.fn().mockResolvedValue({});
  const createLedger = jest.fn().mockResolvedValue({ id: 'ledger-9' });
  const updateReservation = jest.fn().mockResolvedValue({});

  const tx = {
    donHangNhaCungCap: { findUnique: jest.fn().mockResolvedValue(suborder()) },
    vanChuyen: {
      findFirst: jest.fn().mockResolvedValue({ id: 'ship-9' }),
    },
    datChoTonKho: {
      findUnique: jest.fn().mockResolvedValue({ id: 'res-9', trangThai }),
      update: updateReservation,
    },
    phieuKho: { count: jest.fn().mockResolvedValue(daCoPhieu) },
    $queryRaw: jest.fn().mockResolvedValue([
      {
        id: 'lot-9',
        khoId: 'kho-9',
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(5),
        blocked: new Prisma.Decimal(0),
      },
    ]),
    tonKhoLo: { update: updateLot },
    giaoDichTonKho: { create: createLedger },
  } as unknown as Prisma.TransactionClient;

  return { tx, updateLot, createLedger, updateReservation };
}

describe('P0 PICKED-UP inventory commit từ DA_XAC_NHAN', () => {
  it('reservation DA_XAC_NHAN được xuất kho và flip sang DA_BAN', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot, createLedger, updateReservation } = baseTx(
      TrangThaiDatChoTonKho.DA_XAC_NHAN,
      0,
    );

    const changed = await service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(
      tx,
      'sub-9',
      'ship-9',
    );

    expect(changed).toBe(true);
    expect(updateLot).toHaveBeenCalledWith({
      where: { id: 'lot-9' },
      data: {
        onHand: { decrement: 2 },
        reserved: { decrement: 2 },
      },
    });
    expect(createLedger).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tonKhoLoId: 'lot-9' }) }),
    );
    expect(writer.taoTrongTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ maThamChieu: 'SHIP:ship-9' }),
    );
    expect(updateReservation).toHaveBeenCalledWith({
      where: { id: 'res-9' },
      data: {
        trangThai: TrangThaiDatChoTonKho.DA_BAN,
        ketThucLuc: expect.any(Date),
      },
    });
  });

  it('reservation DA_BAN seed trực tiếp vẫn xuất kho và không flip lại', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot, updateReservation } = baseTx(TrangThaiDatChoTonKho.DA_BAN, 0);

    const changed = await service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(
      tx,
      'sub-9',
      'ship-9',
    );

    expect(changed).toBe(true);
    expect(updateLot).toHaveBeenCalledTimes(1);
    expect(writer.taoTrongTransaction).toHaveBeenCalledTimes(1);
    expect(updateReservation).not.toHaveBeenCalled();
  });

  it('reservation DANG_GIU chưa commit thì chặn xuất kho vật lý', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot, createLedger, updateReservation } = baseTx(
      TrangThaiDatChoTonKho.DANG_GIU,
      0,
    );

    await expect(
      service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(tx, 'sub-9', 'ship-9'),
    ).rejects.toThrow('Đơn chưa có inventory commit hợp lệ');

    expect(updateLot).not.toHaveBeenCalled();
    expect(createLedger).not.toHaveBeenCalled();
    expect(writer.taoTrongTransaction).not.toHaveBeenCalled();
    expect(updateReservation).not.toHaveBeenCalled();
  });

  it('PXK đã tồn tại thì idempotent: không trừ tồn lần hai', async () => {
    const { service, writer } = taoService();
    const { tx, updateLot, createLedger, updateReservation } = baseTx(
      TrangThaiDatChoTonKho.DA_XAC_NHAN,
      1,
    );

    const changed = await service.xacNhanXuatKhoDonNhaCungCapTrongTransaction(
      tx,
      'sub-9',
      'ship-9',
    );

    expect(changed).toBe(false);
    expect(updateLot).not.toHaveBeenCalled();
    expect(createLedger).not.toHaveBeenCalled();
    expect(writer.taoTrongTransaction).not.toHaveBeenCalled();
    expect(updateReservation).not.toHaveBeenCalled();
  });
});
