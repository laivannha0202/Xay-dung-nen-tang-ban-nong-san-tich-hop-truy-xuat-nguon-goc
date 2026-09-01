import { ApiProperty } from '@nestjs/swagger';

export class CanhBaoHetHanTonKhoItemDto {
  @ApiProperty()
  tonKhoLoId!: string;

  @ApiProperty()
  khoId!: string;

  @ApiProperty()
  maKho!: string;

  @ApiProperty()
  tenKho!: string;

  @ApiProperty()
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  bienTheSanPhamId!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  tenTrangTrai!: string;

  @ApiProperty()
  ngayHetHan!: string;

  @ApiProperty()
  soNgayConLai!: number;

  @ApiProperty()
  onHand!: number;

  @ApiProperty()
  reserved!: number;

  @ApiProperty()
  blocked!: number;

  @ApiProperty()
  available!: number;

  @ApiProperty({ enum: ['SAP_HET_HAN', 'HET_HAN'] })
  trangThai!: 'SAP_HET_HAN' | 'HET_HAN';
}

export class KetQuaCanhBaoHetHanTonKhoDto {
  @ApiProperty()
  ngayThamChieu!: string;

  @ApiProperty()
  soNgayCanhBao!: number;

  @ApiProperty()
  tongSapHetHan!: number;

  @ApiProperty()
  tongHetHan!: number;

  @ApiProperty({ type: CanhBaoHetHanTonKhoItemDto, isArray: true })
  sapHetHan!: CanhBaoHetHanTonKhoItemDto[];

  @ApiProperty({ type: CanhBaoHetHanTonKhoItemDto, isArray: true })
  hetHan!: CanhBaoHetHanTonKhoItemDto[];
}
