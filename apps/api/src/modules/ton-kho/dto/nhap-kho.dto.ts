import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class NhapKhoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  khoId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  loSanPhamId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bienTheSanPhamId!: string;

  @ApiProperty({ minimum: 0.001, example: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  soLuong!: number;
}
