import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CapNhatCauHinhHeThongDto } from './dto/cap-nhat-cau-hinh-he-thong.dto';
import type { CauHinhHeThongDto } from './dto/phan-hoi-cau-hinh-he-thong.dto';

const CAU_HINH_ID = 1;

const CAU_HINH_MAC_DINH: CauHinhHeThongDto = {
  reservationTtlPhut: 15,
  thoiHanKhieuNaiNgay: 7,
  nguongSapHetHanNgay: 7,
  phiVanChuyenCoBan: 0,
  nguongMienPhiVanChuyen: null,
  giaTriQuyDoiMoiDiem: 0,
};

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type BanGhiCauHinh = {
  reservationTtlPhut: number;
  thoiHanKhieuNaiNgay: number;
  nguongSapHetHanNgay: number;
  phiVanChuyenCoBan: Prisma.Decimal | number;
  nguongMienPhiVanChuyen: Prisma.Decimal | number | null;
  giaTriQuyDoiMoiDiem: Prisma.Decimal | number;
};

@Injectable()
export class CauHinhHeThongService {
  constructor(private readonly prisma: PrismaService) {}

  async layCauHinh(): Promise<CauHinhHeThongDto> {
    const row = await this.prisma.cauHinhHeThong.findUnique({
      where: { id: CAU_HINH_ID },
      select: this.selectFields(),
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
        select: this.selectFields(),
      });

      const current = truoc ? this.toDto(truoc) : { ...CAU_HINH_MAC_DINH };

      const next: CauHinhHeThongDto = {
        reservationTtlPhut: dto.reservationTtlPhut,
        thoiHanKhieuNaiNgay: dto.thoiHanKhieuNaiNgay,
        nguongSapHetHanNgay: dto.nguongSapHetHanNgay,
        phiVanChuyenCoBan: dto.phiVanChuyenCoBan ?? current.phiVanChuyenCoBan,
        nguongMienPhiVanChuyen:
          dto.nguongMienPhiVanChuyen === undefined
            ? current.nguongMienPhiVanChuyen
            : dto.nguongMienPhiVanChuyen,
        giaTriQuyDoiMoiDiem: dto.giaTriQuyDoiMoiDiem ?? current.giaTriQuyDoiMoiDiem,
      };

      const sau = await tx.cauHinhHeThong.upsert({
        where: { id: CAU_HINH_ID },
        create: { id: CAU_HINH_ID, ...next },
        update: { ...next },
        select: this.selectFields(),
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'CAU_HINH_HE_THONG_CAP_NHAT',
          thucThe: 'system_settings',
          thucTheId: String(CAU_HINH_ID),
          truoc: this.snapshot(current),
          sau: this.snapshot(this.toDto(sau)),
          metadata,
        },
      });

      return this.toDto(sau);
    });
  }

  async layReservationTtlMs(): Promise<number> {
    return (await this.layCauHinh()).reservationTtlPhut * 60_000;
  }

  async layThoiHanKhieuNaiNgay(): Promise<number> {
    return (await this.layCauHinh()).thoiHanKhieuNaiNgay;
  }

  async layNguongSapHetHanNgay(): Promise<number> {
    return (await this.layCauHinh()).nguongSapHetHanNgay;
  }

  async layGiaTriQuyDoiMoiDiem(): Promise<number> {
    return (await this.layCauHinh()).giaTriQuyDoiMoiDiem;
  }

  private selectFields() {
    return {
      reservationTtlPhut: true,
      thoiHanKhieuNaiNgay: true,
      nguongSapHetHanNgay: true,
      phiVanChuyenCoBan: true,
      nguongMienPhiVanChuyen: true,
      giaTriQuyDoiMoiDiem: true,
    } as const;
  }

  private toDto(row: BanGhiCauHinh): CauHinhHeThongDto {
    return {
      reservationTtlPhut: row.reservationTtlPhut,
      thoiHanKhieuNaiNgay: row.thoiHanKhieuNaiNgay,
      nguongSapHetHanNgay: row.nguongSapHetHanNgay,
      phiVanChuyenCoBan: Number(row.phiVanChuyenCoBan),
      nguongMienPhiVanChuyen:
        row.nguongMienPhiVanChuyen === null ? null : Number(row.nguongMienPhiVanChuyen),
      giaTriQuyDoiMoiDiem: Number(row.giaTriQuyDoiMoiDiem),
    };
  }

  private snapshot(row: CauHinhHeThongDto): Prisma.InputJsonObject {
    return {
      reservationTtlPhut: row.reservationTtlPhut,
      thoiHanKhieuNaiNgay: row.thoiHanKhieuNaiNgay,
      nguongSapHetHanNgay: row.nguongSapHetHanNgay,
      phiVanChuyenCoBan: row.phiVanChuyenCoBan,
      nguongMienPhiVanChuyen: row.nguongMienPhiVanChuyen,
      giaTriQuyDoiMoiDiem: row.giaTriQuyDoiMoiDiem,
    };
  }
}
