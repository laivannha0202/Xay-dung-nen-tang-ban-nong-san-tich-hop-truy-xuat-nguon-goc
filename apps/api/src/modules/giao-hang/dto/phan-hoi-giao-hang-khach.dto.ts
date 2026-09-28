import { ApiProperty } from '@nestjs/swagger';

import { LyDoGiaoThatBai } from '../../../generated/prisma/client';

export class SuKienGiaoHangCuaToiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty({ enum: LyDoGiaoThatBai, nullable: true })
  lyDoGiaoThatBai!: LyDoGiaoThatBai | null;

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
