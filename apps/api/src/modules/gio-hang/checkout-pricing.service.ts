import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

export type KetQuaDinhGiaCoBan = {
  tamTinhHangHoa: number;
  giamKhuyenMai: number;
  giaTriDiemDaDung: number;
  phiVanChuyen: number;
  tongThanhToan: number;
};

export type ThanhPhanGiamCheckout = {
  giamKhuyenMai?: number;
  giaTriDiemDaDung?: number;
};

@Injectable()
export class CheckoutPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async tinh(
    tamTinhHangHoa: number,
    thanhPhan: ThanhPhanGiamCheckout = {},
  ): Promise<KetQuaDinhGiaCoBan> {
    const settings = await this.prisma.cauHinhHeThong.findUnique({
      where: { id: 1 },
      select: {
        phiVanChuyenCoBan: true,
        nguongMienPhiVanChuyen: true,
      },
    });

    const subtotal = this.tien(tamTinhHangHoa);
    const promotion = this.tien(thanhPhan.giamKhuyenMai ?? 0);
    const points = this.tien(thanhPhan.giaTriDiemDaDung ?? 0);

    if (promotion < 0 || points < 0) {
      throw new BadRequestException('Thành phần giảm giá checkout không được âm.');
    }
    if (promotion > subtotal) {
      throw new BadRequestException('Giảm khuyến mại không được vượt tiền hàng.');
    }
    if (points > this.tien(subtotal - promotion)) {
      throw new BadRequestException('Giá trị điểm thưởng không được vượt tiền hàng còn lại.');
    }

    const baseFee = this.tien(Number(settings?.phiVanChuyenCoBan ?? 0));
    const freeThreshold =
      settings?.nguongMienPhiVanChuyen === null || settings?.nguongMienPhiVanChuyen === undefined
        ? null
        : this.tien(Number(settings.nguongMienPhiVanChuyen));

    const shipping = freeThreshold !== null && subtotal >= freeThreshold ? 0 : baseFee;

    return {
      tamTinhHangHoa: subtotal,
      giamKhuyenMai: promotion,
      giaTriDiemDaDung: points,
      phiVanChuyen: shipping,
      tongThanhToan: this.tien(subtotal - promotion - points + shipping),
    };
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }
}
