import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class TaoDiaChiKhachHangDto {
  @ApiProperty({ minLength: 2, maxLength: 150, example: 'Nguyễn Văn A' })
  @IsString()
  @Length(2, 150)
  tenNguoiNhan!: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai!: string;

  @ApiProperty({ minLength: 3, maxLength: 255, example: '12 Nguyễn Trãi' })
  @IsString()
  @Length(3, 255)
  dongDiaChi!: string;

  @ApiPropertyOptional({ maxLength: 120, nullable: true, example: 'Phường Bến Thành' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  phuongXa?: string | null;

  @ApiPropertyOptional({ maxLength: 120, nullable: true, example: 'Quận 1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quanHuyen?: string | null;

  @ApiProperty({ minLength: 2, maxLength: 120, example: 'TP. Hồ Chí Minh' })
  @IsString()
  @Length(2, 120)
  tinhThanh!: string;

  @ApiPropertyOptional({ maxLength: 20, nullable: true, example: '700000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maBuuChinh?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  macDinh?: boolean;
}
