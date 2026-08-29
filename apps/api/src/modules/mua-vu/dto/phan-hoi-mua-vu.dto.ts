import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiMuaVu } from '../../../generated/prisma/client';

export class TrangTraiMuaVuDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class MuaVuDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: TrangTraiMuaVuDto,
  })
  trangTrai!: TrangTraiMuaVuDto;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayTrong!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayDuKienThuHoach!: string;

  @ApiProperty({
    type: Number,
  })
  sanLuongDuKienKg!: number;

  @ApiProperty({
    enum: TrangThaiMuaVu,
  })
  trangThai!: TrangThaiMuaVu;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachMuaVuDto {
  @ApiProperty({
    type: [MuaVuDto],
  })
  duLieu!: MuaVuDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
