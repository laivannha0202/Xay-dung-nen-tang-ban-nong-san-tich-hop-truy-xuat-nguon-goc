import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { SoDuNhaCungCapModule } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DoiSoatController } from './doi-soat.controller';
import { DoiSoatService } from './doi-soat.service';

@Module({
  imports: [SoDuNhaCungCapModule, XacThucModule, PhanQuyenModule],
  controllers: [DoiSoatController],
  providers: [DoiSoatService],
  exports: [DoiSoatService],
})
export class DoiSoatModule {}
