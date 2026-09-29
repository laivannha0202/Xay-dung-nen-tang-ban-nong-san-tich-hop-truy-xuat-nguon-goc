import { ApiProperty } from '@nestjs/swagger';

import { PhamViKhuyenMai } from '../../../generated/prisma/client';

export class KhuyenMaiKhachHangDto {
  @ApiProperty() id!: string;
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
  @ApiProperty({ nullable: true, type: String }) moTa!: string | null;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;
  @ApiProperty({ nullable: true, type: String }) danhMucSanPhamId!: string | null;
  @ApiProperty({ nullable: true, type: String }) sanPhamId!: string | null;
  @ApiProperty() donHangToiThieu!: number;
  @ApiProperty() giaTriGiam!: number;
  @ApiProperty() batDauLuc!: Date;
  @ApiProperty() ketThucLuc!: Date;
  @ApiProperty({ nullable: true, type: Number }) gioiHanSuDung!: number | null;
  @ApiProperty() soLanDaSuDung!: number;
  @ApiProperty({ nullable: true, type: Number }) soLuotConLai!: number | null;
  @ApiProperty() daLuu!: boolean;
}

export class BoLuuKhuyenMaiKhachHangDto {
  @ApiProperty({ example: true }) ok!: boolean;
}
