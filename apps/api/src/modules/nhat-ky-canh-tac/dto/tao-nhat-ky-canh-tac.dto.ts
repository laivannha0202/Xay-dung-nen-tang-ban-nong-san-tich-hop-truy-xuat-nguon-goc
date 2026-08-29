import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import { LoaiSuKienCanhTac } from '../../../generated/prisma/client';

export class TaoNhatKyCanhTacDto {
  @ApiProperty()
  @IsUUID()
  muaVuId!: string;

  @ApiProperty({
    enum: LoaiSuKienCanhTac,
  })
  @IsEnum(LoaiSuKienCanhTac)
  loaiSuKien!: LoaiSuKienCanhTac;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-09-15T07:30:00.000Z',
  })
  @IsDateString()
  thoiGian!: string;

  @ApiProperty({
    example: 'Tưới nhỏ giọt khu A trong 45 phút.',
  })
  @IsString()
  @Length(2, 5000)
  noiDung!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Cho phép sự kiện xuất hiện trong dữ liệu truy xuất công khai sau này',
  })
  @IsOptional()
  @IsBoolean()
  hienThiCongKhai?: boolean;
}
