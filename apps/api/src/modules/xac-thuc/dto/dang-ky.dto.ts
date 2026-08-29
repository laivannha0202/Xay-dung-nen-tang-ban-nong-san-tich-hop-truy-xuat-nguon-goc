import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class DangKyDto {
  @ApiProperty({ example: 'khachhang@example.com' })
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  matKhau!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @Length(2, 150)
  hoTen!: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai?: string;
}
