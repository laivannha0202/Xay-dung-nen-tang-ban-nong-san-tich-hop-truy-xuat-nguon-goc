import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiDonHang, TrangThaiLoSanPham } from '../../../generated/prisma/client';

export class TrangTraiBaoCaoTruyXuatDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class NguoiThuHoiBaoCaoTruyXuatDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;
}

export class BaoCaoLoTruyXuatItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ nullable: true, type: String })
  maTruyXuat!: string | null;

  @ApiProperty({ enum: TrangThaiLoSanPham })
  trangThai!: TrangThaiLoSanPham;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  conLai!: number;

  @ApiProperty({ nullable: true, type: String })
  phanHangChatLuong!: string | null;

  @ApiProperty({ format: 'date' })
  ngayHetHan!: string;

  @ApiProperty({ format: 'date' })
  ngayThuHoach!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({ type: TrangTraiBaoCaoTruyXuatDto })
  trangTrai!: TrangTraiBaoCaoTruyXuatDto;

  @ApiProperty()
  daThuHoi!: boolean;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  thuHoiLuc!: string | null;

  @ApiProperty()
  soDonHangAnhHuong!: number;

  @ApiProperty()
  soLuongDaPhanBo!: number;
}

export class DanhSachBaoCaoLoTruyXuatDto {
  @ApiProperty({ type: [BaoCaoLoTruyXuatItemDto] })
  duLieu!: BaoCaoLoTruyXuatItemDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class BaoCaoThuHoiTruyXuatItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ nullable: true, type: String })
  maTruyXuat!: string | null;

  @ApiProperty({ enum: TrangThaiLoSanPham })
  trangThaiLo!: TrangThaiLoSanPham;

  @ApiProperty()
  lyDo!: string;

  @ApiProperty()
  thongBaoKhachHang!: string;

  @ApiProperty({ format: 'date-time' })
  thuHoiLuc!: string;

  @ApiProperty({ nullable: true, type: NguoiThuHoiBaoCaoTruyXuatDto })
  nguoiThuHoi!: NguoiThuHoiBaoCaoTruyXuatDto | null;

  @ApiProperty({ type: TrangTraiBaoCaoTruyXuatDto })
  trangTrai!: TrangTraiBaoCaoTruyXuatDto;

  @ApiProperty()
  soDonHangAnhHuong!: number;

  @ApiProperty()
  soLuongDaPhanBo!: number;
}

export class DanhSachBaoCaoThuHoiTruyXuatDto {
  @ApiProperty({ type: [BaoCaoThuHoiTruyXuatItemDto] })
  duLieu!: BaoCaoThuHoiTruyXuatItemDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class BaoCaoDonHangAnhHuongItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ nullable: true, type: String })
  maTruyXuat!: string | null;

  @ApiProperty({ format: 'date-time' })
  thuHoiLuc!: string;

  @ApiProperty({ format: 'uuid' })
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ enum: TrangThaiDonHang })
  trangThaiDonHang!: TrangThaiDonHang;

  @ApiProperty({ format: 'date-time' })
  ngayDatHang!: string;

  @ApiProperty({ format: 'uuid' })
  donHangNhaCungCapId!: string;

  @ApiProperty()
  maDonNhaCungCap!: string;

  @ApiProperty({ enum: TrangThaiDonHang })
  trangThaiDonNhaCungCap!: TrangThaiDonHang;

  @ApiProperty({ format: 'uuid' })
  mucDonHangId!: string;

  @ApiProperty({ format: 'uuid' })
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ format: 'uuid' })
  trangTraiId!: string;

  @ApiProperty()
  maTrangTrai!: string;

  @ApiProperty()
  tenTrangTrai!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  soLuongPhanBo!: number;
}

export class DanhSachBaoCaoDonHangAnhHuongDto {
  @ApiProperty({ type: [BaoCaoDonHangAnhHuongItemDto] })
  duLieu!: BaoCaoDonHangAnhHuongItemDto[];

  @ApiProperty({ description: 'Số order phân biệt từng được allocation từ recalled batch.' })
  tongDonHang!: number;

  @ApiProperty({ description: 'Số allocation row sau filter.' })
  tongPhanBo!: number;

  @ApiProperty()
  tongSoLuongPhanBo!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
