import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../../../generated/prisma/client';

export class KhoTonKhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ enum: TrangThaiBanGhi })
  trangThai!: TrangThaiBanGhi;
}

export class LoSanPhamTonKhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({ type: String, format: 'date' })
  ngayHetHan!: string;

  @ApiProperty({ enum: TrangThaiLoSanPham })
  trangThai!: TrangThaiLoSanPham;
}

export class BienTheTonKhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  khoiLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;
}

export class TonKhoLoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: KhoTonKhoDto })
  kho!: KhoTonKhoDto;

  @ApiProperty({ type: LoSanPhamTonKhoDto })
  loSanPham!: LoSanPhamTonKhoDto;

  @ApiProperty({ type: BienTheTonKhoDto })
  bienThe!: BienTheTonKhoDto;

  @ApiProperty()
  onHand!: number;

  @ApiProperty()
  reserved!: number;

  @ApiProperty()
  blocked!: number;

  @ApiProperty({
    description: 'available = onHand - reserved - blocked',
  })
  available!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachTonKhoLoDto {
  @ApiProperty({ type: [TonKhoLoDto] })
  duLieu!: TonKhoLoDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
