import { ApiProperty } from '@nestjs/swagger';

export class SuKienGiaoHangCuaToiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty({ nullable: true })
  moTa!: string | null;

  @ApiProperty({ nullable: true })
  viTri!: string | null;

  @ApiProperty()
  thoiGian!: Date;
}

export class VanChuyenCuaToiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  donHangNhaCungCapId!: string;

  @ApiProperty()
  maDonNhaCungCap!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty()
  maVanDon!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [SuKienGiaoHangCuaToiDto] })
  suKien!: SuKienGiaoHangCuaToiDto[];
}

export class GiaoHangDonHangCuaToiDto {
  @ApiProperty()
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ type: [VanChuyenCuaToiDto] })
  vanChuyen!: VanChuyenCuaToiDto[];
}
