import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './database/prisma.module';

import { SucKhoeModule } from './modules/suc-khoe/suc-khoe.module';
import { PhanQuyenModule } from './modules/phan-quyen/phan-quyen.module';
import { XacThucModule } from './modules/xac-thuc/xac-thuc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    SucKhoeModule,
    PhanQuyenModule,
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
