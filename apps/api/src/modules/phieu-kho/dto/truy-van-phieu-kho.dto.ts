import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { LoaiPhieuKho, TrangThaiPhieuKho } from '../../../generated/prisma/client';

export class TruyVanPhieuKhoDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timKiem?: string;

  @ApiPropertyOptional({ enum: LoaiPhieuKho })
  @IsEnum(LoaiPhieuKho)
  @IsOptional()
  loai?: LoaiPhieuKho;

  @ApiPropertyOptional({ enum: TrangThaiPhieuKho })
  @IsEnum(TrangThaiPhieuKho)
  @IsOptional()
  trangThai?: TrangThaiPhieuKho;

  @ApiPropertyOptional({ description: 'Mã kho nguồn hoặc kho đích' })
  @IsString()
  @IsOptional()
  maKho?: string;

  @ApiPropertyOptional({ description: 'Mã lô sản phẩm' })
  @IsString()
  @IsOptional()
  maLo?: string;

  @ApiPropertyOptional({ description: 'SKU biến thể' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Email/người lập phiếu' })
  @IsString()
  @IsOptional()
  nguoiLap?: string;

  @ApiPropertyOptional({ minimum: 0.001 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @IsOptional()
  soLuongTu?: number;

  @ApiPropertyOptional({ minimum: 0.001 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @IsOptional()
  soLuongDen?: number;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  tuNgay?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  denNgay?: string;
}
