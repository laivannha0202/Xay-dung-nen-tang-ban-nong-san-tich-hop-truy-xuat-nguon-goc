import { ApiProperty } from '@nestjs/swagger';

export class GiaSanPhamCongKhaiDto {
  @ApiProperty()
  tu!: number;

  @ApiProperty()
  den!: number;

  @ApiProperty({ example: 'VND' })
  tienTe!: string;
}

export class AnhSanPhamCongKhaiDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  laAnhBia!: boolean;

  @ApiProperty()
  thuTu!: number;
}

export class TrangTraiSanPhamCongKhaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;
}

export class DanhMucSanPhamCongKhaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  slug!: string;
}

export class ChungNhanBadgeSanPhamCongKhaiDto {
  @ApiProperty()
  loai!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  donViCap!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayHetHan!: string;
}

export class KhaDungSanPhamCongKhaiDto {
  @ApiProperty()
  coGia!: boolean;

  @ApiProperty({ nullable: true, type: Number })
  soLuongKhaDung!: number | null;

  @ApiProperty()
  coTheDatHang!: boolean;

  @ApiProperty()
  lyDo!: string;
}

export class BienTheSanPhamCongKhaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  khoiLuong!: number;

  @ApiProperty()
  gia!: number;

  @ApiProperty()
  donVi!: string;
}

export class ThuHoachGanNhatTrangTraiDto {
  @ApiProperty({ type: String, format: 'date' })
  ngayThuHoach!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty()
  phanLoai!: string;
}

export class SanPhamCongKhaiTomTatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ nullable: true, type: String })
  moTa!: string | null;

  @ApiProperty({ type: DanhMucSanPhamCongKhaiDto })
  danhMuc!: DanhMucSanPhamCongKhaiDto;

  @ApiProperty({ type: TrangTraiSanPhamCongKhaiDto })
  trangTrai!: TrangTraiSanPhamCongKhaiDto;

  @ApiProperty({ type: GiaSanPhamCongKhaiDto })
  gia!: GiaSanPhamCongKhaiDto;

  @ApiProperty({ nullable: true, type: String })
  anhBiaUrl!: string | null;

  @ApiProperty({ type: [ChungNhanBadgeSanPhamCongKhaiDto] })
  chungNhan!: ChungNhanBadgeSanPhamCongKhaiDto[];

  @ApiProperty({ type: KhaDungSanPhamCongKhaiDto })
  khaDung!: KhaDungSanPhamCongKhaiDto;
}

export class SanPhamCongKhaiChiTietDto extends SanPhamCongKhaiTomTatDto {
  @ApiProperty({ type: [AnhSanPhamCongKhaiDto] })
  anh!: AnhSanPhamCongKhaiDto[];

  @ApiProperty({ type: [BienTheSanPhamCongKhaiDto] })
  bienThe!: BienTheSanPhamCongKhaiDto[];

  @ApiProperty({ type: ThuHoachGanNhatTrangTraiDto, nullable: true })
  thuHoachGanNhatTaiTrangTrai!: ThuHoachGanNhatTrangTraiDto | null;
}

export class DanhSachSanPhamCongKhaiDto {
  @ApiProperty({ type: [SanPhamCongKhaiTomTatDto] })
  duLieu!: SanPhamCongKhaiTomTatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
