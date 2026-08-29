import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class TaoMuaVuDto {
  @ApiProperty()
  @IsUUID()
  trangTraiId!: string;

  @ApiProperty({
    example: 'Cà chua',
  })
  @IsString()
  @Length(2, 150)
  cayTrong!: string;

  @ApiProperty({
    example: 'Cà chua bi',
  })
  @IsString()
  @Length(2, 150)
  giong!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-09-01',
  })
  @IsDateString()
  ngayTrong!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-12-15',
  })
  @IsDateString()
  ngayDuKienThuHoach!: string;

  @ApiProperty({
    type: Number,
    minimum: 0.001,
    example: 12500.5,
    description: 'Sản lượng dự kiến tính theo kilogram',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  sanLuongDuKienKg!: number;

  @ApiPropertyOptional({
    enum: TrangThaiMuaVu,
    default: TrangThaiMuaVu.KE_HOACH,
  })
  @IsOptional()
  @IsEnum(TrangThaiMuaVu)
  trangThai?: TrangThaiMuaVu;
}
