import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TepTinDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  kichThuoc!: number;

  @ApiProperty()
  sha256!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PhanHoiUrlTepTinDto {
  @ApiProperty()
  url!: string;

  @ApiProperty({
    enum: ['xem', 'tai-xuong'],
  })
  cheDo!: 'xem' | 'tai-xuong';

  @ApiProperty({ example: 300 })
  hetHanSauGiay!: number;
}

export class PhanHoiXoaTepTinDto {
  @ApiProperty()
  thongBao!: string;

  @ApiPropertyOptional()
  id?: string;
}
