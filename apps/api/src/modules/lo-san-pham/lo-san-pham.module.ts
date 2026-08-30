import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { LoSanPhamController } from './lo-san-pham.controller';
import { LoSanPhamService } from './lo-san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [LoSanPhamController],
  providers: [LoSanPhamService],
  exports: [LoSanPhamService],
})
export class LoSanPhamModule {}
