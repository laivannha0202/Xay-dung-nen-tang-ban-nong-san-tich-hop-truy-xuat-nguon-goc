import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../../generated/prisma/client';
import { DiemThuongService } from '../diem-thuong/diem-thuong.service';
import { KhuyenMaiService } from '../khuyen-mai/khuyen-mai.service';

/**
 * Đồng bộ hậu refund sau khi gateway đã xác nhận thành công.
 *
 * - Partial refund: đánh dấu parent order để Web/Mobile/Admin thấy đúng trạng thái.
 * - Full refund: ngoài trạng thái order còn hoàn điểm đã dùng và trả lại một lượt voucher.
 * - Mọi thay đổi DB chạy trong một transaction + lock order, nên retry callback/admin request
 *   không được cộng điểm hoặc giảm usage voucher lần hai.
 */
@Injectable()
export class ThanhToanHoanTienHauXuLyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly diemThuongService: DiemThuongService,
    private readonly khuyenMaiService: KhuyenMaiService,
  ) {}

  async dongBo(thanhToanId: string): Promise<void> {
    const paymentRef = await this.prisma.thanhToan.findUnique({
      where: { id: thanhToanId },
      select: {
        donHangId: true,
        trangThai: true,
      },
    });

    if (
      !paymentRef ||
      (paymentRef.trangThai !== TrangThaiThanhToan.PARTIALLY_REFUNDED &&
        paymentRef.trangThai !== TrangThaiThanhToan.REFUNDED)
    ) {
      return;
    }

    await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`
            SELECT id
            FROM \`order\`
            WHERE id = ${paymentRef.donHangId}
            FOR UPDATE
          `,
        );
        if (locked.length !== 1) return;

        const payment = await tx.thanhToan.findUnique({
          where: { id: thanhToanId },
          select: {
            trangThai: true,
            donHang: {
              select: {
                id: true,
                maDonHang: true,
                khachHangId: true,
                trangThai: true,
                diemDaDung: true,
                maKhuyenMaiSnapshot: true,
              },
            },
          },
        });
        if (!payment) return;

        if (payment.trangThai === TrangThaiThanhToan.PARTIALLY_REFUNDED) {
          if (payment.donHang.trangThai !== TrangThaiDonHang.HOAN_TIEN_TOAN_BO) {
            await tx.donHang.update({
              where: { id: payment.donHang.id },
              data: { trangThai: TrangThaiDonHang.HOAN_TIEN_MOT_PHAN },
            });
          }
          return;
        }

        if (payment.trangThai !== TrangThaiThanhToan.REFUNDED) return;
        if (payment.donHang.trangThai === TrangThaiDonHang.HOAN_TIEN_TOAN_BO) return;

        if (payment.donHang.diemDaDung > 0) {
          await this.diemThuongService.hoanTrongTransaction(tx, {
            khachHangId: payment.donHang.khachHangId,
            diemDaDung: payment.donHang.diemDaDung,
            maDonHang: payment.donHang.maDonHang,
          });
        }

        if (payment.donHang.maKhuyenMaiSnapshot) {
          await this.khuyenMaiService.hoanTacSuDungTheoMaTrongTransaction(
            tx,
            payment.donHang.maKhuyenMaiSnapshot,
          );
        }

        await tx.donHangNhaCungCap.updateMany({
          where: {
            donHangId: payment.donHang.id,
            trangThai: { not: TrangThaiDonHang.HOAN_TIEN_TOAN_BO },
          },
          data: { trangThai: TrangThaiDonHang.HOAN_TIEN_TOAN_BO },
        });

        await tx.donHang.update({
          where: { id: payment.donHang.id },
          data: { trangThai: TrangThaiDonHang.HOAN_TIEN_TOAN_BO },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  }
}
