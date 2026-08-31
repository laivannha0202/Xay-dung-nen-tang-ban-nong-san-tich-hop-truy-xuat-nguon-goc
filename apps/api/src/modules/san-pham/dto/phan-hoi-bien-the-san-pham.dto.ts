import { ApiProperty } from '@nestjs/swagger';

export class BienTheSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({
    type: Number,
  })
  khoiLuong!: number;

  @ApiProperty({
    type: Number,
  })
  gia!: number;

  @ApiProperty()
  donVi!: string;

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

export class DanhSachBienTheSanPhamDto {
  @ApiProperty({
    type: [BienTheSanPhamDto],
  })
  duLieu!: BienTheSanPhamDto[];

  @ApiProperty()
  tong!: number;
}
