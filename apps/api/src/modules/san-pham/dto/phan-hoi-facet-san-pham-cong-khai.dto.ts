import { ApiProperty } from '@nestjs/swagger';

export class TuyChonFacetSanPhamCongKhaiDto {
  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({
    minimum: 1,
    description:
      'Số sản phẩm công khai thuộc facet này trong toàn bộ tập public.',
  })
  soSanPham!: number;
}

export class KhoangGiaFacetSanPhamCongKhaiDto {
  @ApiProperty({ nullable: true, type: Number })
  min!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  max!: number | null;
}

export class FacetSanPhamCongKhaiDto {
  @ApiProperty({
    type: [TuyChonFacetSanPhamCongKhaiDto],
  })
  danhMuc!: TuyChonFacetSanPhamCongKhaiDto[];

  @ApiProperty({
    type: [TuyChonFacetSanPhamCongKhaiDto],
  })
  trangTrai!: TuyChonFacetSanPhamCongKhaiDto[];

  @ApiProperty({
    type: [TuyChonFacetSanPhamCongKhaiDto],
  })
  chungNhan!: TuyChonFacetSanPhamCongKhaiDto[];

  @ApiProperty({
    type: [TuyChonFacetSanPhamCongKhaiDto],
    description: 'Nhóm theo địa chỉ trang trại (dữ liệu thật, chưa chuẩn hoá tỉnh/thành).',
  })
  tinhThanh!: TuyChonFacetSanPhamCongKhaiDto[];

  @ApiProperty({ type: KhoangGiaFacetSanPhamCongKhaiDto })
  gia!: KhoangGiaFacetSanPhamCongKhaiDto;
}
