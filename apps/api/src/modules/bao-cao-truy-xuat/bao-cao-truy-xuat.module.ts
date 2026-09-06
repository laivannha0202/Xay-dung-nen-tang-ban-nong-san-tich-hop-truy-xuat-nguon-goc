import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { BaoCaoTruyXuatController } from './bao-cao-truy-xuat.controller';
import { BaoCaoTruyXuatService } from './bao-cao-truy-xuat.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [BaoCaoTruyXuatController],
  providers: [BaoCaoTruyXuatService],
  exports: [BaoCaoTruyXuatService],
})
export class BaoCaoTruyXuatModule {}
