import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class YeuCauDatLaiMatKhauDto {
  @ApiProperty({ example: 'khachhang@example.com' })
  @IsEmail()
  @MaxLength(191)
  email!: string;
}
