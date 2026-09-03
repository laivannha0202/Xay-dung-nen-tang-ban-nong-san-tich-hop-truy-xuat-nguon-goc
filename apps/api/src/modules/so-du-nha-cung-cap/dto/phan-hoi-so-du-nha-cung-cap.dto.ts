import { ApiProperty } from '@nestjs/swagger';

export class SoDuNhaCungCapDto {
  @ApiProperty({ format: 'uuid' })
  nhaCungCapId!: string;

  @ApiProperty()
  maNhaCungCap!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty({ example: 0 })
  dangCho!: number;

  @ApiProperty({ example: 0 })
  khaDung!: number;

  @ApiProperty({ example: 0 })
  tamGiu!: number;

  @ApiProperty({ example: 0 })
  daThanhToan!: number;
}

export class DanhSachSoDuNhaCungCapDto {
  @ApiProperty({ type: [SoDuNhaCungCapDto] })
  duLieu!: SoDuNhaCungCapDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
