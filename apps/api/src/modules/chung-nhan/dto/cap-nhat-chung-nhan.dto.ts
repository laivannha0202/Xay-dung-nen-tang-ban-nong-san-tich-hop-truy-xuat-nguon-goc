import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CapNhatChungNhanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  loai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  ma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 200)
  donViCap?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayCap?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayHetHan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tepTinId?: string;
}
