import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GuiThongBaoPushQuanTriDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tieuDe!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  noiDung!: string;

  @ApiPropertyOptional({ maxLength: 300, example: '/khuyen-mai' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deepLink?: string;
}
