import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';

import { SucKhoeModule } from './modules/suc-khoe/suc-khoe.module';
import { PhanQuyenModule } from './modules/phan-quyen/phan-quyen.module';
import { NhatKyKiemToanModule } from './modules/nhat-ky-kiem-toan/nhat-ky-kiem-toan.module';
import { TepTinModule } from './modules/tep-tin/tep-tin.module';
import { HangDoiModule } from './modules/hang-doi/hang-doi.module';
import { NhaCungCapModule } from './modules/nha-cung-cap/nha-cung-cap.module';
import { XacThucModule } from './modules/xac-thuc/xac-thuc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    SucKhoeModule,
    PhanQuyenModule,
    NhatKyKiemToanModule,
    TepTinModule,
    HangDoiModule,
    NhaCungCapModule,
    XacThucModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
