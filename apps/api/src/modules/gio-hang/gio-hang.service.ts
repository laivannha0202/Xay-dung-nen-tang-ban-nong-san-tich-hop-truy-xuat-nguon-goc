import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatMucGioHangDto } from './dto/cap-nhat-muc-gio-hang.dto';
import type { GioHangDto } from './dto/phan-hoi-gio-hang.dto';
import type { ThemMucGioHangDto } from './dto/them-muc-gio-hang.dto';

@Injectable()
export class GioHangService {
  constructor(private readonly prisma: PrismaService) {}

  async lay(nguoiDungId: string): Promise<GioHangDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);

    const gioHang = await this.prisma.gioHang.upsert({
      where: { khachHangId },
      create: { khachHangId },
      update: {},
      select: { id: true },
    });

    return this.layPhanHoi(gioHang.id);
  }

  async them(nguoiDungId: string, dto: ThemMucGioHangDto): Promise<GioHangDto> {
    await this.prisma.$transaction(async (tx) => {
      const khachHangId = await this.layKhachHangIdTx(tx, nguoiDungId);
      const gioHang = await tx.gioHang.upsert({
        where: { khachHangId },
        create: { khachHangId },
        update: {},
        select: { id: true },
      });

      const bienThe = await this.layBienTheBanDuoc(tx, dto.bienTheSanPhamId);

      const hienTai = await tx.mucGioHang.findUnique({
        where: {
          gioHangId_bienTheSanPhamId: {
            gioHangId: gioHang.id,
            bienTheSanPhamId: dto.bienTheSanPhamId,
          },
        },
        select: { id: true, soLuong: true },
      });

      const mucTieu = (hienTai?.soLuong ?? 0) + dto.soLuong;
      this.kiemTraTon(mucTieu, bienThe.soLuongKhaDung);

      if (hienTai) {
        await tx.mucGioHang.update({
          where: { id: hienTai.id },
          data: { soLuong: mucTieu },
        });
      } else {
        await tx.mucGioHang.create({
          data: {
            gioHangId: gioHang.id,
            bienTheSanPhamId: dto.bienTheSanPhamId,
            soLuong: dto.soLuong,
          },
        });
      }
    });

    return this.lay(nguoiDungId);
  }

  async capNhat(
    nguoiDungId: string,
    mucId: string,
    dto: CapNhatMucGioHangDto,
  ): Promise<GioHangDto> {
    await this.prisma.$transaction(async (tx) => {
      const khachHangId = await this.layKhachHangIdTx(tx, nguoiDungId);

      const muc = await tx.mucGioHang.findFirst({
        where: {
          id: mucId,
          gioHang: { khachHangId },
        },
        select: {
          id: true,
          bienTheSanPhamId: true,
        },
      });
      if (!muc) {
        throw new NotFoundException('Không tìm thấy mục giỏ hàng.');
      }

      const bienThe = await this.layBienTheBanDuoc(tx, muc.bienTheSanPhamId);
      this.kiemTraTon(dto.soLuong, bienThe.soLuongKhaDung);

      await tx.mucGioHang.update({
        where: { id: muc.id },
        data: { soLuong: dto.soLuong },
      });
    });

    return this.lay(nguoiDungId);
  }

  async xoa(nguoiDungId: string, mucId: string): Promise<GioHangDto> {
    await this.prisma.$transaction(async (tx) => {
      const khachHangId = await this.layKhachHangIdTx(tx, nguoiDungId);

      const muc = await tx.mucGioHang.findFirst({
        where: {
          id: mucId,
          gioHang: { khachHangId },
        },
        select: { id: true },
      });
      if (!muc) {
        throw new NotFoundException('Không tìm thấy mục giỏ hàng.');
      }

      await tx.mucGioHang.delete({
        where: { id: muc.id },
      });
    });

    return this.lay(nguoiDungId);
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const item = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!item) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return item.id;
  }

  private async layKhachHangIdTx(
    tx: Prisma.TransactionClient,
    nguoiDungId: string,
  ): Promise<string> {
    const item = await tx.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!item) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return item.id;
  }

  private async layBienTheBanDuoc(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<{ soLuongKhaDung: number }> {
    const homNay = this.homNay();

    const item = await tx.bienTheSanPham.findFirst({
      where: {
        id,
        sanPham: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          danhMucSanPham: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
          },
          trangTrai: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            nhaCungCap: {
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
          },
        },
      },
      select: {
        tonKhoLo: {
          where: {
            kho: {
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
            loSanPham: {
              trangThai: TrangThaiLoSanPham.CO_THE_BAN,
              ngayHetHan: { gte: homNay },
            },
          },
          select: {
            onHand: true,
            reserved: true,
            blocked: true,
          },
        },
      },
    });

    if (!item) {
      throw new BadRequestException('Biến thể không tồn tại hoặc không còn được bán.');
    }

    const soLuongKhaDung = this.tinhTon(item.tonKhoLo);
    return { soLuongKhaDung };
  }

  private kiemTraTon(soLuong: number, soLuongKhaDung: number): void {
    if (soLuong > soLuongKhaDung) {
      throw new BadRequestException(`Số lượng vượt tồn khả dụng hiện tại (${soLuongKhaDung}).`);
    }
  }

  private async layPhanHoi(gioHangId: string): Promise<GioHangDto> {
    const homNay = this.homNay();

    const gioHang = await this.prisma.gioHang.findUniqueOrThrow({
      where: { id: gioHangId },
      include: {
        muc: {
          orderBy: { createdAt: 'asc' },
          include: {
            bienTheSanPham: {
              include: {
                sanPham: {
                  include: {
                    trangTrai: {
                      include: {
                        nhaCungCap: true,
                      },
                    },
                  },
                },
                tonKhoLo: {
                  where: {
                    kho: {
                      trangThai: TrangThaiBanGhi.HOAT_DONG,
                    },
                    loSanPham: {
                      trangThai: TrangThaiLoSanPham.CO_THE_BAN,
                      ngayHetHan: { gte: homNay },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      id: gioHang.id,
      khachHangId: gioHang.khachHangId,
      muc: gioHang.muc.map((muc) => {
        const bienThe = muc.bienTheSanPham;
        const sanPham = bienThe.sanPham;
        const trangTrai = sanPham.trangTrai;
        const soLuongKhaDung = this.tinhTon(bienThe.tonKhoLo);

        return {
          id: muc.id,
          soLuong: muc.soLuong,
          bienThe: {
            id: bienThe.id,
            sku: bienThe.sku,
            khoiLuong: Number(bienThe.khoiLuong),
            donVi: bienThe.donVi,
            giaHienTai: Number(bienThe.gia),
            soLuongKhaDung,
            coTheDatHang: soLuongKhaDung >= muc.soLuong,
            sanPham: {
              id: sanPham.id,
              ten: sanPham.ten,
              trangTrai: {
                id: trangTrai.id,
                ten: trangTrai.ten,
                nhaCungCap: {
                  id: trangTrai.nhaCungCap.id,
                  ten: trangTrai.nhaCungCap.ten,
                },
              },
            },
          },
        };
      }),
    };
  }

  private tinhTon(
    items: Array<{
      onHand: Prisma.Decimal;
      reserved: Prisma.Decimal;
      blocked: Prisma.Decimal;
    }>,
  ): number {
    const value = items.reduce(
      (tong, item) => tong + Number(item.onHand) - Number(item.reserved) - Number(item.blocked),
      0,
    );
    return Math.max(0, Number(value.toFixed(3)));
  }

  private homNay(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}
