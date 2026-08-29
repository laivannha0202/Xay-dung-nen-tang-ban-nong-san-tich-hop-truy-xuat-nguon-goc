import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { TrangThaiXacMinhChungNhan } from '../../../generated/prisma/client';

export class XacMinhChungNhanDto {
  @ApiProperty({
    enum: [TrangThaiXacMinhChungNhan.DA_XAC_MINH, TrangThaiXacMinhChungNhan.TU_CHOI],
  })
  @IsEnum(TrangThaiXacMinhChungNhan)
  trangThaiXacMinh!: TrangThaiXacMinhChungNhan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lyDoTuChoi?: string;
}
