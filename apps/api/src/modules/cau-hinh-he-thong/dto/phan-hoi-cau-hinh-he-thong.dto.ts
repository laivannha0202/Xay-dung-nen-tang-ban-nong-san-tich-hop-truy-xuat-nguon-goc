import { ApiProperty } from '@nestjs/swagger';

export class CauHinhHeThongDto {
  @ApiProperty({ example: 15, description: 'Số phút giữ chỗ tồn kho mặc định.' })
  reservationTtlPhut!: number;

  @ApiProperty({ example: 7, description: 'Số ngày được phép khiếu nại kể từ lúc giao hàng.' })
  thoiHanKhieuNaiNgay!: number;

  @ApiProperty({ example: 7, description: 'Số ngày dùng để xác định lô sắp hết hạn.' })
  nguongSapHetHanNgay!: number;
}
