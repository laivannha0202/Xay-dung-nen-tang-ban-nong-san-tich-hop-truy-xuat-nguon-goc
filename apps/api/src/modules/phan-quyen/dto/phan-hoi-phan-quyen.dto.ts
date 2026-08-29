import { ApiProperty } from '@nestjs/swagger';

export class PhanQuyenNguoiDungDto {
  @ApiProperty()
  nguoiDungId!: string;

  @ApiProperty({ type: [String] })
  vaiTro!: string[];

  @ApiProperty({ type: [String] })
  quyen!: string[];
}

export class PhanHoiGanVaiTroDto {
  @ApiProperty()
  nguoiDungId!: string;

  @ApiProperty()
  maVaiTro!: string;

  @ApiProperty()
  thongBao!: string;
}
