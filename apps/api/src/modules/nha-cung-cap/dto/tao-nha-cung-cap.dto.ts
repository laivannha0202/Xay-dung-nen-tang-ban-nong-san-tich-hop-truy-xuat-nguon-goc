import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaoNhaCungCapDto {
  @ApiProperty({ example: 'NCC-0001' })
  @IsString()
  @Length(2, 50)
  ma!: string;

  @ApiProperty({ example: 'Hợp tác xã Rau Xanh' })
  @IsString()
  @Length(2, 200)
  ten!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nguoiDaiDien?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  soDienThoai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diaChi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ghiChu?: string;
}
