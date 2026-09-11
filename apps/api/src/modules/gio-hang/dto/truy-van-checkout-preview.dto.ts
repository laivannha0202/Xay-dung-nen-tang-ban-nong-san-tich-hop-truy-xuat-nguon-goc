import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TruyVanCheckoutPreviewDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 80,
    example: 'FRESH50',
    description: 'Mã khuyến mại khách hàng muốn áp dụng. Bỏ trống để không áp dụng.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  maKhuyenMai?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    example: 100,
    description: 'Số điểm khách hàng muốn dùng. 0 hoặc bỏ trống nghĩa là không sử dụng.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diemSuDung?: number;
}
