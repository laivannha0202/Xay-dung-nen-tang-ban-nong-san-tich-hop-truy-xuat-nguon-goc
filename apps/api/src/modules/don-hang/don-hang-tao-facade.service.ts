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
      this.damBaoOwnership(existing.khachHang.nguoiDungId, nguoiDungId);

      // Replay đúng chủ: không đánh giá lại địa chỉ/cart mutable sau khi Order đã commit.
      const result = await this.donHangService.tao(nguoiDungId, dto);
      await this.damBaoOwnershipSauCore(result.id, nguoiDungId);
      return result;
    }

    // Request mới phải qua hard business rule trước khi reserve inventory.
    await this.phamViGiaoHangService.damBaoDiaChiHopLe(
      nguoiDungId,
      dto.diaChiGiaoHangId,
    );

    const result = await this.donHangService.tao(nguoiDungId, dto);
    // Chặn race: nếu một request khác vừa thắng unique maDonHang giữa hai bước,
    // không bao giờ trả Order thuộc tài khoản khác.
    await this.damBaoOwnershipSauCore(result.id, nguoiDungId);
    return result;
  }

  private async damBaoOwnershipSauCore(donHangId: string, nguoiDungId: string): Promise<void> {
    const order = await this.prisma.donHang.findUnique({
      where: { id: donHangId },
      select: {
        khachHang: {
          select: { nguoiDungId: true },
        },
      },
    });

    if (!order) {
      throw new ConflictException('Order biến mất sau Create Order.');
    }

    this.damBaoOwnership(order.khachHang.nguoiDungId, nguoiDungId);
  }

  private damBaoOwnership(ownerId: string, nguoiDungId: string): void {
    if (ownerId !== nguoiDungId) {
      throw new ConflictException('Idempotency key Create Order đã thuộc tài khoản khác.');
    }
  }

  private maDonHang(maYeuCau: string): string {
    return 'ORD-' + maYeuCau.replaceAll('-', '').toUpperCase();
  }
}
