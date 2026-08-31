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
import { TrangTraiModule } from './modules/trang-trai/trang-trai.module';
import { ChungNhanModule } from './modules/chung-nhan/chung-nhan.module';
import { MuaVuModule } from './modules/mua-vu/mua-vu.module';
import { NhatKyCanhTacModule } from './modules/nhat-ky-canh-tac/nhat-ky-canh-tac.module';
import { ThuHoachModule } from './modules/thu-hoach/thu-hoach.module';
import { LoSanPhamModule } from './modules/lo-san-pham/lo-san-pham.module';
import { KiemDinhChatLuongModule } from './modules/kiem-dinh-chat-luong/kiem-dinh-chat-luong.module';
import { QrCodeModule } from './modules/qr-code/qr-code.module';
import { SuKienTruyXuatModule } from './modules/su-kien-truy-xuat/su-kien-truy-xuat.module';
import { TruyXuatCongKhaiModule } from './modules/truy-xuat-cong-khai/truy-xuat-cong-khai.module';
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
    TrangTraiModule,
    ChungNhanModule,
    MuaVuModule,
    NhatKyCanhTacModule,
    ThuHoachModule,
    LoSanPhamModule,
    KiemDinhChatLuongModule,
    QrCodeModule,
    SuKienTruyXuatModule,
    TruyXuatCongKhaiModule,
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
