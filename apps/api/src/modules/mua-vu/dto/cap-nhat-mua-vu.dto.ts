import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

import { TrangThaiMuaVu } from '../../../generated/prisma/client';

export class CapNhatMuaVuDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 150)
  cayTrong?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 150)
  giong?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayTrong?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayDuKienThuHoach?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0.001,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  sanLuongDuKienKg?: number;

  @ApiPropertyOptional({
    enum: TrangThaiMuaVu,
  })
  @IsOptional()
  @IsEnum(TrangThaiMuaVu)
  trangThai?: TrangThaiMuaVu;
}
