import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DatLaiMatKhauNhanVienDto {
  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  matKhauMoi!: string;
}
