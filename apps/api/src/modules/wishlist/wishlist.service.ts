import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';

import type {
  DanhSachSanPhamYeuThichDto,
  TrangThaiSanPhamYeuThichDto,
} from './dto/phan-hoi-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(nguoiDungId: string): Promise<DanhSachSanPhamYeuThichDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const rows = await this.prisma.sanPhamYeuThich.findMany({
      where: {
        khachHangId,
        sanPham: this.whereSanPhamCongKhai(),
      },
      include: {
        sanPham: {
          include: {
            trangTrai: true,
            anh: {
              where: {
                tepTin: {
                  trangThai: TrangThaiBanGhi.HOAT_DONG,
                  mimeType: { startsWith: 'image/' },
                },
              },
              orderBy: [{ laAnhBia: 'desc' }, { thuTu: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      duLieu: await Promise.all(
        rows.map(async (row) => {
          const anhBia = row.sanPham.anh[0] ?? null;
          return {
            sanPhamId: row.sanPhamId,
            ten: row.sanPham.ten,
            moTa: row.sanPham.moTa,
            anhBiaUrl: anhBia
              ? await this.tepTinService.taoSignedUrlAnhNoiBo(anhBia.tepTinId)
              : null,
            trangTraiId: row.sanPham.trangTraiId,
            tenTrangTrai: row.sanPham.trangTrai.ten,
            createdAt: row.createdAt,
          };
        }),
      ),
      tong: rows.length,
    };
  }

  async layTrangThai(nguoiDungId: string, sanPhamId: string): Promise<TrangThaiSanPhamYeuThichDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const count = await this.prisma.sanPhamYeuThich.count({
      where: { khachHangId, sanPhamId },
    });
    return { sanPhamId, daYeuThich: count > 0 };
  }

  async them(nguoiDungId: string, sanPhamId: string): Promise<TrangThaiSanPhamYeuThichDto> {
    const [khachHangId] = await Promise.all([
      this.khachHangBatBuoc(nguoiDungId),
      this.sanPhamCongKhaiBatBuoc(sanPhamId),
    ]);

    await this.prisma.sanPhamYeuThich.upsert({
      where: {
        khachHangId_sanPhamId: {
          khachHangId,
          sanPhamId,
        },
      },
      create: { khachHangId, sanPhamId },
      update: {},
    });

    return { sanPhamId, daYeuThich: true };
  }

  async xoa(nguoiDungId: string, sanPhamId: string): Promise<TrangThaiSanPhamYeuThichDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    await this.prisma.sanPhamYeuThich.deleteMany({
      where: { khachHangId, sanPhamId },
    });
    return { sanPhamId, daYeuThich: false };
  }

  private async khachHangBatBuoc(nguoiDungId: string): Promise<string> {
    const item = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      select: { id: true, trangThai: true },
    });
    if (!item || item.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng đang hoạt động.');
    }
    return item.id;
  }

  private async sanPhamCongKhaiBatBuoc(sanPhamId: string): Promise<void> {
    const item = await this.prisma.sanPham.findFirst({
      where: {
        AND: [this.whereSanPhamCongKhai(), { id: sanPhamId }],
      },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm công khai để yêu thích.');
    }
  }

  private whereSanPhamCongKhai(): Prisma.SanPhamWhereInput {
    return {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      trangTrai: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
      },
      danhMucSanPham: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      bienThe: { some: {} },
    };
  }
}
