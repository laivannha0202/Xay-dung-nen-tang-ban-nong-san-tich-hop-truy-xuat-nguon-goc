import { ApiProperty } from '@nestjs/swagger';

import { LoaiGiaoDichTonKho } from '../../../generated/prisma/client';

export class KhoLedgerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  ten!: string;
}

export class LoSanPhamLedgerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maLo!: string;
}

export class BienTheLedgerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;
}

export class GiaoDichTonKhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty({ enum: LoaiGiaoDichTonKho })
  loai!: LoaiGiaoDichTonKho;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty({ type: KhoLedgerDto })
  kho!: KhoLedgerDto;

  @ApiProperty({ type: LoSanPhamLedgerDto })
  loSanPham!: LoSanPhamLedgerDto;

  @ApiProperty({ type: BienTheLedgerDto })
  bienThe!: BienTheLedgerDto;

  @ApiProperty()
  createdAt!: Date;
}

export class DanhSachGiaoDichTonKhoDto {
  @ApiProperty({ type: [GiaoDichTonKhoDto] })
  duLieu!: GiaoDichTonKhoDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
