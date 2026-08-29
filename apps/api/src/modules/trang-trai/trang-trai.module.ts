import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TrangTraiCongKhaiController } from './trang-trai-cong-khai.controller';
import { TrangTraiController } from './trang-trai.controller';
import { TrangTraiService } from './trang-trai.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [TrangTraiController, TrangTraiCongKhaiController],
  providers: [TrangTraiService],
  exports: [TrangTraiService],
})
export class TrangTraiModule {}
