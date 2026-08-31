import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class TaoSanPhamDto {
  @ApiProperty({
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  ten!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  moTa?: string | null;

  @ApiProperty({
    description: 'ID TrangTrai đang hoạt động',
  })
  @IsUUID()
  trangTraiId!: string;

  @ApiProperty({
    description: 'ID DanhMucSanPham đang hoạt động',
  })
  @IsUUID()
  danhMucSanPhamId!: string;
}
