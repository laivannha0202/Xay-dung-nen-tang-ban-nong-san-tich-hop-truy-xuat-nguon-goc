import { ApiProperty } from '@nestjs/swagger';

export class DonHangTomTatCuaToiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  @ApiProperty()
  soNhaCungCap!: number;

  @ApiProperty()
  soMuc!: number;

  @ApiProperty()
  coTheHuy!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachDonHangCuaToiDto {
  @ApiProperty({ type: [DonHangTomTatCuaToiDto] })
  duLieu!: DonHangTomTatCuaToiDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class MucDonHangKhachDto {
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
  khoiLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  maTrangTrai!: string;

  @ApiProperty()
  tenTrangTrai!: string;
}

export class DonHangNhaCungCapKhachDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDon!: string;

  @ApiProperty()
  nhaCungCapId!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tamTinh!: number;

  @ApiProperty({ type: [MucDonHangKhachDto] })
  muc!: MucDonHangKhachDto[];
}

export class MocTienTrinhDonHangDto {
  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  daDat!: boolean;

  @ApiProperty()
  hienTai!: boolean;
}

export class ChiTietDonHangCuaToiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  @ApiProperty()
  coTheHuy!: boolean;

  @ApiProperty({ nullable: true })
  lyDoKhongTheHuy!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [DonHangNhaCungCapKhachDto] })
  donNhaCungCap!: DonHangNhaCungCapKhachDto[];

  @ApiProperty({ type: [MocTienTrinhDonHangDto] })
  tienTrinh!: MocTienTrinhDonHangDto[];
}
