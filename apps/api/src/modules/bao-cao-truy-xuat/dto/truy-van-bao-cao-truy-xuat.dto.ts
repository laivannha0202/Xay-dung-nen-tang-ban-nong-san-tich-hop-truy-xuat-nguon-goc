import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class TruyVanBaoCaoTruyXuatDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  gioiHan = 20;

  @ApiPropertyOptional({
    description: 'Tìm theo mã lô, trace code, farm/crop hoặc order tùy report.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  timKiem?: string;
}

export class TruyVanDonHangAnhHuongTruyXuatDto extends TruyVanBaoCaoTruyXuatDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Lọc affected orders theo một batch cụ thể.',
  })
  @IsOptional()
  @IsUUID()
  loSanPhamId?: string;
}
