import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NhatKyKiemToanDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() tacNhanId!: string | null;
  @ApiProperty() tacNhan!: string;
  @ApiProperty() hanhDong!: string;
  @ApiProperty() thucThe!: string;
  @ApiPropertyOptional() thucTheId!: string | null;
  @ApiPropertyOptional({ type: Object, nullable: true }) truoc!: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: Object, nullable: true }) sau!: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: Object, nullable: true }) metadata!: Record<string, unknown> | null;
  @ApiProperty() createdAt!: Date;
}

export class PhanHoiDanhSachNhatKyDto {
  @ApiProperty({ type: [NhatKyKiemToanDto] }) duLieu!: NhatKyKiemToanDto[];
  @ApiProperty() tong!: number;
  @ApiProperty() trang!: number;
  @ApiProperty() gioiHan!: number;
}
