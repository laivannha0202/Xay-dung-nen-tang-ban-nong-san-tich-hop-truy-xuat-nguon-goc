import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

import { TrangThaiKhieuNai } from '../../../generated/prisma/client';

export class CapNhatXuLyKhieuNaiDto {
  @ApiProperty({ enum: TrangThaiKhieuNai })
  @IsEnum(TrangThaiKhieuNai)
  trangThai!: TrangThaiKhieuNai;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  phanHoiKhachHang?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  soTienDieuChinh?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lyDoDieuChinh?: string | null;
}

export class HoanTienKhieuNaiDto {
  @ApiProperty()
  @IsString()
  @Length(8, 191)
  maYeuCau!: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  soTien!: number;

  @ApiProperty()
  @IsString()
  @Length(3, 500)
  lyDo!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  phanHoiKhachHang?: string | null;
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
