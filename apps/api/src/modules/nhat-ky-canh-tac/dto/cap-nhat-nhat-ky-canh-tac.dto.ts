import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import { LoaiSuKienCanhTac } from '../../../generated/prisma/client';

export class CapNhatNhatKyCanhTacDto {
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
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  thoiGian?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 5000)
  noiDung?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hienThiCongKhai?: boolean;
}
