import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { LyDoKhieuNai } from '../../../generated/prisma/client';

export class TruyVanKhieuNaiDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  gioiHan = 20;

  @ApiPropertyOptional({ enum: LyDoKhieuNai })
  @IsOptional()
  @IsEnum(LyDoKhieuNai)
  lyDo?: LyDoKhieuNai;
}
