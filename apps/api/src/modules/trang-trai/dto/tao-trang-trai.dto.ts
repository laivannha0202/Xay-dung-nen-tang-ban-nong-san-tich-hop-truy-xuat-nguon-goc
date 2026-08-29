import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TaoTrangTraiDto {
  @ApiProperty({ example: 'FARM-0001' })
  @IsString()
  @Length(2, 50)
  ma!: string;

  @ApiProperty({ example: 'Trang trại Rau Xanh' })
  @IsString()
  @Length(2, 200)
  ten!: string;

  @ApiProperty({ example: 'Đà Lạt, Lâm Đồng' })
  @IsString()
  @Length(2, 500)
  diaChi!: string;

  @ApiPropertyOptional({
    minimum: -90,
    maximum: 90,
    example: 11.9404,
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
    example: 108.4583,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  kinhDo?: number;

  @ApiPropertyOptional({
    minimum: 0.01,
    example: 12.5,
    description: 'Diện tích tính theo hecta',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  dienTichHa?: number;

  @ApiProperty()
  @IsUUID()
  nhaCungCapId!: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 10,
    description: 'ID tệp ảnh đã upload qua module Tệp tin',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  anhIds?: string[];
}
