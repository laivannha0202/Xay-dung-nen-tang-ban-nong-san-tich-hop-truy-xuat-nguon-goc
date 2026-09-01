import { ApiProperty } from '@nestjs/swagger';

export class PhanHoiCallbackThanhToanDto {
  @ApiProperty()
  gateway!: string;

  @ApiProperty()
  paymentId!: string;

  @ApiProperty()
  transactionId!: string;

  @ApiProperty()
  maGiaoDich!: string;

  @ApiProperty()
  trangThaiThanhToan!: string;

  @ApiProperty()
  trangThaiGiaoDich!: string;

  @ApiProperty()
  trangThaiDatCho!: string;

  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  daXuLyTruoc!: boolean;
}
