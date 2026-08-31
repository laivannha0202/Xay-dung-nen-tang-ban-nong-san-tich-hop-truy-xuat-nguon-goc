import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class TruyVanTonKhoDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan: number = 20;

  @ApiPropertyOptional({
    description: 'Tìm theo mã/tên Kho, mã Lô, SKU hoặc tên Sản phẩm',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  khoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  loSanPhamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bienTheSanPhamId?: string;
}
