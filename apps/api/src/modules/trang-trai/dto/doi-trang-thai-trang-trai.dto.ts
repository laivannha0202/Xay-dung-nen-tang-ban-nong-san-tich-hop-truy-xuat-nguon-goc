import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class DoiTrangThaiTrangTraiDto {
  @ApiProperty({
    enum: TrangThaiBanGhi,
  })
  @IsEnum(TrangThaiBanGhi)
  trangThai!: TrangThaiBanGhi;
}
