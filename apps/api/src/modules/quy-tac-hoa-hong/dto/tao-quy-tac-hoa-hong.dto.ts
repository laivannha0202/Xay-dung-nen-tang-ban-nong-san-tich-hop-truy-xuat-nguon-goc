import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class TaoQuyTacHoaHongDto {
  @ApiProperty({ example: 8.5, minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tyLe!: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  danhMucSanPhamId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  nhaCungCapId!: string;

  @ApiProperty({ example: '2026-09-04T00:00:00.000Z', format: 'date-time' })
  @IsDateString()
  hieuLucTu!: string;
}
