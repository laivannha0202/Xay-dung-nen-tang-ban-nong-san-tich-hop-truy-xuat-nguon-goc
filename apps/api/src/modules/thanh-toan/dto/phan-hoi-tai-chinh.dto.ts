import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiThanhToan } from '../../../generated/prisma/client';

export class ThanhToanTaiChinhDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty({ example: 500000 })
  soTien!: number;

  @ApiProperty()
  phuongThuc!: string;

  @ApiProperty({ enum: TrangThaiThanhToan })
  trangThai!: TrangThaiThanhToan;

  @ApiProperty({ example: 0 })
  tongDaHoan!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class DanhSachThanhToanTaiChinhDto {
  @ApiProperty({ type: [ThanhToanTaiChinhDto] })
  duLieu!: ThanhToanTaiChinhDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class HoanTienTaiChinhDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  thanhToanId!: string;

  @ApiProperty({ format: 'uuid' })
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  maGiaoDich!: string;

  @ApiProperty({ example: 50000 })
  soTien!: number;

  @ApiProperty()
  phuongThuc!: string;

  @ApiProperty({ enum: TrangThaiThanhToan })
  trangThai!: TrangThaiThanhToan;

  @ApiProperty({ format: 'date-time' })
  thoiGian!: string;
}

export class DanhSachHoanTienTaiChinhDto {
  @ApiProperty({ type: [HoanTienTaiChinhDto] })
  duLieu!: HoanTienTaiChinhDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
