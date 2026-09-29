import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: String, nullable: true })
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

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  ketThucLuc!: Date | null;
}

export class DiaChiGiaoHangDonHangQuanTriDto {
  @ApiProperty({ nullable: true, type: String })
  id!: string | null;

  @ApiProperty({ nullable: true, type: String })
  tenNguoiNhan!: string | null;

  @ApiProperty({ nullable: true, type: String })
  soDienThoai!: string | null;

  @ApiProperty({ nullable: true, type: String })
  diaChi!: string | null;
}

export class PhanBoDonHangQuanTriDto {
  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ nullable: true, type: String })
  maTruyXuat!: string | null;

  @ApiProperty()
  soLuong!: number;
}

export class MucDonHangQuanTriDto {
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

  @ApiProperty({ type: [PhanBoDonHangQuanTriDto] })
  phanBo!: PhanBoDonHangQuanTriDto[];
}

export class DonHangNhaCungCapQuanTriDto {
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

  @ApiProperty({ type: [MucDonHangQuanTriDto] })
  muc!: MucDonHangQuanTriDto[];
}

export class SuKienVanChuyenQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty({ nullable: true, type: String })
  moTa!: string | null;

  @ApiProperty({ nullable: true, type: String })
  viTri!: string | null;

  @ApiProperty()
  thoiGian!: Date;
}

export class VanChuyenQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  donHangNhaCungCapId!: string;

  @ApiProperty()
  maDonNhaCungCap!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty()
  maVanDon!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [SuKienVanChuyenQuanTriDto] })
  suKien!: SuKienVanChuyenQuanTriDto[];
}

export class KhieuNaiLienQuanQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  lyDo!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  soBangChung!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class ChiTietDonHangQuanTriDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ format: 'uuid' })
  maYeuCau!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  tongTien!: number;

  // Optional ở TypeScript để service cũ vẫn compile; controller enrich luôn trả đủ.
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

  @ApiProperty({ type: KhachHangDonHangQuanTriDto })
  khachHang!: KhachHangDonHangQuanTriDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: DiaChiGiaoHangDonHangQuanTriDto, nullable: true })
  diaChiGiaoHang!: DiaChiGiaoHangDonHangQuanTriDto | null;

  @ApiProperty({ type: [DonHangNhaCungCapQuanTriDto] })
  donNhaCungCap!: DonHangNhaCungCapQuanTriDto[];

  @ApiProperty({ type: [ThanhToanQuanTriDto] })
  thanhToan!: ThanhToanQuanTriDto[];

  @ApiProperty({ type: [VanChuyenQuanTriDto] })
  vanChuyen!: VanChuyenQuanTriDto[];

  @ApiProperty({ type: [KhieuNaiLienQuanQuanTriDto] })
  khieuNaiLienQuan!: KhieuNaiLienQuanQuanTriDto[];

  @ApiProperty({ type: DatChoDonHangQuanTriDto, nullable: true })
  datCho!: DatChoDonHangQuanTriDto | null;
}
