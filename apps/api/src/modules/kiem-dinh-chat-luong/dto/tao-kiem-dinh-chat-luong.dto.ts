import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import { KetQuaKiemDinhChatLuong } from '../../../generated/prisma/client';

export class TaoKiemDinhChatLuongDto {
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-08-30',
  })
  @IsDateString()
  ngayKiemDinh!: string;

  @ApiProperty({
    enum: KetQuaKiemDinhChatLuong,
  })
  @IsEnum(KetQuaKiemDinhChatLuong)
  ketQua!: KetQuaKiemDinhChatLuong;

  @ApiPropertyOptional({
    description: 'Bắt buộc khi PASSED; tối đa 100 ký tự',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  phanHang?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  ghiChu?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 10,
    description: 'ID ảnh JPEG/PNG/WebP đã upload qua module Tệp tin',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', {
    each: true,
  })
  tepTinIds?: string[];
}
