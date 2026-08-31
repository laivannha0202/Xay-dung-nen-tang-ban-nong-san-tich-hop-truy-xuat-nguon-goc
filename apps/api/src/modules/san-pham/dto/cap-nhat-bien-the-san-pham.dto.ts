import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CapNhatBienTheSanPhamDto {
  @ApiPropertyOptional({
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 3,
  })
  @IsPositive()
  khoiLuong?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  gia?: number;

  @ApiPropertyOptional({
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  donVi?: string;
}
