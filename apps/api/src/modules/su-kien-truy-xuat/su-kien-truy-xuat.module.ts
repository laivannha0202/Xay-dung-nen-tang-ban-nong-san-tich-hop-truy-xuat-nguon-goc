import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { SuKienTruyXuatController } from './su-kien-truy-xuat.controller';
import { SuKienTruyXuatService } from './su-kien-truy-xuat.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [SuKienTruyXuatController],
  providers: [SuKienTruyXuatService],
  exports: [SuKienTruyXuatService],
})
export class SuKienTruyXuatModule {}
