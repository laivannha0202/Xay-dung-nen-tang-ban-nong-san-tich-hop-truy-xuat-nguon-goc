import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { NenTangDangNhap } from './dang-nhap.dto';

export class LamMoiTokenDto {
  @ApiPropertyOptional({
    description: 'Mobile gửi refresh token trong body; Web dùng HttpOnly cookie.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    enum: NenTangDangNhap,
    default: NenTangDangNhap.WEB,
  })
  @IsOptional()
  nenTang?: NenTangDangNhap;
}
