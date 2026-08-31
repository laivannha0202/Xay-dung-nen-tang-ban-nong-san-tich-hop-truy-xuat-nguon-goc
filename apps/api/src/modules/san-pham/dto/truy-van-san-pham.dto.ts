import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class TruyVanSanPhamDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan: number = 20;

  @ApiPropertyOptional({
    description: 'Tìm theo tên sản phẩm',
  })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  danhMucSanPhamId?: string;

  @ApiPropertyOptional({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  @IsOptional()
  @IsEnum(TrangThaiBanGhi)
  trangThai?: TrangThaiBanGhi;
}
