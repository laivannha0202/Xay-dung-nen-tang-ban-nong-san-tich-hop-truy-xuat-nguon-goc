import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const TRANG_THAI_KHA_DUNG_CONG_KHAI = ['TAT_CA', 'CON_HANG', 'HET_HANG'] as const;

export type TrangThaiKhaDungCongKhai = (typeof TRANG_THAI_KHA_DUNG_CONG_KHAI)[number];

export const SAP_XEP_SAN_PHAM_CONG_KHAI = [
  'PHU_HOP',
  'TEN_AZ',
  'TEN_ZA',
  'GIA_TANG',
  'GIA_GIAM',
  'MOI_NHAT',
] as const;

export type SapXepSanPhamCongKhai = (typeof SAP_XEP_SAN_PHAM_CONG_KHAI)[number];

export class TruyVanSanPhamCongKhaiDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  trang: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  gioiHan: number = 20;

  @ApiPropertyOptional({ description: 'Từ khóa theo tên sản phẩm' })
  @IsOptional()
  @IsString()
  timKiem?: string;

  @ApiPropertyOptional({ description: 'Slug danh mục' })
  @IsOptional()
  @IsString()
  danhMuc?: string;

  @ApiPropertyOptional({ description: 'ID trang trại' })
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional({
    description: 'Tỉnh/thành hoặc chuỗi địa chỉ trang trại',
  })
  @IsOptional()
  @IsString()
  tinhThanh?: string;

  @ApiPropertyOptional({ description: 'Loại chứng nhận còn hiệu lực' })
  @IsOptional()
  @IsString()
  chungNhan?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Giá biến thể tối thiểu' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  giaTu?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Giá biến thể tối đa' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  giaDen?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Có thu hoạch từ ngày này',
  })
  @IsOptional()
  @IsDateString()
  thuHoachTu?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Có thu hoạch đến ngày này',
  })
  @IsOptional()
  @IsDateString()
  thuHoachDen?: string;

  @ApiPropertyOptional({
    minimum: -90,
    maximum: 90,
    description: 'Vĩ độ vị trí người tìm kiếm để tính factor distance',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  @IsOptional()
  viDoNguoiDung?: number;

  @ApiPropertyOptional({
    minimum: -180,
    maximum: 180,
    description: 'Kinh độ vị trí người tìm kiếm để tính factor distance',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  @IsOptional()
  kinhDoNguoiDung?: number;

  @ApiPropertyOptional({
    enum: TRANG_THAI_KHA_DUNG_CONG_KHAI,
    default: 'TAT_CA',
  })
  @IsOptional()
  @IsIn(TRANG_THAI_KHA_DUNG_CONG_KHAI)
  khaDung: TrangThaiKhaDungCongKhai = 'TAT_CA';

  @ApiPropertyOptional({
    enum: SAP_XEP_SAN_PHAM_CONG_KHAI,
    default: 'PHU_HOP',
  })
  @IsOptional()
  @IsIn(SAP_XEP_SAN_PHAM_CONG_KHAI)
  sapXep: SapXepSanPhamCongKhai = 'PHU_HOP';
}
