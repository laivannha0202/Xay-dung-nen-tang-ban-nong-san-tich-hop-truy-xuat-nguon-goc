import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { CapNhatCauHinhHeThongDto } from './dto/cap-nhat-cau-hinh-he-thong.dto';
import type { CauHinhHeThongDto } from './dto/phan-hoi-cau-hinh-he-thong.dto';

const CAU_HINH_ID = 1;
const KHOA_CACHE_CAU_HINH = 'cau-hinh-he-thong:v1';

/**
 * TTL chỉ là lưới an toàn, KHÔNG phải cơ chế đảm bảo độ mới.
 *
 * `capNhat()` xoá khoá ngay khi ghi xong nên đổi cấu hình có hiệu lực tức thì.
 * TTL chỉ bảo vệ khi Redis bị sập giữa lúc ghi: nếu lúc đó không xoá được,
 * sau tối đa 30 giây cấu hình vẫn tự lành.
 */
const TTL_CACHE_CAU_HINH_GIAY = 30;

const CAU_HINH_MAC_DINH: CauHinhHeThongDto = {
  reservationTtlPhut: 15,
  thoiHanKhieuNaiNgay: 7,
  nguongSapHetHanNgay: 7,
  nguongTonKhoToiThieuNgay: 15,
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
  nguongTonKhoToiThieuNgay: number;
  phiVanChuyenCoBan: Prisma.Decimal | number;
  nguongMienPhiVanChuyen: Prisma.Decimal | number | null;
  giaTriQuyDoiMoiDiem: Prisma.Decimal | number;
};

@Injectable()
export class CauHinhHeThongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Đọc cấu hình hệ thống qua cache read-through.
   *
   * Vì sao cache ở đây mà KHÔNG cache trong `QuyenGuard`:
   *   - Cấu hình là một hàng duy nhất, đọc nhiều (mỗi lần chạy job cảnh báo hết
   *     hạn lại đọc `nguongSapHetHanNgay`), ghi ít và có đường vô hiệm hoá rõ
   *     ràng ngay trong `capNhat()`.
   *   - Quyền thì ngược lại: test RBAC đổi vai trò rồi gọi API ngay, và
   *     `phan-quyen-quan-tri` cập nhật xong phải có hiệu lực ngay. Cache quyền
   *     sẽ sinh false negative trong chính test bảo vệ nó — nên `QuyenGuard`
   *     cố ý đọc thẳng DB.
   *
   * Nếu Redis lỗi thì đọc thẳng DB thay vì làm request thất bại: cache là tối
   * ưu hoá, không phải điều kiện đúng đắn.
   */
  async layCauHinh(): Promise<CauHinhHeThongDto> {
    const napCauHinh = async (): Promise<CauHinhHeThongDto> => {
      const row = await this.prisma.cauHinhHeThong.findUnique({
        where: { id: CAU_HINH_ID },
        select: this.selectFields(),
      });

      return row ? this.toDto(row) : { ...CAU_HINH_MAC_DINH };
    };

    try {
      return await this.redis.layJsonKemNut(
        KHOA_CACHE_CAU_HINH,
        TTL_CACHE_CAU_HINH_GIAY,
        napCauHinh,
      );
    } catch {
      return napCauHinh();
    }
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

    const ketQua = await this.prisma.$transaction(async (tx) => {
      const truoc = await tx.cauHinhHeThong.findUnique({
        where: { id: CAU_HINH_ID },
        select: this.selectFields(),
      });

      const current = truoc ? this.toDto(truoc) : { ...CAU_HINH_MAC_DINH };

      const next: CauHinhHeThongDto = {
        reservationTtlPhut: dto.reservationTtlPhut,
        thoiHanKhieuNaiNgay: dto.thoiHanKhieuNaiNgay,
        nguongSapHetHanNgay: dto.nguongSapHetHanNgay,
        nguongTonKhoToiThieuNgay: dto.nguongTonKhoToiThieuNgay ?? current.nguongTonKhoToiThieuNgay,
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

    // Vô hiệu hoá cache SAU khi transaction commit. Xoá trước khi commit sẽ để
    // lại cache cũ nếu transaction rollback.
    try {
      await this.redis.xoa(KHOA_CACHE_CAU_HINH);
    } catch {
      // Redis lỗi: cache cũ tự hết hạn sau TTL ngắn, không được làm hỏng
      // thao tác cập nhật cấu hình.
    }

    return ketQua;
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

  async layNguongTonKhoToiThieuNgay(): Promise<number> {
    return (await this.layCauHinh()).nguongTonKhoToiThieuNgay ?? 0;
  }

  async layGiaTriQuyDoiMoiDiem(): Promise<number> {
    return (await this.layCauHinh()).giaTriQuyDoiMoiDiem;
  }

  private selectFields() {
    return {
      reservationTtlPhut: true,
      thoiHanKhieuNaiNgay: true,
      nguongSapHetHanNgay: true,
      nguongTonKhoToiThieuNgay: true,
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
      nguongTonKhoToiThieuNgay: Number(row.nguongTonKhoToiThieuNgay),
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
      nguongTonKhoToiThieuNgay: row.nguongTonKhoToiThieuNgay,
      phiVanChuyenCoBan: row.phiVanChuyenCoBan,
      nguongMienPhiVanChuyen: row.nguongMienPhiVanChuyen,
      giaTriQuyDoiMoiDiem: row.giaTriQuyDoiMoiDiem,
    };
  }
}
