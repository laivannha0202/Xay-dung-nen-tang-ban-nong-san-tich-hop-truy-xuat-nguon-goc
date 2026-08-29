import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiMuaVu } from '../../../generated/prisma/client';

export class TrangTraiThuHoachDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class MuaVuThuHoachDto {
  @ApiProperty()
  id!: string;

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
    enum: TrangThaiMuaVu,
  })
  trangThai!: TrangThaiMuaVu;

  @ApiProperty({
    type: TrangTraiThuHoachDto,
  })
  trangTrai!: TrangTraiThuHoachDto;
}

export class ThuHoachDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: MuaVuThuHoachDto,
  })
  muaVu!: MuaVuThuHoachDto;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayThuHoach!: string;

  @ApiProperty({
    type: Number,
  })
  soLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  phanLoai!: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  ghiChu!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachThuHoachDto {
  @ApiProperty({
    type: [ThuHoachDto],
  })
  duLieu!: ThuHoachDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
