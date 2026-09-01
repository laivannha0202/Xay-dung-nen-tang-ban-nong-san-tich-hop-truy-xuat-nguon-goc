import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiVanChuyen } from '../../generated/prisma/client';

import type {
  DanhGiaDto,
  DanhSachDanhGiaSanPhamDto,
  TrangThaiDanhGiaMucDonHangDto,
} from './dto/phan-hoi-danh-gia.dto';
import type { TaoDanhGiaDto } from './dto/tao-danh-gia.dto';
import type { TruyVanDanhGiaSanPhamDto } from './dto/truy-van-danh-gia-san-pham.dto';

@Injectable()
export class DanhGiaService {
  constructor(private readonly prisma: PrismaService) {}

  async tao(nguoiDungId: string, dto: TaoDanhGiaDto): Promise<DanhGiaDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, dto.mucDonHangId);

    if (muc.danhGia) {
      throw new ConflictException('Mục đơn hàng đã được đánh giá.');
    }
    if (muc.donHangNhaCungCap.vanChuyen.length === 0) {
      throw new BadRequestException('Chỉ order item đã giao mới được đánh giá.');
    }

    try {
      const created = await this.prisma.danhGia.create({
        data: {
          mucDonHangId: muc.id,
          diem: dto.diem,
          binhLuan: this.chuanHoaBinhLuan(dto.binhLuan),
        },
        include: this.reviewInclude(),
      });
      return this.mapDanhGia(created);
    } catch (error: unknown) {
      if (this.laUniqueConflict(error)) {
        throw new ConflictException('Mục đơn hàng đã được đánh giá.');
      }
      throw error;
    }
  }

  async layTrangThaiMuc(
    nguoiDungId: string,
    mucDonHangId: string,
  ): Promise<TrangThaiDanhGiaMucDonHangDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, mucDonHangId);
    const daGiao = muc.donHangNhaCungCap.vanChuyen.length > 0;
    const danhGia = muc.danhGia ? await this.layDanhGiaTheoId(muc.danhGia.id) : null;
    return {
      mucDonHangId: muc.id,
      sanPhamId: muc.sanPhamId,
      tenSanPham: muc.tenSanPhamSnapshot,
      sku: muc.skuBienTheSnapshot,
      daGiao,
      coTheDanhGia: daGiao && !danhGia,
      lyDo: danhGia
        ? 'Mục đơn hàng đã được đánh giá.'
        : daGiao
          ? null
          : 'Chỉ order item đã giao mới được đánh giá.',
      danhGia,
    };
  }

  async layDanhSachSanPham(
    sanPhamId: string,
    query: TruyVanDanhGiaSanPhamDto,
  ): Promise<DanhSachDanhGiaSanPhamDto> {
    const sanPham = await this.prisma.sanPham.findFirst({
      where: { id: sanPhamId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: { id: true },
    });
    if (!sanPham) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc không còn public.');
    }

    const where = { mucDonHang: { sanPhamId } };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, aggregate, items] = await Promise.all([
      this.prisma.danhGia.count({ where }),
      this.prisma.danhGia.aggregate({ where, _avg: { diem: true } }),
      this.prisma.danhGia.findMany({
        where,
        include: this.reviewInclude(),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    const avg = aggregate._avg.diem;
    return {
      sanPhamId,
      tong,
      diemTrungBinh: avg === null ? null : Number(Number(avg).toFixed(2)),
      trang: query.trang,
      gioiHan: query.gioiHan,
      items: items.map((item) => this.mapDanhGia(item)),
    };
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const khach = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!khach) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return khach.id;
  }

  private async layMucCuaKhach(khachHangId: string, mucDonHangId: string) {
    const muc = await this.prisma.mucDonHang.findFirst({
      where: {
        id: mucDonHangId,
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
      select: {
        id: true,
        sanPhamId: true,
        tenSanPhamSnapshot: true,
        skuBienTheSnapshot: true,
        danhGia: { select: { id: true } },
        donHangNhaCungCap: {
          select: {
            vanChuyen: {
              where: { trangThai: TrangThaiVanChuyen.DELIVERED },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!muc) {
      throw new NotFoundException('Không tìm thấy mục đơn hàng của khách hiện tại.');
    }
    return muc;
  }

  private async layDanhGiaTheoId(id: string): Promise<DanhGiaDto> {
    const item = await this.prisma.danhGia.findUniqueOrThrow({
      where: { id },
      include: this.reviewInclude(),
    });
    return this.mapDanhGia(item);
  }

  private reviewInclude() {
    return {
      mucDonHang: {
        include: {
          donHangNhaCungCap: {
            include: {
              donHang: {
                include: {
                  khachHang: {
                    include: { nguoiDung: true },
                  },
                },
              },
            },
          },
        },
      },
    } as const;
  }

  private mapDanhGia(item: {
    id: string;
    mucDonHangId: string;
    diem: number;
    binhLuan: string | null;
    createdAt: Date;
    updatedAt: Date;
    mucDonHang: {
      sanPhamId: string;
      donHangNhaCungCap: {
        donHang: {
          khachHang: {
            nguoiDung: { hoTen: string };
          };
        };
      };
    };
  }): DanhGiaDto {
    return {
      id: item.id,
      mucDonHangId: item.mucDonHangId,
      sanPhamId: item.mucDonHang.sanPhamId,
      diem: item.diem,
      binhLuan: item.binhLuan,
      nguoiDanhGia: item.mucDonHang.donHangNhaCungCap.donHang.khachHang.nguoiDung.hoTen,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private chuanHoaBinhLuan(value: string | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private laUniqueConflict(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }
    return (error as { code?: unknown }).code === 'P2002';
  }
}
