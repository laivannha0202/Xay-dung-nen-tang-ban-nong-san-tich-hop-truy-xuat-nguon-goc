import { ApiProperty } from '@nestjs/swagger';

import { TrangThaiXacMinhChungNhan } from '../../../generated/prisma/client';

export class TrangTraiChungNhanDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;
}

export class TepTinChungNhanDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenGoc!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  url!: string;
}

export class ChungNhanTomTatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  loai!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  donViCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
  })
  ngayHetHan!: string;

  @ApiProperty({
    type: TrangTraiChungNhanDto,
  })
  trangTrai!: TrangTraiChungNhanDto;

  @ApiProperty({
    enum: TrangThaiXacMinhChungNhan,
  })
  trangThaiXacMinh!: TrangThaiXacMinhChungNhan;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  lyDoTuChoi!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  xacMinhLuc!: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  canhBao30NgayLuc!: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  canhBao7NgayLuc!: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  canhBaoHetHanLuc!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ChungNhanChiTietDto extends ChungNhanTomTatDto {
  @ApiProperty({
    type: TepTinChungNhanDto,
  })
  tepTin!: TepTinChungNhanDto;
}

export class DanhSachChungNhanDto {
  @ApiProperty({
    type: [ChungNhanTomTatDto],
  })
  duLieu!: ChungNhanTomTatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
