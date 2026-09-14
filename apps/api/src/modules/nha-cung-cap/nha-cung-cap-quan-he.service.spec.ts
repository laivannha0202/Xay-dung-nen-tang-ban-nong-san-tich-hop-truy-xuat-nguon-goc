import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';

import { NhaCungCapService } from './nha-cung-cap.service';

/**
 * Unit test DB-free cho Supplier + Farm relation:
 * - supplier list/detail chỉ dùng field thật (ma/ten/nguoiDaiDien/soDienThoai/email/diaChi/trangThai)
 * - không có rating/revenue/orders/balance/payout/farmCount giả
 * - status dùng exact enum HOAT_DONG / NGUNG_HOAT_DONG
 */

function taoNhaCungCapGia() {
  return {
    id: 'ncc-001',
    ma: 'NCC-0001',
    ten: 'Hợp tác xã Rau Xanh',
    nguoiDaiDien: 'Nguyễn Văn A',
    soDienThoai: '0901234567',
    email: 'ncc@example.com',
    diaChi: 'Đà Lạt, Lâm Đồng',
    ghiChu: 'Ghi chú nội bộ',
    trangThai: TrangThaiBanGhi.HOAT_DONG,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('nha-cung-cap quan hệ supplier → farm', () => {
  it('layDanhSach truyền đúng timKiem/trangThai và phân trang server', async () => {
    const duLieu = [taoNhaCungCapGia()];
    let whereDaNhan: unknown;
    const prismaFake = {
      $transaction: async (promises: [Promise<unknown>, Promise<unknown>]) => {
        const [rows, tong] = await Promise.all(promises);
        return [rows, tong];
      },
      nhaCungCap: {
        findMany: async (args: { where: unknown }) => {
          whereDaNhan = args.where;
          return duLieu;
        },
        count: async () => 1,
      },
    };
    const service = new NhaCungCapService(prismaFake as unknown as PrismaService);

    const ketQua = await service.layDanhSach({
      trang: 2,
      gioiHan: 20,
      timKiem: 'Rau Xanh',
      trangThai: TrangThaiBanGhi.HOAT_DONG,
    });

    expect(ketQua.duLieu).toHaveLength(1);
    expect(ketQua.tong).toBe(1);
    expect(ketQua.trang).toBe(2);
    expect(ketQua.gioiHan).toBe(20);
    expect(whereDaNhan).toMatchObject({ trangThai: TrangThaiBanGhi.HOAT_DONG });
    // Không có field giả trong DTO thật.
    expect(ketQua.duLieu[0]).not.toHaveProperty('rating');
    expect(ketQua.duLieu[0]).not.toHaveProperty('revenue');
    expect(ketQua.duLieu[0]).not.toHaveProperty('farmCount');
  });

  it('layChiTiet trả field thật, không leak số liệu giả', async () => {
    const row = taoNhaCungCapGia();
    const prismaFake = {
      nhaCungCap: { findUnique: async () => row },
    };
    const service = new NhaCungCapService(prismaFake as unknown as PrismaService);

    const dto = await service.layChiTiet('ncc-001');

    expect(dto.ma).toBe('NCC-0001');
    expect(dto.ten).toBe('Hợp tác xã Rau Xanh');
    expect(dto.nguoiDaiDien).toBe('Nguyễn Văn A');
    expect(dto.soDienThoai).toBe('0901234567');
    expect(dto.email).toBe('ncc@example.com');
    expect(dto.diaChi).toBe('Đà Lạt, Lâm Đồng');
    expect(dto.trangThai).toBe(TrangThaiBanGhi.HOAT_DONG);
    expect(dto).not.toHaveProperty('rating');
    expect(dto).not.toHaveProperty('doanhThu');
  });

  it('layChiTiet không tồn tại → NotFound', async () => {
    const prismaFake = { nhaCungCap: { findUnique: async () => null } };
    const service = new NhaCungCapService(prismaFake as unknown as PrismaService);

    await expect(service.layChiTiet('khong-co')).rejects.toThrow(NotFoundException);
  });

  it.each([TrangThaiBanGhi.HOAT_DONG, TrangThaiBanGhi.NGUNG_HOAT_DONG])(
    'doiTrangThai giữ nguyên enum thật %s khi trùng',
    async (trangThai) => {
      const row = { ...taoNhaCungCapGia(), trangThai };
      const prismaFake = {
        nguoiDung: { findUnique: async () => ({ id: 'actor-1', email: 'admin@local' }) },
        nhaCungCap: { findUnique: async () => row },
        $transaction: async () => {
          throw new Error('Không được gọi transaction khi trạng thái không đổi');
        },
      };
      const service = new NhaCungCapService(prismaFake as unknown as PrismaService);

      const dto = await service.doiTrangThai('actor-1', 'ncc-001', trangThai, {
        ip: null,
        userAgent: null,
      });

      expect(dto.trangThai).toBe(trangThai);
    },
  );
});
