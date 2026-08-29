import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CapNhatTrangTraiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 50)
  ma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 200)
  ten?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diaChi?: string;

  @ApiPropertyOptional({
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  viDo?: number;

  @ApiPropertyOptional({
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  kinhDo?: number;

  @ApiPropertyOptional({
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  dienTichHa?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  nhaCungCapId?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 10,
    description: 'Nếu truyền vào, thay thế toàn bộ danh sách ảnh hiện tại',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  anhIds?: string[];
}
