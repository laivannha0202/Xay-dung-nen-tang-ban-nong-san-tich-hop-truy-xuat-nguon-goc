import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CapNhatSanPhamDto {
  @ApiPropertyOptional({
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  ten?: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  moTa?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  danhMucSanPhamId?: string;
}
