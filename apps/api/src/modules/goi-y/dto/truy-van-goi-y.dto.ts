import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TruyVanGoiYDto {
  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: 20,
    description: 'Số sản phẩm tối đa trả về.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  gioiHan = 10;
}
