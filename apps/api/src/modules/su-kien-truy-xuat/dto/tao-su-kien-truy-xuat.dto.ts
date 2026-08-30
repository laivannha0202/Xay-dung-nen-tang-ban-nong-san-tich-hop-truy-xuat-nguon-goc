import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { LoaiSuKienTruyXuat } from '../../../generated/prisma/client';

export class TaoSuKienTruyXuatDto {
  @ApiProperty({
    enum: LoaiSuKienTruyXuat,
    enumName: 'LoaiSuKienTruyXuat',
  })
  @IsEnum(LoaiSuKienTruyXuat)
  loai!: LoaiSuKienTruyXuat;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-25T09:30:00.000Z',
  })
  @IsDateString()
  thoiGian!: string;

  @ApiProperty({
    example: 'Trang trại Đà Lạt, Lâm Đồng',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  diaDiem!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Metadata JSON object, tối đa 8 KiB',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    default: false,
    description: 'Đánh dấu sự kiện được phép xuất hiện ở public trace từ PHIEN-027',
  })
  @IsOptional()
  @IsBoolean()
  congKhai?: boolean;
}
