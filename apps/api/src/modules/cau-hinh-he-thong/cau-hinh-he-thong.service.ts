import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { CapNhatCauHinhHeThongDto } from './dto/cap-nhat-cau-hinh-he-thong.dto';
import type { CauHinhHeThongDto } from './dto/phan-hoi-cau-hinh-he-thong.dto';

const CAU_HINH_ID = 1;
const CAU_HINH_MAC_DINH: CauHinhHeThongDto = {
  reservationTtlPhut: 15,
  thoiHanKhieuNaiNgay: 7,
  nguongSapHetHanNgay: 7,
};

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type BanGhiCauHinh = {
  reservationTtlPhut: number;
  thoiHanKhieuNaiNgay: number;
  nguongSapHetHanNgay: number;
};

@Injectable()
export class CauHinhHeThongService {
  constructor(private readonly prisma: PrismaService) {}

  async layCauHinh(): Promise<CauHinhHeThongDto> {
    const row = await this.prisma.cauHinhHeThong.findUnique({
      where: { id: CAU_HINH_ID },
      select: {
        reservationTtlPhut: true,
        thoiHanKhieuNaiNgay: true,
        nguongSapHetHanNgay: true,
      },
    });

    return row ? this.toDto(row) : { ...CAU_HINH_MAC_DINH };
  }

  async capNhat(
    tacNhanId: string,
    dto: CapNhatCauHinhHeThongDto,
    metadata: MetadataAudit,
  ): Promise<CauHinhHeThongDto> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: tacNhanId },
      select: { id: true, email: true },
    });
    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    }

    return this.prisma.$transaction(async (tx) => {
      const truoc = await tx.cauHinhHeThong.findUnique({
        where: { id: CAU_HINH_ID },
        select: {
          reservationTtlPhut: true,
          thoiHanKhieuNaiNgay: true,
          nguongSapHetHanNgay: true,
        },
      });

      const sau = await tx.cauHinhHeThong.upsert({
        where: { id: CAU_HINH_ID },
        create: {
          id: CAU_HINH_ID,
          reservationTtlPhut: dto.reservationTtlPhut,
          thoiHanKhieuNaiNgay: dto.thoiHanKhieuNaiNgay,
          nguongSapHetHanNgay: dto.nguongSapHetHanNgay,
        },
        update: {
          reservationTtlPhut: dto.reservationTtlPhut,
          thoiHanKhieuNaiNgay: dto.thoiHanKhieuNaiNgay,
          nguongSapHetHanNgay: dto.nguongSapHetHanNgay,
        },
        select: {
          reservationTtlPhut: true,
          thoiHanKhieuNaiNgay: true,
          nguongSapHetHanNgay: true,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'CAU_HINH_HE_THONG_CAP_NHAT',
          thucThe: 'system_settings',
          thucTheId: String(CAU_HINH_ID),
          truoc: this.snapshot(truoc ?? CAU_HINH_MAC_DINH),
          sau: this.snapshot(sau),
          metadata,
        },
      });

      return this.toDto(sau);
    });
  }

  async layReservationTtlMs(): Promise<number> {
    const settings = await this.layCauHinh();
    return settings.reservationTtlPhut * 60_000;
  }

  async layThoiHanKhieuNaiNgay(): Promise<number> {
    return (await this.layCauHinh()).thoiHanKhieuNaiNgay;
  }

  async layNguongSapHetHanNgay(): Promise<number> {
    return (await this.layCauHinh()).nguongSapHetHanNgay;
  }

  private toDto(row: BanGhiCauHinh): CauHinhHeThongDto {
    return {
      reservationTtlPhut: row.reservationTtlPhut,
      thoiHanKhieuNaiNgay: row.thoiHanKhieuNaiNgay,
      nguongSapHetHanNgay: row.nguongSapHetHanNgay,
    };
  }

  private snapshot(row: BanGhiCauHinh): {
    reservationTtlPhut: number;
    thoiHanKhieuNaiNgay: number;
    nguongSapHetHanNgay: number;
  } {
    return {
      reservationTtlPhut: row.reservationTtlPhut,
      thoiHanKhieuNaiNgay: row.thoiHanKhieuNaiNgay,
      nguongSapHetHanNgay: row.nguongSapHetHanNgay,
    };
  }
}
