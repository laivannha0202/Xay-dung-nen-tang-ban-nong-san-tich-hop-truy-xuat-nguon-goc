import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, IsString, Length } from 'class-validator';

export class KiemTraChatLuongLoDto {
  @ApiProperty({ minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  soLuong!: number;

  @ApiProperty({ enum: ['PASS', 'DAMAGE', 'EXPIRE'] })
  @IsEnum(['PASS', 'DAMAGE', 'EXPIRE'])
  quyetDinh!: 'PASS' | 'DAMAGE' | 'EXPIRE';

  @ApiProperty()
  @IsString()
  @Length(3, 500)
  lyDo!: string;
}

export class PhanHoiKiemTraChatLuongLoDto {
  @ApiProperty()
  daThayDoi!: boolean;

  @ApiProperty()
  maThamChieu!: string;

  @ApiProperty()
  quyetDinh!: 'PASS' | 'DAMAGE' | 'EXPIRE';

  @ApiProperty()
  soLuong!: number;
}
