import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { LoaiGiaoDichTonKho } from '../../../generated/prisma/client';

export class TruyVanGiaoDichTonKhoDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan: number = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tonKhoLoId?: string;

  @ApiPropertyOptional({ enum: LoaiGiaoDichTonKho })
  @IsOptional()
  @IsEnum(LoaiGiaoDichTonKho)
  loai?: LoaiGiaoDichTonKho;
}
