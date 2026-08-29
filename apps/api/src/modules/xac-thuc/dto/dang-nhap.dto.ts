import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength } from 'class-validator';

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
}
