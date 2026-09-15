import { ApiProperty } from '@nestjs/swagger';

export class GiaSanPhamCongKhaiDto {
  @ApiProperty()
  tu!: number;

  @ApiProperty()
  den!: number;

  @ApiProperty({ example: 'VND' })
  tienTe!: string;
}

export class GiaBanSanPhamCongKhaiDto {
  @ApiProperty({ description: 'Giá HIỆU LỰC thấp nhất trong các biến thể.' })
  tu!: number;

  @ApiProperty({ description: 'Giá HIỆU LỰC cao nhất trong các biến thể.' })
  den!: number;

  @ApiProperty({ example: 'VND' })
  tienTe!: string;

  @ApiProperty({
    description: 'Biến thể có giaHieuLuc thấp nhất (tie-break id tăng dần).',
  })
  bienTheDaiDienId!: string;

  @ApiProperty({ description: 'Giá gốc của CHÍNH biến thể đại diện.' })
  giaGocDaiDien!: number;

  @ApiProperty({ description: 'Giá hiệu lực của CHÍNH biến thể đại diện.' })
  giaHieuLucDaiDien!: number;

  @ApiProperty({ enum: ['NORMAL', 'FLASH_SALE'] })
  loaiGia!: 'NORMAL' | 'FLASH_SALE';

  @ApiProperty({
    description: 'true khi loaiGia FLASH_SALE và giaHieuLucDaiDien < giaGocDaiDien.',
  })
  dangGiam!: boolean;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Chỉ dùng để hiển thị badge, không dùng để tính ngược giá sale.',
  })
  phanTramGiam!: number | null;
}


export class QuyCachSanPhamCongKhaiDto {
  @ApiProperty()
  khoiLuong!: number;

  @ApiProperty()
  donVi!: string;
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

  @ApiProperty()
  soLuongKhaDung!: number;

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

  @ApiProperty({ description: 'Giá catalog/gốc của biến thể (giữ để tương thích ngược).' })
  gia!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty({
    description: 'Tồn khả dụng của biến thể từ InventoryLot hợp lệ',
  })
  soLuongKhaDung!: number;

  @ApiProperty({ description: 'Giá gốc của biến thể (từ GiaHieuLucService, fallback = gia).' })
  giaGoc!: number;

  @ApiProperty({
    description: 'Giá bán thực tế customer phải thấy (từ GiaHieuLucService).',
  })
  giaHieuLuc!: number;

  @ApiProperty({ enum: ['NORMAL', 'FLASH_SALE'] })
  loaiGia!: 'NORMAL' | 'FLASH_SALE';

  @ApiProperty()
  dangGiam!: boolean;

  @ApiProperty({ nullable: true, type: Number })
  phanTramGiam!: number | null;
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

export class DanhGiaTomTatSanPhamCongKhaiDto {
  @ApiProperty({ nullable: true, type: Number })
  diemTrungBinh!: number | null;

  @ApiProperty()
  tongLuot!: number;
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

  @ApiProperty({
    type: GiaBanSanPhamCongKhaiDto,
    description: 'Giá bán hiệu lực từ GiaHieuLucService (nguồn sự thật duy nhất). UI customer PHẢI dùng object này.',
  })
  giaBan!: GiaBanSanPhamCongKhaiDto;

  @ApiProperty({ type: QuyCachSanPhamCongKhaiDto })
  quyCach!: QuyCachSanPhamCongKhaiDto;

  @ApiProperty({ nullable: true, type: String })
  anhBiaUrl!: string | null;

  @ApiProperty({ type: [ChungNhanBadgeSanPhamCongKhaiDto] })
  chungNhan!: ChungNhanBadgeSanPhamCongKhaiDto[];

  @ApiProperty({ type: KhaDungSanPhamCongKhaiDto })
  khaDung!: KhaDungSanPhamCongKhaiDto;

  @ApiProperty({ type: DanhGiaTomTatSanPhamCongKhaiDto })
  danhGia!: DanhGiaTomTatSanPhamCongKhaiDto;

  @ApiProperty()
  noiBat!: boolean;

  @ApiProperty({ nullable: true, type: Number })
  thuTuNoiBat!: number | null;
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
