import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class TaoDoiSoatDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  nhaCungCapId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Đầu kỳ, inclusive.',
  })
  @IsDateString()
  batDauLuc!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Cuối kỳ, exclusive.',
  })
  @IsDateString()
  ketThucLuc!: string;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    minimum: 0,
    deprecated: true,
    description:
      'DEPRECATED: Số tiền hoàn hiện được tính tự động từ canonical refund_allocation ledger.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hoanTien = 0;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    description: 'Điều chỉnh có dấu: số dương là khoản trừ, số âm là khoản cộng.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  dieuChinh = 0;
}
