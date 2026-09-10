import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TongQuanDiemThuongDto {
  @ApiProperty({ description: 'Số điểm hiện có của khách hàng', example: 120 })
  diem!: number;

  @ApiProperty({ description: 'Tổng số giao dịch điểm đã ghi nhận', example: 3 })
  tongGiaoDich!: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Thời điểm số dư điểm được cập nhật gần nhất',
  })
  capNhatLuc!: Date | null;
}

export class GiaoDichDiemThuongDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Số điểm tăng hoặc giảm trong giao dịch', example: 20 })
  bienDongDiem!: number;

  @ApiProperty({ description: 'Số dư điểm ngay sau giao dịch', example: 120 })
  soDuSau!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  lyDo!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class DanhSachGiaoDichDiemThuongDto {
  @ApiProperty({ type: [GiaoDichDiemThuongDto] })
  items!: GiaoDichDiemThuongDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
