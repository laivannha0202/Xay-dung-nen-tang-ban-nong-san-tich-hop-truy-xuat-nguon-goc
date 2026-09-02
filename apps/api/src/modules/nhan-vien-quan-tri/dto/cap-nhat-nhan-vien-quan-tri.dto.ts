import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CapNhatNhanVienQuanTriDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 150)
  hoTen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 50)
  maNhanVien?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  chucDanh?: string;
}
