import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class TaoChiTraNhaCungCapDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Khóa idempotency do caller tạo; retry phải dùng lại cùng giá trị.',
  })
  @IsUUID()
  maYeuCau!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  nhaCungCapId!: string;

  @ApiProperty({ example: 500000, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  soTien!: number;
}
