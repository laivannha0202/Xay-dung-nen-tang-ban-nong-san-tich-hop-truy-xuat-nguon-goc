import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class LocDanhGiaQuanTriDto {
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

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  diem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  hienThi?: boolean;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  timKiem?: string;
}

export class CapNhatHienThiDanhGiaQuanTriDto {
  @ApiProperty()
  @IsBoolean()
  hienThi!: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lyDo?: string;
}

export class DanhGiaQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty() mucDonHangId!: string;
  @ApiProperty() sanPhamId!: string;
  @ApiProperty() tenSanPham!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() maDonHang!: string;
  @ApiProperty() hoTenKhach!: string;
  @ApiProperty() diem!: number;
  @ApiProperty({ nullable: true, type: String }) binhLuan!: string | null;
  @ApiProperty() hienThi!: boolean;
  @ApiProperty({ nullable: true, type: String }) lyDoAn!: string | null;
  @ApiProperty({ nullable: true, type: String }) anBoi!: string | null;
  @ApiProperty({ nullable: true, type: String }) anLuc!: Date | null;
  @ApiProperty() createdAt!: Date;
}

export class DanhSachDanhGiaQuanTriDto {
  @ApiProperty({ type: [DanhGiaQuanTriDto] })
  duLieu!: DanhGiaQuanTriDto[];
  @ApiProperty() tong!: number;
  @ApiProperty() trang!: number;
  @ApiProperty() gioiHan!: number;
}
