import { ApiProperty } from '@nestjs/swagger';

export class DanhGiaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mucDonHangId!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  diem!: number;

  @ApiProperty({ nullable: true })
  binhLuan!: string | null;

  @ApiProperty()
  nguoiDanhGia!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TrangThaiDanhGiaMucDonHangDto {
  @ApiProperty()
  mucDonHangId!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  daGiao!: boolean;

  @ApiProperty()
  coTheDanhGia!: boolean;

  @ApiProperty({ nullable: true })
  lyDo!: string | null;

  @ApiProperty({ type: DanhGiaDto, nullable: true })
  danhGia!: DanhGiaDto | null;
}

export class DanhSachDanhGiaSanPhamDto {
  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tong!: number;

  @ApiProperty({ nullable: true })
  diemTrungBinh!: number | null;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;

  @ApiProperty({ type: [DanhGiaDto] })
  items!: DanhGiaDto[];
}
