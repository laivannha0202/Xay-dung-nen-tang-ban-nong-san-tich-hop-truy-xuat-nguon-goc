import { ApiProperty } from '@nestjs/swagger';

import { TonKhoLoDto } from './phan-hoi-ton-kho.dto';

export class SnapshotDieuChinhTonKhoDto {
  @ApiProperty()
  onHand!: number;

  @ApiProperty()
  reserved!: number;

  @ApiProperty()
  blocked!: number;

  @ApiProperty()
  available!: number;
}

export class KetQuaDieuChinhTonKhoDto {
  @ApiProperty({ type: TonKhoLoDto })
  tonKho!: TonKhoLoDto;

  @ApiProperty()
  giaoDichId!: string;

  @ApiProperty()
  auditId!: string;

  @ApiProperty()
  tacNhanId!: string;

  @ApiProperty()
  tacNhan!: string;

  @ApiProperty()
  lyDo!: string;

  @ApiProperty()
  soLuongDieuChinh!: number;

  @ApiProperty()
  thoiGian!: Date;

  @ApiProperty({ type: SnapshotDieuChinhTonKhoDto })
  truoc!: SnapshotDieuChinhTonKhoDto;

  @ApiProperty({ type: SnapshotDieuChinhTonKhoDto })
  sau!: SnapshotDieuChinhTonKhoDto;
}
