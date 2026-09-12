import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export const PHUONG_THUC_THANH_TOAN_054 = [
  'COD',
  'MOCK',
  'VNPAY_SANDBOX',
] as const;

export const KET_QUA_MOCK_054 = ['THANH_CONG', 'THAT_BAI'] as const;
export const KENH_TRA_VE_THANH_TOAN = ['MOBILE', 'WEB'] as const;

export type PhuongThucThanhToan054 =
  (typeof PHUONG_THUC_THANH_TOAN_054)[number];

export type KetQuaMock054 = (typeof KET_QUA_MOCK_054)[number];
export type KenhTraVeThanhToan = (typeof KENH_TRA_VE_THANH_TOAN)[number];

export class TaoThanhToanDto {
  @ApiProperty()
  @IsUUID()
  donHangId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Idempotency key cho một lần tạo Payment.',
  })
  @IsUUID()
  maYeuCau!: string;

  @ApiProperty({
    enum: PHUONG_THUC_THANH_TOAN_054,
  })
  @IsIn(PHUONG_THUC_THANH_TOAN_054)
  phuongThuc!: PhuongThucThanhToan054;

  @ApiPropertyOptional({
    enum: KENH_TRA_VE_THANH_TOAN,
    default: 'MOBILE',
    description:
      'Kênh an toàn mà Backend sẽ dùng để chọn callback redirect. Client không được truyền URL tùy ý.',
  })
  @IsOptional()
  @IsIn(KENH_TRA_VE_THANH_TOAN)
  kenhTraVe?: KenhTraVeThanhToan;

  @ApiPropertyOptional({
    enum: KET_QUA_MOCK_054,
    description:
      'Bắt buộc khi phuongThuc=MOCK; không dùng cho COD/VNPAY_SANDBOX.',
  })
  @ValidateIf((dto: TaoThanhToanDto) => dto.phuongThuc === 'MOCK')
  @IsIn(KET_QUA_MOCK_054)
  ketQuaMock?: KetQuaMock054;
}
