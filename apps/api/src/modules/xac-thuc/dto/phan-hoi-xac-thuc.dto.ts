import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NguoiDungXacThucDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  hoTen!: string;
}

export class PhanHoiDangKyDto {
  @ApiProperty({ type: NguoiDungXacThucDto })
  nguoiDung!: NguoiDungXacThucDto;
}

export class PhanHoiTokenDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiPropertyOptional({
    description: 'Chỉ trả cho client MOBILE; WEB dùng HttpOnly cookie.',
  })
  refreshToken?: string;

  @ApiProperty({ type: NguoiDungXacThucDto })
  nguoiDung!: NguoiDungXacThucDto;
}

export class PhanHoiThongBaoDto {
  @ApiProperty()
  thongBao!: string;
}
