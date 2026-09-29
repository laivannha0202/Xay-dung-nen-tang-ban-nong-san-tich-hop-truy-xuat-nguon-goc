import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PhamViKhuyenMai } from '../../../generated/prisma/client';

export type TrangThaiVoucherKhachHang = 'KHA_DUNG' | 'DA_SU_DUNG' | 'HET_HAN';

export class VoucherHienThiDto {
  @ApiProperty() khuyenMaiId!: string;
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
  @ApiPropertyOptional({ nullable: true }) moTa!: string | null;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;
  @ApiPropertyOptional({ nullable: true }) danhMucSanPhamId!: string | null;
  @ApiPropertyOptional({ nullable: true }) sanPhamId!: string | null;
  @ApiProperty() donHangToiThieu!: number;
  @ApiProperty() giaTriGiam!: number;
  @ApiProperty() batDauLuc!: Date;
  @ApiProperty() ketThucLuc!: Date;
  @ApiPropertyOptional({ nullable: true }) gioiHanSuDung!: number | null;
  @ApiProperty() soLanDaSuDung!: number;
  @ApiProperty() daLuu!: boolean;
  @ApiPropertyOptional({ nullable: true }) daLuuLuc!: Date | null;
  @ApiPropertyOptional({ nullable: true }) daSuDungLuc!: Date | null;
  @ApiPropertyOptional({ nullable: true }) maDonHangSuDung!: string | null;
  @ApiProperty({ enum: ['KHA_DUNG', 'DA_SU_DUNG', 'HET_HAN'] })
  trangThaiVoucher!: TrangThaiVoucherKhachHang;
}

export class DanhSachVoucherHienThiDto {
  @ApiProperty({ type: [VoucherHienThiDto] }) items!: VoucherHienThiDto[];
  @ApiProperty() tong!: number;
}
