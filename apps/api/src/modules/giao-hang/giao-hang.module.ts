import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MockShippingAdapter } from './adapter/mock-shipping.adapter';
import { ShippingAdapterRegistry } from './adapter/shipping-adapter.registry';
import { GiaoHangController } from './giao-hang.controller';
import { GiaoHangQuanTriController } from './giao-hang-quan-tri.controller';
import { GiaoHangService } from './giao-hang.service';
import { PhamViGiaoHangService } from './pham-vi-giao-hang.service';

@Module({
  imports: [PrismaModule, XacThucModule, PhanQuyenModule],
  controllers: [GiaoHangController, GiaoHangQuanTriController],
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
