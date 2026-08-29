import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class TaoThuHoachDto {
  @ApiProperty()
  @IsUUID()
  muaVuId!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-08-20',
  })
  @IsDateString()
  ngayThuHoach!: string;

  @ApiProperty({
    type: Number,
    minimum: 0.001,
    example: 1250.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  soLuong!: number;

  @ApiProperty({
    example: 'KG',
  })
  @IsString()
  @Length(1, 30)
  donVi!: string;

  @ApiProperty({
    example: 'Loại A',
  })
  @IsString()
  @Length(1, 100)
  phanLoai!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ghiChu?: string;
}
