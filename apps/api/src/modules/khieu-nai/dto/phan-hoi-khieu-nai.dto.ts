import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LyDoKhieuNai, TrangThaiKhieuNai, TrangThaiVanChuyen } from '../../../generated/prisma/client';

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

  @ApiPropertyOptional({ nullable: true })
  urlXem!: string | null;

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

  @ApiProperty({ description: 'Mã khiếu nại nghiệp vụ KN-YYYYMMDD-XXXXXX (server-generated, unique).' })
  maKhieuNai!: string;

  @ApiProperty({ enum: LyDoKhieuNai })
  lyDo!: LyDoKhieuNai;

  @ApiProperty()
  moTa!: string;

  @ApiProperty({ enum: TrangThaiKhieuNai })
  trangThai!: TrangThaiKhieuNai;

  @ApiPropertyOptional({ nullable: true })
  phanHoiKhachHang!: string | null;

  @ApiPropertyOptional({ nullable: true })
  xuLyLuc!: Date | null;

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

  @ApiProperty()
  maKhieuNai!: string;

  @ApiProperty({ enum: LyDoKhieuNai })
  lyDo!: LyDoKhieuNai;

  @ApiProperty({ enum: TrangThaiKhieuNai })
  trangThai!: TrangThaiKhieuNai;

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

export class ThongKeKhieuNaiTheoLyDoDto {
  @ApiProperty({ enum: LyDoKhieuNai })
  lyDo!: LyDoKhieuNai;

  @ApiProperty()
  tong!: number;
}

export class ThongKeKhieuNaiTheoTrangThaiDto {
  @ApiProperty({ enum: TrangThaiKhieuNai })
  trangThai!: TrangThaiKhieuNai;

  @ApiProperty()
  tong!: number;
}

export class ThongKeKhieuNaiDto {
  @ApiProperty()
  tong!: number;

  @ApiProperty()
  coBangChung!: number;

  @ApiProperty()
  chuaCoBangChung!: number;

  @ApiProperty({ description: 'Số khiếu nại chất lượng hoặc hết hạn.' })
  chatLuongHoacHetHan!: number;

  @ApiProperty({ type: [ThongKeKhieuNaiTheoLyDoDto] })
  theoLyDo!: ThongKeKhieuNaiTheoLyDoDto[];

  @ApiProperty({ type: [ThongKeKhieuNaiTheoTrangThaiDto] })
  theoTrangThai!: ThongKeKhieuNaiTheoTrangThaiDto[];
}
