import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class CapNhatQuyenVaiTroDto {
  @ApiProperty({
    type: [String],
    description: 'Toàn bộ mã quyền đang hoạt động cần giữ cho role.',
    example: ['san_pham.xem', 'don_hang.xu_ly'],
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsString({ each: true })
  maQuyen!: string[];
}
