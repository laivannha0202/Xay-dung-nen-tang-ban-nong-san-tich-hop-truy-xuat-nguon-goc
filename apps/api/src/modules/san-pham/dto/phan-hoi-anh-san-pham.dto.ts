import { ApiProperty } from '@nestjs/swagger';

export class AnhSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tepTinId!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  kichThuoc!: number;

  @ApiProperty()
  laAnhBia!: boolean;

  @ApiProperty()
  thuTu!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class DanhSachAnhSanPhamDto {
  @ApiProperty({ type: [AnhSanPhamDto] })
  duLieu!: AnhSanPhamDto[];

  @ApiProperty()
  tong!: number;
}

export class PhanHoiXoaAnhSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  thongBao!: string;
}
