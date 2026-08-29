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

  async ganVaiTro(
    tacNhanId: string,
    nguoiDungId: string,
    maVaiTro: string,
    metadata: { ip: string | null; userAgent: string | null },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const [tacNhan, nguoiDung, vaiTro] = await Promise.all([
        tx.nguoiDung.findUnique({ where: { id: tacNhanId }, select: { id: true, email: true } }),
        tx.nguoiDung.findFirst({
          where: { id: nguoiDungId, trangThai: TrangThaiNguoiDung.HOAT_DONG },
          select: { id: true },
        }),
        tx.vaiTro.findFirst({
          where: { ma: maVaiTro, trangThai: TrangThaiBanGhi.HOAT_DONG },
          select: { id: true },
        }),
      ]);

      if (!tacNhan) throw new NotFoundException('Không tìm thấy tác nhân thực hiện.');
      if (!nguoiDung) throw new NotFoundException('Không tìm thấy người dùng đang hoạt động.');
      if (!vaiTro) throw new NotFoundException('Không tìm thấy vai trò đang hoạt động.');

      const hienTai = await tx.nguoiDungVaiTro.findFirst({
        where: { nguoiDungId, vaiTroId: vaiTro.id },
        select: { id: true, trangThai: true },
      });

      const truoc = { maVaiTro, trangThai: hienTai?.trangThai ?? null };
      const banGhi = hienTai
        ? await tx.nguoiDungVaiTro.update({
            where: { id: hienTai.id },
            data: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          })
        : await tx.nguoiDungVaiTro.create({
            data: { nguoiDungId, vaiTroId: vaiTro.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
          });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: tacNhan.id,
          tacNhan: tacNhan.email,
          hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO',
          thucThe: 'nguoi_dung_vai_tro',
          thucTheId: banGhi.id,
          truoc,
          sau: { maVaiTro, trangThai: TrangThaiBanGhi.HOAT_DONG },
          metadata: { ip: metadata.ip, userAgent: metadata.userAgent, nguoiDungId, maVaiTro },
        },
      });
    });
  }
}
