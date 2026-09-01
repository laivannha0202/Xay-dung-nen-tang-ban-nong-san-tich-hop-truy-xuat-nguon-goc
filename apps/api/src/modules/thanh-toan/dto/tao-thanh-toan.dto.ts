import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID, ValidateIf } from 'class-validator';

export const PHUONG_THUC_THANH_TOAN_054 = ['COD', 'MOCK'] as const;

export const KET_QUA_MOCK_054 = ['THANH_CONG', 'THAT_BAI'] as const;

export type PhuongThucThanhToan054 = (typeof PHUONG_THUC_THANH_TOAN_054)[number];

export type KetQuaMock054 = (typeof KET_QUA_MOCK_054)[number];

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
    enum: KET_QUA_MOCK_054,
    description: 'Bắt buộc khi phuongThuc=MOCK; chỉ dùng PHIEN-054 để mô phỏng gateway.',
  })
  @ValidateIf((dto: TaoThanhToanDto) => dto.phuongThuc === 'MOCK')
  @IsIn(KET_QUA_MOCK_054)
  ketQuaMock?: KetQuaMock054;
}
