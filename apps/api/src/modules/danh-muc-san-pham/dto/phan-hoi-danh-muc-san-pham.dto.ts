import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class AnhDanhMucSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  url!: string;
}

export class DanhMucChaRutGonDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  slug!: string;
}

export class DanhMucSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  danhMucChaId!: string | null;

  @ApiProperty({
    nullable: true,
    type: DanhMucChaRutGonDto,
  })
  danhMucCha!: DanhMucChaRutGonDto | null;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  anhId!: string | null;

  @ApiProperty({
    nullable: true,
    type: AnhDanhMucSanPhamDto,
  })
  anh!: AnhDanhMucSanPhamDto | null;

  @ApiProperty({
    enum: TrangThaiBanGhi,
    enumName: 'TrangThaiBanGhi',
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty()
  soDanhMucCon!: number;

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

export class DanhSachDanhMucSanPhamDto {
  @ApiProperty({
    type: [DanhMucSanPhamDto],
  })
  duLieu!: DanhMucSanPhamDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
