
// AGRIMARKET FARM-FIRST COMPATIBILITY (Option B)
//
// NhaCungCap không còn là chức năng quản trị độc lập, nhưng order/checkout/
// commission/finance/settlement/payout vẫn khóa theo nhaCungCapId (FK
// Restrict). Backend phải tự gắn liên kết nội bộ khi tạo trang trại mà
// request không chỉ định nhà cung cấp.

import { BadRequestException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { TepTinService } from '../tep-tin/tep-tin.service';

import { TrangTraiService } from './trang-trai.service';

function taoChiTietRow(nhaCungCapId: string) {
  return {
    id: 'farm-moi',
    ma: 'FARM-9000',
    ten: 'Trang trại Mới',
    diaChi: 'Hưng Yên',
    viDo: null,
    kinhDo: null,
    dienTichHa: null,
    nhaCungCapId,
    noiBatTrangChu: false,
    thuTuNoiBat: null,
    trangThai: TrangThaiBanGhi.HOAT_DONG,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    nhaCungCap: { id: nhaCungCapId, ma: 'NCC-001', ten: 'Hợp tác xã' },
    anh: [],
  };
}

function taoService(prismaFake: unknown) {
  const tepTinFake = {
    taoSignedUrlAnhNoiBoNhieu: async () => new Map(),
    layMetadata: async () => ({ mimeType: 'image/jpeg' }),
  };
  return new TrangTraiService(
    prismaFake as unknown as PrismaService,
    tepTinFake as unknown as TepTinService,
  );
}

function taoPrismaFake(opts: {
  nhaCungCapMacDinh: { id: string } | null;
  tuTaoNoiBo?: { id: string };
}) {
  let daTaoNoiBo = false;
  let nhaCungCapIdDaLuu: unknown;
  const txFake = {
    nhaCungCap: {
      findFirst: async () => opts.nhaCungCapMacDinh,
      create: async (args: { data: Record<string, unknown> }) => {
        daTaoNoiBo = true;
        return { id: opts.tuTaoNoiBo?.id ?? 'ncc-noi-bo', ...args.data };
      },
    },
    trangTrai: {
      create: async (args: { data: Record<string, unknown> }) => {
        nhaCungCapIdDaLuu = args.data.nhaCungCapId;
        return { id: 'farm-moi' };
      },
      findUniqueOrThrow: async () => ({
        id: 'farm-moi',
        anh: [],
        nhaCungCapId: nhaCungCapIdDaLuu,
      }),
    },
    nhatKyKiemToan: { create: async () => ({ id: 'audit-1' }) },
  };
  const prismaFake = {
    nguoiDung: { findUnique: async () => ({ id: 'actor-1', email: 'admin@local' }) },
    nhaCungCap: { findFirst: async () => ({ id: 'ncc-cu-the' }) },
    $transaction: async (cb: (tx: unknown) => Promise<string>) => cb(txFake),
    trangTrai: { findUnique: async () => taoChiTietRow(nhaCungCapIdDaLuu as string) },
  };
  return {
    prismaFake,
    ketQua: () => ({ daTaoNoiBo, nhaCungCapIdDaLuu }),
  };
}

const DTO_CO_BAN = {
  ma: 'FARM-9000',
  ten: 'Trang trại Mới',
  diaChi: 'Hưng Yên',
};

describe('trang-trai tự gắn nhà cung cấp nội bộ', () => {
  it('không chỉ định NCC + đã có NCC hoạt động → dùng NCC lâu đời nhất, không tạo mới', async () => {
    const { prismaFake, ketQua } = taoPrismaFake({
      nhaCungCapMacDinh: { id: 'ncc-lau-doi' },
    });
    const service = taoService(prismaFake);

    const dto = await service.tao('actor-1', { ...DTO_CO_BAN }, { ip: null, userAgent: null });

    expect(ketQua().daTaoNoiBo).toBe(false);
    expect(ketQua().nhaCungCapIdDaLuu).toBe('ncc-lau-doi');
    expect(dto.nhaCungCap.id).toBe('ncc-lau-doi');
  });

  it('không chỉ định NCC + chưa có NCC nào → tự tạo thực thể nội bộ trong transaction', async () => {
    const { prismaFake, ketQua } = taoPrismaFake({
      nhaCungCapMacDinh: null,
      tuTaoNoiBo: { id: 'ncc-noi-bo' },
    });
    const service = taoService(prismaFake);

    const dto = await service.tao('actor-1', { ...DTO_CO_BAN }, { ip: null, userAgent: null });

    expect(ketQua().daTaoNoiBo).toBe(true);
    expect(ketQua().nhaCungCapIdDaLuu).toBe('ncc-noi-bo');
    expect(dto.nhaCungCap.id).toBe('ncc-noi-bo');
  });

  it('chỉ định NCC rõ ràng → vẫn validate và dùng đúng NCC đó', async () => {
    const { prismaFake, ketQua } = taoPrismaFake({
      nhaCungCapMacDinh: { id: 'ncc-lau-doi' },
    });
    const service = taoService(prismaFake);

    await service.tao(
      'actor-1',
      { ...DTO_CO_BAN, nhaCungCapId: 'ncc-cu-the' },
      { ip: null, userAgent: null },
    );

    expect(ketQua().daTaoNoiBo).toBe(false);
    expect(ketQua().nhaCungCapIdDaLuu).toBe('ncc-cu-the');
  });

  it('chỉ định NCC không tồn tại → BadRequest, không tạo farm', async () => {
    const { prismaFake } = taoPrismaFake({ nhaCungCapMacDinh: { id: 'ncc-lau-doi' } });
    (prismaFake as { nhaCungCap: { findFirst: unknown } }).nhaCungCap.findFirst =
      async () => null;
    const service = taoService(prismaFake);

    await expect(
      service.tao('actor-1', { ...DTO_CO_BAN, nhaCungCapId: 'khong-co' }, { ip: null, userAgent: null }),
    ).rejects.toThrow(BadRequestException);
  });
});
