import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { LoaiSuKienTruyXuat } from '../../../generated/prisma/client';

export class TruyVanSuKienTruyXuatDto {
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
    description: 'Tìm theo mã Lô, địa điểm, cây trồng hoặc trang trại',
  })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  loSanPhamId?: string;

  @ApiPropertyOptional({
    enum: LoaiSuKienTruyXuat,
    enumName: 'LoaiSuKienTruyXuat',
  })
  @IsOptional()
  @IsEnum(LoaiSuKienTruyXuat)
  loai?: LoaiSuKienTruyXuat;

  @ApiPropertyOptional({
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  congKhai?: boolean;
}
