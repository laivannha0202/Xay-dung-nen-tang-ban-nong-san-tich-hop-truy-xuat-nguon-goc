import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LoaiBaoQuan } from '../../../generated/prisma/client';

export class TaoLoTuThuHoachDto {
  @ApiProperty({ example: 'LO-20260918-001' })
  @IsString()
  @Length(2, 100)
  maLo!: string;

  @ApiProperty({ type: Number, minimum: 0.001, example: 500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  soLuong!: number;

  @ApiProperty({ type: String, format: 'date', example: '2026-09-25' })
  @IsDateString()
  ngayHetHan!: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  ngayDongGoi?: string;

  @ApiPropertyOptional({ enum: LoaiBaoQuan, default: LoaiBaoQuan.NHIET_DO_THUONG })
  @IsOptional()
  @IsEnum(LoaiBaoQuan)
  loaiBaoQuan?: LoaiBaoQuan;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  nhietDoMin?: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  nhietDoMax?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  doAmMin?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  doAmMax?: number;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  huongDanBaoQuan?: string;
}
