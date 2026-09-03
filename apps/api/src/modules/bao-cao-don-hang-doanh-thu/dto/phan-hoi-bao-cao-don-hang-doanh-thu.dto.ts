import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiDonHang } from '../../../generated/prisma/client';

export class NhaCungCapBaoCaoDonHangDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class BaoCaoDonHangDoanhThuItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ enum: TrangThaiDonHang })
  trangThaiDonHang!: TrangThaiDonHang;

  @ApiProperty({ format: 'date-time' })
  ngayDatHang!: string;

  @ApiProperty({ format: 'uuid' })
  donHangNhaCungCapId!: string;

  @ApiProperty()
  maDonNhaCungCap!: string;

  @ApiProperty({ enum: TrangThaiDonHang })
  trangThaiDonNhaCungCap!: TrangThaiDonHang;

  @ApiProperty({ type: NhaCungCapBaoCaoDonHangDto })
  nhaCungCap!: NhaCungCapBaoCaoDonHangDto;

  @ApiProperty({ format: 'uuid' })
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ format: 'uuid' })
  trangTraiId!: string;

  @ApiProperty()
  maTrangTrai!: string;

  @ApiProperty()
  tenTrangTrai!: string;

  @ApiProperty({ format: 'uuid' })
  danhMucSanPhamId!: string;

  @ApiProperty({ nullable: true })
  tenDanhMucSanPham!: string | null;

  @ApiProperty({ example: 2 })
  soLuong!: number;

  @ApiProperty({ example: 125000 })
  donGia!: number;

  @ApiProperty({ example: 250000 })
  doanhThuGop!: number;
}

export class BaoCaoDonHangDoanhThuDto {
  @ApiProperty({ type: [BaoCaoDonHangDoanhThuItemDto] })
  duLieu!: BaoCaoDonHangDoanhThuItemDto[];

  @ApiProperty({ example: 12, description: 'Số parent order phân biệt sau filter.' })
  tongDonHang!: number;

  @ApiProperty({ example: 18, description: 'Số order item sau filter.' })
  tongMuc!: number;

  @ApiProperty({ example: 31 })
  tongSoLuong!: number;

  @ApiProperty({
    example: 3750000,
    description:
      'Gross order-item revenue của order có successful payment; không tự phân bổ payment-level refund theo farm/category.',
  })
  doanhThuGop!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
