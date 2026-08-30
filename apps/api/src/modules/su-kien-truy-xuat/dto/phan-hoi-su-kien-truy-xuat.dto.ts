import { ApiProperty } from '@nestjs/swagger';

import { LoaiSuKienTruyXuat } from '../../../generated/prisma/client';

export class LoSuKienTruyXuatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({
    nullable: true,
    type: String,
  })
  maTruyXuat!: string | null;

  @ApiProperty()
  cayTrong!: string;

  @ApiProperty()
  giong!: string;

  @ApiProperty()
  trangTrai!: string;
}

export class SuKienTruyXuatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    type: LoSuKienTruyXuatDto,
  })
  loSanPham!: LoSuKienTruyXuatDto;

  @ApiProperty({
    enum: LoaiSuKienTruyXuat,
    enumName: 'LoaiSuKienTruyXuat',
  })
  loai!: LoaiSuKienTruyXuat;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  thoiGian!: string;

  @ApiProperty()
  diaDiem!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty()
  congKhai!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class DanhSachSuKienTruyXuatDto {
  @ApiProperty({
    type: [SuKienTruyXuatDto],
  })
  duLieu!: SuKienTruyXuatDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}
