import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TruyVanXaPhuongHungYenDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm không dấu (ví dụ "thai binh" tìm được "Thái Bình").',
    example: 'kien xuong',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tuKhoa?: string;
}
