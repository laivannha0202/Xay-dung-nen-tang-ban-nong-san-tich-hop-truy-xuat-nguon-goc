import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  TrangThaiBanGhi,
  TrangThaiDonHang,
} from '../../generated/prisma/client';

export type MucQuotaFlashSale = {
  mucFlashSaleId: string;
  bienTheSanPhamId: string;
  soLuong: number;
};

type MucQuotaGom = {
  mucFlashSaleId: string;
  soLuong: number;
};

@Injectable()
export class FlashSaleQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  private gom(items: MucQuotaFlashSale[]): MucQuotaGom[] {
    const map = new Map<string, number>();
    for (const item of items) {
      if (!item.mucFlashSaleId || item.soLuong <= 0) continue;
      map.set(item.mucFlashSaleId, (map.get(item.mucFlashSaleId) ?? 0) + item.soLuong);
    }
    return [...map.entries()]
      .map(([mucFlashSaleId, soLuong]) => ({ mucFlashSaleId, soLuong }))
      .sort((a, b) => a.mucFlashSaleId.localeCompare(b.mucFlashSaleId));
  }

  async kiemTraKhachHang(
    khachHangId: string,
    items: MucQuotaFlashSale[],
  ): Promise<string[]> {
    const lyDo: string[] = [];
    for (const item of this.gom(items)) {
      const row = await this.prisma.mucFlashSale.findUnique({
        where: { id: item.mucFlashSaleId },
        select: {
          id: true,
          gioiHanTong: true,
          gioiHanMoiKhach: true,
          soLuongDaBan: true,
          trangThai: true,
          chienDich: {
            select: {
              trangThai: true,
              batDauLuc: true,
              ketThucLuc: true,
            },
          },
        },
      });
      if (!row) {
        lyDo.push('Flash Sale không còn tồn tại.');
        continue;
      }

      const now = new Date();
      if (
        row.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        row.chienDich.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        now < row.chienDich.batDauLuc ||
        now > row.chienDich.ketThucLuc
      ) {
        lyDo.push('Flash Sale đã kết thúc hoặc không còn hoạt động.');
        continue;
      }

      if (row.gioiHanTong !== null && row.soLuongDaBan + item.soLuong > row.gioiHanTong) {
        lyDo.push('Số lượng Flash Sale còn lại không đủ.');
      }

      if (row.gioiHanMoiKhach !== null) {
        const aggregate = await this.prisma.mucDonHang.aggregate({
          where: {
            mucFlashSaleIdSnapshot: row.id,
            donHangNhaCungCap: {
              donHang: {
                khachHangId,
                trangThai: { not: TrangThaiDonHang.DA_HUY },
              },
            },
          },
          _sum: { soLuong: true },
        });
        const daDung = aggregate._sum.soLuong ?? 0;
        if (daDung + item.soLuong > row.gioiHanMoiKhach) {
          lyDo.push(`Bạn đã đạt giới hạn ${row.gioiHanMoiKhach} sản phẩm của Flash Sale này.`);
        }
      }
    }
    return [...new Set(lyDo)];
  }

  async giuTrongTransaction(
    tx: Prisma.TransactionClient,
    khachHangId: string,
    items: MucQuotaFlashSale[],
  ): Promise<void> {
    for (const item of this.gom(items)) {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT id
          FROM muc_flash_sale
          WHERE id = ${item.mucFlashSaleId}
          FOR UPDATE
        `,
      );
      if (locked.length !== 1) {
        throw new BadRequestException('Flash Sale không còn tồn tại.');
      }

      const row = await tx.mucFlashSale.findUnique({
        where: { id: item.mucFlashSaleId },
        select: {
          id: true,
          gioiHanTong: true,
          gioiHanMoiKhach: true,
          soLuongDaBan: true,
          trangThai: true,
          chienDich: {
            select: {
              trangThai: true,
              batDauLuc: true,
              ketThucLuc: true,
            },
          },
        },
      });
      if (!row) throw new BadRequestException('Flash Sale không còn tồn tại.');

      const now = new Date();
      if (
        row.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        row.chienDich.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        now < row.chienDich.batDauLuc ||
        now > row.chienDich.ketThucLuc
      ) {
        throw new BadRequestException('Flash Sale đã kết thúc hoặc không còn hoạt động.');
      }

      if (row.gioiHanTong !== null && row.soLuongDaBan + item.soLuong > row.gioiHanTong) {
        throw new BadRequestException('Số lượng Flash Sale còn lại không đủ.');
      }

      if (row.gioiHanMoiKhach !== null) {
        const aggregate = await tx.mucDonHang.aggregate({
          where: {
            mucFlashSaleIdSnapshot: row.id,
            donHangNhaCungCap: {
              donHang: {
                khachHangId,
                trangThai: { not: TrangThaiDonHang.DA_HUY },
              },
            },
          },
          _sum: { soLuong: true },
        });
        const daDung = aggregate._sum.soLuong ?? 0;
        if (daDung + item.soLuong > row.gioiHanMoiKhach) {
          throw new BadRequestException(
            `Mỗi khách chỉ được mua tối đa ${row.gioiHanMoiKhach} sản phẩm trong Flash Sale này.`,
          );
        }
      }

      await tx.mucFlashSale.update({
        where: { id: row.id },
        data: { soLuongDaBan: { increment: item.soLuong } },
      });
    }
  }

  async hoanTrongTransaction(
    tx: Prisma.TransactionClient,
    items: Array<{ mucFlashSaleId: string | null; soLuong: number }>,
  ): Promise<void> {
    const normalized = this.gom(
      items
        .filter((item): item is { mucFlashSaleId: string; soLuong: number } =>
          Boolean(item.mucFlashSaleId),
        )
        .map((item) => ({
          mucFlashSaleId: item.mucFlashSaleId,
          bienTheSanPhamId: '',
          soLuong: item.soLuong,
        })),
    );

    for (const item of normalized) {
      await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT id
          FROM muc_flash_sale
          WHERE id = ${item.mucFlashSaleId}
          FOR UPDATE
        `,
      );
      await tx.$executeRaw(
        Prisma.sql`
          UPDATE muc_flash_sale
          SET so_luong_da_ban = GREATEST(0, so_luong_da_ban - ${item.soLuong})
          WHERE id = ${item.mucFlashSaleId}
        `,
      );
    }
  }
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
