import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { TrangThaiDonHang } from '../../../generated/prisma/client';

export class LocDonHangQuanTriDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan: number = 20;

  @ApiPropertyOptional({ enum: TrangThaiDonHang })
  @IsOptional()
  @IsEnum(TrangThaiDonHang)
  trangThai?: TrangThaiDonHang;

  @ApiPropertyOptional({ maxLength: 100, description: 'Lọc gần đúng theo mã đơn hàng' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  maDonHang?: string;
}
