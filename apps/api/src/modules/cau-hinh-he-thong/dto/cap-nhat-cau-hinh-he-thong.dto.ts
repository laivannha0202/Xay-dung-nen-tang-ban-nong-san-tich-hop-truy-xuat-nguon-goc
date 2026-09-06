import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CapNhatCauHinhHeThongDto {
  @ApiProperty({ type: Number, example: 15, minimum: 1, maximum: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  reservationTtlPhut!: number;

  @ApiProperty({ type: Number, example: 7, minimum: 1, maximum: 365 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  thoiHanKhieuNaiNgay!: number;

  @ApiProperty({ type: Number, example: 7, minimum: 1, maximum: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  nguongSapHetHanNgay!: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    example: 0,
    description: 'Phí vận chuyển cơ bản. Migration mặc định 0 để không tự đặt chính sách phí.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  phiVanChuyenCoBan?: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 500000,
    description: 'Ngưỡng miễn phí vận chuyển. Null nghĩa là chưa áp dụng ngưỡng.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  nguongMienPhiVanChuyen?: number | null;
}
