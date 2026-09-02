import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TrangThaiNguoiDung } from '../../../generated/prisma/client';

export class LocNhanVienQuanTriDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional({ enum: TrangThaiNguoiDung })
  @IsOptional()
  @IsEnum(TrangThaiNguoiDung)
  trangThai?: TrangThaiNguoiDung;
}
