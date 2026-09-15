import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class XaPhuongHungYenPhanHoiDto {
  @ApiProperty({ example: 'HY-C001' })
  ma!: string;

  @ApiProperty({ example: 'Tân Hưng' })
  ten!: string;

  @ApiProperty({ example: 'Xã Tân Hưng' })
  tenDayDu!: string;

  @ApiProperty({ enum: ['XA', 'PHUONG'], example: 'XA' })
  loai!: string;

  @ApiPropertyOptional({ example: 'tan hung' })
  tenChuanHoa?: string;
}

export class ThonToDanPhoPhanHoiDto {
  @ApiProperty({ example: 'HY-C079-V01' })
  ma!: string;

  @ApiProperty({ example: 'Tán Thuật' })
  ten!: string;

  @ApiProperty({ example: 'Thôn Tán Thuật' })
  tenDayDu!: string;

  @ApiProperty({ enum: ['THON', 'TO_DAN_PHO'], example: 'THON' })
  loai!: string;
}
