import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi, TrangThaiMuaVu } from '../../../generated/prisma/client';

export class NhaCungCapTrangTraiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class AnhTrangTraiDto {
  @ApiProperty()
  tepTinId!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  thuTu!: number;

  @ApiProperty()
  url!: string;
}

export class TrangTraiTomTatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty()
  diaChi!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  viDo!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  kinhDo!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
  })
  dienTichHa!: number | null;

  @ApiProperty({
    type: NhaCungCapTrangTraiDto,
  })
  nhaCungCap!: NhaCungCapTrangTraiDto;

  @ApiProperty()
  soAnh!: number;

  @ApiProperty({
    enum: TrangThaiBanGhi,
  })
  trangThai!: TrangThaiBanGhi;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TrangTraiChiTietDto extends TrangTraiTomTatDto {
  @ApiProperty({
    type: [AnhTrangTraiDto],
  })
  anh!: AnhTrangTraiDto[];
}

export class ChungNhanCongKhaiTrangTraiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  loai!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  donViCap!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayCap!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayHetHan!: string;
}

export class MuaVuCongKhaiTrangTraiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayTrong!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayDuKienThuHoach!: string;

  @ApiProperty()
  sanLuongDuKienKg!: number;

  @ApiProperty({ enum: TrangThaiMuaVu })
  trangThai!: TrangThaiMuaVu;
}

export class TrangTraiCongKhaiChiTietDto extends TrangTraiChiTietDto {
  @ApiProperty({ type: [ChungNhanCongKhaiTrangTraiDto] })
  chungNhan!: ChungNhanCongKhaiTrangTraiDto[];

  @ApiProperty({ type: [MuaVuCongKhaiTrangTraiDto] })
  muaVu!: MuaVuCongKhaiTrangTraiDto[];
}

export class DanhSachTrangTraiDto {
  @ApiProperty({
    type: [TrangTraiTomTatDto],
  })
  duLieu!: TrangTraiTomTatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
