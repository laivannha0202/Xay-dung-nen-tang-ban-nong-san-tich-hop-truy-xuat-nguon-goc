import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MucDonHangDuKienDto {
  @ApiProperty()
  @IsUUID()
  bienTheSanPhamId!: string;

  @ApiProperty({ minimum: 1, maximum: 999 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  soLuong!: number;

  @ApiProperty({
    minimum: 0,
    description: 'Giá client vừa thấy ở checkout/cart; Backend bắt buộc đối chiếu current price.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  donGiaDuKien!: number;
}

export class TaoDonHangDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Idempotency key do client tạo cho một lần submit Create Order.',
  })
  @IsUUID()
  maYeuCau!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Địa chỉ giao hàng thuộc người dùng hiện tại. Backend lưu snapshot vào đơn hàng nếu có.',
  })
  @IsOptional()
  @IsUUID()
  diaChiGiaoHangId?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 80,
    example: 'FRESH50',
    description: 'Mã khuyến mãi đã được khách hàng xác nhận ở checkout preview.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  maKhuyenMai?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    example: 100,
    description: 'Số điểm loyalty khách hàng muốn sử dụng cho đơn hàng.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diemSuDung?: number;

  @ApiProperty({ type: [MucDonHangDuKienDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MucDonHangDuKienDto)
  items!: MucDonHangDuKienDto[];
}
