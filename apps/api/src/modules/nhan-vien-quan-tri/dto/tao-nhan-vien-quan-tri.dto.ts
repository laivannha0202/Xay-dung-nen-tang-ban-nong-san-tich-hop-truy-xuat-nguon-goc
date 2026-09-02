import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class TaoNhanVienQuanTriDto {
  @ApiProperty({ example: 'nhanvien@example.com' })
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  matKhau!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 150)
  hoTen!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai?: string;

  @ApiProperty()
  @IsString()
  @Length(2, 50)
  maNhanVien!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  chucDanh?: string;
}
