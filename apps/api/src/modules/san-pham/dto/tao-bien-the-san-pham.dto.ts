import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class TaoBienTheSanPhamDto {
  @ApiProperty({
    maxLength: 100,
    example: 'CARROT-500G',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku!: string;

  @ApiProperty({
    type: Number,
    example: 500,
    description: 'Khối lượng/quy cách số. Kết hợp donVi để biểu diễn 500g, 1kg, 2kg.',
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 3,
  })
  @IsPositive()
  khoiLuong!: number;

  @ApiProperty({
    type: Number,
    example: 35000,
    description: 'Giá catalog hiện tại của biến thể; giá Order phải snapshot khi đặt hàng.',
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  gia!: number;

  @ApiProperty({
    maxLength: 30,
    example: 'g',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  donVi!: string;
}
