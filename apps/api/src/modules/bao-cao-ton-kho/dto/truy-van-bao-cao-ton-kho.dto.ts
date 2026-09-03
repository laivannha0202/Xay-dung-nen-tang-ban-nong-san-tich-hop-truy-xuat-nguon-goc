import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

import { LoaiGiaoDichTonKho } from '../../../generated/prisma/client';

export class TruyVanBaoCaoTonKhoDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  khoId?: string;

  @ApiPropertyOptional({ maxLength: 150, description: 'Mã kho, mã lô, SKU hoặc tên sản phẩm.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  timKiem?: string;
}

export class TruyVanBaoCaoHaoHutTonKhoDto extends TruyVanBaoCaoTonKhoDto {
  @ApiPropertyOptional({
    enum: [LoaiGiaoDichTonKho.DAMAGE, LoaiGiaoDichTonKho.EXPIRE],
    description: 'Chỉ DAMAGE hoặc EXPIRE. Bỏ trống để lấy cả hai.',
  })
  @IsOptional()
  @IsIn([LoaiGiaoDichTonKho.DAMAGE, LoaiGiaoDichTonKho.EXPIRE])
  loai?: LoaiGiaoDichTonKho;
}
