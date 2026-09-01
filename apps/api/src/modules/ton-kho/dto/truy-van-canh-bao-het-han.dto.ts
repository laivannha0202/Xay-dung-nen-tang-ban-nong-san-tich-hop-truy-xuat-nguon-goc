import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class TruyVanCanhBaoHetHanTonKhoDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 30,
    default: 7,
    description: 'Số ngày tính là sắp hết hạn',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  soNgay: number = 7;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
    description: 'Số item tối đa cho mỗi nhóm alert',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  gioiHan: number = 10;
}
