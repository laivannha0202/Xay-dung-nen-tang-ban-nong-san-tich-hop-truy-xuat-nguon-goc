import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TruyVanNhatKyDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan: number = 50;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tacNhanId?: string;

  @ApiPropertyOptional({ example: 'PHAN_QUYEN_GAN_VAI_TRO' })
  @IsString()
  @IsOptional()
  hanhDong?: string;

  @ApiPropertyOptional({ example: 'nguoi_dung_vai_tro' })
  @IsString()
  @IsOptional()
  thucThe?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  tuNgay?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  denNgay?: string;
}
