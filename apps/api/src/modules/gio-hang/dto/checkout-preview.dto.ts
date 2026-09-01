import { ApiProperty } from '@nestjs/swagger';

export class NhaCungCapCheckoutPreviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;
}

export class ItemCheckoutPreviewDto {
  @ApiProperty()
  mucGioHangId!: string;

  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  tenSanPham!: string;

  @ApiProperty()
  bienTheId!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  soLuong!: number;

  @ApiProperty()
  donGia!: number;

  @ApiProperty()
  thanhTien!: number;

  @ApiProperty()
  soLuongKhaDung!: number;

  @ApiProperty()
  coTheDatHang!: boolean;

  @ApiProperty({ type: NhaCungCapCheckoutPreviewDto })
  nhaCungCap!: NhaCungCapCheckoutPreviewDto;
}

export class PriceCheckoutPreviewDto {
  @ApiProperty()
  tamTinhHangHoa!: number;

  @ApiProperty({ example: 'VND' })
  tienTe!: string;
}

export class ThanhPhanChuaSanSangCheckoutPreviewDto {
  @ApiProperty()
  trangThai!: string;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Null khi repository chưa có nguồn sự thật để tính thành phần này.',
  })
  giaTri!: number | null;

  @ApiProperty()
  lyDo!: string;
}

export class TotalCheckoutPreviewDto {
  @ApiProperty()
  tamTinhDaBiet!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Chỉ có giá trị khi mọi thành phần bắt buộc đã có nguồn sự thật.',
  })
  tongThanhToan!: number | null;

  @ApiProperty()
  coTheXacNhan!: boolean;

  @ApiProperty({ type: [String] })
  lyDoKhongTheXacNhan!: string[];
}

export class CheckoutPreviewDto {
  @ApiProperty()
  gioHangId!: string;

  @ApiProperty({ type: [ItemCheckoutPreviewDto] })
  items!: ItemCheckoutPreviewDto[];

  @ApiProperty({ type: PriceCheckoutPreviewDto })
  price!: PriceCheckoutPreviewDto;

  @ApiProperty({
    type: ThanhPhanChuaSanSangCheckoutPreviewDto,
  })
  promotion!: ThanhPhanChuaSanSangCheckoutPreviewDto;

  @ApiProperty({
    type: ThanhPhanChuaSanSangCheckoutPreviewDto,
  })
  shipping!: ThanhPhanChuaSanSangCheckoutPreviewDto;

  @ApiProperty({
    type: ThanhPhanChuaSanSangCheckoutPreviewDto,
  })
  points!: ThanhPhanChuaSanSangCheckoutPreviewDto;

  @ApiProperty({ type: TotalCheckoutPreviewDto })
  total!: TotalCheckoutPreviewDto;
}
