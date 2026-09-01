import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class DieuChinhTonKhoDto {
  @ApiProperty({
    minimum: 0,
    maximum: 99999999999.999,
    example: 25.5,
    description: 'Giá trị onHand mới sau kiểm kê/điều chỉnh',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(99999999999.999)
  onHandMoi!: number;

  @ApiProperty({
    minLength: 3,
    maxLength: 500,
    example: 'Chênh lệch sau kiểm kê thực tế',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  lyDo!: string;
}
