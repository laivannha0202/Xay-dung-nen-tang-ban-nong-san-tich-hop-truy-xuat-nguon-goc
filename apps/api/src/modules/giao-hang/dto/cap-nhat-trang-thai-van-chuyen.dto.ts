import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateIf,
  ValidationArguments,
} from 'class-validator';

import { LyDoGiaoThatBai, TrangThaiVanChuyen } from '../../../generated/prisma/client';

/**
 * AGRIMARKET-DELIVERY-FAILURE: lý do giao thất bại thuộc sự kiện FAILED.
 * - trangThai = FAILED → lyDoGiaoThatBai BẮT BUỘC.
 * - trangThai khác FAILED → cấm gửi lý do (service chốt lại, không chỉ tin DTO).
 */
function khongGuiLyDoKhiKhongFailed(
  value: unknown,
  args: ValidationArguments,
): void {
  if (value === undefined || value === null || value === '') return;

  const dto = args.object as { trangThai?: TrangThaiVanChuyen };
  if (dto.trangThai === TrangThaiVanChuyen.FAILED) return;

  throw new Error(
    `Lý do giao thất bại chỉ dùng khi trạng thái là FAILED (hiện tại: ${dto.trangThai}).`,
  );
}

export class CapNhatTrangThaiVanChuyenDto {
  @ApiProperty({
    enum: TrangThaiVanChuyen,
    description: 'Trạng thái vận chuyển mới',
  })
  @IsEnum(TrangThaiVanChuyen)
  trangThai!: TrangThaiVanChuyen;

  @ApiPropertyOptional({
    enum: LyDoGiaoThatBai,
    nullable: true,
    description:
      'Bắt buộc khi trangThai = FAILED. Cấm gửi khi trạng thái khác FAILED. KHONG_LIEN_LAC_DUOC nghĩa là không liên lạc được / khách không nghe máy.',
  })
  @ValidateIf((dto: CapNhatTrangThaiVanChuyenDto) => dto.trangThai === TrangThaiVanChuyen.FAILED)
  @IsDefined({ message: 'Trạng thái FAILED bắt buộc phải có lý do giao thất bại.' })
  @IsEnum(LyDoGiaoThatBai)
  @Validate(khongGuiLyDoKhiKhongFailed)
  lyDoGiaoThatBai?: LyDoGiaoThatBai;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Mô tả sự kiện giao hàng',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  moTa?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Vị trí phát sinh sự kiện',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  viTri?: string;
}
