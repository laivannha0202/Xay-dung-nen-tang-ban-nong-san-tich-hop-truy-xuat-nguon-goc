import { Module } from '@nestjs/common';

import { GioHangModule } from '../gio-hang/gio-hang.module';
import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DonHangController } from './don-hang.controller';
import { DonHangService } from './don-hang.service';

@Module({
  imports: [XacThucModule, GioHangModule, TonKhoModule],
  controllers: [DonHangController],
  providers: [DonHangService],
  exports: [DonHangService],
})
export class DonHangModule {}
