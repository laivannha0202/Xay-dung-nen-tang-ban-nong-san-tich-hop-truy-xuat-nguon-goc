import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class XuatKhoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tonKhoLoId!: string;

  @ApiProperty({ minimum: 0.001, example: 5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  soLuong!: number;
}
