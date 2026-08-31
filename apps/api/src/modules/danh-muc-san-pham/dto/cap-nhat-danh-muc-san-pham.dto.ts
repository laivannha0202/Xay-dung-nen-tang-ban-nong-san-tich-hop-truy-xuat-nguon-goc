import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CapNhatDanhMucSanPhamDto {
  @ApiPropertyOptional({
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  ten?: string;

  @ApiPropertyOptional({
    maxLength: 191,
    example: 'rau-cu-huu-co',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang',
  })
  slug?: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  danhMucChaId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  anhId?: string | null;
}
