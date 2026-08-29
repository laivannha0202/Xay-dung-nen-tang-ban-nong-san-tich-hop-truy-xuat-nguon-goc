import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, Length } from 'class-validator';

export class TaoChungNhanDto {
  @ApiProperty()
  @IsUUID()
  trangTraiId!: string;

  @ApiProperty({ example: 'VietGAP' })
  @IsString()
  @Length(2, 100)
  loai!: string;

  @ApiProperty({ example: 'VG-2026-001' })
  @IsString()
  @Length(2, 100)
  ma!: string;

  @ApiProperty({
    example: 'Trung tâm Chứng nhận chất lượng',
  })
  @IsString()
  @Length(2, 200)
  donViCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-01-15',
  })
  @IsDateString()
  ngayCap!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2027-01-15',
  })
  @IsDateString()
  ngayHetHan!: string;

  @ApiProperty({
    description: 'ID file đã upload qua module Tệp tin',
  })
  @IsUUID()
  tepTinId!: string;
}
