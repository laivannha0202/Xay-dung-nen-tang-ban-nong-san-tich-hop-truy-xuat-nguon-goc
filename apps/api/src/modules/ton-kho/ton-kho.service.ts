import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

import type { DanhSachTonKhoLoDto, TonKhoLoDto } from './dto/phan-hoi-ton-kho.dto';
import type { TruyVanTonKhoDto } from './dto/truy-van-ton-kho.dto';

type TonKhoLoRow = Prisma.TonKhoLoGetPayload<{
  include: {
    kho: true;
    loSanPham: true;
    bienTheSanPham: {
      include: {
        sanPham: true;
      };
    };
  };
}>;

@Injectable()
export class TonKhoService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanTonKhoDto): Promise<DanhSachTonKhoLoDto> {
    const where: Prisma.TonKhoLoWhereInput = {};
    const and: Prisma.TonKhoLoWhereInput[] = [];

    if (dto.khoId) and.push({ khoId: dto.khoId });
    if (dto.loSanPhamId) and.push({ loSanPhamId: dto.loSanPhamId });
    if (dto.bienTheSanPhamId) and.push({ bienTheSanPhamId: dto.bienTheSanPhamId });

    const timKiem = dto.timKiem?.trim();
    if (timKiem) {
      and.push({
        OR: [
          { kho: { maKho: { contains: timKiem } } },
          { kho: { ten: { contains: timKiem } } },
          { loSanPham: { maLo: { contains: timKiem } } },
          { bienTheSanPham: { sku: { contains: timKiem } } },
          {
            bienTheSanPham: {
              sanPham: {
                ten: { contains: timKiem },
              },
            },
          },
        ],
      });
    }

    if (and.length) where.AND = and;

    const skip = (dto.trang - 1) * dto.gioiHan;
    const include = this.includeTonKho();

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.tonKhoLo.findMany({
        where,
        include,
        orderBy: [
          { kho: { maKho: 'asc' } },
          { loSanPham: { ngayHetHan: 'asc' } },
          { bienTheSanPham: { sku: 'asc' } },
          { createdAt: 'asc' },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.tonKhoLo.count({ where }),
    ]);

    return {
      duLieu: rows.map((item) => this.toDto(item)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<TonKhoLoDto> {
    const item = await this.prisma.tonKhoLo.findUnique({
      where: { id },
      include: this.includeTonKho(),
    });
    if (!item) throw new NotFoundException('Không tìm thấy tồn kho theo lô.');
    return this.toDto(item);
  }

  private includeTonKho() {
    return {
      kho: true,
      loSanPham: true,
      bienTheSanPham: {
        include: {
          sanPham: true,
        },
      },
    } satisfies Prisma.TonKhoLoInclude;
  }

  private toDto(item: TonKhoLoRow): TonKhoLoDto {
    const onHand = Number(item.onHand);
    const reserved = Number(item.reserved);
    const blocked = Number(item.blocked);
    const available = Number((onHand - reserved - blocked).toFixed(3));

    return {
      id: item.id,
      kho: {
        id: item.kho.id,
        maKho: item.kho.maKho,
        ten: item.kho.ten,
        trangThai: item.kho.trangThai,
      },
      loSanPham: {
        id: item.loSanPham.id,
        maLo: item.loSanPham.maLo,
        ngayHetHan: item.loSanPham.ngayHetHan.toISOString().slice(0, 10),
        trangThai: item.loSanPham.trangThai,
      },
      bienThe: {
        id: item.bienTheSanPham.id,
        sku: item.bienTheSanPham.sku,
        khoiLuong: Number(item.bienTheSanPham.khoiLuong),
        donVi: item.bienTheSanPham.donVi,
        sanPhamId: item.bienTheSanPham.sanPham.id,
        tenSanPham: item.bienTheSanPham.sanPham.ten,
      },
      onHand,
      reserved,
      blocked,
      available,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
