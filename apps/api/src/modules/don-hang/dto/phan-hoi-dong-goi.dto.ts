import { ApiProperty } from '@nestjs/swagger';

export class ChecklistDongGoiMucDto {
  @ApiProperty()
  ma!: string;

  @ApiProperty()
  nhan!: string;

  @ApiProperty()
  dat!: boolean;

  @ApiProperty({ nullable: true })
  lyDo!: string | null;
}

export class PhanBoDongGoiDto {
  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  coQr!: boolean;

  @ApiProperty({ nullable: true })
  maTruyXuat!: string | null;
}

export class MucDongGoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty({ type: [PhanBoDongGoiDto] })
  phanBo!: PhanBoDongGoiDto[];
}

export class PhanHoiDongGoiDto {
  @ApiProperty()
  donNhaCungCapId!: string;

  @ApiProperty()
  maDonNhaCungCap!: string;

  @ApiProperty()
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty()
  trangThaiDonHang!: string;

  @ApiProperty()
  trangThaiDonNhaCungCap!: string;

  @ApiProperty()
  coTheBatDau!: boolean;

  @ApiProperty()
  coTheHoanTat!: boolean;

  @ApiProperty({ type: [ChecklistDongGoiMucDto] })
  checklist!: ChecklistDongGoiMucDto[];

  @ApiProperty({ type: [MucDongGoiDto] })
  muc!: MucDongGoiDto[];
}
