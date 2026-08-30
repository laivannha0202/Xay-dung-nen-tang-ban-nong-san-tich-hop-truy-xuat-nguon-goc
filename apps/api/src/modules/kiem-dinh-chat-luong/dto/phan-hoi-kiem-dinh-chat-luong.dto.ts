import { ApiProperty } from '@nestjs/swagger';

import { KetQuaKiemDinhChatLuong, TrangThaiLoSanPham } from '../../../generated/prisma/client';

export class NguoiKiemDinhDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  hoTen!: string;
}

export class LoKiemDinhDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({
    enum: TrangThaiLoSanPham,
  })
  trangThai!: TrangThaiLoSanPham;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty()
  trangTrai!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayThuHoach!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayHetHan!: string;
}

export class KiemDinhChatLuongTomTatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: LoKiemDinhDto,
  })
  loSanPham!: LoKiemDinhDto;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayKiemDinh!: string;

  @ApiProperty({
    type: NguoiKiemDinhDto,
  })
  nguoiKiemDinh!: NguoiKiemDinhDto;

  @ApiProperty({
    enum: KetQuaKiemDinhChatLuong,
  })
  ketQua!: KetQuaKiemDinhChatLuong;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  phanHang!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  ghiChu!: string | null;

  @ApiProperty()
  soAnh!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class AnhKiemDinhDto {
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

export class KiemDinhChatLuongChiTietDto extends KiemDinhChatLuongTomTatDto {
  @ApiProperty({
    type: [AnhKiemDinhDto],
  })
  anh!: AnhKiemDinhDto[];
}

export class DanhSachKiemDinhChatLuongDto {
  @ApiProperty({
    type: [KiemDinhChatLuongTomTatDto],
  })
  duLieu!: KiemDinhChatLuongTomTatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
