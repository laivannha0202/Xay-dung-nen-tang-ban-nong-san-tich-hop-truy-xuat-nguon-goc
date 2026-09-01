import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class XacNhanDongGoiDto {
  @ApiProperty({ example: true })
  @Equals(true)
  dungSanPham!: boolean;

  @ApiProperty({ example: true })
  @Equals(true)
  dungBatch!: boolean;

  @ApiProperty({ example: true })
  @Equals(true)
  dungQty!: boolean;

  @ApiProperty({ example: true })
  @Equals(true)
  dongGoi!: boolean;

  @ApiProperty({ example: true })
  @Equals(true)
  qr!: boolean;
}
