import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { TrangThaiLoSanPham } from '../../../generated/prisma/client';

export class TruyVanLoSanPhamDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan: number = 20;

  @ApiPropertyOptional({
    description: 'Tìm theo mã lô, phân hạng, cây trồng, giống hoặc trang trại',
  })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  thuHoachId?: string;

  @ApiPropertyOptional({
    enum: TrangThaiLoSanPham,
  })
  @IsOptional()
  @IsEnum(TrangThaiLoSanPham)
  trangThai?: TrangThaiLoSanPham;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phanHangChatLuong?: string;
}
