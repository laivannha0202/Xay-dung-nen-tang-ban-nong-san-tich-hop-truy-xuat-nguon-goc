import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class TrangTraiSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  trangThai!: TrangThaiBanGhi;
}

export class DanhMucSanPhamRutGonDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  trangThai!: TrangThaiBanGhi;
}

export class SanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  moTa!: string | null;

  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty({
    type: TrangTraiSanPhamDto,
  })
  trangTrai!: TrangTraiSanPhamDto;

  @ApiProperty()
  danhMucSanPhamId!: string;

  @ApiProperty({
    type: DanhMucSanPhamRutGonDto,
  })
  danhMucSanPham!: DanhMucSanPhamRutGonDto;

  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;
}

export class DanhSachSanPhamDto {
  @ApiProperty({
    type: [SanPhamDto],
  })
  duLieu!: SanPhamDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
