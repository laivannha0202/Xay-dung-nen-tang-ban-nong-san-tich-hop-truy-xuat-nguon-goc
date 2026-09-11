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

import { PhamViKhuyenMai, TrangThaiBanGhi } from '../../../generated/prisma/client';

export class LocKhuyenMaiQuanTriDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(191)
  timKiem?: string;

  @ApiPropertyOptional({ enum: PhamViKhuyenMai })
  @IsOptional()
  @IsEnum(PhamViKhuyenMai)
  phamVi?: PhamViKhuyenMai;

  @ApiPropertyOptional({ enum: TrangThaiBanGhi })
  @IsOptional()
  @IsEnum(TrangThaiBanGhi)
  trangThai?: TrangThaiBanGhi;
}

export class LuuKhuyenMaiQuanTriDto {
  @ApiProperty({ example: 'FRESH50' })
  @IsString()
  @MaxLength(80)
  ma!: string;

  @ApiProperty({ example: 'Giảm 50.000đ toàn sàn' })
  @IsString()
  @MaxLength(191)
  ten!: string;

  @ApiProperty({ enum: PhamViKhuyenMai })
  @IsEnum(PhamViKhuyenMai)
  phamVi!: PhamViKhuyenMai;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  danhMucSanPhamId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  sanPhamId?: string | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  donHangToiThieu = 0;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  giaTriGiam!: number;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  batDauLuc!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  ketThucLuc!: string;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gioiHanSuDung?: number | null;
}

export class DoiTrangThaiKhuyenMaiQuanTriDto {
  @ApiProperty({ enum: TrangThaiBanGhi })
  @IsEnum(TrangThaiBanGhi)
  trangThai!: TrangThaiBanGhi;
}

export class KhuyenMaiQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;
  @ApiProperty({ nullable: true, type: String }) danhMucSanPhamId!: string | null;
  @ApiProperty({ nullable: true, type: String }) sanPhamId!: string | null;
  @ApiProperty() donHangToiThieu!: number;
  @ApiProperty() giaTriGiam!: number;
  @ApiProperty() batDauLuc!: Date;
  @ApiProperty() ketThucLuc!: Date;
  @ApiProperty({ nullable: true, type: Number }) gioiHanSuDung!: number | null;
  @ApiProperty() soLanDaSuDung!: number;
  @ApiProperty({ enum: TrangThaiBanGhi }) trangThai!: TrangThaiBanGhi;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class DanhSachKhuyenMaiQuanTriDto {
  @ApiProperty({ type: [KhuyenMaiQuanTriDto] }) duLieu!: KhuyenMaiQuanTriDto[];
  @ApiProperty() tong!: number;
  @ApiProperty() trang!: number;
  @ApiProperty() gioiHan!: number;
}
