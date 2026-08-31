import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SapXepAnhSanPhamDto {
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 100,
    description: 'Toàn bộ id SanPhamAnh theo thứ tự hiển thị mới',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  anhIds!: string[];
}
