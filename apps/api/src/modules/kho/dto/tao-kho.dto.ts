import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class TaoKhoDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  maKho!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  ten!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  diaChi!: string;
}
