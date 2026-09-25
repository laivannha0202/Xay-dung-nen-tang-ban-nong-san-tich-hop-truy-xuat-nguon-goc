import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import type {
  DanhSachSoDuNhaCungCapDto,
  SoDuNhaCungCapDto,
} from './dto/phan-hoi-so-du-nha-cung-cap.dto';
import type { TruyVanSoDuNhaCungCapDto } from './dto/truy-van-so-du-nha-cung-cap.dto';

const NHA_CUNG_CAP_SO_DU_SELECT = {
  id: true,
  ma: true,
  ten: true,
  soDu: {
    select: {
      dangCho: true,
      khaDung: true,
      tamGiu: true,
      daThanhToan: true,
    },
  },
} satisfies Prisma.NhaCungCapSelect;

type NhaCungCapVoiSoDu = Prisma.NhaCungCapGetPayload<{
  select: typeof NHA_CUNG_CAP_SO_DU_SELECT;
}>;

@Injectable()
export class SoDuNhaCungCapService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: TruyVanSoDuNhaCungCapDto): Promise<DanhSachSoDuNhaCungCapDto> {
    const where: Prisma.NhaCungCapWhereInput = query.nhaCungCapId ? { id: query.nhaCungCapId } : {};
    const skip = (query.trang - 1) * query.gioiHan;

    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.nhaCungCap.count({ where }),
      this.prisma.nhaCungCap.findMany({
        where,
        select: NHA_CUNG_CAP_SO_DU_SELECT,
        orderBy: [{ ten: 'asc' }, { id: 'asc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.mapSoDu(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layTheoNhaCungCap(nhaCungCapId: string): Promise<SoDuNhaCungCapDto> {
    const row = await this.prisma.nhaCungCap.findUnique({
      where: { id: nhaCungCapId },
      select: NHA_CUNG_CAP_SO_DU_SELECT,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp.');
    }
    return this.mapSoDu(row);
  }

  async congDangChoTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await tx.soDuNhaCungCap.upsert({
      where: { nhaCungCapId },
      create: { nhaCungCapId, dangCho: soTien },
      update: { dangCho: { increment: soTien } },
    });
  }

  async chuyenDangChoSangKhaDungTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const row = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
      select: { dangCho: true },
    });
    if (!row || this.toCents(Number(row.dangCho)) < this.toCents(soTien)) {
      throw new BadRequestException(
        'Số dư đang chờ không đủ để giải phóng settlement sang khả dụng.',
      );
    }
    await tx.soDuNhaCungCap.update({
      where: { nhaCungCapId },
      data: {
        dangCho: { decrement: soTien },
        khaDung: { increment: soTien },
      },
    });
  }

  async congKhaDungTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await tx.soDuNhaCungCap.upsert({
      where: { nhaCungCapId },
      create: {
        nhaCungCapId,
        khaDung: soTien,
      },
      update: {
        khaDung: {
          increment: soTien,
        },
      },
    });
  }

  async giuTienChiTraTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const row = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
      select: { khaDung: true },
    });
    if (!row || this.toCents(Number(row.khaDung)) < this.toCents(soTien)) {
      throw new BadRequestException('Số dư khả dụng không đủ để tạo yêu cầu chi trả.');
    }
    await tx.soDuNhaCungCap.update({
      where: { nhaCungCapId },
      data: {
        khaDung: { decrement: soTien },
        tamGiu: { increment: soTien },
      },
    });
  }

  async xacNhanChiTraThanhCongTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const row = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
      select: { tamGiu: true },
    });
    if (!row || this.toCents(Number(row.tamGiu)) < this.toCents(soTien)) {
      throw new BadRequestException('Số dư tạm giữ không đủ để xác nhận chi trả.');
    }
    await tx.soDuNhaCungCap.update({
      where: { nhaCungCapId },
      data: {
        tamGiu: { decrement: soTien },
        daThanhToan: { increment: soTien },
      },
    });
  }

  async hoanTraChiTraThatBaiTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
  ): Promise<void> {
    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const row = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
      select: { tamGiu: true },
    });
    if (!row || this.toCents(Number(row.tamGiu)) < this.toCents(soTien)) {
      throw new BadRequestException('Số dư tạm giữ không đủ để hoàn trả payout thất bại.');
    }
    await tx.soDuNhaCungCap.update({
      where: { nhaCungCapId },
      data: {
        tamGiu: { decrement: soTien },
        khaDung: { increment: soTien },
      },
    });
  }

  /**
   * Reconcile refund tác động vào số dư nhà cung cấp và ghi nợ theo ma trận trạng thái:
   * CASE A: CHUA_DOI_SOAT -> Không đổi seller_balance, canonical refund_allocation sẽ trừ future payable.
   * CASE B: DANG_CHO -> Giảm seller_balance.dangCho.
   * CASE C: KHA_DUNG -> Giảm seller_balance.khaDung.
   * CASE D & E: Payout REQUESTED / PROCESSING:
   *   Tiền đang nằm ở tamGiu. Reconcile từ tamGiu (giảm tamGiu, giảm payout amount).
   * CASE F: Payout PAID:
   *   Payout đã PAID, daThanhToan đã tăng. Không sửa/xóa payout cũ!
   *   Tạo bản ghi NoNhaCungCap (Supplier Debt / liability) mới ở trạng thái OPEN.
   */
  async xuLyRefundChoSettlementTrongGiaoDich(
    tx: Prisma.TransactionClient,
    doiSoatId: string,
    nhaCungCapId: string,
    soTien: number,
    thanhToanId: string,
    mucDonHangId?: string,
  ): Promise<void> {
    const settlement = await tx.doiSoatNhaCungCap.findUnique({
      where: { id: doiSoatId },
      include: {
        chiTra: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!settlement) return;

    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const balance = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
    });
    if (!balance) return;

    // Tìm payout liên quan (nếu có)
    const latestPayout = settlement.chiTra[0];

    if (!latestPayout) {
      // Chưa có payout
      if (settlement.trangThai === 'DANG_CHO') {
        const dangCho = Number(balance.dangCho);
        const tru = Math.min(dangCho, soTien);
        if (tru > 0) {
          await tx.soDuNhaCungCap.update({
            where: { nhaCungCapId },
            data: { dangCho: { decrement: tru } },
          });
        }
      } else if (settlement.trangThai === 'KHA_DUNG') {
        const khaDung = Number(balance.khaDung);
        const tru = Math.min(khaDung, soTien);
        if (tru > 0) {
          await tx.soDuNhaCungCap.update({
            where: { nhaCungCapId },
            data: { khaDung: { decrement: tru } },
          });
        }
      }
      return;
    }

    // Có payout
    if (latestPayout.trangThai === 'REQUESTED' || latestPayout.trangThai === 'PROCESSING') {
      // Tiền đang ở seller_balance.tamGiu!
      const tamGiu = Number(balance.tamGiu);
      const tru = Math.min(tamGiu, soTien);
      if (tru > 0) {
        await tx.soDuNhaCungCap.update({
          where: { nhaCungCapId },
          data: { tamGiu: { decrement: tru } },
        });
        // Đồng thời cập nhật giảm amount của payout tương ứng để payout khi đi tiếp không bị trả thừa
        const payoutAmount = Number(latestPayout.soTien);
        const payoutMoi = Math.max(0, payoutAmount - tru);
        await tx.chiTraNhaCungCap.update({
          where: { id: latestPayout.id },
          data: { soTien: payoutMoi },
        });
      }
    } else if (latestPayout.trangThai === 'PAID') {
      // Payout đã PAID! Không sửa payout history, không âm daThanhToan!
      // Ghi nhận công nợ mới (Supplier Debt)
      await tx.noNhaCungCap.create({
        data: {
          nhaCungCapId,
          thanhToanId,
          mucDonHangId: mucDonHangId ?? null,
          chiTraId: latestPayout.id,
          soTien,
          lyDo: `Refund sau khi payout ${latestPayout.id} đã hoàn tất thanh toán (PAID).`,
          trangThai: 'OPEN',
        },
      });
    } else {
      // FAILED: Tiền đã được hoàn lại khaDung từ trước
      const khaDung = Number(balance.khaDung);
      const tru = Math.min(khaDung, soTien);
      if (tru > 0) {
        await tx.soDuNhaCungCap.update({
          where: { nhaCungCapId },
          data: { khaDung: { decrement: tru } },
        });
      }
    }
  }

  /**
   * Reconcile refund tác động vào số dư nhà cung cấp theo trạng thái settlement/payout
   */
  async truSoDuTheoRefundTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
    soTien: number,
    settlementTrangThai: 'CHUA_DOI_SOAT' | 'DANG_CHO' | 'KHA_DUNG',
  ): Promise<void> {
    await this.khoaSoDuTrongGiaoDich(tx, nhaCungCapId);
    const row = await tx.soDuNhaCungCap.findUnique({
      where: { nhaCungCapId },
      select: { dangCho: true, khaDung: true },
    });
    if (!row) return;

    if (settlementTrangThai === 'DANG_CHO') {
      const dangCho = Number(row.dangCho);
      const tru = Math.min(dangCho, soTien);
      if (tru > 0) {
        await tx.soDuNhaCungCap.update({
          where: { nhaCungCapId },
          data: { dangCho: { decrement: tru } },
        });
      }
    } else if (settlementTrangThai === 'KHA_DUNG') {
      const khaDung = Number(row.khaDung);
      const tru = Math.min(khaDung, soTien);
      if (tru > 0) {
        await tx.soDuNhaCungCap.update({
          where: { nhaCungCapId },
          data: { khaDung: { decrement: tru } },
        });
      }
    }
    // CHUA_DOI_SOAT: không đổi seller_balance vì chưa kết chuyển vào settlement;
    // tiền refund đã tự động giảm future payable qua canonical refund ledger.
  }

  private async khoaSoDuTrongGiaoDich(
    tx: Prisma.TransactionClient,
    nhaCungCapId: string,
  ): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ supplier_id: string }>>(
      Prisma.sql`SELECT supplier_id FROM seller_balance WHERE supplier_id = ${nhaCungCapId} FOR UPDATE`,
    );
    if (rows.length !== 1) {
      throw new BadRequestException('Nhà cung cấp chưa có số dư để chi trả.');
    }
  }

  private toCents(value: number): number {
    return Math.round(value * 100);
  }
  private mapSoDu(row: NhaCungCapVoiSoDu): SoDuNhaCungCapDto {
    return {
      nhaCungCapId: row.id,
      maNhaCungCap: row.ma,
      tenNhaCungCap: row.ten,
      dangCho: Number(row.soDu?.dangCho ?? 0),
      khaDung: Number(row.soDu?.khaDung ?? 0),
      tamGiu: Number(row.soDu?.tamGiu ?? 0),
      daThanhToan: Number(row.soDu?.daThanhToan ?? 0),
    };
  }
}
