import { ApiProperty } from '@nestjs/swagger';

export class QuyTacHoaHongDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 8.5, minimum: 0, maximum: 100 })
  tyLe!: number;

  @ApiProperty({ format: 'uuid' })
  danhMucSanPhamId!: string;

  @ApiProperty()
  tenDanhMucSanPham!: string;

  @ApiProperty({ format: 'uuid' })
  nhaCungCapId!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty({ format: 'date-time' })
  hieuLucTu!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class DanhSachQuyTacHoaHongDto {
  @ApiProperty({ type: [QuyTacHoaHongDto] })
  duLieu!: QuyTacHoaHongDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
