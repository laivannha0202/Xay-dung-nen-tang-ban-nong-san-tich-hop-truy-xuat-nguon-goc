import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { NhatKyKiemToanDto, PhanHoiDanhSachNhatKyDto } from './dto/phan-hoi-nhat-ky.dto';
import type { TruyVanNhatKyDto } from './dto/truy-van-nhat-ky.dto';

@Injectable()
export class NhatKyKiemToanService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanNhatKyDto): Promise<PhanHoiDanhSachNhatKyDto> {
    const where: Prisma.NhatKyKiemToanWhereInput = {};
    if (dto.tacNhanId) where.tacNhanId = dto.tacNhanId;
    if (dto.hanhDong) where.hanhDong = dto.hanhDong;
    if (dto.thucThe) where.thucThe = dto.thucThe;
    if (dto.tuNgay || dto.denNgay) {
      where.createdAt = {
        ...(dto.tuNgay ? { gte: new Date(dto.tuNgay) } : {}),
        ...(dto.denNgay ? { lte: new Date(dto.denNgay) } : {}),
      };
    }

    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.nhatKyKiemToan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (dto.trang - 1) * dto.gioiHan,
        take: dto.gioiHan,
      }),
      this.prisma.nhatKyKiemToan.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item): NhatKyKiemToanDto => ({
        id: item.id,
        tacNhanId: item.tacNhanId,
        tacNhan: item.tacNhan,
        hanhDong: item.hanhDong,
        thucThe: item.thucThe,
        thucTheId: item.thucTheId,
        truoc: (item.truoc as Record<string, unknown> | null) ?? null,
        sau: (item.sau as Record<string, unknown> | null) ?? null,
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
        createdAt: item.createdAt,
      })),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }
}
