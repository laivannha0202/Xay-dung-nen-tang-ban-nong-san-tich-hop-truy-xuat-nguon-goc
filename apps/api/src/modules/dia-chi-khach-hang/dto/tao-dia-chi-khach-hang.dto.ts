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

  @ApiPropertyOptional({
    type: String,
    maxLength: 120,
    nullable: true,
    example: 'Phường Bến Thành',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  phuongXa?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 120, nullable: true, example: 'Quận 1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quanHuyen?: string | null;

  // Optional khi dùng xaPhuongMa (tỉnh suy ra Hưng Yên); bắt buộc ở nhánh
  // legacy (service tự từ chối khi thiếu).
  @ApiPropertyOptional({ minLength: 2, maxLength: 120, example: 'Hưng Yên' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  tinhThanh?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 32,
    nullable: true,
    description:
      'Mã xã/phường Hưng Yên (ví dụ HY-C079). Khi có mã này, tỉnh cố định Hưng Yên và bỏ quận/huyện + mã bưu chính.',
    example: 'HY-C079',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  xaPhuongMa?: string | null;

  @ApiPropertyOptional({
    type: String,
    maxLength: 40,
    nullable: true,
    description:
      'Mã thôn/tổ dân phố (phải thuộc xã/phường đã chọn). Toàn tỉnh NOT_COMPLETE nên cho phép null trong giai đoạn chuyển tiếp.',
    example: 'HY-C079-V01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  thonToDanPhoMa?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 20, nullable: true, example: '700000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maBuuChinh?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  macDinh?: boolean;
}
