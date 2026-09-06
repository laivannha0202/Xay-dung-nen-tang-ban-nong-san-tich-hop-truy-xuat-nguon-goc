import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { CheckoutPreviewService } from './checkout-preview.service';
import { CheckoutPricingService } from './checkout-pricing.service';
import { GioHangController } from './gio-hang.controller';
import { GioHangService } from './gio-hang.service';

@Module({
  imports: [XacThucModule],
  controllers: [GioHangController],
  providers: [GioHangService, CheckoutPricingService, CheckoutPreviewService],
  exports: [GioHangService, CheckoutPricingService],
})
export class GioHangModule {}
