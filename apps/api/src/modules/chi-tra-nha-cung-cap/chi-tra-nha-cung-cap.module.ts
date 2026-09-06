import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { SoDuNhaCungCapModule } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { ChiTraNhaCungCapController } from './chi-tra-nha-cung-cap.controller';
import { ChiTraNhaCungCapService } from './chi-tra-nha-cung-cap.service';

@Module({
  imports: [SoDuNhaCungCapModule, XacThucModule, PhanQuyenModule],
  controllers: [ChiTraNhaCungCapController],
  providers: [ChiTraNhaCungCapService],
  exports: [ChiTraNhaCungCapService],
})
export class ChiTraNhaCungCapModule {}
