import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuyenMaTranDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiPropertyOptional({ nullable: true })
  moTa!: string | null;
}

export class VaiTroMaTranDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ma!: string;

  @ApiProperty()
  ten!: string;

  @ApiPropertyOptional({ nullable: true })
  moTa!: string | null;

  @ApiProperty({ type: [String] })
  maQuyen!: string[];
}

export class MaTranPhanQuyenDto {
  @ApiProperty({ type: [VaiTroMaTranDto] })
  vaiTro!: VaiTroMaTranDto[];

  @ApiProperty({ type: [QuyenMaTranDto] })
  quyen!: QuyenMaTranDto[];
}
