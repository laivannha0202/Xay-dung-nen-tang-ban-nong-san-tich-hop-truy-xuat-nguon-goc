import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { TrangThaiThanhToan } from '../../../generated/prisma/client';

export class TruyVanThanhToanTaiChinhDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan = 20;

  @ApiPropertyOptional({ enum: TrangThaiThanhToan })
  @IsOptional()
  @IsEnum(TrangThaiThanhToan)
  trangThai?: TrangThaiThanhToan;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phuongThuc?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  maDonHang?: string;
}

export class TruyVanHoanTienTaiChinhDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan = 20;

  @ApiPropertyOptional({ enum: TrangThaiThanhToan })
  @IsOptional()
  @IsEnum(TrangThaiThanhToan)
  trangThai?: TrangThaiThanhToan;
}
