import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CapNhatCauHinhHeThongDto {
  @ApiProperty({ example: 15, minimum: 1, maximum: 60 })
  @IsInt()
  @Min(1)
  @Max(60)
  reservationTtlPhut!: number;

  @ApiProperty({ example: 7, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  thoiHanKhieuNaiNgay!: number;

  @ApiProperty({ example: 7, minimum: 1, maximum: 30 })
  @IsInt()
  @Min(1)
  @Max(30)
  nguongSapHetHanNgay!: number;
}
