import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CapNhatLoSanPhamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  maLo?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0.001,
    description: 'Chỉ sửa khi Lô còn MOI_TAO; remaining sẽ bằng quantity mới',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  soLuong?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  ngayHetHan?: string;
}
