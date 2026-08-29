import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class NhaCungCapTrangTraiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class AnhTrangTraiDto {
  @ApiProperty()
  tepTinId!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  thuTu!: number;

  @ApiProperty()
  url!: string;
}

export class TrangTraiTomTatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  viDo!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  kinhDo!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  dienTichHa!: number | null;

  @ApiProperty({
    type: NhaCungCapTrangTraiDto,
  })
  nhaCungCap!: NhaCungCapTrangTraiDto;

  @ApiProperty()
  soAnh!: number;

  @ApiProperty({
    enum: TrangThaiBanGhi,
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TrangTraiChiTietDto extends TrangTraiTomTatDto {
  @ApiProperty({
    type: [AnhTrangTraiDto],
  })
  anh!: AnhTrangTraiDto[];
}

export class DanhSachTrangTraiDto {
  @ApiProperty({
    type: [TrangTraiTomTatDto],
  })
  duLieu!: TrangTraiTomTatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
