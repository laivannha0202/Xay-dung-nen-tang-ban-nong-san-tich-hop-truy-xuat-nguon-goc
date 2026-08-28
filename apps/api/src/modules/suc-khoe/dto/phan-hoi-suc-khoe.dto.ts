import { ApiProperty } from '@nestjs/swagger';

export class PhanHoiSucKhoeDto {
  @ApiProperty({
    example: 'ok',
    description: 'Trạng thái hiện tại của API',
  })
  trangThai!: string;

  @ApiProperty({
    example: 'agrimarket-api',
    description: 'Tên dịch vụ đang phản hồi',
  })
  dichVu!: string;
}
