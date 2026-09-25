import { Module } from '@nestjs/common';

import { HangDoiModule } from '../hang-doi/hang-doi.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { ThongBaoPushModule } from '../thong-bao-push/thong-bao-push.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { LoSanPhamController } from './lo-san-pham.controller';
import { LoSanPhamService } from './lo-san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, ThongBaoPushModule, HangDoiModule],
  controllers: [LoSanPhamController],
  providers: [LoSanPhamService],
  exports: [LoSanPhamService],
})
export class LoSanPhamModule {}
