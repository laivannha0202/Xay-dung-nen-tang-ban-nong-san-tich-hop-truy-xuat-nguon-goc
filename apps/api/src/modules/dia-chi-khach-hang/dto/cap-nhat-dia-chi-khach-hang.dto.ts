import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CapNhatDiaChiKhachHangDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  tenNguoiNhan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai?: string;

  @ApiPropertyOptional({ minLength: 3, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(3, 255)
  dongDiaChi?: string;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  phuongXa?: string | null;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quanHuyen?: string | null;

  @ApiPropertyOptional({ minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  tinhThanh?: string;

  @ApiPropertyOptional({ maxLength: 20, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maBuuChinh?: string | null;
}
