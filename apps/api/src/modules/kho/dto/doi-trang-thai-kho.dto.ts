import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class DoiTrangThaiKhoDto {
  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  @IsEnum(TrangThaiBanGhi)
  trangThai!: TrangThaiBanGhi;
}
