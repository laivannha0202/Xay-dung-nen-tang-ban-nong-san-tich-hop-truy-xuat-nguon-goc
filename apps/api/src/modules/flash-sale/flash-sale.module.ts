import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { FlashSaleCongKhaiController } from './flash-sale-cong-khai.controller';
import { FlashSaleQuanTriController } from './flash-sale-quan-tri.controller';
import { FlashSaleService } from './flash-sale.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [FlashSaleCongKhaiController, FlashSaleQuanTriController],
  providers: [FlashSaleService],
  exports: [FlashSaleService],
})
export class FlashSaleModule {}
