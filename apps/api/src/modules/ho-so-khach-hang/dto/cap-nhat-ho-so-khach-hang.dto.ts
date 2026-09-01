import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CapNhatHoSoKhachHangDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  hoTen?: string;

  @ApiPropertyOptional({ example: '0912345678', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,20}$/)
  soDienThoai?: string | null;

  @ApiPropertyOptional({ example: '1998-05-20', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngaySinh?: string | null;
}
