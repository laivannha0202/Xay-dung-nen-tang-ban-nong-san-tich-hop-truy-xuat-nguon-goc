import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class GanAnhSanPhamDto {
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 20,
    description: 'Danh sách TepTin ảnh đã tải lên kho private',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  tepTinIds!: string[];
}
