import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

import type {
  DanhSachGiaoDichTonKhoDto,
  GiaoDichTonKhoDto,
} from './dto/phan-hoi-giao-dich-ton-kho.dto';
import type { TruyVanGiaoDichTonKhoDto } from './dto/truy-van-giao-dich-ton-kho.dto';

type GiaoDichTonKhoRow = Prisma.GiaoDichTonKhoGetPayload<{
  include: {
    tonKhoLo: {
      include: {
        kho: true;
        loSanPham: true;
        bienTheSanPham: {
          include: {
            sanPham: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class GiaoDichTonKhoService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanGiaoDichTonKhoDto): Promise<DanhSachGiaoDichTonKhoDto> {
    const where: Prisma.GiaoDichTonKhoWhereInput = {};
    if (dto.tonKhoLoId) where.tonKhoLoId = dto.tonKhoLoId;
    if (dto.loai) where.loai = dto.loai;

    const skip = (dto.trang - 1) * dto.gioiHan;
    const include = this.includeLedger();

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.giaoDichTonKho.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.giaoDichTonKho.count({ where }),
    ]);

    return {
      duLieu: rows.map((item) => this.toDto(item)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<GiaoDichTonKhoDto> {
    const item = await this.prisma.giaoDichTonKho.findUnique({
      where: { id },
      include: this.includeLedger(),
    });
    if (!item) throw new NotFoundException('Không tìm thấy giao dịch tồn kho.');
    return this.toDto(item);
  }

  private includeLedger() {
    return {
      tonKhoLo: {
        include: {
          kho: true,
          loSanPham: true,
          bienTheSanPham: {
            include: {
              sanPham: true,
            },
          },
        },
      },
    } satisfies Prisma.GiaoDichTonKhoInclude;
  }

  private toDto(item: GiaoDichTonKhoRow): GiaoDichTonKhoDto {
    return {
      id: item.id,
      tonKhoLoId: item.tonKhoLoId,
      loai: item.loai,
      soLuong: Number(item.soLuong),
      kho: {
        id: item.tonKhoLo.kho.id,
        maKho: item.tonKhoLo.kho.maKho,
        ten: item.tonKhoLo.kho.ten,
      },
      loSanPham: {
        id: item.tonKhoLo.loSanPham.id,
        maLo: item.tonKhoLo.loSanPham.maLo,
      },
      bienThe: {
        id: item.tonKhoLo.bienTheSanPham.id,
        sku: item.tonKhoLo.bienTheSanPham.sku,
        sanPhamId: item.tonKhoLo.bienTheSanPham.sanPham.id,
        tenSanPham: item.tonKhoLo.bienTheSanPham.sanPham.ten,
      },
      createdAt: item.createdAt,
    };
  }
}
