import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MockShippingAdapter } from './adapter/mock-shipping.adapter';
import { ShippingAdapterRegistry } from './adapter/shipping-adapter.registry';
import { GiaoHangController } from './giao-hang.controller';
import { GiaoHangService } from './giao-hang.service';
import { PhamViGiaoHangService } from './pham-vi-giao-hang.service';

@Module({
  imports: [PrismaModule, XacThucModule],
  controllers: [GiaoHangController],
  providers: [
    GiaoHangService,
    PhamViGiaoHangService,
    MockShippingAdapter,
    {
      provide: ShippingAdapterRegistry,
      useFactory: (mockShippingAdapter: MockShippingAdapter) =>
        new ShippingAdapterRegistry([mockShippingAdapter]),
      inject: [MockShippingAdapter],
    },
  ],
  exports: [GiaoHangService, PhamViGiaoHangService, ShippingAdapterRegistry],
})
export class GiaoHangModule {}
