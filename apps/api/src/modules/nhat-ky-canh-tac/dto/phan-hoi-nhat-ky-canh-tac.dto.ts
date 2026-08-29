import { ApiProperty } from '@nestjs/swagger';

import { LoaiSuKienCanhTac, TrangThaiMuaVu } from '../../../generated/prisma/client';

export class TrangTraiNhatKyCanhTacDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class MuaVuNhatKyCanhTacDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({
    enum: TrangThaiMuaVu,
  })
  trangThai!: TrangThaiMuaVu;

  @ApiProperty({
    type: TrangTraiNhatKyCanhTacDto,
  })
  trangTrai!: TrangTraiNhatKyCanhTacDto;
}

export class NhatKyCanhTacDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: MuaVuNhatKyCanhTacDto,
  })
  muaVu!: MuaVuNhatKyCanhTacDto;

  @ApiProperty({
    enum: LoaiSuKienCanhTac,
  })
  loaiSuKien!: LoaiSuKienCanhTac;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  thoiGian!: Date;

  @ApiProperty()
  noiDung!: string;

  @ApiProperty()
  hienThiCongKhai!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachNhatKyCanhTacDto {
  @ApiProperty({
    type: [NhatKyCanhTacDto],
  })
  duLieu!: NhatKyCanhTacDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
