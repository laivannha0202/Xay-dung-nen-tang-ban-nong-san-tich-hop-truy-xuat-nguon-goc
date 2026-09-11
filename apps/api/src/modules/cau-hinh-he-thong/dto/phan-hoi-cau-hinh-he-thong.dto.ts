import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CauHinhHeThongDto {
  @ApiProperty({
    type: Number,
    example: 15,
    description: 'Số phút giữ chỗ tồn kho mặc định.',
  })
  reservationTtlPhut!: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số ngày được phép khiếu nại kể từ lúc giao hàng.',
  })
  thoiHanKhieuNaiNgay!: number;

  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Số ngày dùng để xác định lô sắp hết hạn.',
  })
  nguongSapHetHanNgay!: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Phí vận chuyển cơ bản.',
  })
  phiVanChuyenCoBan!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Ngưỡng miễn phí vận chuyển.',
  })
  nguongMienPhiVanChuyen!: number | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description:
      'Giá trị VND quy đổi cho mỗi điểm thưởng. 0 nghĩa là chưa bật đổi điểm tại checkout.',
  })
  giaTriQuyDoiMoiDiem!: number;
}
