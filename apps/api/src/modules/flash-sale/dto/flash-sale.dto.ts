import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { TrangThaiBanGhi } from '../../../generated/prisma/client';

export class ChienDichFlashSaleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ nullable: true, type: String })
  moTa!: string | null;

  @ApiProperty()
  batDauLuc!: Date;

  @ApiProperty()
  ketThucLuc!: Date;

  @ApiProperty({ enum: TrangThaiBanGhi })
  trangThai!: TrangThaiBanGhi;

  /**
   * Số SKU đã gắn vào chiến dịch (kể cả SKU tạm dừng).
   * Admin cần nhìn thấy chiến dịch rỗng (0 SKU) để biết chưa thêm hàng
   * — trước đây list không hiện số SKU nên chiến dịch rỗng trông "khỏe".
   */
  @ApiProperty()
  soMuc!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MucFlashSaleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chienDichId!: string;

  @ApiProperty()
  bienTheSanPhamId!: string;

  @ApiProperty()
  giaFlash!: number;

  @ApiProperty({ nullable: true, type: Number })
  gioiHanTong!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  gioiHanMoiKhach!: number | null;

  @ApiProperty()
  soLuongDaBan!: number;

  @ApiProperty({ enum: TrangThaiBanGhi })
  trangThai!: TrangThaiBanGhi;
}

export class ChienDichFlashSaleChiTietDto extends ChienDichFlashSaleDto {
  @ApiProperty({ type: [MucFlashSaleDto] })
  muc!: MucFlashSaleDto[];
}

export class DanhSachChienDichFlashSaleDto {
  @ApiProperty({ type: [ChienDichFlashSaleDto] })
  duLieu!: ChienDichFlashSaleDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class LocChienDichFlashSaleDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan = 20;

  @ApiPropertyOptional({ enum: TrangThaiBanGhi })
  @IsOptional()
  @IsEnum(TrangThaiBanGhi)
  trangThai?: TrangThaiBanGhi;
}

export class LuuChienDichFlashSaleDto {
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @MaxLength(180)
  ten!: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moTa?: string | null;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  batDauLuc!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  ketThucLuc!: string;
}

export class DoiTrangThaiChienDichFlashSaleDto {
  @ApiProperty({ enum: TrangThaiBanGhi })
  @IsEnum(TrangThaiBanGhi)
  trangThai!: TrangThaiBanGhi;
}

export class ThemMucFlashSaleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bienTheSanPhamId!: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  giaFlash!: number;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gioiHanTong?: number | null;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gioiHanMoiKhach?: number | null;
}

export class CapNhatMucFlashSaleDto {
  @ApiPropertyOptional({ minimum: 0.01, description: 'Gia flash moi, phai < gia goc hien tai.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  giaFlash?: number;

  @ApiPropertyOptional({
    minimum: 1,
    nullable: true,
    description: 'Quota tong moi, khong duoc nho hon so luong da ban.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gioiHanTong?: number | null;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gioiHanMoiKhach?: number | null;

  @ApiPropertyOptional({ enum: TrangThaiBanGhi })
  @IsOptional()
  @IsEnum(TrangThaiBanGhi)
  trangThai?: TrangThaiBanGhi;
}

export class ChungNhanFlashSaleDto {
  @ApiProperty()
  loai!: string;
}

export class TrangTraiFlashSaleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;
}

export class MucFlashSaleCongKhaiDto {
  @ApiProperty()
  sanPhamId!: string;

  @ApiProperty()
  bienTheSanPhamId!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ nullable: true, type: String })
  anhBiaUrl!: string | null;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  khoiLuong!: number;

  @ApiProperty()
  donVi!: string;

  @ApiProperty({ description: 'Giá gốc từ danh mục biến thể (server-side).' })
  giaGoc!: number;

  @ApiProperty({ description: 'Giá flash sale hiệu lực (server-side).' })
  giaFlash!: number;

  @ApiProperty({ description: 'Phần trăm giảm suy ra server-side, làm tròn nguyên.' })
  phanTramGiam!: number;

  @ApiProperty({ description: 'Tồn khả dụng thực từ inventory.' })
  soLuongKhaDung!: number;

  @ApiProperty({ type: TrangTraiFlashSaleDto })
  trangTrai!: TrangTraiFlashSaleDto;

  @ApiProperty({ type: [ChungNhanFlashSaleDto] })
  chungNhan!: ChungNhanFlashSaleDto[];
}

export class ChienDichFlashSaleCongKhaiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ten!: string;

  @ApiProperty({ nullable: true, type: String })
  moTa!: string | null;

  @ApiProperty()
  batDauLuc!: Date;

  @ApiProperty()
  ketThucLuc!: Date;

  @ApiProperty({ type: [MucFlashSaleCongKhaiDto] })
  muc!: MucFlashSaleCongKhaiDto[];
}
