import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

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

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noiBat?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTuNoiBat?: number | null;
}
