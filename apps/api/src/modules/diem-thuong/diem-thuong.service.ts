import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';

import type {
  DanhSachGiaoDichDiemThuongDto,
  TongQuanDiemThuongDto,
} from './dto/phan-hoi-diem-thuong.dto';
import type { TruyVanGiaoDichDiemThuongDto } from './dto/truy-van-giao-dich-diem-thuong.dto';

@Injectable()
export class DiemThuongService {
  constructor(private readonly prisma: PrismaService) {}

  async layTongQuan(nguoiDungId: string): Promise<TongQuanDiemThuongDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const taiKhoan = await this.prisma.taiKhoanLoyalty.findUnique({
      where: { khachHangId },
      select: {
        diem: true,
        updatedAt: true,
        _count: { select: { giaoDich: true } },
      },
    });

    if (!taiKhoan) {
      return {
        diem: 0,
        tongGiaoDich: 0,
        capNhatLuc: null,
      };
    }

    return {
      diem: taiKhoan.diem,
      tongGiaoDich: taiKhoan._count.giaoDich,
      capNhatLuc: taiKhoan.updatedAt,
    };
  }

  async layGiaoDich(
    nguoiDungId: string,
    query: TruyVanGiaoDichDiemThuongDto,
  ): Promise<DanhSachGiaoDichDiemThuongDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const taiKhoan = await this.prisma.taiKhoanLoyalty.findUnique({
      where: { khachHangId },
      select: { id: true },
    });

    if (!taiKhoan) {
      return {
        items: [],
        tong: 0,
        trang: query.trang,
        gioiHan: query.gioiHan,
      };
    }

    const where = { loyaltyAccountId: taiKhoan.id };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, items] = await this.prisma.$transaction([
      this.prisma.giaoDichLoyalty.count({ where }),
      this.prisma.giaoDichLoyalty.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
        select: {
          id: true,
          bienDongDiem: true,
          soDuSau: true,
          lyDo: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items,
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const khachHang = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });

    if (!khachHang) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }

    return khachHang.id;
  }
}
