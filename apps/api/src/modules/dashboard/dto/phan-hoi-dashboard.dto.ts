import { ApiProperty } from '@nestjs/swagger';

export class CanhBaoTonKhoDashboardDto {
  @ApiProperty({ example: 8 })
  tong!: number;

  @ApiProperty({ example: 5 })
  sapHetHan!: number;

  @ApiProperty({ example: 3 })
  hetHan!: number;
}

export class DashboardKpiDto {
  @ApiProperty({
    example: 125000000,
    description: 'Net successful payment revenue after successful refunds.',
  })
  doanhThu!: number;

  @ApiProperty({ example: 320 })
  donHang!: number;

  @ApiProperty({ example: 180 })
  khachHang!: number;

  @ApiProperty({ example: 95 })
  sanPham!: number;

  @ApiProperty({ type: CanhBaoTonKhoDashboardDto })
  canhBaoTonKho!: CanhBaoTonKhoDashboardDto;

  @ApiProperty({ example: 12 })
  khieuNai!: number;

  @ApiProperty({ format: 'date-time' })
  capNhatLuc!: string;
}
