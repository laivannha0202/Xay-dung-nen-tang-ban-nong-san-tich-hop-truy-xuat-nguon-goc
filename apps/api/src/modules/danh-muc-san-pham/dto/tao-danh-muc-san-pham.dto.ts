import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class TaoDanhMucSanPhamDto {
  @ApiProperty({
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  ten!: string;

  @ApiProperty({
    maxLength: 191,
    example: 'rau-cu-huu-co',
    description: 'Slug lowercase kebab-case dùng cho URL/catalog',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang',
  })
  slug!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Danh mục cha; bỏ trống để tạo danh mục gốc',
  })
  @IsOptional()
  @IsUUID()
  danhMucChaId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'ID TepTin ảnh đang hoạt động',
  })
  @IsOptional()
  @IsUUID()
  anhId?: string | null;
}
