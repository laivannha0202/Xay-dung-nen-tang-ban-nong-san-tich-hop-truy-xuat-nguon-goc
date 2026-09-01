import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LyDoKhieuNai, TrangThaiVanChuyen } from '../../../generated/prisma/client';

export class DieuKienKhieuNaiMucDonHangDto {
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
  coTheKhieuNai!: boolean;

  @ApiPropertyOptional({ nullable: true })
  lyDo!: string | null;
}

export class BangChungKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tepTinId!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PhanBoKhieuNaiDto {
  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  maLo!: string;

  @ApiPropertyOptional({ nullable: true })
  maTruyXuat!: string | null;

  @ApiProperty()
  soLuong!: number;
}

export class VanChuyenKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maVanDon!: string;

  @ApiProperty({ enum: TrangThaiVanChuyen })
  trangThai!: TrangThaiVanChuyen;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MucDonHangKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  bienTheSanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  donGia!: number;

  @ApiProperty()
  thanhTien!: number;

  @ApiProperty()
  maTrangTrai!: string;

  @ApiProperty()
  tenTrangTrai!: string;
}

export class DonHangKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;
}

export class DonNhaCungCapKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDon!: string;

  @ApiProperty()
  tenNhaCungCap!: string;
}

export class KhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: LyDoKhieuNai })
  lyDo!: LyDoKhieuNai;

  @ApiProperty()
  moTa!: string;

  @ApiProperty({ type: DonHangKhieuNaiDto })
  donHang!: DonHangKhieuNaiDto;

  @ApiProperty({ type: DonNhaCungCapKhieuNaiDto })
  donNhaCungCap!: DonNhaCungCapKhieuNaiDto;

  @ApiProperty({ type: MucDonHangKhieuNaiDto })
  mucDonHang!: MucDonHangKhieuNaiDto;

  @ApiProperty({ type: [PhanBoKhieuNaiDto] })
  phanBo!: PhanBoKhieuNaiDto[];

  @ApiProperty({ type: [VanChuyenKhieuNaiDto] })
  vanChuyen!: VanChuyenKhieuNaiDto[];

  @ApiProperty({ type: [BangChungKhieuNaiDto] })
  bangChung!: BangChungKhieuNaiDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TomTatKhieuNaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: LyDoKhieuNai })
  lyDo!: LyDoKhieuNai;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  soBangChung!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class DanhSachKhieuNaiDto {
  @ApiProperty({ type: [TomTatKhieuNaiDto] })
  items!: TomTatKhieuNaiDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
