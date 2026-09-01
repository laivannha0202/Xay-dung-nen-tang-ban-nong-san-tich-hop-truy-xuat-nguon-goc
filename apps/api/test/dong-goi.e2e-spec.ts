import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiDonHang } from '../src/generated/prisma/client';
import { DongGoiController } from '../src/modules/don-hang/dong-goi.controller';
import { DongGoiService } from '../src/modules/don-hang/dong-goi.service';
import { MA_QUYEN } from '../src/modules/phan-quyen/ma-quyen';
import { KHOA_YEU_CAU_QUYEN } from '../src/modules/phan-quyen/yeu-cau-quyen.decorator';

function fixture(
  trangThai: TrangThaiDonHang = TrangThaiDonHang.DANG_CHUAN_BI,
  parent: TrangThaiDonHang = TrangThaiDonHang.DANG_CHUAN_BI,
  qr: string | null = 'AGM-QR-1',
) {
  return {
    id: 'sub-1',
    maDon: 'ORD-1-S1',
    donHangId: 'order-1',
    nhaCungCapId: 'supplier-1',
    trangThai,
    tamTinh: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    donHang: { id: 'order-1', maDonHang: 'ORD-1', trangThai: parent },
    nhaCungCap: { ten: 'NCC A' },
    muc: [
      {
        id: 'item-1',
        donHangNhaCungCapId: 'sub-1',
        sanPhamId: 'product-1',
        bienTheSanPhamId: 'variant-1',
        trangTraiId: 'farm-1',
        soLuong: 2,
        donGiaSnapshot: 50,
        tenSanPhamSnapshot: 'Cà chua',
        skuBienTheSnapshot: 'CA-1',
        khoiLuongBienTheSnapshot: 1,
        donViBienTheSnapshot: 'kg',
        maTrangTraiSnapshot: 'FARM-A',
        tenTrangTraiSnapshot: 'Trang trại A',
        createdAt: new Date(),
        phanBo: [
          {
            id: 'alloc-1',
            mucDonHangId: 'item-1',
            tonKhoLoId: 'lot-stock-1',
            soLuong: 2,
            createdAt: new Date(),
            tonKhoLo: {
              id: 'lot-stock-1',
              bienTheSanPhamId: 'variant-1',
              loSanPhamId: 'batch-1',
              kho: { maKho: 'KHO-A' },
              loSanPham: { maLo: 'LO-A', maTruyXuat: qr },
            },
          },
        ],
      },
    ],
  };
}

function taoPrisma() {
  const prisma: any = {
    nguoiDung: {
      findUnique: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'staff@example.com' }),
    },
    donHang: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    donHangNhaCungCap: {
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(0),
    },
    nhatKyKiemToan: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  return prisma;
}

describe('PHIEN-062 Packing Workflow', () => {
  it('exact 3 endpoints đều reuse don_hang.xu_ly', () => {
    for (const method of ['layChecklist', 'batDau', 'hoanTat'] as const) {
      expect(Reflect.getMetadata(KHOA_YEU_CAU_QUYEN, DongGoiController.prototype[method])).toEqual([
        MA_QUYEN.DON_HANG_XU_LY,
      ]);
    }
  });

  it('checklist đối chiếu product/batch/qty/QR từ allocation source-of-truth', async () => {
    const prisma = taoPrisma();
    prisma.donHangNhaCungCap.findUnique.mockResolvedValue(fixture());
    const service = new DongGoiService(prisma as unknown as PrismaService);
    const result = await service.layChecklist('sub-1');

    expect(result.checklist.map((item) => [item.ma, item.dat])).toEqual([
      ['DUNG_SAN_PHAM', true],
      ['DUNG_BATCH', true],
      ['DUNG_QTY', true],
      ['DONG_GOI', false],
      ['QR', true],
    ]);
    expect(result.coTheHoanTat).toBe(true);
    expect(result.muc[0]?.phanBo[0]).toMatchObject({
      maKho: 'KHO-A',
      maLo: 'LO-A',
      soLuong: 2,
      coQr: true,
    });
  });

  it('bắt đầu chỉ đi DA_XAC_NHAN -> DANG_CHUAN_BI', async () => {
    const prisma = taoPrisma();
    prisma.donHangNhaCungCap.findUnique
      .mockResolvedValueOnce({
        id: 'sub-1',
        maDon: 'ORD-1-S1',
        donHangId: 'order-1',
        trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        donHang: { trangThai: TrangThaiDonHang.DA_XAC_NHAN },
      })
      .mockResolvedValueOnce(
        fixture(TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DANG_CHUAN_BI),
      );
    const service = new DongGoiService(prisma as unknown as PrismaService);
    await service.batDau('staff-1', 'sub-1', { ip: null, userAgent: null });

    expect(prisma.donHang.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trangThai: TrangThaiDonHang.DANG_CHUAN_BI } }),
    );
    expect(prisma.donHangNhaCungCap.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trangThai: TrangThaiDonHang.DANG_CHUAN_BI } }),
    );
  });

  it('không cho hoàn tất nếu batch chưa có QR', async () => {
    const prisma = taoPrisma();
    prisma.donHangNhaCungCap.findUnique.mockResolvedValue(
      fixture(TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DANG_CHUAN_BI, null),
    );
    const service = new DongGoiService(prisma as unknown as PrismaService);

    await expect(
      service.hoanTat(
        'staff-1',
        'sub-1',
        { dungSanPham: true, dungBatch: true, dungQty: true, dongGoi: true, qr: true },
        { ip: null, userAgent: null },
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.donHangNhaCungCap.updateMany).not.toHaveBeenCalled();
  });

  it('hoàn tất suborder và aggregate parent khi mọi supplier order đã đóng gói', async () => {
    const prisma = taoPrisma();
    prisma.donHangNhaCungCap.findUnique
      .mockResolvedValueOnce(fixture())
      .mockResolvedValueOnce(fixture(TrangThaiDonHang.DA_DONG_GOI, TrangThaiDonHang.DA_DONG_GOI));
    prisma.donHangNhaCungCap.count.mockResolvedValue(0);
    const service = new DongGoiService(prisma as unknown as PrismaService);

    const result = await service.hoanTat(
      'staff-1',
      'sub-1',
      { dungSanPham: true, dungBatch: true, dungQty: true, dongGoi: true, qr: true },
      { ip: null, userAgent: null },
    );

    expect(prisma.donHangNhaCungCap.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trangThai: TrangThaiDonHang.DA_DONG_GOI } }),
    );
    expect(prisma.donHang.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trangThai: TrangThaiDonHang.DA_DONG_GOI } }),
    );
    expect(result.trangThaiDonNhaCungCap).toBe(TrangThaiDonHang.DA_DONG_GOI);
  });
});
