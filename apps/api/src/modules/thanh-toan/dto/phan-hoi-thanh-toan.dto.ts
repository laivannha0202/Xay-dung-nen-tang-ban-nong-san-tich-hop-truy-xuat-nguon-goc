import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GiaoDichThanhToanPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maGiaoDich!: string;

  @ApiProperty()
  soTien!: number;

  @ApiProperty()
  phuongThuc!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  thoiGian!: Date;
}

export class DatChoThanhToanPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty()
  hetHanLuc!: Date;
}

export class ThanhToanPhanHoiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  donHangId!: string;

  @ApiProperty()
  maDonHang!: string;

  @ApiProperty()
  soTien!: number;

  @ApiProperty()
  phuongThuc!: string;

  @ApiProperty()
  trangThai!: string;

  @ApiProperty({ type: GiaoDichThanhToanPhanHoiDto })
  giaoDich!: GiaoDichThanhToanPhanHoiDto;

  @ApiProperty({ type: DatChoThanhToanPhanHoiDto })
  datCho!: DatChoThanhToanPhanHoiDto;

  @ApiPropertyOptional({
    description:
      'URL gateway cần mở khi payment online đang chờ người dùng thanh toán.',
  })
  paymentUrl?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Thời điểm payment URL hết hiệu lực nếu gateway cung cấp.',
  })
  expiresAt?: Date;
}
