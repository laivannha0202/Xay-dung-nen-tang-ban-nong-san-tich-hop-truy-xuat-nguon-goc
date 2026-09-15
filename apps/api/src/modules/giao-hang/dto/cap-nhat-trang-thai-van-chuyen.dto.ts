import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { TrangThaiVanChuyen } from '../../../generated/prisma/client';

export class CapNhatTrangThaiVanChuyenDto {
  @ApiProperty({
    enum: TrangThaiVanChuyen,
    description: 'Trạng thái vận chuyển mới',
  })
  @IsEnum(TrangThaiVanChuyen)
  trangThai!: TrangThaiVanChuyen;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Mô tả sự kiện giao hàng',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  moTa?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Vị trí phát sinh sự kiện',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  viTri?: string;
}
