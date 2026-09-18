import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { LyDoKhieuNai, TrangThaiKhieuNai } from '../../../generated/prisma/client';

export const SAP_XEP_KHIEU_NAI = ['MOI_NHAT', 'CU_NHAT'] as const;
export type SapXepKhieuNai = (typeof SAP_XEP_KHIEU_NAI)[number];

export class TruyVanKhieuNaiDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 50, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  gioiHan = 20;

  @ApiPropertyOptional({ enum: LyDoKhieuNai })
  @IsOptional()
  @IsEnum(LyDoKhieuNai)
  lyDo?: LyDoKhieuNai;

  @ApiPropertyOptional({ enum: TrangThaiKhieuNai })
  @IsOptional()
  @IsEnum(TrangThaiKhieuNai)
  trangThai?: TrangThaiKhieuNai;
  @ApiPropertyOptional({
    description: 'Tìm theo mã khiếu nại, mã đơn hoặc tên sản phẩm.',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: SAP_XEP_KHIEU_NAI, default: 'MOI_NHAT' })
  @IsOptional()
  @IsIn(SAP_XEP_KHIEU_NAI)
  sapXep?: SapXepKhieuNai;

}
