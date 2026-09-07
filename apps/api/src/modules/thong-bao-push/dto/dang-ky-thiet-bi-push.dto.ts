import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export const NEN_TANG_THIET_BI_PUSH = [
  'ANDROID',
  'IOS',
] as const;

export type NenTangThietBiPushDto =
  (typeof NEN_TANG_THIET_BI_PUSH)[number];

const EXPO_PUSH_TOKEN_PATTERN =
  /^(?:ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

export class DangKyThietBiPushDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'expoPushToken không đúng định dạng Expo Push Token.',
  })
  expoPushToken!: string;

  @ApiProperty({
    enum: NEN_TANG_THIET_BI_PUSH,
  })
  @IsIn(NEN_TANG_THIET_BI_PUSH)
  nenTang!: NenTangThietBiPushDto;

  @ApiProperty({
    format: 'uuid',
    description: 'EAS projectId dùng để tạo ExpoPushToken.',
  })
  @IsUUID()
  projectId!: string;
}

export class HuyDangKyThietBiPushDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'expoPushToken không đúng định dạng Expo Push Token.',
  })
  expoPushToken!: string;
}
