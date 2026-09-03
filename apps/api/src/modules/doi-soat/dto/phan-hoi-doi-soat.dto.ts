import { ApiProperty } from '@nestjs/swagger';

export class DoiSoatNhaCungCapDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  nhaCungCapId!: string;

  @ApiProperty()
  maNhaCungCap!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty({ format: 'date-time' })
  batDauLuc!: string;

  @ApiProperty({ format: 'date-time' })
  ketThucLuc!: string;

  @ApiProperty({ example: 1000000 })
  doanhThu!: number;

  @ApiProperty({ example: 80000 })
  hoaHong!: number;

  @ApiProperty({ example: 50000 })
  hoanTien!: number;

  @ApiProperty({ example: 0 })
  dieuChinh!: number;

  @ApiProperty({ example: 870000 })
  phaiTra!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class DanhSachDoiSoatNhaCungCapDto {
  @ApiProperty({ type: [DoiSoatNhaCungCapDto] })
  duLieu!: DoiSoatNhaCungCapDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
