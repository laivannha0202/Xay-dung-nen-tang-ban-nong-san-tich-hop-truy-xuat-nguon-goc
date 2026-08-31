import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class KhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;

  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachKhoDto {
  @ApiProperty({ type: [KhoDto] })
  duLieu!: KhoDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
