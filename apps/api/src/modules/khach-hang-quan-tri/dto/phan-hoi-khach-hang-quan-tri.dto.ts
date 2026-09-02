import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  LyDoKhieuNai,
  TrangThaiDonHang,
  TrangThaiNguoiDung,
} from '../../../generated/prisma/client';

export class KhachHangQuanTriTomTatDto {
  @ApiProperty() id!: string;
  @ApiProperty() nguoiDungId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() hoTen!: string;
  @ApiPropertyOptional({ nullable: true }) soDienThoai!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) ngaySinh!: string | null;
  @ApiProperty({ enum: TrangThaiNguoiDung }) trangThai!: TrangThaiNguoiDung;
  @ApiProperty() tongDonHang!: number;
  @ApiProperty() tongKhieuNai!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}

export class DanhSachKhachHangQuanTriDto {
  @ApiProperty({ type: [KhachHangQuanTriTomTatDto] }) items!: KhachHangQuanTriTomTatDto[];
  @ApiProperty() tong!: number;
  @ApiProperty() trang!: number;
  @ApiProperty() gioiHan!: number;
}

export class ChiTietKhachHangQuanTriDto extends KhachHangQuanTriTomTatDto {
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class DonHangKhachHangQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty() maDonHang!: string;
  @ApiProperty({ enum: TrangThaiDonHang }) trangThai!: TrangThaiDonHang;
  @ApiProperty() tongTien!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class DanhSachDonHangKhachHangQuanTriDto {
  @ApiProperty({ type: [DonHangKhachHangQuanTriDto] }) items!: DonHangKhachHangQuanTriDto[];
  @ApiProperty() tong!: number;
}

export class KhieuNaiKhachHangQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: LyDoKhieuNai }) lyDo!: LyDoKhieuNai;
  @ApiProperty() moTa!: string;
  @ApiProperty() maDonHang!: string;
  @ApiProperty() tenSanPham!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}

export class DanhSachKhieuNaiKhachHangQuanTriDto {
  @ApiProperty({ type: [KhieuNaiKhachHangQuanTriDto] }) items!: KhieuNaiKhachHangQuanTriDto[];
  @ApiProperty() tong!: number;
}

export class TrangThaiKhoaKhachHangQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty() nguoiDungId!: string;
  @ApiProperty({ enum: TrangThaiNguoiDung }) trangThai!: TrangThaiNguoiDung;
}
