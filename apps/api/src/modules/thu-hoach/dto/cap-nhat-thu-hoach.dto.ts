import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CapNhatThuHoachDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  muaVuId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayThuHoach?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0.001,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  soLuong?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 30)
  donVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  phanLoai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ghiChu?: string;
}
