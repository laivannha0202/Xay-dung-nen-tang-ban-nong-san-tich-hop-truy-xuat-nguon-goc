import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { LyDoKhieuNai } from '../../../generated/prisma/client';

export class TaoKhieuNaiDto {
  @ApiProperty({ description: 'order_item id thuộc khách hiện tại' })
  @IsUUID()
  mucDonHangId!: string;

  @ApiProperty({ enum: LyDoKhieuNai })
  @IsEnum(LyDoKhieuNai)
  lyDo!: LyDoKhieuNai;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  moTa!: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('all', { each: true })
  tepTinIds?: string[];
}
