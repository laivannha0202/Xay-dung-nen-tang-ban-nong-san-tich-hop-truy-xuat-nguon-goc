import { ApiProperty } from '@nestjs/swagger';

export class PhanBoDonHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  soLuong!: number;
}

export class MucDonHangPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  bienTheSanPhamId!: string;

  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  donGiaSnapshot!: number;

  @ApiProperty()
  tenSanPhamSnapshot!: string;

  @ApiProperty()
  skuBienTheSnapshot!: string;

  @ApiProperty()
  khoiLuongBienTheSnapshot!: number;

  @ApiProperty()
  donViBienTheSnapshot!: string;

  @ApiProperty()
  maTrangTraiSnapshot!: string;

  @ApiProperty()
  tenTrangTraiSnapshot!: string;

  @ApiProperty({ type: [PhanBoDonHangDto] })
  phanBo!: PhanBoDonHangDto[];
}

export class DonHangNhaCungCapPhanHoiDto {
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

  @ApiProperty({ type: [MucDonHangPhanHoiDto] })
  muc!: MucDonHangPhanHoiDto[];
}

export class DatChoDonHangPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maThamChieu!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  hetHanLuc!: Date;
}

export class DonHangPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  khachHangId!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  @ApiProperty({ type: DatChoDonHangPhanHoiDto })
  datCho!: DatChoDonHangPhanHoiDto;

  @ApiProperty({ type: [DonHangNhaCungCapPhanHoiDto] })
  donNhaCungCap!: DonHangNhaCungCapPhanHoiDto[];
}
