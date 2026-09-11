import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PhamViGiaoHangService } from '../giao-hang/pham-vi-giao-hang.service';

import { DonHangService } from './don-hang.service';
import type { DonHangPhanHoiDto } from './dto/phan-hoi-don-hang.dto';
import type { TaoDonHangDto } from './dto/tao-don-hang.dto';

@Injectable()
export class DonHangTaoFacadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phamViGiaoHangService: PhamViGiaoHangService,
    private readonly donHangService: DonHangService,
  ) {}

  async tao(nguoiDungId: string, dto: TaoDonHangDto): Promise<DonHangPhanHoiDto> {
    const maDonHang = this.maDonHang(dto.maYeuCau);
    const existing = await this.prisma.donHang.findUnique({
      where: { maDonHang },
      select: {
        id: true,
        khachHang: {
          select: { nguoiDungId: true },
        },
      },
    });

    if (existing) {
      if (existing.khachHang.nguoiDungId !== nguoiDungId) {
        throw new ConflictException('Idempotency key Create Order đã thuộc tài khoản khác.');
      }

      // Replay đúng chủ: không đánh giá lại địa chỉ/cart mutable sau khi Order đã commit.
      return this.donHangService.tao(nguoiDungId, dto);
    }

    // Request mới phải qua hard business rule trước khi reserve inventory.
    await this.phamViGiaoHangService.damBaoDiaChiHopLe(
      nguoiDungId,
      dto.diaChiGiaoHangId,
    );

    return this.donHangService.tao(nguoiDungId, dto);
  }

  private maDonHang(maYeuCau: string): string {
    return 'ORD-' + maYeuCau.replaceAll('-', '').toUpperCase();
  }
}
