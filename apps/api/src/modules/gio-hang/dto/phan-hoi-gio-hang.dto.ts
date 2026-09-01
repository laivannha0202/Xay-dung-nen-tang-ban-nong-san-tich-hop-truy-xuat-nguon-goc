import { ApiProperty } from '@nestjs/swagger';

export class NhaCungCapGioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;
}

export class TrangTraiGioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ type: NhaCungCapGioHangDto })
  nhaCungCap!: NhaCungCapGioHangDto;
}

export class SanPhamGioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ type: TrangTraiGioHangDto })
  trangTrai!: TrangTraiGioHangDto;
}

export class BienTheGioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  khoiLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty()
  giaHienTai!: number;

  @ApiProperty()
  soLuongKhaDung!: number;

  @ApiProperty()
  coTheDatHang!: boolean;

  @ApiProperty({ type: SanPhamGioHangDto })
  sanPham!: SanPhamGioHangDto;
}

export class MucGioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty({ type: BienTheGioHangDto })
  bienThe!: BienTheGioHangDto;
}

export class GioHangDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  khachHangId!: string;

  @ApiProperty({ type: [MucGioHangDto] })
  muc!: MucGioHangDto[];
}
