import { Module } from '@nestjs/common';

import { GioHangModule } from '../gio-hang/gio-hang.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DonHangQuanTriController } from './don-hang-quan-tri.controller';
import { DonHangController } from './don-hang.controller';
import { DonHangService } from './don-hang.service';
import { DongGoiController } from './dong-goi.controller';
import { DongGoiService } from './dong-goi.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, GioHangModule, TonKhoModule],
  controllers: [DonHangController, DonHangQuanTriController, DongGoiController],
  providers: [DonHangService, DongGoiService],
  exports: [DonHangService],
})
export class DonHangModule {}
