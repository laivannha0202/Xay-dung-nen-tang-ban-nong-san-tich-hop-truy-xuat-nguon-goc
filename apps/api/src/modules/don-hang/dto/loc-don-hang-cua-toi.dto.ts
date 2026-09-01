import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  TRANG_THAI_DON_HANG_COT_LOI_059,
  type TrangThaiDonHangCotLoi059,
} from '../may-trang-thai-don-hang';

export class LocDonHangCuaToiDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  gioiHan: number = 20;

  @ApiPropertyOptional({ enum: [...TRANG_THAI_DON_HANG_COT_LOI_059] })
  @IsOptional()
  @IsIn([...TRANG_THAI_DON_HANG_COT_LOI_059])
  trangThai?: TrangThaiDonHangCotLoi059;
}
