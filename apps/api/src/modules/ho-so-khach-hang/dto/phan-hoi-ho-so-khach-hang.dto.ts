import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HoSoKhachHangPhanHoiDto {
  @ApiProperty()
  khachHangId!: string;

  @ApiProperty()
  nguoiDungId!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  soDienThoai!: string | null;

  @ApiProperty()
  hoTen!: string;

  @ApiPropertyOptional({ nullable: true, example: '1998-05-20' })
  ngaySinh!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
