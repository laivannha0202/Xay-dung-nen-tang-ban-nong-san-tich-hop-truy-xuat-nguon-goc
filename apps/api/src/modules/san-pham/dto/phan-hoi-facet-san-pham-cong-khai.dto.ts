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
}
