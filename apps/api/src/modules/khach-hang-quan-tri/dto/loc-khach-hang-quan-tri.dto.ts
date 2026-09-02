import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { TrangThaiNguoiDung } from '../../../generated/prisma/client';

export class LocKhachHangQuanTriDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan: number = 20;

  @ApiPropertyOptional({ description: 'Tìm theo họ tên, email hoặc số điện thoại.' })
  @IsString()
  @IsOptional()
  timKiem?: string;

  @ApiPropertyOptional({ enum: TrangThaiNguoiDung })
  @IsEnum(TrangThaiNguoiDung)
  @IsOptional()
  trangThai?: TrangThaiNguoiDung;
}
