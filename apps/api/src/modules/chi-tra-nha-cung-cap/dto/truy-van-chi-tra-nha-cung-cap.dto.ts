import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { TrangThaiChiTraNhaCungCap } from '../../../generated/prisma/client';

export class TruyVanChiTraNhaCungCapDto {
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  nhaCungCapId?: string;

  @ApiPropertyOptional({ enum: TrangThaiChiTraNhaCungCap })
  @IsOptional()
  @IsEnum(TrangThaiChiTraNhaCungCap)
  trangThai?: TrangThaiChiTraNhaCungCap;
}
