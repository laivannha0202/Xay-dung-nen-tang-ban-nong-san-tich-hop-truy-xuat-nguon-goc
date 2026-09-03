import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TrangThaiChiTraNhaCungCap } from '../../../generated/prisma/client';

export class ChiTraNhaCungCapDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  maYeuCau!: string;

  @ApiProperty({ format: 'uuid' })
  nhaCungCapId!: string;

  @ApiProperty()
  maNhaCungCap!: string;

  @ApiProperty()
  tenNhaCungCap!: string;

  @ApiProperty({ example: 500000 })
  soTien!: number;

  @ApiProperty({ enum: TrangThaiChiTraNhaCungCap })
  trangThai!: TrangThaiChiTraNhaCungCap;

  @ApiProperty({ format: 'date-time' })
  yeuCauLuc!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  xuLyLuc!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  thanhToanLuc!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  thatBaiLuc!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lyDoThatBai!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class DanhSachChiTraNhaCungCapDto {
  @ApiProperty({ type: [ChiTraNhaCungCapDto] })
  duLieu!: ChiTraNhaCungCapDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
