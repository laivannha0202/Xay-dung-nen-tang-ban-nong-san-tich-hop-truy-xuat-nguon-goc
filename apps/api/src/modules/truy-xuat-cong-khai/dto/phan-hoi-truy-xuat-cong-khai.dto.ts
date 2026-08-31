import { ApiProperty } from '@nestjs/swagger';

import {
  KetQuaKiemDinhChatLuong,
  LoaiSuKienCanhTac,
  LoaiSuKienTruyXuat,
  TrangThaiLoSanPham,
} from '../../../generated/prisma/client';

export class LoTruyXuatCongKhaiDto {
  @ApiProperty()
  maLo!: string;

  @ApiProperty()
  maTruyXuat!: string;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  phanHangChatLuong!: string | null;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayHetHan!: string;

  @ApiProperty({
    enum: TrangThaiLoSanPham,
    enumName: 'TrangThaiLoSanPham',
  })
  trangThai!: TrangThaiLoSanPham;
}

export class TrangTraiTruyXuatCongKhaiDto {
  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;
}

export class MuaVuTruyXuatCongKhaiDto {
  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayTrong!: string;
}

export class ThuHoachTruyXuatCongKhaiDto {
  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayThuHoach!: string;

  @ApiProperty()
  phanLoai!: string;
}

export class ChungNhanTruyXuatCongKhaiDto {
  @ApiProperty()
  loai!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  donViCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayHetHan!: string;
}

export class KiemDinhTruyXuatCongKhaiDto {
  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayKiemDinh!: string;

  @ApiProperty({
    enum: KetQuaKiemDinhChatLuong,
    enumName: 'KetQuaKiemDinhChatLuong',
  })
  ketQua!: KetQuaKiemDinhChatLuong;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  phanHang!: string | null;
}

export class NhatKyCanhTacTruyXuatCongKhaiDto {
  @ApiProperty({
    enum: LoaiSuKienCanhTac,
    enumName: 'LoaiSuKienCanhTac',
  })
  loaiSuKien!: LoaiSuKienCanhTac;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  thoiGian!: string;

  @ApiProperty()
  noiDung!: string;
}

export class SuKienTruyXuatCongKhaiDto {
  @ApiProperty({
    enum: LoaiSuKienTruyXuat,
    enumName: 'LoaiSuKienTruyXuat',
  })
  loai!: LoaiSuKienTruyXuat;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  thoiGian!: string;

  @ApiProperty()
  diaDiem!: string;
}

export class ThuHoiTruyXuatCongKhaiDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  thuHoiLuc!: string | null;

  @ApiProperty()
  thongBaoKhachHang!: string;
}

export class TruyXuatCongKhaiDto {
  @ApiProperty()
  maTruyXuat!: string;

  @ApiProperty({
    type: LoTruyXuatCongKhaiDto,
  })
  lo!: LoTruyXuatCongKhaiDto;

  @ApiProperty({
    type: TrangTraiTruyXuatCongKhaiDto,
  })
  trangTrai!: TrangTraiTruyXuatCongKhaiDto;

  @ApiProperty({
    type: MuaVuTruyXuatCongKhaiDto,
  })
  muaVu!: MuaVuTruyXuatCongKhaiDto;

  @ApiProperty({
    type: ThuHoachTruyXuatCongKhaiDto,
  })
  thuHoach!: ThuHoachTruyXuatCongKhaiDto;

  @ApiProperty({
    type: [ChungNhanTruyXuatCongKhaiDto],
  })
  chungNhan!: ChungNhanTruyXuatCongKhaiDto[];

  @ApiProperty({
    type: [KiemDinhTruyXuatCongKhaiDto],
  })
  kiemDinh!: KiemDinhTruyXuatCongKhaiDto[];

  @ApiProperty({
    type: [NhatKyCanhTacTruyXuatCongKhaiDto],
  })
  nhatKyCanhTac!: NhatKyCanhTacTruyXuatCongKhaiDto[];

  @ApiProperty({
    type: [SuKienTruyXuatCongKhaiDto],
  })
  suKien!: SuKienTruyXuatCongKhaiDto[];

  @ApiProperty({
    type: ThuHoiTruyXuatCongKhaiDto,
    nullable: true,
  })
  thuHoi!: ThuHoiTruyXuatCongKhaiDto | null;
}
