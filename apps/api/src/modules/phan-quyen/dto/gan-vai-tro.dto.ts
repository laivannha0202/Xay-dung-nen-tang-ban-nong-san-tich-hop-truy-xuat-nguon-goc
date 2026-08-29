import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class GanVaiTroDto {
  @ApiProperty()
  @IsString()
  nguoiDungId!: string;

  @ApiProperty({
    enum: ['KHACH_HANG', 'NHAN_VIEN', 'ADMIN'],
  })
  @IsString()
  @IsIn(['KHACH_HANG', 'NHAN_VIEN', 'ADMIN'])
  maVaiTro!: 'KHACH_HANG' | 'NHAN_VIEN' | 'ADMIN';
}
