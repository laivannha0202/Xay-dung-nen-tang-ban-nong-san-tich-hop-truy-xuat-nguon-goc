import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { KetQuaKiemDinhChatLuong } from '../../../generated/prisma/client';

export class TruyVanKiemDinhChatLuongDto {
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
    description: 'Tìm theo mã Lô, phân hạng, người kiểm định, cây trồng hoặc trang trại',
  })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  loSanPhamId?: string;

  @ApiPropertyOptional({
    enum: KetQuaKiemDinhChatLuong,
  })
  @IsOptional()
  @IsEnum(KetQuaKiemDinhChatLuong)
  ketQua?: KetQuaKiemDinhChatLuong;
}
