import { ApiProperty } from '@nestjs/swagger';

import { DonHangNhaCungCapKhachDto } from './phan-hoi-don-hang-khach.dto';

export class KhachHangDonHangQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nguoiDungId!: string;

  @ApiProperty()
  hoTen!: string;

  @ApiProperty()
  email!: string;
}

export class DonHangTomTatQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  @ApiProperty({ type: KhachHangDonHangQuanTriDto })
  khachHang!: KhachHangDonHangQuanTriDto;

  @ApiProperty()
  soNhaCungCap!: number;

  @ApiProperty()
  soMuc!: number;

  @ApiProperty({ nullable: true })
  trangThaiThanhToan!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachDonHangQuanTriDto {
  @ApiProperty({ type: [DonHangTomTatQuanTriDto] })
  duLieu!: DonHangTomTatQuanTriDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class GiaoDichThanhToanQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maGiaoDich!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  soTien!: number;

  @ApiProperty()
  thoiGian!: Date;
}

export class ThanhToanQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phuongThuc!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  soTien!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: [GiaoDichThanhToanQuanTriDto] })
  giaoDich!: GiaoDichThanhToanQuanTriDto[];
}

export class DatChoDonHangQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  hetHanLuc!: Date;

  @ApiProperty({ nullable: true })
  ketThucLuc!: Date | null;
}

export class ChiTietDonHangQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  @ApiProperty({ type: KhachHangDonHangQuanTriDto })
  khachHang!: KhachHangDonHangQuanTriDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [DonHangNhaCungCapKhachDto] })
  donNhaCungCap!: DonHangNhaCungCapKhachDto[];

  @ApiProperty({ type: [ThanhToanQuanTriDto] })
  thanhToan!: ThanhToanQuanTriDto[];

  @ApiProperty({ type: DatChoDonHangQuanTriDto, nullable: true })
  datCho!: DatChoDonHangQuanTriDto | null;
}
