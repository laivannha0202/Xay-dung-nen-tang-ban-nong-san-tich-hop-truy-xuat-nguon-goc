import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { LoaiGiaoDichTonKho, TrangThaiBanGhi } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { ChuyenKhoDto } from './dto/chuyen-kho.dto';
import type { NhapKhoDto } from './dto/nhap-kho.dto';
import type {
  KetQuaBienDongTonKhoDto,
  KetQuaChuyenKhoDto,
} from './dto/phan-hoi-bien-dong-ton-kho.dto';
import type { DanhSachTonKhoLoDto, TonKhoLoDto } from './dto/phan-hoi-ton-kho.dto';
import type { TruyVanTonKhoDto } from './dto/truy-van-ton-kho.dto';
import type { XuatKhoDto } from './dto/xuat-kho.dto';

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
          { bienTheSanPham: { sanPham: { ten: { contains: timKiem } } } },
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

  async nhapKho(dto: NhapKhoDto): Promise<KetQuaBienDongTonKhoDto> {
    const ketQua = await this.prisma.$transaction(async (tx) => {
      const [kho, loSanPham, bienThe] = await Promise.all([
        tx.kho.findUnique({ where: { id: dto.khoId } }),
        tx.loSanPham.findUnique({ where: { id: dto.loSanPhamId } }),
        tx.bienTheSanPham.findUnique({ where: { id: dto.bienTheSanPhamId } }),
      ]);
      if (!kho) throw new NotFoundException('Không tìm thấy Kho nhập.');
      if (kho.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Kho nhập đang bị khóa.');
      }
      if (!loSanPham) throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
      if (!bienThe) throw new NotFoundException('Không tìm thấy Biến thể sản phẩm.');

      const tonKho = await tx.tonKhoLo.upsert({
        where: {
          khoId_loSanPhamId_bienTheSanPhamId: {
            khoId: dto.khoId,
            loSanPhamId: dto.loSanPhamId,
            bienTheSanPhamId: dto.bienTheSanPhamId,
          },
        },
        create: {
          khoId: dto.khoId,
          loSanPhamId: dto.loSanPhamId,
          bienTheSanPhamId: dto.bienTheSanPhamId,
          onHand: dto.soLuong,
          reserved: 0,
          blocked: 0,
        },
        update: {
          onHand: { increment: dto.soLuong },
        },
      });

      const giaoDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: tonKho.id,
          loai: LoaiGiaoDichTonKho.HARVEST_IN,
          soLuong: dto.soLuong,
        },
      });
      return { tonKhoLoId: tonKho.id, giaoDichId: giaoDich.id };
    });

    return {
      tonKho: await this.layChiTiet(ketQua.tonKhoLoId),
      giaoDichId: ketQua.giaoDichId,
    };
  }

  async xuatKho(dto: XuatKhoDto): Promise<KetQuaBienDongTonKhoDto> {
    const ketQua = await this.prisma.$transaction(async (tx) => {
      const nguon = await tx.tonKhoLo.findUnique({
        where: { id: dto.tonKhoLoId },
        include: { kho: true },
      });
      if (!nguon) throw new NotFoundException('Không tìm thấy tồn kho nguồn.');
      if (nguon.kho.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Kho nguồn đang bị khóa.');
      }

      await this.truAvailableAtomic(tx, nguon.id, dto.soLuong);

      const giaoDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: nguon.id,
          loai: LoaiGiaoDichTonKho.TRANSFER_OUT,
          soLuong: dto.soLuong,
        },
      });
      return { tonKhoLoId: nguon.id, giaoDichId: giaoDich.id };
    });

    return {
      tonKho: await this.layChiTiet(ketQua.tonKhoLoId),
      giaoDichId: ketQua.giaoDichId,
    };
  }

  async chuyenKho(dto: ChuyenKhoDto): Promise<KetQuaChuyenKhoDto> {
    const ketQua = await this.prisma.$transaction(async (tx) => {
      const [nguon, khoDich] = await Promise.all([
        tx.tonKhoLo.findUnique({
          where: { id: dto.tonKhoLoIdNguon },
          include: { kho: true },
        }),
        tx.kho.findUnique({ where: { id: dto.khoDichId } }),
      ]);
      if (!nguon) throw new NotFoundException('Không tìm thấy tồn kho nguồn.');
      if (!khoDich) throw new NotFoundException('Không tìm thấy Kho đích.');
      if (nguon.kho.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Kho nguồn đang bị khóa.');
      }
      if (khoDich.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Kho đích đang bị khóa.');
      }
      if (nguon.khoId === dto.khoDichId) {
        throw new BadRequestException('Kho đích phải khác Kho nguồn.');
      }

      await this.truAvailableAtomic(tx, nguon.id, dto.soLuong);

      const dich = await tx.tonKhoLo.upsert({
        where: {
          khoId_loSanPhamId_bienTheSanPhamId: {
            khoId: dto.khoDichId,
            loSanPhamId: nguon.loSanPhamId,
            bienTheSanPhamId: nguon.bienTheSanPhamId,
          },
        },
        create: {
          khoId: dto.khoDichId,
          loSanPhamId: nguon.loSanPhamId,
          bienTheSanPhamId: nguon.bienTheSanPhamId,
          onHand: dto.soLuong,
          reserved: 0,
          blocked: 0,
        },
        update: {
          onHand: { increment: dto.soLuong },
        },
      });

      const giaoDichNguon = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: nguon.id,
          loai: LoaiGiaoDichTonKho.TRANSFER_OUT,
          soLuong: dto.soLuong,
        },
      });
      const giaoDichDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: dich.id,
          loai: LoaiGiaoDichTonKho.TRANSFER_IN,
          soLuong: dto.soLuong,
        },
      });

      return {
        nguonId: nguon.id,
        dichId: dich.id,
        giaoDichNguonId: giaoDichNguon.id,
        giaoDichDichId: giaoDichDich.id,
      };
    });

    return {
      nguon: await this.layChiTiet(ketQua.nguonId),
      dich: await this.layChiTiet(ketQua.dichId),
      giaoDichNguonId: ketQua.giaoDichNguonId,
      giaoDichDichId: ketQua.giaoDichDichId,
    };
  }

  private async truAvailableAtomic(
    tx: Prisma.TransactionClient,
    tonKhoLoId: string,
    soLuong: number,
  ): Promise<void> {
    const changed = await tx.$executeRaw`
      UPDATE inventory_lot
      SET on_hand = on_hand - ${soLuong}
      WHERE id = ${tonKhoLoId}
        AND (on_hand - reserved - blocked) >= ${soLuong}
    `;
    if (changed !== 1) {
      throw new BadRequestException('Số lượng available không đủ.');
    }
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
