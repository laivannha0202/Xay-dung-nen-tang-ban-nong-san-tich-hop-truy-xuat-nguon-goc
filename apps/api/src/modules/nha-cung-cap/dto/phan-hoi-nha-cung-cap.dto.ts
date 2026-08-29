import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class NhaCungCapDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  nguoiDaiDien!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  soDienThoai!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  diaChi!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  ghiChu!: string | null;

  @ApiProperty({
    enum: TrangThaiBanGhi,
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachNhaCungCapDto {
  @ApiProperty({
    type: [NhaCungCapDto],
  })
  duLieu!: NhaCungCapDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
