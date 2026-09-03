import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';

export class TruyVanBaoCaoDonHangDoanhThuDto {
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

  @ApiPropertyOptional({ format: 'date', description: 'Ngày bắt đầu theo UTC, inclusive.' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tuNgay?: string;

  @ApiPropertyOptional({ format: 'date', description: 'Ngày kết thúc theo UTC, inclusive.' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  denNgay?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Farm filter theo snapshot order item.' })
  @IsOptional()
  @IsUUID()
  trangTraiId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Category filter theo category_id_snapshot của order item.',
  })
  @IsOptional()
  @IsUUID()
  danhMucSanPhamId?: string;
}
