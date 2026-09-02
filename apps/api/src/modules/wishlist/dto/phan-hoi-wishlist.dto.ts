import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SanPhamYeuThichDto {
  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  ten!: string;

  @ApiPropertyOptional({ nullable: true })
  moTa!: string | null;

  @ApiProperty()
  trangTraiId!: string;

  @ApiProperty()
  tenTrangTrai!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class DanhSachSanPhamYeuThichDto {
  @ApiProperty({ type: [SanPhamYeuThichDto] })
  duLieu!: SanPhamYeuThichDto[];

  @ApiProperty()
  tong!: number;
}

export class TrangThaiSanPhamYeuThichDto {
  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  daYeuThich!: boolean;
}
