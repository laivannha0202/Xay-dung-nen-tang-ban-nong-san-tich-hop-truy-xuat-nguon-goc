import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DatLaiMatKhauDto {
  @ApiProperty({
    description: 'Mã một lần nhận qua email.',
  })
  @IsString()
  maDatLai!: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  matKhauMoi!: string;
}
