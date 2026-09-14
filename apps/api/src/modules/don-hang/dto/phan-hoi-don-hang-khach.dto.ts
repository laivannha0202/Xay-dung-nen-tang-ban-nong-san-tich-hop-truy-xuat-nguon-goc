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

/**
 * Allocation truy xuất lô cho khách hàng: chỉ field công khai, factual.
 * Không tái dùng Admin DTO (chứa tonKhoLoId/loSanPhamId nội bộ kho).
 * Một MucDonHang có thể có NHIỀU allocation → luôn là array, không gộp.
 */
export class PhanBoTruyXuatMucDonHangKhachDto {
  @ApiProperty({ description: 'Mã lô sản phẩm đã cấp phát (persisted allocation)' })
  maLo!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Mã truy xuất công khai của lô; null khi lô chưa có mã',
  })
  maTruyXuat!: string | null;

  @ApiProperty({ description: 'Số lượng đã cấp phát từ lô (ngữ nghĩa tồn kho backend)' })
  soLuong!: number;
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

  @ApiProperty({
    type: [PhanBoTruyXuatMucDonHangKhachDto],
    description: 'Các lô exact đã cấp phát cho mục này (persisted allocation, có thể rỗng)',
  })
  phanBo!: PhanBoTruyXuatMucDonHangKhachDto[];
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

export class DiaChiGiaoHangDonHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenNguoiNhan!: string;

  @ApiProperty()
  soDienThoai!: string;

  @ApiProperty()
  diaChi!: string;
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

  // Optional ở TypeScript để DonHangService legacy vẫn compile; controller enrich luôn trả đủ.
  @ApiProperty()
  tamTinhHangHoa?: number;

  @ApiProperty()
  phiVanChuyen?: number;

  @ApiProperty({ nullable: true, type: String })
  maKhuyenMai?: string | null;

  @ApiProperty()
  giamKhuyenMai?: number;

  @ApiProperty()
  diemDaDung?: number;

  @ApiProperty()
  giaTriDiemDaDung?: number;

  @ApiProperty()
  coTheHuy!: boolean;

  @ApiProperty({ nullable: true })
  lyDoKhongTheHuy!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: DiaChiGiaoHangDonHangDto, nullable: true })
  diaChiGiaoHang!: DiaChiGiaoHangDonHangDto | null;

  @ApiProperty({ type: [DonHangNhaCungCapKhachDto] })
  donNhaCungCap!: DonHangNhaCungCapKhachDto[];

  @ApiProperty({ type: [MocTienTrinhDonHangDto] })
  tienTrinh!: MocTienTrinhDonHangDto[];
}
