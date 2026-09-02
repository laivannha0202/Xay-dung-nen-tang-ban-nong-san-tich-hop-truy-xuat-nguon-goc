import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class GanVaiTroNhanVienDto {
  @ApiProperty({ type: [String], example: ['NHAN_VIEN'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  maVaiTro!: string[];
}
