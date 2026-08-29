import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { LoaiSuKienCanhTac } from '../../../generated/prisma/client';

export class TruyVanNhatKyCanhTacDto {
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
    description: 'Tìm theo nội dung, cây trồng, giống hoặc tên trang trại',
  })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  muaVuId?: string;

  @ApiPropertyOptional({
    enum: LoaiSuKienCanhTac,
  })
  @IsOptional()
  @IsEnum(LoaiSuKienCanhTac)
  loaiSuKien?: LoaiSuKienCanhTac;

  @ApiPropertyOptional({
    type: Boolean,
  })
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsOptional()
  @IsBoolean()
  hienThiCongKhai?: boolean;
}
