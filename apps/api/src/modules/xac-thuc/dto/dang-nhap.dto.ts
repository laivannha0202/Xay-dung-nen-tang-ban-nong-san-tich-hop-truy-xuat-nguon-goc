import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum NenTangDangNhap {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export class DangNhapDto {
  @ApiProperty({ example: 'khachhang@example.com' })
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @ApiProperty()
  @IsString()
  matKhau!: string;

  @ApiProperty({
    enum: NenTangDangNhap,
    default: NenTangDangNhap.WEB,
  })
  @IsEnum(NenTangDangNhap)
  nenTang: NenTangDangNhap = NenTangDangNhap.WEB;

  @ApiPropertyOptional({
    description:
      'WEB: true = refresh cookie persistent (tồn tại sau khi đóng browser); ' +
      'false = session cookie (mất khi đóng browser). Mặc định true để tương thích client cũ. MOBILE bỏ qua.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ghiNho?: boolean;
}
