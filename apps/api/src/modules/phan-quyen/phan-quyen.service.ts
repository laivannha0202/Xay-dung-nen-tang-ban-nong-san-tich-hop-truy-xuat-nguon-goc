import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../../generated/prisma/client';

import type { PhanQuyenNguoiDungDto } from './dto/phan-hoi-phan-quyen.dto';

@Injectable()
export class PhanQuyenService {
  constructor(private readonly prisma: PrismaService) {}

  async layCuaNguoiDung(nguoiDungId: string): Promise<PhanQuyenNguoiDungDto> {
    const nguoiDung = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDungId },
      select: { id: true },
    });

    if (!nguoiDung) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const danhSach = await this.prisma.nguoiDungVaiTro.findMany({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: {
            ma: true,
            trangThai: true,
            vaiTroQuyen: {
              where: {
                trangThai: TrangThaiBanGhi.HOAT_DONG,
              },
              select: {
                quyen: {
                  select: {
                    ma: true,
                    trangThai: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const vaiTro = new Set<string>();
    const quyen = new Set<string>();

    for (const gan of danhSach) {
      if (gan.vaiTro.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        continue;
      }

      vaiTro.add(gan.vaiTro.ma);

      for (const ganQuyen of gan.vaiTro.vaiTroQuyen) {
        if (ganQuyen.quyen.trangThai === TrangThaiBanGhi.HOAT_DONG) {
          quyen.add(ganQuyen.quyen.ma);
        }
      }
    }

    return {
      nguoiDungId,
      vaiTro: [...vaiTro].sort(),
      quyen: [...quyen].sort(),
    };
  }

  async ganVaiTro(nguoiDungId: string, maVaiTro: string): Promise<void> {
    const [nguoiDung, vaiTro] = await Promise.all([
      this.prisma.nguoiDung.findFirst({
        where: {
          id: nguoiDungId,
          trangThai: TrangThaiNguoiDung.HOAT_DONG,
        },
        select: { id: true },
      }),
      this.prisma.vaiTro.findFirst({
        where: {
          ma: maVaiTro,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        select: { id: true },
      }),
    ]);

    if (!nguoiDung) {
      throw new NotFoundException('Không tìm thấy người dùng đang hoạt động.');
    }

    if (!vaiTro) {
      throw new NotFoundException('Không tìm thấy vai trò đang hoạt động.');
    }

    const hienTai = await this.prisma.nguoiDungVaiTro.findFirst({
      where: {
        nguoiDungId,
        vaiTroId: vaiTro.id,
      },
      select: { id: true },
    });

    if (hienTai) {
      await this.prisma.nguoiDungVaiTro.update({
        where: { id: hienTai.id },
        data: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      });
      return;
    }

    await this.prisma.nguoiDungVaiTro.create({
      data: {
        nguoiDungId,
        vaiTroId: vaiTro.id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });
  }
}
