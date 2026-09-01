import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiThanhToan } from '../../../generated/prisma/client';
import { TEN_PAYMENT_GATEWAY, type TenPaymentGateway } from '../gateway/payment-gateway.adapter';

export class HoanTienThanhToanPhanHoiDto {
  @ApiProperty()
  paymentId!: string;

  @ApiProperty()
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ enum: TEN_PAYMENT_GATEWAY })
  gateway!: TenPaymentGateway;

  @ApiProperty()
  maYeuCau!: string;

  @ApiProperty()
  refundTransactionId!: string;

  @ApiProperty()
  maGiaoDichHoanTien!: string;

  @ApiProperty()
  soTienDaThanhToan!: number;

  @ApiProperty()
  soTienHoan!: number;

  @ApiProperty()
  tongDaHoan!: number;

  @ApiProperty()
  conLai!: number;

  @ApiProperty({ enum: TrangThaiThanhToan })
  trangThaiThanhToan!: TrangThaiThanhToan;

  @ApiProperty({ enum: TrangThaiThanhToan })
  trangThaiGiaoDichHoanTien!: TrangThaiThanhToan;

  @ApiProperty()
  daXuLyTruoc!: boolean;
}
