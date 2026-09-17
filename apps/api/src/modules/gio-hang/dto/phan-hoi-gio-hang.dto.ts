import { ApiProperty } from '@nestjs/swagger';

import {
  LOAI_GIA_HIEU_LUC,
  type LoaiGiaHieuLuc,
} from '../../flash-sale/gia-hieu-luc.service';

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

  @ApiProperty({ type: String, nullable: true })
  anhBiaUrl!: string | null;

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

  @ApiProperty({
    description: 'Giá hiệu lực server-side (flash sale nếu đang hiệu lực).',
  })
  giaHienTai!: number;

  @ApiProperty({ description: 'Giá gốc của biến thể (server-side).' })
  giaGoc!: number;

  @ApiProperty({
    enum: LOAI_GIA_HIEU_LUC,
    description: 'Nguồn của giá hiệu lực.',
  })
  loaiGia!: LoaiGiaHieuLuc;

  @ApiProperty({ type: String, nullable: true })
  mucFlashSaleId!: string | null;

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
