import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export type PhanBoHoanTienDto = {
  id: string;
  thanhToanId: string;
  donHangId: string;
  mucDonHangId: string;
  nhaCungCapId: string;
  soTienPhanBo: number;
  tongSoTienHoan: number;
  maYeuCau: string;
  createdAt: string;
};

export type TaoPhanBoHoanTienInput = {
  thanhToanId: string;
  mucDonHangId: string;
  nhaCungCapId: string;
  soTienPhanBo: number;
  maYeuCau: string;
};

@Injectable()
export class PhanBoHoanTienService {
  constructor(private readonly prisma: PrismaService) {}

  async phanBoTuRefund(input: TaoPhanBoHoanTienInput, tongSoTienHoan: number): Promise<PhanBoHoanTienDto> {
    const cents = Math.round(input.soTienPhanBo * 100);
    if (cents <= 0) {
      throw new Error('Số tiền phân bổ phải > 0.');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM payment WHERE id = ${input.thanhToanId} FOR UPDATE`,
      );
      if (locked.length !== 1) {
        throw new Error('Không tìm thấy payment để phân bổ hoàn tiền.');
      }

      const payment = await tx.thanhToan.findUnique({
        where: { id: input.thanhToanId },
        select: { id: true, donHangId: true },
      });
      if (!payment) {
        throw new Error('Payment không tồn tại.');
      }

      const existing = await tx.phanBoHoanTien.findFirst({
        where: {
          thanhToanId: input.thanhToanId,
          mucDonHangId: input.mucDonHangId,
          maYeuCau: input.maYeuCau,
        },
      });
      if (existing) {
        return this.map(existing);
      }

      const created = await tx.phanBoHoanTien.create({
        data: {
          thanhToanId: input.thanhToanId,
          donHangId: payment.donHangId,
          mucDonHangId: input.mucDonHangId,
          nhaCungCapId: input.nhaCungCapId,
          soTienPhanBo: input.soTienPhanBo,
          tongSoTienHoan,
          maYeuCau: input.maYeuCau,
        },
      });

      return this.map(created);
    });
  }

  async layTheoDonHang(donHangId: string): Promise<PhanBoHoanTienDto[]> {
    const rows = await this.prisma.phanBoHoanTien.findMany({
      where: { donHangId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.map(row));
  }

  private map(row: Prisma.PhanBoHoanTienGetPayload<Record<string, never>>): PhanBoHoanTienDto {
    return {
      id: row.id,
      thanhToanId: row.thanhToanId,
      donHangId: row.donHangId,
      mucDonHangId: row.mucDonHangId,
      nhaCungCapId: row.nhaCungCapId,
      soTienPhanBo: Number(row.soTienPhanBo),
      tongSoTienHoan: Number(row.tongSoTienHoan),
      maYeuCau: row.maYeuCau,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
