import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsUUID,
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

  @ApiProperty({ type: [MucDonHangDuKienDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MucDonHangDuKienDto)
  items!: MucDonHangDuKienDto[];
}
