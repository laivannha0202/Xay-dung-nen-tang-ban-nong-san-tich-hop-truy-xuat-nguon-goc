import { randomBytes } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import QRCode from 'qrcode';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

import type { QrCodeLoSanPhamDto } from './dto/phan-hoi-qr-code.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type LoQr = {
  id: string;
  maLo: string;
  maTruyXuat: string | null;
};

@Injectable()
export class QrCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async layTheoLo(loSanPhamId: string): Promise<QrCodeLoSanPhamDto> {
    const lo = await this.prisma.loSanPham.findUnique({
      where: {
        id: loSanPhamId,
      },
      select: {
        id: true,
        maLo: true,
        maTruyXuat: true,
      },
    });

    if (!lo) {
      throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
    }

    if (!lo.maTruyXuat) {
      throw new NotFoundException('Lô chưa có QR Code.');
    }

    return this.render(
      lo as LoQr & {
        maTruyXuat: string;
      },
    );
  }

  async taoHoacLay(
    tacNhanId: string,
    loSanPhamId: string,
    metadata: MetadataAudit,
  ): Promise<QrCodeLoSanPhamDto> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: {
        id: tacNhanId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }

    let loSau: LoQr | null = null;

    try {
      loSau = await this.prisma.$transaction(async (tx) => {
        await this.khoaLo(tx, loSanPhamId);

        const lo = await tx.loSanPham.findUnique({
          where: {
            id: loSanPhamId,
          },
          select: {
            id: true,
            maLo: true,
            maTruyXuat: true,
          },
        });

        if (!lo) {
          throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
        }

        if (lo.maTruyXuat) {
          return lo;
        }

        const maTruyXuat = this.taoMaTruyXuat();

        const updated = await tx.loSanPham.update({
          where: {
            id: lo.id,
          },
          data: {
            maTruyXuat,
          },
          select: {
            id: true,
            maLo: true,
            maTruyXuat: true,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'QR_CODE_LO_TAO',
            thucThe: 'lo_san_pham',
            thucTheId: lo.id,
            truoc: {
              maTruyXuat: null,
            },
            sau: {
              maTruyXuat,
            },
            metadata,
          },
        });

        return updated;
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Xung đột mã truy xuất. Hãy thực hiện lại thao tác.');
      }

      throw error;
    }

    if (!loSau || !loSau.maTruyXuat) {
      throw new ConflictException('Không thể tạo mã truy xuất cho Lô.');
    }

    return this.render(
      loSau as LoQr & {
        maTruyXuat: string;
      },
    );
  }

  private async khoaLo(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
      }>
    >`
        SELECT id
        FROM lo_san_pham
        WHERE id = ${id}
        FOR UPDATE
      `;

    if (rows.length !== 1) {
      throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
    }
  }

  private taoMaTruyXuat(): string {
    return 'AGM-' + randomBytes(16).toString('hex').toUpperCase();
  }

  private async render(
    lo: LoQr & {
      maTruyXuat: string;
    },
  ): Promise<QrCodeLoSanPhamDto> {
    const payload = lo.maTruyXuat;

    const [pngDataUrl, svg] = await Promise.all([
      QRCode.toDataURL(payload, {
        type: 'image/png',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 512,
      }),
      QRCode.toString(payload, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 512,
      }),
    ]);

    return {
      loSanPhamId: lo.id,
      maLo: lo.maLo,
      maTruyXuat: lo.maTruyXuat,
      payload,
      pngDataUrl,
      svg,
    };
  }
}
