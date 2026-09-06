import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import type { GiaoHangDonHangCuaToiDto } from './dto/phan-hoi-giao-hang-khach.dto';

@Injectable()
export class GiaoHangService {
  constructor(private readonly prisma: PrismaService) {}

  async layTheoDonHangCuaToi(
    nguoiDungId: string,
    donHangId: string,
  ): Promise<GiaoHangDonHangCuaToiDto> {
    const donHang = await this.prisma.donHang.findFirst({
      where: {
        id: donHangId,
        khachHang: {
          nguoiDungId,
        },
      },
      select: {
        id: true,
        maDonHang: true,
        donNhaCungCap: {
          orderBy: {
            maDon: 'asc',
          },
          select: {
            id: true,
            maDon: true,
            nhaCungCap: {
              select: {
                ten: true,
              },
            },
            vanChuyen: {
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                maVanDon: true,
                trangThai: true,
                createdAt: true,
                updatedAt: true,
                suKien: {
                  orderBy: [{ thoiGian: 'asc' }, { id: 'asc' }],
                  select: {
                    id: true,
                    trangThai: true,
                    moTa: true,
                    viTri: true,
                    thoiGian: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!donHang) {
      throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
    }

    return {
      donHangId: donHang.id,
      maDonHang: donHang.maDonHang,
      vanChuyen: donHang.donNhaCungCap.flatMap((suborder) =>
        suborder.vanChuyen.map((shipment) => ({
          id: shipment.id,
          donHangNhaCungCapId: suborder.id,
          maDonNhaCungCap: suborder.maDon,
          tenNhaCungCap: suborder.nhaCungCap.ten,
          maVanDon: shipment.maVanDon,
          trangThai: shipment.trangThai,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
          suKien: shipment.suKien,
        })),
      ),
    };
  }
}
