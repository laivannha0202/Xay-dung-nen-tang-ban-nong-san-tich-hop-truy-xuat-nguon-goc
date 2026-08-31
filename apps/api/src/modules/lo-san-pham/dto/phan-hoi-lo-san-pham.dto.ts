import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiLoSanPham, TrangThaiMuaVu } from '../../../generated/prisma/client';

export class TrangTraiLoSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class MuaVuLoSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({
    enum: TrangThaiMuaVu,
  })
  trangThai!: TrangThaiMuaVu;

  @ApiProperty({
    type: TrangTraiLoSanPhamDto,
  })
  trangTrai!: TrangTraiLoSanPhamDto;
}

export class ThuHoachLoSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayThuHoach!: string;

  @ApiProperty({
    type: Number,
  })
  soLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  phanLoai!: string;

  @ApiProperty({
    type: MuaVuLoSanPhamDto,
  })
  muaVu!: MuaVuLoSanPhamDto;
}

export class NguoiThuHoiLoSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  hoTen!: string;
}

export class ThuHoiLoSanPhamChiTietDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  lyDo!: string;

  @ApiProperty()
  thongBaoKhachHang!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  thuHoiLuc!: string;

  @ApiProperty({
    type: NguoiThuHoiLoSanPhamDto,
    nullable: true,
  })
  nguoiThuHoi!: NguoiThuHoiLoSanPhamDto | null;
}

export class LoSanPhamDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({
    type: ThuHoachLoSanPhamDto,
  })
  thuHoach!: ThuHoachLoSanPhamDto;

  @ApiProperty({
    type: Number,
  })
  soLuong!: number;

  @ApiProperty({
    type: Number,
  })
  conLai!: number;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  phanHangChatLuong!: string | null;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayHetHan!: string;

  @ApiProperty({
    enum: TrangThaiLoSanPham,
  })
  trangThai!: TrangThaiLoSanPham;

  @ApiProperty({
    type: ThuHoiLoSanPhamChiTietDto,
    nullable: true,
  })
  thuHoi!: ThuHoiLoSanPhamChiTietDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachLoSanPhamDto {
  @ApiProperty({
    type: [LoSanPhamDto],
  })
  duLieu!: LoSanPhamDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
