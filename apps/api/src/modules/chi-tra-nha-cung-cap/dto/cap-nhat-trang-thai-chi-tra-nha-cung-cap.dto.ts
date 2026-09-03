import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

import { TrangThaiChiTraNhaCungCap } from '../../../generated/prisma/client';

const TRANG_THAI_CAP_NHAT = [
  TrangThaiChiTraNhaCungCap.PROCESSING,
  TrangThaiChiTraNhaCungCap.PAID,
  TrangThaiChiTraNhaCungCap.FAILED,
] as const;

export class CapNhatTrangThaiChiTraNhaCungCapDto {
  @ApiProperty({ enum: TRANG_THAI_CAP_NHAT })
  @IsIn(TRANG_THAI_CAP_NHAT)
  trangThai!: TrangThaiChiTraNhaCungCap;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Bắt buộc khi chuyển PROCESSING -> FAILED.',
  })
  @ValidateIf(
    (dto: CapNhatTrangThaiChiTraNhaCungCapDto) =>
      dto.trangThai === TrangThaiChiTraNhaCungCap.FAILED,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  lyDoThatBai?: string;

  @IsOptional()
  _validationMarker?: never;
}
