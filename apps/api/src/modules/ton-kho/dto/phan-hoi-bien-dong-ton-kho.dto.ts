import { ApiProperty } from '@nestjs/swagger';

import { TonKhoLoDto } from './phan-hoi-ton-kho.dto';

export class KetQuaBienDongTonKhoDto {
  @ApiProperty({ type: TonKhoLoDto })
  tonKho!: TonKhoLoDto;

  @ApiProperty()
  giaoDichId!: string;
}

export class KetQuaChuyenKhoDto {
  @ApiProperty({ type: TonKhoLoDto })
  nguon!: TonKhoLoDto;

  @ApiProperty({ type: TonKhoLoDto })
  dich!: TonKhoLoDto;

  @ApiProperty()
  giaoDichNguonId!: string;

  @ApiProperty()
  giaoDichDichId!: string;
}
