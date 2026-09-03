import { ApiProperty } from '@nestjs/swagger';

import { LoaiGiaoDichTonKho } from '../../../generated/prisma/client';

export class KhoBaoCaoTonKhoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  ten!: string;
}

export class LoSanPhamBaoCaoTonKhoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ format: 'date' })
  ngayHetHan!: string;
}

export class BienTheBaoCaoTonKhoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ format: 'uuid' })
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;
}

export class BaoCaoTonKhoItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: KhoBaoCaoTonKhoDto })
  kho!: KhoBaoCaoTonKhoDto;

  @ApiProperty({ type: LoSanPhamBaoCaoTonKhoDto })
  loSanPham!: LoSanPhamBaoCaoTonKhoDto;

  @ApiProperty({ type: BienTheBaoCaoTonKhoDto })
  bienThe!: BienTheBaoCaoTonKhoDto;

  @ApiProperty({ example: 25.5 })
  onHand!: number;

  @ApiProperty({ example: 2 })
  reserved!: number;

  @ApiProperty({ example: 1 })
  blocked!: number;

  @ApiProperty({ example: 22.5 })
  available!: number;
}

export class BaoCaoCanhBaoTonKhoItemDto extends BaoCaoTonKhoItemDto {
  @ApiProperty({ example: 4, description: 'Âm nếu đã hết hạn.' })
  soNgayConLai!: number;
}

export class DanhSachBaoCaoTonKhoDto {
  @ApiProperty({ type: [BaoCaoTonKhoItemDto] })
  duLieu!: BaoCaoTonKhoItemDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class DanhSachBaoCaoCanhBaoTonKhoDto {
  @ApiProperty({ type: [BaoCaoCanhBaoTonKhoItemDto] })
  duLieu!: BaoCaoCanhBaoTonKhoItemDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;

  @ApiProperty({ format: 'date' })
  ngayThamChieu!: string;

  @ApiProperty({ example: 7, description: 'Ngưỡng near-expiry lấy từ System Settings.' })
  soNgayCanhBao!: number;
}

export class BaoCaoHaoHutTonKhoItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tonKhoLoId!: string;

  @ApiProperty({ enum: [LoaiGiaoDichTonKho.DAMAGE, LoaiGiaoDichTonKho.EXPIRE] })
  loai!: LoaiGiaoDichTonKho;

  @ApiProperty({ example: 3.5 })
  soLuong!: number;

  @ApiProperty({ type: KhoBaoCaoTonKhoDto })
  kho!: KhoBaoCaoTonKhoDto;

  @ApiProperty({ type: LoSanPhamBaoCaoTonKhoDto })
  loSanPham!: LoSanPhamBaoCaoTonKhoDto;

  @ApiProperty({ type: BienTheBaoCaoTonKhoDto })
  bienThe!: BienTheBaoCaoTonKhoDto;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class DanhSachBaoCaoHaoHutTonKhoDto {
  @ApiProperty({ type: [BaoCaoHaoHutTonKhoItemDto] })
  duLieu!: BaoCaoHaoHutTonKhoItemDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
