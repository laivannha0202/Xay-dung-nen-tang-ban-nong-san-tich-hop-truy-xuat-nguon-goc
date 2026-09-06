import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

export type KetQuaDinhGiaCoBan = {
  tamTinhHangHoa: number;
  phiVanChuyen: number;
  tongThanhToan: number;
};

@Injectable()
export class CheckoutPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async tinh(tamTinhHangHoa: number): Promise<KetQuaDinhGiaCoBan> {
    const settings = await this.prisma.cauHinhHeThong.findUnique({
      where: { id: 1 },
      select: {
        phiVanChuyenCoBan: true,
        nguongMienPhiVanChuyen: true,
      },
    });

    const subtotal = this.tien(tamTinhHangHoa);
    const baseFee = this.tien(Number(settings?.phiVanChuyenCoBan ?? 0));
    const freeThreshold =
      settings?.nguongMienPhiVanChuyen === null || settings?.nguongMienPhiVanChuyen === undefined
        ? null
        : this.tien(Number(settings.nguongMienPhiVanChuyen));

    const shipping = freeThreshold !== null && subtotal >= freeThreshold ? 0 : baseFee;

    return {
      tamTinhHangHoa: subtotal,
      phiVanChuyen: shipping,
      tongThanhToan: this.tien(subtotal + shipping),
    };
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }
}
