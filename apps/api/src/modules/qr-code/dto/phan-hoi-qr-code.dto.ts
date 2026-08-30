import { ApiProperty } from '@nestjs/swagger';

export class QrCodeLoSanPhamDto {
  @ApiProperty()
  loSanPhamId!: string;

  @ApiProperty()
  maLo!: string;

  @ApiProperty({
    description: 'Mã truy xuất ổn định, duy nhất và bất biến của Lô',
    example: 'AGM-0123456789ABCDEF0123456789ABCDEF',
  })
  maTruyXuat!: string;

  @ApiProperty({
    description: 'Payload thực tế được nhúng vào QR; bằng chính maTruyXuat',
  })
  payload!: string;

  @ApiProperty({
    description: 'QR PNG dưới dạng data URL để preview/download',
  })
  pngDataUrl!: string;

  @ApiProperty({
    description: 'QR SVG để download/print chất lượng cao',
  })
  svg!: string;
}
