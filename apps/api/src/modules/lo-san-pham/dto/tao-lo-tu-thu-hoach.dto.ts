import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Length, Min } from 'class-validator';

export class TaoLoTuThuHoachDto {
  @ApiProperty({
    example: 'LO-20260830-001',
  })
  @IsString()
  @Length(2, 100)
  maLo!: string;

  @ApiProperty({
    type: Number,
    minimum: 0.001,
    example: 500,
    description: 'Số lượng Lô theo cùng đơn vị với Thu hoạch',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  soLuong!: number;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-09-15',
  })
  @IsDateString()
  ngayHetHan!: string;
}
