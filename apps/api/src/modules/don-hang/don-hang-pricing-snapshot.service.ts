import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

export type PricingSnapshotDonHang = {
  tamTinhHangHoa: number;
  phiVanChuyen: number;
  maKhuyenMai: string | null;
  giamKhuyenMai: number;
  diemDaDung: number;
  giaTriDiemDaDung: number;
};

@Injectable()
export class DonHangPricingSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async lay(donHangId: string): Promise<PricingSnapshotDonHang> {
    const order = await this.prisma.donHang.findUnique({
      where: { id: donHangId },
      select: {
        tamTinhHangHoa: true,
        phiVanChuyen: true,
        maKhuyenMaiSnapshot: true,
        giamKhuyenMai: true,
        diemDaDung: true,
        giaTriDiemDaDung: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy pricing snapshot của đơn hàng.');
    }

    return {
      tamTinhHangHoa: Number(order.tamTinhHangHoa),
      phiVanChuyen: Number(order.phiVanChuyen),
      maKhuyenMai: order.maKhuyenMaiSnapshot,
      giamKhuyenMai: Number(order.giamKhuyenMai),
      diemDaDung: order.diemDaDung,
      giaTriDiemDaDung: Number(order.giaTriDiemDaDung),
    };
  }
}
