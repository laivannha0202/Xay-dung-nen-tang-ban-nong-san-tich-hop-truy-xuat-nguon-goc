import { randomBytes } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import QRCode from 'qrcode';

import { PrismaService } from '../../database/prisma.service';

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

    const loBanDau = await this.prisma.loSanPham.findUnique({
      where: {
        id: loSanPhamId,
      },
      select: {
        id: true,
        maLo: true,
        maTruyXuat: true,
      },
    });

    if (!loBanDau) {
      throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
    }

    if (loBanDau.maTruyXuat) {
      return this.render(
        loBanDau as LoQr & {
          maTruyXuat: string;
        },
      );
    }

    for (let lanThu = 0; lanThu < 3; lanThu += 1) {
      const maTruyXuat = this.taoMaTruyXuat();

      try {
        const claim = await this.prisma.loSanPham.updateMany({
          where: {
            id: loSanPhamId,
            maTruyXuat: null,
          },
          data: {
            maTruyXuat,
          },
        });

        if (claim.count === 1) {
          try {
            await this.prisma.nhatKyKiemToan.create({
              data: {
                tacNhanId: actor.id,
                tacNhan: actor.email,
                hanhDong: 'QR_CODE_LO_TAO',
                thucThe: 'lo_san_pham',
                thucTheId: loSanPhamId,
                truoc: {
                  maTruyXuat: null,
                },
                sau: {
                  maTruyXuat,
                },
                metadata,
              },
            });
          } catch (error) {
            await this.prisma.loSanPham.updateMany({
              where: {
                id: loSanPhamId,
                maTruyXuat,
              },
              data: {
                maTruyXuat: null,
              },
            });

            throw error;
          }

          return this.render({
            id: loBanDau.id,
            maLo: loBanDau.maLo,
            maTruyXuat,
          });
        }

        const loDaCoMa = await this.prisma.loSanPham.findUnique({
          where: {
            id: loSanPhamId,
          },
          select: {
            id: true,
            maLo: true,
            maTruyXuat: true,
          },
        });

        if (!loDaCoMa) {
          throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
        }

        if (loDaCoMa.maTruyXuat) {
          return this.render(
            loDaCoMa as LoQr & {
              maTruyXuat: string;
            },
          );
        }
      } catch (error) {
        if (this.laLoiUnique(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Không thể tạo mã truy xuất sau nhiều lần thử.');
  }

  private laLoiUnique(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
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
