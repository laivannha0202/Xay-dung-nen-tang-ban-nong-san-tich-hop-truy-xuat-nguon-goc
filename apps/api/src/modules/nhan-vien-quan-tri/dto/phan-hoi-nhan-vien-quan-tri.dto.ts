import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../../../generated/prisma/client';

export class NhanVienQuanTriDto {
  @ApiProperty() id!: string;
  @ApiProperty() nguoiDungId!: string;
  @ApiProperty() maNhanVien!: string;
  @ApiPropertyOptional({ nullable: true }) chucDanh!: string | null;
  @ApiProperty() email!: string;
  @ApiProperty() hoTen!: string;
  @ApiPropertyOptional({ nullable: true }) soDienThoai!: string | null;
  @ApiProperty({ enum: TrangThaiNguoiDung }) trangThaiNguoiDung!: TrangThaiNguoiDung;
  @ApiProperty({ enum: TrangThaiBanGhi }) trangThaiNhanVien!: TrangThaiBanGhi;
  @ApiProperty({ type: [String] }) vaiTro!: string[];
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class DanhSachNhanVienQuanTriDto {
  @ApiProperty({ type: [NhanVienQuanTriDto] }) items!: NhanVienQuanTriDto[];
  @ApiProperty() tong!: number;
  @ApiProperty() trang!: number;
  @ApiProperty() gioiHan!: number;
}

export class VaiTroKhaDungDto {
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
}

export class DanhSachVaiTroKhaDungDto {
  @ApiProperty({ type: [VaiTroKhaDungDto] }) items!: VaiTroKhaDungDto[];
}

export class DatLaiMatKhauNhanVienResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() nguoiDungId!: string;
  @ApiProperty() thongBao!: string;
}
