import { Module } from '@nestjs/common';

import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { CheckoutPreviewService } from './checkout-preview.service';
import { CheckoutPricingService } from './checkout-pricing.service';
import { GioHangController } from './gio-hang.controller';
import { GioHangService } from './gio-hang.service';

@Module({
  imports: [XacThucModule, TepTinModule],
  controllers: [GioHangController],
  providers: [GioHangService, CheckoutPricingService, CheckoutPreviewService],
  exports: [GioHangService, CheckoutPricingService],
})
export class GioHangModule {}
