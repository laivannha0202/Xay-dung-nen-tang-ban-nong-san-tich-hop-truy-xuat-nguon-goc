import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LoaiNoiDungTrangChu } from '../../../generated/prisma/client';

export const VI_TRI_NOI_DUNG_TRANG_CHU = ['HERO', 'RIGHT_TOP', 'RIGHT_BOTTOM'] as const;

export type ViTriNoiDungTrangChu =
  (typeof VI_TRI_NOI_DUNG_TRANG_CHU)[number];

export class NoiDungTrangChuDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: LoaiNoiDungTrangChu })
  loai!: LoaiNoiDungTrangChu;

  @ApiProperty()
  tieuDe!: string;

  @ApiProperty({ nullable: true, type: String })
  nhan!: string | null;

  @ApiProperty({ nullable: true, type: String })
  moTa!: string | null;

  @ApiProperty({ nullable: true, type: String })
  anhUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  duongDan!: string | null;

  @ApiProperty({ nullable: true, type: String })
  viTri!: string | null;

  @ApiProperty()
  thuTu!: number;

  @ApiProperty()
  hienThi!: boolean;

  @ApiProperty({ nullable: true })
  batDauLuc!: Date | null;

  @ApiProperty({ nullable: true })
  ketThucLuc!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DanhSachNoiDungTrangChuQuanTriDto {
  @ApiProperty({ type: [NoiDungTrangChuDto] })
  duLieu!: NoiDungTrangChuDto[];

  @ApiProperty()
  tong!: number;

  @ApiProperty()
  trang!: number;

  @ApiProperty()
  gioiHan!: number;
}

export class LocNoiDungTrangChuQuanTriDto {
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

  @ApiPropertyOptional({ enum: LoaiNoiDungTrangChu })
  @IsOptional()
  @IsEnum(LoaiNoiDungTrangChu)
  loai?: LoaiNoiDungTrangChu;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  hienThi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  timKiem?: string;
}

export class LuuNoiDungTrangChuDto {
  @ApiProperty({ enum: LoaiNoiDungTrangChu })
  @IsEnum(LoaiNoiDungTrangChu)
  loai!: LoaiNoiDungTrangChu;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @Length(2, 200)
  tieuDe!: string;

  @ApiPropertyOptional({ maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nhan?: string | null;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  moTa?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  anhUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  duongDan?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'HERO' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  viTri?: string | null;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTu?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  hienThi?: boolean;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  batDauLuc?: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  ketThucLuc?: string | null;
}

export class DoiTrangThaiNoiDungTrangChuDto {
  @ApiProperty()
  @IsBoolean()
  hienThi!: boolean;
}

export class TruyVanNoiDungTrangChuCongKhaiDto {
  @ApiPropertyOptional({ enum: LoaiNoiDungTrangChu })
  @IsOptional()
  @IsEnum(LoaiNoiDungTrangChu)
  loai?: LoaiNoiDungTrangChu;
}

export class TrangChuCongKhaiDto {
  @ApiProperty({ type: [NoiDungTrangChuDto] })
  banners!: NoiDungTrangChuDto[];

  @ApiProperty({ type: [NoiDungTrangChuDto] })
  kienThuc!: NoiDungTrangChuDto[];

  @ApiProperty({ type: [NoiDungTrangChuDto] })
  cauChuyenTrangTrai!: NoiDungTrangChuDto[];
}
