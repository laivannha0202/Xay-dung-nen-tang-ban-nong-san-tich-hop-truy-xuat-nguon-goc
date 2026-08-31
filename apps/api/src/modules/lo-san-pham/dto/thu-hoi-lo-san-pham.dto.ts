import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ThuHoiLoSanPhamDto {
  @ApiProperty({
    description: 'Lý do nội bộ phục vụ vận hành/audit; không trả ở public trace',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  lyDo!: string;

  @ApiProperty({
    description: 'Thông báo an toàn được phép hiển thị cho khách hàng trên trace',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  thongBaoKhachHang!: string;
}
