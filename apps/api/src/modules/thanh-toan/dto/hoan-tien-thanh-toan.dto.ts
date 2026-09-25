import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class HoanTienThanhToanDto {
  @ApiProperty({ description: 'Idempotency key UUID cho refund request' })
  @IsUUID()
  maYeuCau!: string;

  @ApiProperty({ minimum: 0.01, example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  soTien!: number;

  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  lyDo!: string;

  @ApiPropertyOptional({
    description: 'ID mục đơn hàng nếu hoàn tiền đích danh cho một sản phẩm (complaint refund)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  mucDonHangId?: string;
}
