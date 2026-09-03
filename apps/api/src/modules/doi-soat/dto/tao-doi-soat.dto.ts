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
    default: 0,
    minimum: 0,
    description:
      'Refund đã được quy thuộc cho supplier trong kỳ. Payment refund hiện chưa lưu allocation theo supplier.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hoanTien = 0;

  @ApiPropertyOptional({
    default: 0,
    description: 'Điều chỉnh có dấu: số dương là khoản trừ, số âm là khoản cộng.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  dieuChinh = 0;
}
