import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { CheckoutPreviewService } from './checkout-preview.service';
import { GioHangController } from './gio-hang.controller';
import { GioHangService } from './gio-hang.service';

@Module({
  imports: [XacThucModule],
  controllers: [GioHangController],
  providers: [GioHangService, CheckoutPreviewService],
  exports: [GioHangService],
})
export class GioHangModule {}
