import { ApiProperty } from '@nestjs/swagger';

import {
  NEN_TANG_THIET_BI_PUSH,
  type NenTangThietBiPushDto,
} from './dang-ky-thiet-bi-push.dto';

export class ThietBiPushPhanHoiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: NEN_TANG_THIET_BI_PUSH,
  })
  nenTang!: NenTangThietBiPushDto;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty()
  hoatDong!: boolean;

  @ApiProperty({
    format: 'date-time',
  })
  lanCuoiDangKy!: Date;
}

export class HuyThietBiPushPhanHoiDto {
  @ApiProperty()
  daHuy!: boolean;
}

export class GuiThuPushPhanHoiDto {
  @ApiProperty({ minimum: 0 })
  soThietBi!: number;

  @ApiProperty({ minimum: 0 })
  daGui!: number;

  @ApiProperty({ minimum: 0 })
  soLoi!: number;
}
