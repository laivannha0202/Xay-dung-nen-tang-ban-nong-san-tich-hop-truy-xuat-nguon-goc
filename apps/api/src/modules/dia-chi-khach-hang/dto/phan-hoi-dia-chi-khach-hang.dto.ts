import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiaChiKhachHangPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenNguoiNhan!: string;

  @ApiProperty()
  soDienThoai!: string;

  @ApiProperty()
  dongDiaChi!: string;

  @ApiPropertyOptional({ nullable: true })
  phuongXa!: string | null;

  @ApiPropertyOptional({ nullable: true })
  quanHuyen!: string | null;

  @ApiProperty()
  tinhThanh!: string;

  @ApiPropertyOptional({ nullable: true })
  maBuuChinh!: string | null;

  @ApiProperty()
  macDinh!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class XoaDiaChiKhachHangPhanHoiDto {
  @ApiProperty()
  thongBao!: string;
}
